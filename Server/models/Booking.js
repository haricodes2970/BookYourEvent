const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    booker:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidAmount: { type: Number, required: true },
    message:   { type: String, default: '' },
    placedAt:  { type: Date, default: Date.now },
});

const bookingSchema = new mongoose.Schema({
    venue:      { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    booker:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventDate:  { type: Date, required: true },
    startTime:  { type: String, required: true },
    endTime:    { type: String, required: true },
    guestCount: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    // ── BIDDING ──────────────────────────────────
    bidAmount: { type: Number, default: 0 },   // this booker's bid
    bids:      [bidSchema],                    // all bids on this slot

    // ── STATUS ───────────────────────────────────
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'payment_pending', 'confirmed', 'expired'],
        default: 'pending',
    },

    // ── PAYMENT ──────────────────────────────────
    paymentStatus:    { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paymentDeadline:  { type: Date, default: null },   // 4hrs after approval
    reminderSent:     { type: Boolean, default: false }, // 1hr reminder flag

    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    commissionRate:    { type: Number, default: 0 },
    platformFee:       { type: Number, default: 0 },
    ownerAmount:       { type: Number, default: 0 },

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
