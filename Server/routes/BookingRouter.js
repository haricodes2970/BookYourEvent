const express = require('express');
const router = express.Router();
const { createBooking, getVenueBookings, getMyBookings, updateBookingStatus, getAllBookingsAdmin } = require('../controllers/BookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles, adminOnly } = require('../middleware/roleMiddleware');

router.post('/create', protect, authorizeRoles('booker'), createBooking);
router.get('/my-bookings', protect, authorizeRoles('booker'), getMyBookings);
router.get('/all', protect, adminOnly, getAllBookingsAdmin);
router.get('/venue/:venueId', protect, authorizeRoles('venueOwner', 'admin'), getVenueBookings);
router.patch('/:id/status', protect, authorizeRoles('venueOwner', 'admin'), updateBookingStatus);

module.exports = router;