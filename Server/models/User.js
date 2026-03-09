const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name:       { type: String, required: true, trim: true },
    username:   {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 24,
        match: /^[a-z0-9._]+$/,
    },
    email:      { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:   { type: String, required: true },
    phone:      { type: String, required: true },
    avatar:     { type: String, default: '' },
    role:       { type: String, enum: ['booker', 'venueOwner', 'admin'], default: 'booker' },
    isVerified: { type: Boolean, default: false },
    otp:        { type: String },
    otpExpiry:  { type: Date },

    // ── Venue Owner Payment Details ──────────────────
    paymentDetails: {
        upiId:       { type: String, default: '' },
        accountName: { type: String, default: '' },
        accountNo:   { type: String, default: '' },
        ifsc:        { type: String, default: '' },
        bankName:    { type: String, default: '' },
        paymentType: { type: String, enum: ['upi', 'bank', ''], default: '' },
    },

}, { timestamps: true });

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
