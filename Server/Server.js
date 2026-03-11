const express  = require('express');
const dotenv   = require('dotenv');
const cors     = require('cors');
const passport = require('passport');

dotenv.config({ path: __dirname + '/.env' });

const connectDB = require('./config/db');
const { expireUnpaidBookings } = require('./controllers/BookingController');
require('./config/passport');

// ✅ FIX #10 — granular rate limiters (replaces single authLimiter)
const {
  otpLimiter,
  loginLimiter,
  generalAuthLimiter,
  apiLimiter,
} = require('./middleware/rateLimiters');

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'https://bookyourevnt.netlify.app',
  'https://spontaneous-pixie-eb33b8.netlify.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

connectDB();

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'BookYourEvent Server is Running', status: 'ok' });
});

// ── Routes with granular rate limits ──────────────────────────────────────
// ✅ Order matters — specific routes before the catch-all generalAuthLimiter

// Tightest: OTP, forgot-password (brute-force targets)
app.use('/api/auth/verify-otp',        otpLimiter);
app.use('/api/auth/forgot-password',   otpLimiter);
app.use('/api/auth/reset-password',    otpLimiter);

// Medium: login
app.use('/api/auth/login',             loginLimiter);

// General: register, /me, profile updates
app.use('/api/auth',                   generalAuthLimiter, require('./routes/AuthRouter'));

// Broad: all other API routes
app.use('/api/venues',   apiLimiter, require('./routes/VenueRouter'));
app.use('/api/bookings', apiLimiter, require('./routes/BookingRouter'));
app.use('/api/reviews',  apiLimiter, require('./routes/ReviewRouter'));
app.use('/api/stats',               require('./routes/StatsRouter'));   // public, no limit needed
app.use('/api/payments', apiLimiter, require('./routes/PaymentRouter'));
app.use('/api/chats',    apiLimiter, require('./routes/ChatRouter'));

// ── ✅ FIX #5 — Global error handler (catch unhandled Express errors) ──────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Don't leak stack traces in production
  const body = {
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}:`, message);
  res.status(status).json(body);
});

// ── 404 handler for unknown API routes ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
});

// ── Background jobs ────────────────────────────────────────────────────────
setInterval(expireUnpaidBookings, 15 * 60 * 1000); // expire unpaid bookings every 15 min

// Keep Render free-tier server warm (avoids cold-start delays)
setInterval(() => {
  fetch(`${process.env.SERVER_URL || 'http://localhost:' + PORT}/`)
    .then(() => console.log('[keepalive] Server pinged'))
    .catch(() => {});
}, 14 * 60 * 1000);
