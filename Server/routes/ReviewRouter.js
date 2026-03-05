const express = require('express');
const router = express.Router();
const { addReview, getVenueReviews, deleteReview } = require('../controllers/ReviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addReview);
router.get('/:venueId', protect, getVenueReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;