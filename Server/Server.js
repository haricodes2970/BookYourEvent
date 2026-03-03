const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://spontaneous-pixie-eb33b8.netlify.app'

    ],
    credentials: true
}));
app.use(express.json());

// Connect to Database
connectDB();

// Health Check Route
app.get('/', (req, res) => {
    res.json({ message: 'BookYourEvent Server is Running' });
});

// Routes (we wire these soon)
// Routes
app.use('/api/auth', require('./routes/AuthRouter'));
// app.use('/api/auth', require('./routes/AuthRouter'));
app.use('/api/venues', require('./routes/VenueRouter'));
app.use('/api/bookings', require('./routes/BookingRouter'));
app.use('/api/reviews', require('./routes/ReviewRouter'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
