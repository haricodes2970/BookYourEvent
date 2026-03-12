const Review = require('../models/Review');
const Booking = require('../models/Booking');

const addReview = async (req, res) => {
    try {
        const { venueId, rating, comment, text } = req.body;
        const reviewText = (typeof comment === 'string' ? comment : typeof text === 'string' ? text : '').trim();

        // Check if user has a completed/approved booking for this venue
        const booking = await Booking.findOne({
            venue: venueId,
            booker: req.user.id,
            status: { $in: ['approved', 'confirmed'] },
        });
        if (!booking) return res.status(403).json({ message: 'You can only review venues you have booked' });

        // Check if already reviewed
        const existing = await Review.findOne({ venue: venueId, reviewer: req.user.id });
        if (existing) return res.status(400).json({ message: 'You have already reviewed this venue' });

        const review = await Review.create({
            venue: venueId,
            reviewer: req.user.id,
            rating,
            comment: reviewText,
        });

        await review.populate('reviewer', 'name');
        res.status(201).json({ message: 'Review added!', review });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getVenueReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ venue: req.params.venueId })
            .populate('reviewer', 'name')
            .sort({ createdAt: -1 });

        const avgRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        res.status(200).json({ reviews, avgRating, total: reviews.length });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: 'Unauthorized' });
        await Review.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { addReview, getVenueReviews, deleteReview };
