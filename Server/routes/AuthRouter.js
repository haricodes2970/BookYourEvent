const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, getMe, savePaymentDetails, getUsers, deleteUser, updateUserRole, forgotPassword, resetPassword } = require('../controllers/AuthController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me',                  protect, getMe);
router.patch('/payment-details',   protect, savePaymentDetails);
router.get('/users',               protect, adminOnly, getUsers);
router.delete('/users/:id',        protect, adminOnly, deleteUser);
router.patch('/users/:id/role',    protect, adminOnly, updateUserRole);

// ── GOOGLE OAUTH ──────────────────────────────────
router.get('/google', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${process.env.SERVER_URL}/api/auth/google/callback`,
        response_type: 'code',
        scope: 'profile email',
        access_type: 'offline',
        prompt: 'select_account',   // 👈 always show account picker
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error) return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${process.env.SERVER_URL}/api/auth/google/callback`,
            grant_type: 'authorization_code',
        });
        const { access_token } = tokenResponse.data;

        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const { email, name } = userInfoResponse.data;

        let user = await User.findOne({ email });
        if (user) {
            user.isVerified = true;
            await user.save();
        } else {
            user = await User.create({
                name, email,
                password: 'GOOGLE_AUTH_' + Math.random().toString(36),
                phone: 'N/A',
                role: 'booker',
                isVerified: true,
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        const userEncoded = encodeURIComponent(JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
        }));

        res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}&user=${userEncoded}`);
    } catch (err) {
        console.error('Google OAuth callback error:', err.response?.data || err.message);
        res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    }
});

module.exports = router;
