const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: true,
    },
    booker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    eventDate: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    guestCount: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },

    // ── PAYMENT FIELDS ──────────────────────────
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid',
    },
    razorpayOrderId: {
        type: String,
        default: null,
    },
    razorpayPaymentId: {
        type: String,
        default: null,
    },
    commissionRate: {
        type: Number,
        default: 0,
    },
    platformFee: {
        type: Number,
        default: 0,
    },
    ownerAmount: {
        type: Number,
        default: 0,
    },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
