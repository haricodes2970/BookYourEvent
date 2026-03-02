import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createVenue, getAllVenues, deleteVenue } from '../services/venueService';
import { getVenueBookings, updateBookingStatus } from '../services/bookingService';

const VENUE_TYPES = [
    'Marriage Hall', 'Party Hall', 'Conference Room', 'Shop/Retail',
    'Farmhouse', 'Rooftop', 'Studio', 'Theatre', 'Sports Ground',
    'Banquet Hall', 'Resort', 'Turf', 'Swimming Pool', 'Auditorium',
    'Warehouse', 'Photoshoot Studio', 'Terrace', 'Community Hall'
];

const AMENITIES_LIST = [
    'AC', 'Parking', 'WiFi', 'Stage', 'Sound System',
    'Projector', 'Catering Kitchen', 'Generator', 'Washrooms',
    'Changing Rooms', 'Security', 'Swimming Pool', 'Floodlights', 'Unlimited Food'
];

const OwnerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Marriage Hall',
        location: { address: '', city: 'Bangalore', pincode: '' },
        capacity: '',
        pricePerHour: '',
        pricePerDay: '',
        amenities: [],
        bookingType: 'manual'
    });

    useEffect(() => {
        fetchMyVenues();
    }, []);

    const fetchMyVenues = async () => {
        try {
            const data = await getAllVenues();
            const myVenues = data.venues.filter(v => v.owner._id === user.id);
            setVenues(myVenues);
        } catch (err) {
            setError('Failed to load venues');
        } finally {
            setLoading(false);
        }
    };

    const fetchVenueBookings = async (venueId) => {
        setBookingsLoading(true);
        try {
            const data = await getVenueBookings(venueId);
            setBookings(data.bookings);
        } catch (err) {
            setError('Failed to load bookings');
        } finally {
            setBookingsLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingId, status) => {
        try {
            await updateBookingStatus(bookingId, status);
            setBookings(bookings.map(b =>
                b._id === bookingId ? { ...b, status } : b
            ));
            setSuccess(`Booking ${status} successfully`);
        } catch (err) {
            setError('Failed to update booking status');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'address' || name === 'pincode') {
            setFormData({ ...formData, location: { ...formData.location, [name]: value } });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAmenityToggle = (amenity) => {
        if (formData.amenities.includes(amenity)) {
            setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
        } else {
            setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');
        try {
            await createVenue(formData);
            setSuccess('Venue created! Waiting for admin approval.');
            setShowForm(false);
            fetchMyVenues();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create venue');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this venue?')) return;
        try {
            await deleteVenue(id);
            setVenues(venues.filter(v => v._id !== id));
        } catch (err) {
            setError('Failed to delete venue');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Book<span className="text-blue-400">Your</span>Event</h1>
                <div className="flex items-center gap-4">
                    <span className="text-blue-200 text-sm">Welcome, {user?.name}</span>
                    <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg text-sm transition">Logout</button>
                </div>
            </nav>

            <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">My Venues</h2>
                        <p className="text-blue-300">Manage your venue listings</p>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        {showForm ? 'Cancel' : '+ Add New Venue'}
                    </button>
                </div>

                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
                {success && <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-4">{success}</div>}

                {/* Create Venue Form */}
                {showForm && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
                        <h3 className="text-xl font-bold text-white mb-6">Create New Venue</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Venue Name</label>
                                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Enter venue name" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition" required />
                                </div>
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Venue Type</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-slate-800 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition">
                                        {VENUE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-blue-200 text-sm mb-1 block">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe your venue" rows={3} className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Address</label>
                                    <input name="address" value={formData.location.address} onChange={handleChange} placeholder="Street address" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition" required />
                                </div>
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Pincode</label>
                                    <input name="pincode" value={formData.location.pincode} onChange={handleChange} placeholder="560001" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Capacity</label>
                                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="Max guests" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition" required />
                                </div>
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Price Per Hour (₹)</label>
                                    <input type="number" name="pricePerHour" value={formData.pricePerHour} onChange={handleChange} placeholder="2000" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition" />
                                </div>
                                <div>
                                    <label className="text-blue-200 text-sm mb-1 block">Price Per Day (₹)</label>
                                    <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} placeholder="15000" className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 transition" />
                                </div>
                            </div>

                            <div>
                                <label className="text-blue-200 text-sm mb-2 block">Booking Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input type="radio" name="bookingType" value="manual" checked={formData.bookingType === 'manual'} onChange={handleChange} />
                                        Manual Approval
                                    </label>
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input type="radio" name="bookingType" value="instant" checked={formData.bookingType === 'instant'} onChange={handleChange} />
                                        Instant Booking
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-blue-200 text-sm mb-2 block">Amenities</label>
                                <div className="flex flex-wrap gap-2">
                                    {AMENITIES_LIST.map(amenity => (
                                        <button
                                            type="button"
                                            key={amenity}
                                            onClick={() => handleAmenityToggle(amenity)}
                                            className={`px-3 py-1 rounded-full text-sm transition ${
                                                formData.amenities.includes(amenity)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                                            }`}
                                        >
                                            {amenity}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition">
                                {formLoading ? 'Creating...' : 'Create Venue'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Venues List */}
                {loading ? (
                    <p className="text-blue-300">Loading your venues...</p>
                ) : venues.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-blue-300 text-lg">No venues yet. Create your first venue!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {venues.map(venue => (
                            <div key={venue._id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full">{venue.type}</span>
                                    <span className={`text-xs px-3 py-1 rounded-full ${venue.isApproved ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                        {venue.isApproved ? 'Approved' : 'Pending'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{venue.name}</h3>
                                <p className="text-blue-300 text-sm mb-4">📍 {venue.location.address}</p>
                                <div className="flex justify-between items-center border-t border-white/10 pt-4">
                                    <p className="text-blue-400 font-bold">₹{venue.pricePerHour}/hr</p>
                                    <button
                                        onClick={() => handleDelete(venue._id)}
                                        className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1 rounded-lg text-sm transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bookings Section */}
                {venues.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-white mb-4">Booking Requests</h3>
                        <div className="flex gap-3 mb-4 flex-wrap">
                            {venues.map(venue => (
                                <button
                                    key={venue._id}
                                    onClick={() => fetchVenueBookings(venue._id)}
                                    className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-4 py-2 rounded-lg text-sm transition"
                                >
                                    {venue.name}
                                </button>
                            ))}
                        </div>

                        {bookingsLoading && <p className="text-blue-300">Loading bookings...</p>}

                        {bookings.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bookings.map(booking => (
                                    <div key={booking._id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-white font-semibold">{booking.booker?.name}</p>
                                                <p className="text-blue-300 text-sm">{booking.booker?.email}</p>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full ${
                                                booking.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                                                booking.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                                                'bg-yellow-500/20 text-yellow-300'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div>
                                                <p className="text-white/40 text-xs">Date</p>
                                                <p className="text-white text-sm">{new Date(booking.eventDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-xs">Time</p>
                                                <p className="text-white text-sm">{booking.startTime} - {booking.endTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-xs">Guests</p>
                                                <p className="text-white text-sm">{booking.guestCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/40 text-xs">Total</p>
                                                <p className="text-blue-400 font-bold">₹{booking.totalPrice}</p>
                                            </div>
                                        </div>
                                        {booking.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleStatusUpdate(booking._id, 'approved')}
                                                    className="flex-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 py-2 rounded-lg text-sm transition"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                                                    className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 py-2 rounded-lg text-sm transition"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {!bookingsLoading && bookings.length === 0 && (
                            <p className="text-blue-300">Click a venue above to see its bookings.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;