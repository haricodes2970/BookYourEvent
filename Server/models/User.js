const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    username: {
      type: String,
      unique: true,
      sparse: true,   // allows multiple null values in the unique index
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-z0-9._]+$/,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: { type: String, required: true },

    // ✅ FIX #8 — phone is now nullable.
    // Google OAuth users don't have a phone number at sign-up.
    // Previously stored as the string 'N/A' which pollutes the field.
    phone: {
      type: String,
      default: null,
      trim: true,
      // Optional: enforce Indian mobile format when provided
      // match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'],
    },

    avatar: { type: String, default: '' },

    role: {
      type: String,
      enum: ['booker', 'venueOwner', 'admin'],
      default: 'booker',
    },

    isVerified: { type: Boolean, default: false },

    // ✅ FIX #8 — explicit flag for Google OAuth accounts.
    // Lets you conditionally show/hide password change, phone setup, etc.
    isGoogleUser: { type: Boolean, default: false },

    otp: { type: String },
    otpExpiry: { type: Date },

    // ── Venue Owner Payment Details ───────────────────────────────────────
    paymentDetails: {
      upiId:       { type: String, default: '' },
      accountName: { type: String, default: '' },
      accountNo:   { type: String, default: '' },
      ifsc:        { type: String, default: '' },
      bankName:    { type: String, default: '' },
      paymentType: { type: String, enum: ['upi', 'bank', ''], default: '' },
    },
  },
  { timestamps: true },
);

// ── Password hashing ───────────────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  // Skip hashing for Google OAuth placeholder passwords that were
  // already hashed on a previous save, or haven't changed.
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
