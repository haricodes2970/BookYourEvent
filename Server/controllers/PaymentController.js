const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Booking  = require('../models/Booking');

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getCommission = (amount) => {
    if (amount >= 10000) return { rate: 0.08, ownerRate: 0.92 };
    return { rate: 0.05, ownerRate: 0.95 };
};

/* ══════════════════════════════════════
   POST /api/payments/create-order
   Only works if booking is payment_pending
   and deadline has not passed
══════════════════════════════════════ */
const createOrder = async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId).populate('venue');
        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });

        // ── Must be approved by owner first ──
        if (booking.status !== 'payment_pending')
            return res.status(400).json({ message: 'Booking has not been approved yet or is already confirmed.' });

        // ── Check deadline ──
        if (new Date() > booking.paymentDeadline) {
            booking.status = 'expired';
            await booking.save();
            return res.status(400).json({ message: 'Payment deadline expired. Slot has been reopened.' });
        }

        // ── Must be the booker ──
        if (booking.booker.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized' });

        const amount = booking.bidAmount; // pay the bid amount
        const { rate, ownerRate } = getCommission(amount);
        const platformFee = Math.round(amount * rate);
        const ownerAmount = Math.round(amount * ownerRate);

        const order = await razorpay.orders.create({
            amount:   amount * 100,
            currency: 'INR',
            receipt:  `bye_${Date.now()}`,
        });

        // ── Save order details to booking ──
        booking.razorpayOrderId = order.id;
        booking.commissionRate  = rate;
        booking.platformFee     = platformFee;
        booking.ownerAmount     = ownerAmount;
        await booking.save();

        res.status(200).json({
            orderId:  order.id,
            amount:   order.amount,
            currency: order.currency,
            bookingId: booking._id,
            key:      process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ message: 'Failed to create payment order', error: err.message });
    }
};

/* ══════════════════════════════════════
   POST /api/payments/verify
   Verifies signature → marks confirmed
══════════════════════════════════════ */
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const sign    = razorpay_order_id + '|' + razorpay_payment_id;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex');

        if (expected !== razorpay_signature)
            return res.status(400).json({ message: 'Payment verification failed — invalid signature' });

        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                paymentStatus:     'paid',
                status:            'confirmed',
                razorpayPaymentId: razorpay_payment_id,
            },
            { new: true }
        ).populate('venue booker');

        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });

        res.status(200).json({ message: 'Payment successful! Booking confirmed.', booking });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ message: 'Payment verification failed', error: err.message });
    }
};

/* ══════════════════════════════════════
   GET /api/payments/my-payments
══════════════════════════════════════ */
const getMyPayments = async (req, res) => {
    try {
        const bookings = await Booking.find({
            booker:        req.user.id,
            paymentStatus: 'paid',
        })
            .populate('venue', 'name location images pricePerHour')
            .sort({ createdAt: -1 });

        res.status(200).json({ bookings });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch payments' });
    }
};

/* ══════════════════════════════════════
   GET /api/payments/admin-stats
══════════════════════════════════════ */
const getAdminRevenue = async (req, res) => {
    try {
        const paid = await Booking.find({ paymentStatus: 'paid' });

        const totalRevenue    = paid.reduce((s, b) => s + b.bidAmount,    0);
        const totalCommission = paid.reduce((s, b) => s + b.platformFee,  0);
        const totalOwnerPaid  = paid.reduce((s, b) => s + b.ownerAmount,  0);

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
