const Venue = require('../models/Venue');

const parseMaybeJson = (value, fallback) => {
    if (typeof value !== 'string') {
        return value ?? fallback;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const createVenue = async (req, res) => {
    try {
        const {
            name, description, type, location,
            capacity, pricePerHour, pricePerDay,
            amenities, bookingType
        } = req.body;

        if (!name || !description || !type || !location || !capacity)
            return res.status(400).json({ message: 'Please fill all required fields' });

        // Get uploaded image URLs from Cloudinary
        const images = req.files ? req.files.map(file => file.path) : [];

        const venue = new Venue({
            owner: req.user.id,
            name, description, type,
            location: typeof location === 'string' ? JSON.parse(location) : location,
            capacity, pricePerHour, pricePerDay,
            amenities: typeof amenities === 'string' ? JSON.parse(amenities) : amenities,
            bookingType,
            images
        });

        await venue.save();
        res.status(201).json({ message: 'Venue created. Waiting for admin approval.', venue });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAllVenues = async (req, res) => {
    try {
        const venues = await Venue.find({ isApproved: true, isActive: true })
            .populate('owner', 'name username email phone avatar');
        res.status(200).json({ count: venues.length, venues });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getMyVenues = async (req, res) => {
    try {
        const venues = await Venue.find({ owner: req.user.id })
            .populate('owner', 'name username email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({ count: venues.length, venues });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getVenueById = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('owner', 'name email phone');
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        res.status(200).json({ venue });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        if (venue.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized. This is not your venue.' });
        await Venue.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Venue deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const updateVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        if (venue.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized. This is not your venue.' });
        }

        const payload = req.body || {};
        const location = parseMaybeJson(payload.location, null);
        const amenities = parseMaybeJson(payload.amenities, null);

        if (payload.name !== undefined) venue.name = payload.name;
        if (payload.description !== undefined) venue.description = payload.description;
        if (payload.type !== undefined) venue.type = payload.type;
        if (payload.bookingType !== undefined) venue.bookingType = payload.bookingType;
        if (payload.capacity !== undefined) venue.capacity = Number(payload.capacity) || venue.capacity;
        if (payload.pricePerHour !== undefined) venue.pricePerHour = Number(payload.pricePerHour) || 0;
        if (payload.pricePerDay !== undefined) venue.pricePerDay = Number(payload.pricePerDay) || 0;

        if (location && typeof location === 'object') {
            venue.location = {
                ...venue.location,
                address: location.address ?? venue.location?.address,
                city: location.city ?? venue.location?.city,
                pincode: location.pincode ?? venue.location?.pincode,
            };
        }

        if (Array.isArray(amenities)) {
            venue.amenities = amenities;
        }

        await venue.save();

        const updatedVenue = await Venue.findById(venue._id).populate('owner', 'name username email avatar');
        res.status(200).json({ message: 'Venue updated successfully', venue: updatedVenue });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const toggleVenueActive = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        if (venue.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized. This is not your venue.' });
        }

        if (typeof req.body?.isActive === 'boolean') {
            venue.isActive = req.body.isActive;
        } else {
            venue.isActive = !venue.isActive;
        }

        await venue.save();
        res.status(200).json({
            message: venue.isActive ? 'Venue enabled successfully' : 'Venue disabled successfully',
            venue,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const approveVenue = async (req, res) => {
    try {
        const venue = await Venue.findByIdAndUpdate(
            req.params.id, { isApproved: true }, { new: true }
        );
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        res.status(200).json({ message: 'Venue approved', venue });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAllVenuesAdmin = async (req, res) => {
    try {
        const venues = await Venue.find().populate('owner', 'name email phone');
        res.status(200).json({ count: venues.length, venues });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const adminDeleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findByIdAndDelete(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        res.status(200).json({ message: 'Venue deleted by admin' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const blockDates = async (req, res) => {
    try {
        const { dates } = req.body;
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        if (venue.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized' });

        venue.blockedDates = [...new Set([
            ...venue.blockedDates.map(d => d.toISOString().split('T')[0]),
            ...dates
        ])].map(d => new Date(d));

        await venue.save();
        res.status(200).json({ message: 'Dates blocked', blockedDates: venue.blockedDates });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const unblockDate = async (req, res) => {
    try {
        const { date } = req.body;
        const venue = await Venue.findById(req.params.id);
        if (!venue) return res.status(404).json({ message: 'Venue not found' });
        if (venue.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized' });

        venue.blockedDates = venue.blockedDates.filter(d =>
            d.toISOString().split('T')[0] !== date
        );

        await venue.save();
        res.status(200).json({ message: 'Date unblocked', blockedDates: venue.blockedDates });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    createVenue,
    getAllVenues,
    getMyVenues,
    getVenueById,
    deleteVenue,
    updateVenue,
    toggleVenueActive,
    approveVenue,
    getAllVenuesAdmin,
    adminDeleteVenue,
    blockDates,
    unblockDate,
};
