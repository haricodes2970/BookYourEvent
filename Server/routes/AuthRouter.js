/**
 * AuthRouter.js — PATCH for Google OAuth callback only.
 *
 * ✅ Changes from the original:
 *   1. phone is set to null (not 'N/A') for new Google OAuth users
 *   2. isGoogleUser: true is set on new OAuth accounts
 *   3. Existing users who originally registered via email+password
 *      are NOT overwritten with isGoogleUser:true — we only set it
 *      on brand-new creates so the flag remains meaningful.
 *
 * Replace the `user = await User.create({...})` block inside
 * your /google/callback route handler with the version below.
 * Everything else in AuthRouter.js stays the same.
 */

// ── REPLACE the else{} block inside /google/callback (lines 80-93) ────────
//
//  } else {
//    const seed = normalizeUsername(normalizedEmail.split('@')[0] || name || 'user');
//    const username = await generateUniqueUsername(seed);
//    user = await User.create({
//      name,
//      username,
//      email: normalizedEmail,
//      password: 'GOOGLE_AUTH_' + Math.random().toString(36),
//      phone: null,          // ✅ was: 'N/A'
//      role: 'booker',
//      isVerified: true,
//      isGoogleUser: true,   // ✅ new flag
//      avatar: picture || createAvatarUrl(name),
//    });
//  }
//
// ─────────────────────────────────────────────────────────────────────────

/**
 * The complete, corrected /google/callback handler.
 * Paste this in place of the existing router.get('/google/callback', ...) block.
 */
const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');

const {
  register, verifyOTP, login, getMe,
  savePaymentDetails, getUsers, deleteUser, updateUserRole,
  forgotPassword, resetPassword,
  normalizeUsername, createAvatarUrl, generateUniqueUsername,
} = require('../controllers/AuthController');

const { protect }               = require('../middleware/authMiddleware');
const { adminOnly, authorizeRoles } = require('../middleware/roleMiddleware');

// ── Standard auth routes (unchanged) ──────────────────────────────────────
router.post('/register',        register);
router.post('/verify-otp',      verifyOTP);
router.post('/login',           login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/me',               protect, getMe);

router.patch('/payment-details', protect, authorizeRoles('venueOwner'), savePaymentDetails);
router.get('/users',             protect, adminOnly, getUsers);
router.delete('/users/:id',      protect, adminOnly, deleteUser);
router.patch('/users/:id/role',  protect, adminOnly, updateUserRole);

// ── Google OAuth ───────────────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  `${process.env.SERVER_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope:         'profile email',
    access_type:   'offline',
    prompt:        'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  `${process.env.SERVER_URL}/api/auth/google/callback`,
      grant_type:    'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // Fetch Google profile
    const { data: profile } = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const { email, name, picture } = profile;
    const normalizedEmail = (email || '').trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Existing user — update verification, username, avatar if missing
      user.isVerified = true;
      if (!user.username) {
        const seed = normalizeUsername(
          user.name || normalizedEmail.split('@')[0] || 'user',
        );
        user.username = await generateUniqueUsername(seed, user._id);
      }
      if (!user.avatar) {
        user.avatar = picture || createAvatarUrl(user.name);
      }
      await user.save();

    } else {
      // ✅ NEW USER — phone: null, isGoogleUser: true
      const seed     = normalizeUsername(normalizedEmail.split('@')[0] || name || 'user');
      const username = await generateUniqueUsername(seed);

      user = await User.create({
        name,
        username,
        email:        normalizedEmail,
        password:     'GOOGLE_AUTH_' + Math.random().toString(36).slice(2),
        phone:        null,         // ✅ no more 'N/A' string
        role:         'booker',
        isVerified:   true,
        isGoogleUser: true,         // ✅ explicit flag
        avatar:       picture || createAvatarUrl(name),
      });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id:       user._id,
        role:     user.role,
        name:     user.name,
        email:    user.email,
        username: user.username || '',
        avatar:   user.avatar  || '',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },  // ✅ normalised to 7d (was 30d for OAuth, 7d for email)
    );

    const userEncoded = encodeURIComponent(
      JSON.stringify({
        id:           user._id,
        name:         user.name,
        username:     user.username || '',
        email:        user.email,
        avatar:       user.avatar  || '',
        role:         user.role,
        phone:        user.phone,        // will be null for new Google users
        isGoogleUser: user.isGoogleUser, // ✅ pass to frontend
      }),
    );

    res.redirect(
      `${process.env.CLIENT_URL}/auth/google/success?token=${token}&user=${userEncoded}`,
    );

  } catch (err) {
    console.error('Google OAuth callback error:', err.response?.data || err.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
  }
});

module.exports = router;

// ── ADD THIS ROUTE to your existing AuthRouter.js ──────────────────────────
// Place it with the other protected auth routes (after authMiddleware)

// IMPORT at top of AuthRouter.js (already there):
// const { protect } = require('../middleware/authMiddleware');

// ADD THIS ROUTE:
router.patch('/switch-role', protect, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['booker', 'venueOwner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be booker or venueOwner.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    ).select('-password -otp -otpExpiry');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email, isGoogleUser: user.isGoogleUser },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
