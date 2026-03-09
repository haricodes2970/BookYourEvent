const Booking = require('../models/Booking');
const Venue   = require('../models/Venue');
const User    = require('../models/User');
const {
    sendBookingApprovedEmail,
    sendBookingRejectedEmail,
    sendBookingExpiredEmail,
    sendPaymentReminderEmail,
    sendOwnerNewBidEmail,
    sendOwnerBidRaisedEmail,
} = require('../utils/emailService');

/* ══════════════════════════════════════
   CREATE BOOKING / PLACE BID
   POST /api/bookings/create
══════════════════════════════════════ */
const createBooking = async (req, res) => {
    try {
        const { venueId, eventDate, startTime, endTime, guestCount, bidAmount, message } = req.body;

        if (!venueId || !eventDate || !startTime || !endTime || !guestCount)
            return res.status(400).json({ message: 'Please fill all fields' });

        const venue = await Venue.findById(venueId);
        if (!venue)
            return res.status(404).json({ message: 'Venue not found' });
        if (!venue.isApproved)
            return res.status(400).json({ message: 'Venue is not available for booking' });

        if (guestCount > venue.capacity)
            return res.status(400).json({ message: `Venue capacity is ${venue.capacity} guests maximum` });

        // ── Check if this booker already has a pending bid for this slot ──
        const existingBid = await Booking.findOne({
            venue:     venueId,
            booker:    req.user.id,
            eventDate: new Date(eventDate),
            status:    { $in: ['pending', 'payment_pending'] },
        });
        if (existingBid)
            return res.status(400).json({ message: 'You already have a bid for this slot. Raise your bid instead.' });

        // ── Check for already confirmed booking on same slot ──
        const confirmed = await Booking.findOne({
            venue:     venueId,
            eventDate: new Date(eventDate),
            status:    'confirmed',
            $and: [{ startTime: { $lt: endTime } }, { endTime: { $gt: startTime } }],
        });
        if (confirmed)
            return res.status(400).json({ message: 'This slot is already confirmed. Please choose another time.' });

        // ── Calculate price ──
        const start      = parseInt(startTime.split(':')[0]);
        const end        = parseInt(endTime.split(':')[0]);
        const hours      = end - start;
        const totalPrice = hours * venue.pricePerHour;
        const finalBid   = bidAmount && bidAmount > totalPrice ? bidAmount : totalPrice;

        const booking = await Booking.create({
            venue:      venueId,
            booker:     req.user.id,
            eventDate:  new Date(eventDate),
            startTime,
            endTime,
            guestCount,
            totalPrice,
            bidAmount:  finalBid,
            status:     'pending',
            bids: [{
                booker:    req.user.id,
                bidAmount: finalBid,
                message:   message || '',
            }],
        });

        await booking.populate([
            {
                path: 'venue',
                select: 'name owner',
                populate: { path: 'owner', select: 'name email' },
            },
            { path: 'booker', select: 'name email' },
        ]);

        if (booking.venue?.owner?.email) {
            try {
                await sendOwnerNewBidEmail(
                    booking.venue.owner.email,
                    booking.venue.owner.name,
                    {
                        venueName: booking.venue.name,
                        eventDate: booking.eventDate,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        bidAmount: booking.bidAmount,
                        bookerName: booking.booker?.name,
                        bookerEmail: booking.booker?.email,
                    }
                );
            } catch (emailErr) {
                console.error(`Owner new-bid email failed for booking ${booking._id}:`, emailErr.message);
            }
        } else {
            console.warn(`Owner email missing for booking ${booking._id}. New-bid email skipped.`);
        }

        res.status(201).json({
            message: 'Bid placed! Waiting for owner to review all bids.',
            booking,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════
   RAISE BID
   PATCH /api/bookings/:id/raise-bid
══════════════════════════════════════ */
const raiseBid = async (req, res) => {
    try {
        const { newBidAmount, message } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });
        if (booking.booker.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized' });
        if (!['pending'].includes(booking.status))
            return res.status(400).json({ message: 'Cannot raise bid at this stage' });
        if (newBidAmount <= booking.bidAmount)
            return res.status(400).json({ message: `New bid must be higher than current bid ₹${booking.bidAmount}` });

        booking.bidAmount = newBidAmount;
        booking.bids.push({ booker: req.user.id, bidAmount: newBidAmount, message: message || '' });
        await booking.save();

        await booking.populate([
            {
                path: 'venue',
                select: 'name owner',
                populate: { path: 'owner', select: 'name email' },
            },
            { path: 'booker', select: 'name email' },
        ]);

        if (booking.venue?.owner?.email) {
            try {
                await sendOwnerBidRaisedEmail(
                    booking.venue.owner.email,
                    booking.venue.owner.name,
                    {
                        venueName: booking.venue.name,
                        eventDate: booking.eventDate,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        bidAmount: booking.bidAmount,
                        bookerName: booking.booker?.name,
                        bookerEmail: booking.booker?.email,
                    }
                );
            } catch (emailErr) {
                console.error(`Owner raised-bid email failed for booking ${booking._id}:`, emailErr.message);
            }
        } else {
            console.warn(`Owner email missing for booking ${booking._id}. Raised-bid email skipped.`);
        }

        res.status(200).json({ message: 'Bid raised successfully!', booking });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════
   GET ALL BIDS FOR A VENUE SLOT — owner sees ranked bids
   GET /api/bookings/venue/:venueId
══════════════════════════════════════ */
const getVenueBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ venue: req.params.venueId })
            .populate('booker', 'name username email avatar phone')
            .populate('venue', 'name location')
            .sort({ bidAmount: -1 }); // highest bid first

        res.status(200).json({ count: bookings.length, bookings });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getOwnerBookings = async (req, res) => {
    try {
        const ownerVenueFilter = { owner: req.user.id };
        if (req.query.venueId) {
            ownerVenueFilter._id = req.query.venueId;
        }

        const ownerVenues = await Venue.find(ownerVenueFilter).select('_id');
        const venueIds = ownerVenues.map((venue) => venue._id);

        if (!venueIds.length) {
            return res.status(200).json({
                count: 0,
                bookings: [],
                stats: {
                    totalBookings: 0,
                    confirmedBookings: 0,
                    pendingBookings: 0,
                    paymentPendingBookings: 0,
                    totalRevenue: 0,
                },
            });
        }

        const bookings = await Booking.find({ venue: { $in: venueIds } })
            .populate('booker', 'name username email avatar')
            .populate('venue', 'name location isApproved isActive')
            .sort({ createdAt: -1 });

        const stats = bookings.reduce(
            (acc, booking) => {
                acc.totalBookings += 1;
                if (booking.status === 'confirmed') {
                    acc.confirmedBookings += 1;
                    acc.totalRevenue += booking.ownerAmount || booking.bidAmount || booking.totalPrice || 0;
                }
                if (booking.status === 'pending') {
                    acc.pendingBookings += 1;
                }
                if (booking.status === 'payment_pending') {
                    acc.paymentPendingBookings += 1;
                }
                return acc;
            },
            {
                totalBookings: 0,
                confirmedBookings: 0,
                pendingBookings: 0,
                paymentPendingBookings: 0,
                totalRevenue: 0,
            }
        );

        res.status(200).json({ count: bookings.length, bookings, stats });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════
   GET MY BOOKINGS — booker sees own bids
   GET /api/bookings/my-bookings
══════════════════════════════════════ */
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ booker: req.user.id })
            .populate({ path: 'venue', select: 'name location pricePerHour images owner', populate: { path: 'owner', select: 'name email role' } })
            .sort({ createdAt: -1 });

        res.status(200).json({ count: bookings.length, bookings });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════
   APPROVE / REJECT BOOKING — owner action
   PATCH /api/bookings/:id/status
   When approved:
     - payment_deadline = now + 4hrs
     - email + in-app notification to booker
     - other bids on same slot → rejected
══════════════════════════════════════ */
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status))
            return res.status(400).json({ message: 'Invalid status' });

        const booking = await Booking.findById(req.params.id)
            .populate('venue')
            .populate('booker', 'name email');

        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });

        if (booking.venue.owner.toString() !== req.user.id)
            return res.status(403).json({ message: 'Unauthorized' });

        if (status === 'approved') {
            const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000);
            booking.status = 'payment_pending';
            booking.paymentDeadline = deadline;

            await Booking.updateMany(
                {
                    venue: booking.venue._id,
                    eventDate: booking.eventDate,
                    _id: { $ne: booking._id },
                    status: 'pending',
                },
                { status: 'rejected' }
            );
        } else {
            booking.status = 'rejected';
        }

        await booking.save();

        if (status === 'approved') {
            if (booking.booker?.email) {
                try {
                    await sendBookingApprovedEmail(
                        booking.booker.email,
                        booking.booker.name,
                        {
                            venueName: booking.venue.name,
                            eventDate: booking.eventDate,
                            startTime: booking.startTime,
                            endTime: booking.endTime,
                            bidAmount: booking.bidAmount,
                            deadline: booking.paymentDeadline,
                        }
                    );
                } catch (emailErr) {
                    console.error(`Approval email failed for booking ${booking._id}:`, emailErr.message);
                }
            } else {
                console.warn(`Booker email missing for booking ${booking._id}. Approval email skipped.`);
            }
        } else if (booking.booker?.email) {
            try {
                await sendBookingRejectedEmail(
                    booking.booker.email,
                    booking.booker.name,
                    {
                        venueName: booking.venue.name,
                        eventDate: booking.eventDate,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        bidAmount: booking.bidAmount,
                    }
                );
            } catch (emailErr) {
                console.error(`Rejection email failed for booking ${booking._id}:`, emailErr.message);
            }
        } else {
            console.warn(`Booker email missing for booking ${booking._id}. Rejection email skipped.`);
        }

        res.status(200).json({
            message: status === 'approved'
                ? 'Booking approved! Booker notified. They have 4 hours to pay.'
                : 'Booking rejected.',
            booking,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/* ══════════════════════════════════════
   EXPIRE UNPAID BOOKINGS — cron job
   Called by setInterval in Server.js every 15 mins
   Expires bookings past deadline
   Sends 1hr reminder email
══════════════════════════════════════ */
const expireUnpaidBookings = async () => {
    try {
        const now = new Date();

        // Find bookings past deadline and expire them.
        const expired = await Booking.find({
            status:          'payment_pending',
            paymentDeadline: { $lt: now },
        }).populate('booker', 'name email').populate('venue', 'name');

        for (const booking of expired) {
            booking.status = 'expired';
            await booking.save();
            console.log(`Booking ${booking._id} expired - slot reopened`);

            if (!booking.booker?.email) {
                console.warn(`Booker email missing for booking ${booking._id}. Expiry email skipped.`);
                continue;
            }

            try {
                await sendBookingExpiredEmail(
                    booking.booker.email,
                    booking.booker.name,
                    {
                        venueName: booking.venue?.name || 'Venue',
                        eventDate: booking.eventDate,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        bidAmount: booking.bidAmount,
                    }
                );
            } catch (emailErr) {
                console.error(`Expiry email failed for booking ${booking._id}:`, emailErr.message);
            }
        }

        // Find bookings within 1hr of deadline and send reminder email once.
        const reminderWindow = new Date(now.getTime() + 60 * 60 * 1000);
        const needsReminder  = await Booking.find({
            status:          'payment_pending',
            reminderSent:    false,
            paymentDeadline: { $gt: now, $lt: reminderWindow },
        }).populate('booker', 'name email').populate('venue', 'name');

        for (const booking of needsReminder) {
            if (!booking.booker?.email) {
                console.warn(`Booker email missing for booking ${booking._id}. Reminder skipped.`);
                continue;
            }

            try {
                await sendPaymentReminderEmail(
                    booking.booker.email,
                    booking.booker.name,
                    {
                        venueName: booking.venue.name,
                        deadline: booking.paymentDeadline,
                        bidAmount: booking.bidAmount,
                    }
                );
                booking.reminderSent = true;
                await booking.save();
                console.log(`Reminder sent to ${booking.booker.email}`);
            } catch (e) {
                console.error(`Reminder email failed for booking ${booking._id}:`, e.message);
            }
        }
    } catch (err) {
        console.error('Expiry job error:', err.message);
    }
};

const getAllBookingsAdmin = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('booker', 'name email phone')
            .populate('venue', 'name location')
            .sort({ createdAt: -1 });
        res.status(200).json({ count: bookings.length, bookings });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = {
    createBooking,
    raiseBid,
    getVenueBookings,
    getOwnerBookings,
    getMyBookings,
    updateBookingStatus,
    getAllBookingsAdmin,
    expireUnpaidBookings,
};

