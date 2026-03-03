const express = require('express');
const router = express.Router();
const { createReview, getVenueReviews } = require('../controllers/ReviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create', protect, authorizeRoles('booker'), createReview);
router.get('/:venueId', protect, getVenueReviews);

module.exports = router;