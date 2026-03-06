const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');

dotenv.config({ path: __dirname + '/.env' }); // ✅ Only once, at the top

require('./config/passport');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        process.env.CLIENT_URL  // ✅ Uses your .env instead of hardcoding
    ],
    credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

connectDB();

app.get('/', (req, res) => {
    res.json({ message: 'BookYourEvent Server is Running' });
});

app.use('/api/auth', require('./routes/AuthRouter'));
app.use('/api/venues', require('./routes/VenueRouter'));
app.use('/api/bookings', require('./routes/BookingRouter'));
app.use('/api/reviews', require('./routes/ReviewRouter'));
app.use('/api/stats', require('./routes/StatsRouter'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});