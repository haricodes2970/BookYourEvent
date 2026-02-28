const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

const createBooking = async (req, res) => {
    try {
        const { venueId, eventDate, startTime, endTime, guestCount } = req.body;
        
        
        // 1. Check all fields exist
        if (!venueId || !eventDate || !startTime || !endTime || !guestCount)
            return res.status(400).json({ message: 'Please fill all fields' });
        
        
        // 2. Check venue exists and is approved
        const venue = await Venue.findById(venueId);
        if (!venue)
            return res.status(404).json({ message: 'Venue not found' });
        if (!venue.isApproved)
            return res.status(400).json({ message: 'Venue is not available for booking' });
        
        
        // 3. Check guest count doesn't exceed capacity
        if (guestCount > venue.capacity)
            return res.status(400).json({ 
                message: `Venue capacity is ${venue.capacity} guests maximum` 
            });
        
        
        // 4. THIS IS THE DOUBLE BOOKING PREVENTION
        const clash = await Booking.findOne({
            venue: venueId,
            eventDate: eventDate,
            status: { $in: ['pending', 'approved'] },
            $and: [
                { startTime: { $lt: endTime } },
                { endTime: { $gt: startTime } }
            ]
        });

        if (clash)
            return res.status(400).json({ 
                message: 'This time slot is already booked. Please choose another time.' 
            });
        
        
        // 5. Calculate total price
        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        const hours = end - start;
        const totalPrice = hours * venue.pricePerHour;
        
        
        // 6. Create the booking
        const booking = new Booking({
            venue: venueId,
            booker: req.user.id,
            eventDate,
            startTime,
            endTime,
            guestCount,
            totalPrice,
            status: venue.bookingType === 'instant' ? 'approved' : 'pending'
        });

        await booking.save();

        
        
        res.status(201).json({ 
            message: venue.bookingType === 'instant' 
                ? 'Booking confirmed!' 
                : 'Booking request sent. Waiting for owner approval.',
            booking 
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};





// GET ALL BOOKINGS FOR A VENUE — venue owner sees this
const getVenueBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ venue: req.params.venueId })
            .populate('booker', 'name email phone')
            .populate('venue', 'name location');

        res.status(200).json({ count: bookings.length, bookings });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET ALL BOOKINGS BY A BOOKER — booker sees their own history
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ booker: req.user.id })
            .populate('venue', 'name location pricePerHour');

        res.status(200).json({ count: bookings.length, bookings });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};



// UPDATE BOOKING STATUS — venue owner approves or rejects
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status))
            return res.status(400).json({ message: 'Invalid status' });

        const booking = await Booking.findById(req.params.id)
            .populate('venue');

        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });

        if (booking.venue.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized' });

        booking.status = status;
        await booking.save();

        res.status(200).json({ message: `Booking ${status}`, booking });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { createBooking, getVenueBookings, getMyBookings, updateBookingStatus };

