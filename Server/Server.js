const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

dotenv.config({ path: __dirname + '/.env' });

const connectDB = require('./config/db');
const { expireUnpaidBookings } = require('./controllers/BookingController');
require('./config/passport');

const app = express();

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

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());
app.use(passport.initialize());

connectDB();

app.get('/', (req, res) => {
    res.json({ message: 'BookYourEvent Server is Running' });
});

app.use('/api/auth', authLimiter, require('./routes/AuthRouter'));
app.use('/api/venues', require('./routes/VenueRouter'));
app.use('/api/bookings', require('./routes/BookingRouter'));
app.use('/api/reviews', require('./routes/ReviewRouter'));
app.use('/api/stats', require('./routes/StatsRouter'));
app.use('/api/payments', require('./routes/PaymentRouter'));
app.use('/api/chats', require('./routes/ChatRouter'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

setInterval(expireUnpaidBookings, 15 * 60 * 1000);

setInterval(() => {
    fetch('https://bookyourevent.onrender.com/')
        .then(() => console.log('Server kept alive'))
        .catch(() => {});
}, 14 * 60 * 1000);

