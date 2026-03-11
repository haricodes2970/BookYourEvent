/**
 * rateLimiters.js
 *
 * ✅ Replaces the single generic authLimiter in Server.js with
 * purpose-built limiters per endpoint type.
 *
 * Current state (Server.js):
 *   const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
 *   app.use('/api/auth', authLimiter, ...)
 *
 * Problem: 20 requests/15 min is applied to ALL auth routes including /me
 * (which the app calls on every page load). A power user will hit the limit
 * just using the app normally. Meanwhile OTP and login — the routes that
 * need tight protection — share the same generous bucket.
 *
 * Usage in Server.js:
 *   const { otpLimiter, loginLimiter, generalAuthLimiter } = require('./middleware/rateLimiters');
 *   app.use('/api/auth/login',        loginLimiter);
 *   app.use('/api/auth/register',     generalAuthLimiter);
 *   app.use('/api/auth/verify-otp',   otpLimiter);
 *   app.use('/api/auth/forgot-password', otpLimiter);
 *   app.use('/api/auth',              generalAuthLimiter); // catch-all for /me etc.
 */

const rateLimit = require('express-rate-limit');

// ── OTP & password reset — tightest limit ─────────────────────────────────
// 5 attempts per IP per 15 minutes.
// Brute-forcing a 6-digit OTP needs up to 1,000,000 attempts — at 5/15 min
// that's 52 years. Even 6 attempts would take years to brute-force.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    message: 'Too many OTP requests from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// ── Login — medium limit ───────────────────────────────────────────────────
// 10 attempts per IP per 15 minutes.
// Allows for legitimate mistyped passwords without locking out real users,
// while blocking automated credential stuffing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // don't penalise successful logins
});

// ── General auth (register, /me, profile updates) ─────────────────────────
// 60 requests per 15 minutes — comfortable for real app usage.
const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    message: 'Too many requests from this IP. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// ── API-wide limiter for all non-auth routes ───────────────────────────────
// 200 requests per 15 minutes — handles normal browsing + dashboard usage.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    message: 'Rate limit exceeded. Please wait before making more requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

module.exports = { otpLimiter, loginLimiter, generalAuthLimiter, apiLimiter };
