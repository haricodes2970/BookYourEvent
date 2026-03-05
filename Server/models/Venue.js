const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'Marriage Hall', 'Party Hall', 'Conference Room',
            'Shop/Retail', 'Farmhouse', 'Rooftop', 'Studio',
            'Theatre', 'Sports Ground', 'Banquet Hall', 'Resort',
            'Turf', 'Swimming Pool', 'Auditorium', 'Warehouse',
            'Photoshoot Studio', 'Terrace', 'Community Hall'
        ],
        required: true
    },
    location: {
        address: { type: String, required: true },
        city: { type: String, default: 'Bangalore' },
        pincode: { type: String, required: true }
    },
    capacity: {
        type: Number,
        required: true
    },
    pricePerHour: {
        type: Number,
        default: 0
    },
    pricePerDay: {
        type: Number,
        default: 0
    },
    amenities: {
        type: [String],
        enum: [
            'AC', 'Parking', 'WiFi', 'Stage', 'Sound System',
            'Projector', 'Catering Kitchen', 'Generator',
            'Washrooms', 'Changing Rooms', 'Security',
            'Swimming Pool', 'Floodlights', 'Unlimited Food'
        ]
    },
    bookingType: {
        type: String,
        enum: ['instant', 'manual'],
        default: 'manual'
    },
    images: {
        type: [String],
        default: []
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Venue = mongoose.model('Venue', venueSchema);
module.exports = Venue;