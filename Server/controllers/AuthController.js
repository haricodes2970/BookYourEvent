const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/* ══════════════════════════════════════
   GOOGLE OAUTH SETUP
══════════════════════════════════════ */
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// GET /api/auth/google
const googleAuth = (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        prompt: 'select_account',  // always show account picker
    });
    res.redirect(authUrl);
};

// GET /api/auth/google/callback
const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data } = await oauth2.userinfo.get();

        let user = await User.findOne({ email: data.email });

        if (!user) {
            user = await User.create({
                name: data.name,
                email: data.email,
                password: Math.random().toString(36).slice(-10), // placeholder password
                role: 'booker',
                isVerified: true,
                googleId: data.id,
            });
        } else if (!user.googleId) {
            user.googleId = data.id;
            user.isVerified = true;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}&name=${encodeURIComponent(user.name)}&role=${user.role}&id=${user._id}&email=${encodeURIComponent(user.email)}`);
    } catch (err) {
        console.error('Google OAuth error:', err);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
};

/* ══════════════════════════════════════
   REGISTER
══════════════════════════════════════ */
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified)
            return res.status(400).json({ message: 'Email already registered' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        if (existingUser && !existingUser.isVerified) {
            existingUser.name = name;
            existingUser.phone = phone;
            existingUser.password = password;
            existingUser.role = role || 'booker';
            existingUser.otp = otp;
            existingUser.otpExpiry = otpExpiry;
            await existingUser.save();
        } else {
            await User.create({
                name, email, password, phone,
                role: role || 'booker',
                otp, otpExpiry,
                isVerified: false,
            });
        }

        await sendOTPEmail(email, name, otp);
        res.status(200).json({ message: 'OTP sent to your email. Please verify.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

/* ══════════════════════════════════════
   VERIFY OTP
══════════════════════════════════════ */
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Already verified. Please login.' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Try again.' });
        if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired. Please register again.' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        await sendWelcomeEmail(email, user.name);
        res.status(200).json({ message: 'Email verified! You can now login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Verification failed', error: err.message });
    }
};

/* ══════════════════════════════════════
   LOGIN
══════════════════════════════════════ */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });
        if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email first.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};

/* ══════════════════════════════════════
   FORGOT PASSWORD
══════════════════════════════════════ */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await sendOTPEmail(email, user.name, otp);
        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send OTP', error: err.message });
    }
};

/* ══════════════════════════════════════
   RESET PASSWORD
══════════════════════════════════════ */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful! Please login.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to reset password', error: err.message });
    }
};

/* ══════════════════════════════════════
   ADMIN — GET ALL USERS
══════════════════════════════════════ */
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -otp -otpExpiry');
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

/* ══════════════════════════════════════
   ADMIN — DELETE USER
══════════════════════════════════════ */
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete an admin' });
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

/* ══════════════════════════════════════
   ADMIN — UPDATE USER ROLE
══════════════════════════════════════ */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['booker', 'venueOwner', 'admin'].includes(role))
            return res.status(400).json({ message: 'Invalid role' });
        const user = await User.findByIdAndUpdate(
            req.params.id, { role }, { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'Role updated', user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update role' });
    }
};

module.exports = {
    register,
    verifyOTP,
    login,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUser,
    updateUserRole,
    googleAuth,
    googleCallback,
};
