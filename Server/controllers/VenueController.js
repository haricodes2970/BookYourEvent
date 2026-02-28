const Venue = require('../models/Venue');

// CREATE VENUE — only venueOwner
const createVenue = async (req, res) => {
    try {
        const {
            name, description, type, location,
            capacity, pricePerHour, pricePerDay,
            amenities, bookingType
        } = req.body;

        if (!name || !description || !type || !location || !capacity)
            return res.status(400).json({ message: 'Please fill all required fields' });

        const venue = new Venue({
            owner: req.user.id,
            name,
            description,
            type,
            location,
            capacity,
            pricePerHour,
            pricePerDay,
            amenities,
            bookingType
        });

        await venue.save();
        res.status(201).json({ message: 'Venue created. Waiting for admin approval.', venue });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET ALL APPROVED VENUES — bookers see this
const getAllVenues = async (req, res) => {
    try {
        const venues = await Venue.find({ isApproved: true, isActive: true })
            .populate('owner', 'name email phone');

        res.status(200).json({ count: venues.length, venues });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET SINGLE VENUE BY ID
const getVenueById = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('owner', 'name email phone');

        if (!venue)
            return res.status(404).json({ message: 'Venue not found' });

        res.status(200).json({ venue });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE VENUE — only the owner can delete their own venue
const deleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);

        if (!venue)
            return res.status(404).json({ message: 'Venue not found' });

        if (venue.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized. This is not your venue.' });

        await Venue.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Venue deleted successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createVenue, getAllVenues, getVenueById, deleteVenue };