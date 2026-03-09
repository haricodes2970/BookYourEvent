const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const {
    sendBookerPaymentSuccessEmail,
    sendOwnerPaymentReceivedEmail,
} = require('../utils/emailService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getCommission = (amount) => {
    if (amount >= 10000) return { rate: 0.08, ownerRate: 0.92 };
    return { rate: 0.05, ownerRate: 0.95 };
};

const createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId).populate('venue');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'payment_pending') {
            return res.status(400).json({ message: 'Booking has not been approved yet or is already confirmed.' });
        }

        if (new Date() > booking.paymentDeadline) {
            booking.status = 'expired';
            await booking.save();
            return res.status(400).json({ message: 'Payment deadline expired. Slot has been reopened.' });
        }

        if (booking.booker.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const amount = booking.bidAmount;
        const { rate, ownerRate } = getCommission(amount);
        const platformFee = Math.round(amount * rate);
        const ownerAmount = Math.round(amount * ownerRate);

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: `bye_${Date.now()}`,
        });

        booking.razorpayOrderId = order.id;
        booking.commissionRate = rate;
        booking.platformFee = platformFee;
        booking.ownerAmount = ownerAmount;
        await booking.save();

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            bookingId: booking._id,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ message: 'Failed to create payment order', error: err.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex');

        if (expected !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed - invalid signature' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.booker.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (booking.paymentStatus === 'paid' && booking.status === 'confirmed') {
            await booking.populate([
                { path: 'booker', select: 'name email' },
                {
                    path: 'venue',
                    select: 'name owner',
                    populate: { path: 'owner', select: 'name email' },
                },
            ]);
            return res.status(200).json({ message: 'Payment already verified. Booking confirmed.', booking });
        }

        if (booking.status !== 'payment_pending') {
            return res.status(400).json({ message: 'Booking is not awaiting payment.' });
        }

        if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ message: 'Order mismatch for this booking.' });
        }

        booking.paymentStatus = 'paid';
        booking.status = 'confirmed';
        booking.razorpayPaymentId = razorpay_payment_id;
        booking.paymentDeadline = undefined;
        booking.reminderSent = true;
        await booking.save();

        await booking.populate([
            { path: 'booker', select: 'name email' },
            {
                path: 'venue',
                select: 'name owner',
                populate: { path: 'owner', select: 'name email' },
            },
        ]);

        const emailDetails = {
            venueName: booking.venue?.name || 'Venue',
            eventDate: booking.eventDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            bidAmount: booking.bidAmount,
            platformFee: booking.platformFee,
            ownerAmount: booking.ownerAmount,
            paymentId: booking.razorpayPaymentId,
            bookerName: booking.booker?.name,
            bookerEmail: booking.booker?.email,
        };

        if (booking.booker?.email) {
            try {
                await sendBookerPaymentSuccessEmail(
                    booking.booker.email,
                    booking.booker.name,
                    emailDetails
                );
            } catch (emailErr) {
                console.error(`Booker payment email failed for booking ${booking._id}:`, emailErr.message);
            }
        } else {
            console.warn(`Booker email missing for booking ${booking._id}. Skipping confirmation email.`);
        }

        if (booking.venue?.owner?.email) {
            try {
                await sendOwnerPaymentReceivedEmail(
                    booking.venue.owner.email,
                    booking.venue.owner.name,
                    emailDetails
                );
            } catch (emailErr) {
                console.error(`Owner payment email failed for booking ${booking._id}:`, emailErr.message);
            }
        } else {
            console.warn(`Owner email missing for booking ${booking._id}. Skipping owner notification email.`);
        }

        res.status(200).json({ message: 'Payment successful! Booking confirmed.', booking });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ message: 'Payment verification failed', error: err.message });
    }
};

const getMyPayments = async (req, res) => {
    try {
        const bookings = await Booking.find({
            booker: req.user.id,
            paymentStatus: 'paid',
        })
            .populate('venue', 'name location images pricePerHour')
            .sort({ createdAt: -1 });

        res.status(200).json({ bookings });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch payments' });
    }
};

const getAdminRevenue = async (req, res) => {
    try {
        const paid = await Booking.find({ paymentStatus: 'paid' });

        const totalRevenue = paid.reduce((sum, booking) => sum + booking.bidAmount, 0);
        const totalCommission = paid.reduce((sum, booking) => sum + booking.platformFee, 0);
        const totalOwnerPaid = paid.reduce((sum, booking) => sum + booking.ownerAmount, 0);

        res.status(200).json({
            totalBookings: paid.length,
            totalRevenue,
            totalCommission,
            totalOwnerPaid,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch revenue stats' });
    }
};

module.exports = { createOrder, verifyPayment, getMyPayments, getAdminRevenue };

