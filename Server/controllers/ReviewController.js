const Review = require('../models/Review');
const Booking = require('../models/Booking');



// CREATE REVIEW
const createReview = async (req, res) => {
    try {
        const { venueId, bookingId, rating, comment } = req.body;

        if (!venueId || !bookingId || !rating || !comment)
            return res.status(400).json({ message: 'Please fill all fields' });

        
        
        // Check booking exists and belongs to this user
        const booking = await Booking.findById(bookingId);
        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });

        if (booking.booker.toString() !== req.user.id)
            return res.status(403).json({ message: 'This is not your booking' });

        
        
        // Only completed or approved bookings can be reviewed
        if (!['approved', 'completed'].includes(booking.status))
            return res.status(400).json({ message: 'You can only review after your event is confirmed' });

        
        
        // One review per booking
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview)
            return res.status(400).json({ message: 'You have already reviewed this booking' });

        const review = new Review({
            venue: venueId,
            booker: req.user.id,
            booking: bookingId,
            rating,
            comment
        });

        await review.save();
        res.status(201).json({ message: 'Review submitted successfully', review });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};



// GET ALL REVIEWS FOR A VENUE
const getVenueReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ venue: req.params.venueId })
            .populate('booker', 'name');

        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        res.status(200).json({ 
            count: reviews.length, 
            averageRating: avgRating,
            reviews 
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createReview, getVenueReviews };