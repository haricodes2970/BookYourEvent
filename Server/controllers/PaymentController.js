const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

// ── Init Razorpay ──────────────────────────────────
const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Commission logic ───────────────────────────────
const getCommission = (amount) => {
    if (amount >= 10000) return { rate: 0.08, ownerRate: 0.92 };
    return { rate: 0.05, ownerRate: 0.95 };
};

/* ══════════════════════════════════════
   POST /api/payments/create-order
   Body: { bookingData }
   Creates booking + Razorpay order
══════════════════════════════════════ */
const createOrder = async (req, res) => {
    try {
        const {
            venue,
            eventDate,
            startTime,
            endTime,
            guestCount,
            totalPrice,
        } = req.body;

        const bookerId = req.user.id;

        // ── Double booking check ──
        const conflict = await Booking.findOne({
            venue,
            eventDate: new Date(eventDate),
            status: { $in: ['pending', 'approved'] },
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ],
        });
        if (conflict)
            return res.status(400).json({ message: 'Venue already booked for this time slot' });

        // ── Commission calculation ──
        const { rate, ownerRate } = getCommission(totalPrice);
        const platformFee = Math.round(totalPrice * rate);
        const ownerAmount = Math.round(totalPrice * ownerRate);

        // ── Create Razorpay order ──
        const order = await razorpay.orders.create({
            amount:   totalPrice * 100, // paise
            currency: 'INR',
            receipt:  `bye_${Date.now()}`,
        });

        // ── Save booking as unpaid ──
        const booking = await Booking.create({
            venue,
            booker:          bookerId,
            eventDate:       new Date(eventDate),
            startTime,
            endTime,
            guestCount,
            totalPrice,
            status:          'pending',
            paymentStatus:   'unpaid',
            razorpayOrderId: order.id,
            commissionRate:  rate,
            platformFee,
            ownerAmount,
        });

        res.status(200).json({
            orderId:   order.id,
            amount:    order.amount,
            currency:  order.currency,
            bookingId: booking._id,
            key:       process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ message: 'Failed to create payment order', error: err.message });
    }
};

/* ══════════════════════════════════════
   POST /api/payments/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }
   Verifies signature → marks booking paid + approved
══════════════════════════════════════ */
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
        } = req.body;

        // ── Signature verification ──
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest('hex');

        if (expected !== razorpay_signature)
            return res.status(400).json({ message: 'Payment verification failed — invalid signature' });

        // ── Update booking → paid + approved (instant booking) ──
        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                paymentStatus:    'paid',
                status:           'approved',
                razorpayPaymentId: razorpay_payment_id,
            },
            { new: true }
        ).populate('venue booker');

        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });

        res.status(200).json({
            message: 'Payment successful! Booking confirmed.',
            booking,
        });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ message: 'Payment verification failed', error: err.message });
    }
};

/* ══════════════════════════════════════
   GET /api/payments/my-payments
   Booker sees their payment history
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
   Admin sees total revenue + commission
══════════════════════════════════════ */
const getAdminRevenue = async (req, res) => {
    try {
        const paid = await Booking.find({ paymentStatus: 'paid' });

        const totalRevenue   = paid.reduce((s, b) => s + b.totalPrice,  0);
        const totalCommission = paid.reduce((s, b) => s + b.platformFee, 0);
        const totalOwnerPaid  = paid.reduce((s, b) => s + b.ownerAmount, 0);

        res.status(200).json({
            totalBookings:  paid.length,
            totalRevenue,
            totalCommission,
            totalOwnerPaid,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch revenue stats' });
    }
};

module.exports = { createOrder, verifyPayment, getMyPayments, getAdminRevenue };
