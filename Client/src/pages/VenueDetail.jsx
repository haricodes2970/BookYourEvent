import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVenueById } from '../services/venueService';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';

const VenueDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const [bookingData, setBookingData] = useState({
        eventDate: '',
        startTime: '',
        endTime: '',
        guestCount: ''
    });

    useEffect(() => {
        const fetchVenue = async () => {
            try {
                const data = await getVenueById(id);
                setVenue(data.venue);
            } catch (err) {
                setError('Failed to load venue');
            } finally {
                setLoading(false);
            }
        };
        fetchVenue();
    }, [id]);

    const handleChange = (e) => {
        setBookingData({ ...bookingData, [e.target.name]: e.target.value });
    };

    const calculatePrice = () => {
        if (!bookingData.startTime || !bookingData.endTime) return 0;
        const start = parseInt(bookingData.startTime.split(':')[0]);
        const end = parseInt(bookingData.endTime.split(':')[0]);
        const hours = end - start;
        return hours > 0 ? hours * venue.pricePerHour : 0;
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setError('');
        setBookingLoading(true);
        try {
            await createBooking({
                venueId: id,
                ...bookingData,
                guestCount: parseInt(bookingData.guestCount)
            });
            setSuccess(
                venue.bookingType === 'instant'
                    ? 'Booking confirmed!'
                    : 'Booking request sent! Waiting for owner approval.'
            );
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
            <p className="text-blue-300 text-lg">Loading venue...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => navigate('/booker/dashboard')}>
                    Book<span className="text-blue-400">Your</span>Event
                </h1>
                <button
                    onClick={() => navigate('/booker/dashboard')}
                    className="text-blue-300 hover:text-white transition"
                >
                    ← Back to Venues
                </button>
            </nav>

            <div className="max-w-4xl mx-auto p-6">
                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
                {success && <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}

                {venue && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Venue Info */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full">
                                {venue.type}
                            </span>
                            <h2 className="text-3xl font-bold text-white mt-3 mb-2">{venue.name}</h2>
                            <p className="text-blue-300 mb-4">📍 {venue.location.address}, {venue.location.city}</p>
                            <p className="text-white/70 mb-6">{venue.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-white/40 text-xs">Capacity</p>
                                    <p className="text-white font-bold text-xl">{venue.capacity}</p>
                                    <p className="text-white/40 text-xs">guests</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-white/40 text-xs">Price</p>
                                    <p className="text-blue-400 font-bold text-xl">₹{venue.pricePerHour}</p>
                                    <p className="text-white/40 text-xs">per hour</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-blue-200 text-sm mb-2">Amenities</p>
                                <div className="flex flex-wrap gap-2">
                                    {venue.amenities?.map((amenity, index) => (
                                        <span key={index} className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full">
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-white/40 text-xs">Booking Type</p>
                                <p className="text-white font-semibold capitalize">{venue.bookingType}</p>
                            </div>

                            <div className="mt-2">
                                <p className="text-white/40 text-xs">Owner</p>
                                <p className="text-white">{venue.owner?.name}</p>
                                <p className="text-blue-300 text-sm">{venue.owner?.phone}</p>
                            </div>
                        </div>

                        {/* Booking Form */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-6">Book This Venue</h3>
                            <form onSubmit={handleBooking} className="space-y-4">
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Event Date</label>
                                    <input
                                        type="date"
                                        name="eventDate"
                                        value={bookingData.eventDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-blue-200 text-sm mb-1 block">Start Time</label>
                                        <input
                                            type="time"
                                            name="startTime"
                                            value={bookingData.startTime}
                                            onChange={handleChange}
                                            className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-blue-200 text-sm mb-1 block">End Time</label>
                                        <input
                                            type="time"
                                            name="endTime"
                                            value={bookingData.endTime}
                                            onChange={handleChange}
                                            className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Number of Guests</label>
                                    <input
                                        type="number"
                                        name="guestCount"
                                        value={bookingData.guestCount}
                                        onChange={handleChange}
                                        placeholder={`Max ${venue.capacity} guests`}
                                        max={venue.capacity}
                                        className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition"
                                        required
                                    />
                                </div>

                                {/* Price Calculation */}
                                {calculatePrice() > 0 && (
                                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                                        <p className="text-blue-200 text-sm">Estimated Total</p>
                                        <p className="text-white font-bold text-2xl">₹{calculatePrice()}</p>
                                        <p className="text-blue-300 text-xs">
                                            {parseInt(bookingData.endTime) - parseInt(bookingData.startTime)} hours × ₹{venue.pricePerHour}/hr
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={bookingLoading}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                                >
                                    {bookingLoading ? 'Processing...' : venue.bookingType === 'instant' ? 'Book Now' : 'Send Booking Request'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VenueDetail;