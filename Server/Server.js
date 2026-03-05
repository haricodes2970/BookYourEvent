const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');

dotenv.config({ path: __dirname + '/.env' });
require('./config/passport');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://bookyourevent.netlify.app'
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
