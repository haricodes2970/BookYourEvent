const express  = require('express');
const dotenv   = require('dotenv');
const cors     = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');
const { expireUnpaidBookings } = require('./controllers/BookingController');

dotenv.config({ path: __dirname + '/.env' });
require('./config/passport');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://bookyourevnt.netlify.app',
        'https://spontaneous-pixie-eb33b8.netlify.app',
        process.env.CLIENT_URL,
    ],
    credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

connectDB();

app.get('/', (req, res) => {
    res.json({ message: 'BookYourEvent Server is Running' });
});

app.use('/api/auth',     require('./routes/AuthRouter'));
app.use('/api/venues',   require('./routes/VenueRouter'));
app.use('/api/bookings', require('./routes/BookingRouter'));
app.use('/api/reviews',  require('./routes/ReviewRouter'));
app.use('/api/stats',    require('./routes/StatsRouter'));
app.use('/api/payments', require('./routes/PaymentRouter'));
app.use('/api/chats',    require('./routes/ChatRouter'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// ── Run every 15 mins — expire unpaid bookings + send reminders ──
setInterval(expireUnpaidBookings, 15 * 60 * 1000);

// ── Keep Render awake every 14 mins ──
setInterval(() => {
    fetch('https://bookyourevent.onrender.com/')
        .then(() => console.log('Server kept alive'))
        .catch(() => {});
}, 14 * 60 * 1000);

