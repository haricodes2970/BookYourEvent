const User    = require('../models/User');
const jwt     = require('jsonwebtoken');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const generateToken = (user) => jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
);

/* ══════════════════════════════════════ REGISTER ══════════════════════════════════════ */
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        if (!name || !email || !password || !phone)
            return res.status(400).json({ message: 'All fields are required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already registered' });

        const otp       = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await User.create({ name, email, password, phone, role: role || 'booker', otp, otpExpiry });
        await sendOTPEmail(email, name, otp);

        res.status(201).json({ message: 'OTP sent to your email. Please verify.', email });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════ VERIFY OTP ══════════════════════════════════════ */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user)            return res.status(404).json({ message: 'User not found' });
        if (user.isVerified)  return res.status(400).json({ message: 'Already verified' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired' });

        user.isVerified = true;
        user.otp        = undefined;
        user.otpExpiry  = undefined;
        await user.save();

        await sendWelcomeEmail(email, user.name);
        const token = generateToken(user);
        res.status(200).json({
            message: 'Email verified!', token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════ LOGIN ══════════════════════════════════════ */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user)           return res.status(404).json({ message: 'User not found' });
        if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email first' });

        const match = await user.comparePassword(password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful', token,
            user: {
                id: user._id, name: user.name, email: user.email,
                role: user.role, paymentDetails: user.paymentDetails,
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════
   GET ME
   GET /api/auth/me
══════════════════════════════════════ */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpiry');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════
   SAVE PAYMENT DETAILS
   PATCH /api/auth/payment-details
   Only for venueOwner role
══════════════════════════════════════ */
const savePaymentDetails = async (req, res) => {
    try {
        const { paymentType, upiId, accountName, accountNo, ifsc, bankName } = req.body;

        if (!paymentType || !['upi', 'bank'].includes(paymentType))
            return res.status(400).json({ message: 'Payment type must be upi or bank' });

        if (paymentType === 'upi' && !upiId)
            return res.status(400).json({ message: 'UPI ID is required' });

        if (paymentType === 'bank' && (!accountName || !accountNo || !ifsc || !bankName))
            return res.status(400).json({ message: 'All bank details are required' });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { paymentDetails: { paymentType, upiId, accountName, accountNo, ifsc, bankName } },
            { new: true }
        ).select('-password -otp -otpExpiry');

        res.status(200).json({ message: '✅ Payment details saved!', paymentDetails: user.paymentDetails });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════ FORGOT PASSWORD ══════════════════════════════════════ */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp; user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendOTPEmail(email, user.name, otp);
        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════ RESET PASSWORD ══════════════════════════════════════ */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired' });

        user.password = newPassword; user.otp = undefined; user.otpExpiry = undefined;
        await user.save();
        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════ ADMIN ══════════════════════════════════════ */
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -otp -otpExpiry').sort({ createdAt: -1 });
        res.status(200).json({ count: users.length, users });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        res.status(200).json({ message: 'Role updated', user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    register, verifyOTP, login, getMe,
    savePaymentDetails,
    forgotPassword, resetPassword,
    getUsers, deleteUser, updateUserRole,
};
