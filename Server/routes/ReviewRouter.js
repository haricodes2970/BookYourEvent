const express = require('express');
const router = express.Router();
const { createReview, getVenueReviews } = require('../controllers/ReviewController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create', verifyToken, authorizeRoles('booker'), createReview);
router.get('/:venueId', verifyToken, getVenueReviews);

module.exports = router;