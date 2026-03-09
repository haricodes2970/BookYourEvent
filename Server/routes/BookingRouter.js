const express = require('express');
const router  = express.Router();
const {
    createBooking,
    raiseBid,
    getVenueBookings,
    getMyBookings,
    updateBookingStatus,
    getAllBookingsAdmin,
} = require('../controllers/BookingController');
const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/create',                    protect, createBooking);
router.patch('/:id/raise-bid',            protect, raiseBid);
router.get('/venue/:venueId',             protect, getVenueBookings);
router.get('/my-bookings',                protect, getMyBookings);
router.patch('/:id/status',               protect, updateBookingStatus);
router.get('/admin/all',                  protect, adminOnly, getAllBookingsAdmin);

module.exports = router;