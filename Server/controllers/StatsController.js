const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const getPlatformStats = async (req, res) => {
    try {
        const venueCount = await Venue.countDocuments({ isApproved: true });
        const bookingCount = await Booking.countDocuments({ status: 'approved' });

        const reviews = await Review.find({});
        let satisfactionRate = 0;
        if (reviews.length > 0) {
            const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            satisfactionRate = Math.round((avg / 5) * 100);
        }

        const venues = await Venue.aggregate([
            { $match: { isApproved: true, images: { $exists: true, $not: { $size: 0 } } } },
            { $sample: { size: 2 } },
            { $project: { name: 1, type: 1, pricePerHour: 1, images: 1, location: 1 } }
        ]);

        res.status(200).json({ venueCount, bookingCount, satisfactionRate, randomVenues: venues });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getPlatformStats };