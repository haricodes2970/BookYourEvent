const express = require('express');
const router = express.Router();
const { createBooking, getVenueBookings, getMyBookings, updateBookingStatus } = require('../controllers/BookingController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create', verifyToken, authorizeRoles('booker'), createBooking);
router.get('/my-bookings', verifyToken, authorizeRoles('booker'), getMyBookings);
router.get('/venue/:venueId', verifyToken, authorizeRoles('venueOwner', 'admin'), getVenueBookings);
router.patch('/:id/status', verifyToken, authorizeRoles('venueOwner'), updateBookingStatus);

module.exports = router;