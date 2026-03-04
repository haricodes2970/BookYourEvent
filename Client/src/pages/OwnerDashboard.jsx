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
    const [activeTab, setActiveTab] = useState('venues');
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        name: '', description: '', type: 'Marriage Hall',
        location: { address: '', city: 'Bangalore', pincode: '' },
        capacity: '', pricePerHour: '', pricePerDay: '',
        amenities: [], bookingType: 'manual'
    });

    useEffect(() => { fetchMyVenues(); }, []);

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
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, status } : b));
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
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteVenue(id);
            setVenues(venues.filter(v => v._id !== id));
        } catch (err) {
            setError('Failed to delete venue');
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
            background: 'linear-gradient(180deg, #c8e6c9 0%, #d8eeda 20%, #e8f5e9 45%, #f1f8f1 70%, #f8fdf8 100%)'
        }}>
            {/* Birds Left */}
            <svg className="absolute top-20 left-16 opacity-25 z-0 pointer-events-none" width="180" height="80" viewBox="0 0 180 80">
                <path d="M10 40 Q24 26 38 40 Q24 33 10 40Z" fill="#4a8a6a"/>
                <path d="M48 25 Q62 12 76 25 Q62 18 48 25Z" fill="#4a8a6a" opacity="0.8"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8a6a" opacity="0.7"/>
                <path d="M22 58 Q36 45 50 58 Q36 51 22 58Z" fill="#4a8a6a" opacity="0.5"/>
            </svg>

            {/* Birds Right */}
            <svg className="absolute top-14 right-24 opacity-25 z-0 pointer-events-none" width="160" height="70" viewBox="0 0 160 70">
                <path d="M120 30 Q134 17 148 30 Q134 23 120 30Z" fill="#4a8a6a"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8a6a" opacity="0.8"/>
                <path d="M130 52 Q144 39 158 52 Q144 45 130 52Z" fill="#4a8a6a" opacity="0.6"/>
            </svg>

            {/* Extra Birds */}
            <svg className="absolute top-40 left-1/3 opacity-15 z-0 pointer-events-none" width="120" height="60" viewBox="0 0 120 60">
                <path d="M10 30 Q22 18 34 30 Q22 24 10 30Z" fill="#6aaa8a"/>
                <path d="M44 18 Q56 6 68 18 Q56 12 44 18Z" fill="#6aaa8a" opacity="0.8"/>
                <path d="M78 34 Q90 22 102 34 Q90 28 78 34Z" fill="#6aaa8a" opacity="0.6"/>
            </svg>

            {/* Wildflowers Bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#a8d4a8" opacity="0.25"/>
                    <path d="M0 180 Q220 130 440 155 Q660 120 880 148 Q1100 125 1320 142 L1440 138 L1440 180Z" fill="#88c888" opacity="0.2"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={130+(i%5)*8} stroke="#7aaa7a" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={122+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)}
                                fill={['#b8d8b8','#c8e0c8','#d4e8d4','#c0d8c0','#d8e8c0','#e8d4b8'][i%6]} opacity="0.7"/>
                            {i%3===0 && <ellipse cx={x+8} cy={118+(i%4)*9} rx="4" ry="7" fill="#d0dcb8" opacity="0.5"/>}
                        </g>
                    ))}
                </svg>
            </div>

            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 text-xs italic z-10 tracking-widest pointer-events-none">
                EASY. BOOK. ENJOY.
            </p>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-4">
                {/* Left — Logo + Nav Links */}
                <div className="flex items-center gap-8">
                    <img src="/logo.png" alt="BYE" className="h-14 w-14 rounded-full object-cover shadow-md cursor-pointer"
                    onClick={() => navigate('/')}
                    onError={(e)=>{e.target.style.display='none'}}/>
                    <button onClick={()=>setActiveTab('venues')}
                        className={`text-sm font-medium transition ${activeTab==='venues' ? 'text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                        My Venues
                    </button>
                    <button onClick={()=>setActiveTab('bookings')}
                        className={`text-sm font-medium transition ${activeTab==='bookings' ? 'text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                        Bookings
                    </button>
                    <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">About</a>
                    <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">Contact</a>
                </div>

                {/* Center — Search */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
                    <input
                        type="text"
                        placeholder="Search Venues"
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                        className="bg-transparent text-slate-600 text-sm focus:outline-none placeholder-slate-400 w-44"
                    />
                    <span className="text-slate-400 text-sm">🔍</span>
                </div>

                {/* Right — Buttons */}
                <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm font-medium">Hi, {user?.name?.split(' ')[0]}</span>
                    <button
                        onClick={()=>{ setShowForm(!showForm); setActiveTab('venues'); }}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', color: '#4a7a5a' }}>
                        {showForm ? 'Cancel' : '+ Add Venue'}
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
                        Account Settings
                    </button>
                    <button onClick={handleLogout}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
                        Log Out
                    </button>
                </div>
            </nav>

            {/* Page Title */}
            <div className="relative z-10 px-8 pt-2 pb-4">
                <h1 className="text-2xl font-bold text-slate-700">Owner Dashboard</h1>
                <p className="text-slate-400 text-xs tracking-widest uppercase mt-0.5">Oversee Venues & Bookings</p>
            </div>

            {/* Alerts */}
            <div className="relative z-10 px-8">
                {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-3 text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-3 text-sm">{success}</div>}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 px-8 pb-24 overflow-y-auto">

                {/* Create Venue Form */}
                {showForm && (
                    <div className="rounded-2xl p-6 mb-6 shadow-lg"
                        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.9)' }}>
                        <h3 className="text-lg font-bold text-slate-700 mb-4">Create New Venue</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-slate-500 text-xs mb-1 block">Venue Name</label>
                                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Enter venue name"
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-green-400 transition text-sm" required/>
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs mb-1 block">Venue Type</label>
                                    <select name="type" value={formData.type} onChange={handleChange}
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-green-400 transition text-sm">
                                        {VENUE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-500 text-xs mb-1 block">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange}
                                    placeholder="Describe your venue" rows={2}
                                    className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-green-400 transition text-sm resize-none" required/>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-slate-500 text-xs mb-1 block">Address</label>
                                    <input name="address" value={formData.location.address} onChange={handleChange} placeholder="Street address"
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-green-400 transition text-sm" required/>
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs mb-1 block">Pincode</label>
                                    <input name="pincode" value={formData.location.pincode} onChange={handleChange} placeholder="560001"
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-green-400 transition text-sm" required/>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-slate-500 text-xs mb-1 block">Capacity</label>
                                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="Max guests"
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-green-400 transition text-sm" required/>
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs mb-1 block">Price Per Hour (₹)</label>
                                    <input type="number" name="pricePerHour" value={formData.pricePerHour} onChange={handleChange} placeholder="2000"
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-green-400 transition text-sm"/>
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs mb-1 block">Price Per Day (₹)</label>
                                    <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} placeholder="15000"
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-green-400 transition text-sm"/>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-500 text-xs mb-2 block">Booking Type</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 text-slate-600 text-sm cursor-pointer">
                                        <input type="radio" name="bookingType" value="manual" checked={formData.bookingType==='manual'} onChange={handleChange} className="accent-green-500"/>
                                        Manual Approval
                                    </label>
                                    <label className="flex items-center gap-2 text-slate-600 text-sm cursor-pointer">
                                        <input type="radio" name="bookingType" value="instant" checked={formData.bookingType==='instant'} onChange={handleChange} className="accent-green-500"/>
                                        Instant Booking
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-500 text-xs mb-2 block">Amenities</label>
                                <div className="flex flex-wrap gap-2">
                                    {AMENITIES_LIST.map(amenity => (
                                        <button type="button" key={amenity} onClick={()=>handleAmenityToggle(amenity)}
                                            className={`px-3 py-1 rounded-full text-xs transition ${
                                                formData.amenities.includes(amenity)
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white/60 text-slate-500 hover:bg-white/80'
                                            }`}>
                                            {amenity}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={formLoading}
                                className="px-8 py-2.5 rounded-lg text-sm font-semibold text-white transition"
                                style={{ background: formLoading ? '#9dc49d' : '#4a7a5a' }}>
                                {formLoading ? 'Creating...' : 'Create Venue'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Venues Tab */}
                {activeTab === 'venues' && (
                    <>
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <p className="text-slate-400 text-sm">Loading venues...</p>
                            </div>
                        ) : venues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-4">
                                <p className="text-slate-400 text-sm">No venues yet. Create your first venue!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {venues
                                    .filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(venue => (
                                    <div key={venue._id}
                                        className="rounded-xl overflow-hidden shadow-sm transition hover:shadow-lg hover:-translate-y-0.5"
                                        style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(180,220,180,0.4)' }}>

                                        <div className="h-28 flex items-center justify-center text-5xl"
                                            style={{ background: 'linear-gradient(135deg, #c8e8c8, #b0d8b0)' }}>
                                            {venue.type === 'Resort' ? '🏖️' :
                                             venue.type === 'Rooftop' ? '🌆' :
                                             venue.type === 'Farmhouse' ? '🌾' :
                                             venue.type === 'Marriage Hall' ? '💒' :
                                             venue.type === 'Party Hall' ? '🎉' :
                                             venue.type === 'Conference Room' ? '🏢' :
                                             venue.type === 'Banquet Hall' ? '🍽️' :
                                             venue.type === 'Turf' ? '⚽' :
                                             venue.type === 'Studio' ? '🎨' : '🏛️'}
                                        </div>

                                        <div className="p-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full text-slate-500"
                                                    style={{ background: 'rgba(150,200,150,0.2)' }}>
                                                    {venue.type}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${venue.isApproved ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>
                                                    {venue.isApproved ? '✓ Live' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 font-bold text-sm mt-2 truncate">{venue.name}</p>
                                            <p className="text-slate-400 text-xs truncate mt-0.5">📍 {venue.location?.address}</p>
                                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                                                <span className="text-slate-700 font-bold text-sm">₹{venue.pricePerHour}<span className="text-slate-400 font-normal text-xs">/hr</span></span>
                                                <button onClick={()=>handleDelete(venue._id)}
                                                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-red-400 transition hover:bg-red-50"
                                                    style={{ border: '1px solid rgba(220,150,150,0.3)' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div>
                        <div className="flex gap-3 mb-4 flex-wrap">
                            {venues.map(venue => (
                                <button key={venue._id} onClick={()=>fetchVenueBookings(venue._id)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
                                    style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(180,220,180,0.5)' }}>
                                    {venue.name}
                                </button>
                            ))}
                        </div>

                        {bookingsLoading && <p className="text-slate-400 text-sm">Loading bookings...</p>}

                        {!bookingsLoading && bookings.length === 0 && (
                            <p className="text-slate-400 text-sm">Click a venue above to see its bookings.</p>
                        )}

                        {bookings.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bookings.map(booking => (
                                    <div key={booking._id} className="rounded-xl p-5 shadow-sm"
                                        style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(180,220,180,0.4)' }}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-slate-700 font-semibold text-sm">{booking.booker?.name}</p>
                                                <p className="text-slate-400 text-xs">{booking.booker?.email}</p>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full ${
                                                booking.status==='approved' ? 'bg-green-50 text-green-600' :
                                                booking.status==='rejected' ? 'bg-red-50 text-red-500' :
                                                'bg-yellow-50 text-yellow-600'}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                            <div><p className="text-slate-400">Date</p><p className="text-slate-600 font-medium">{new Date(booking.eventDate).toLocaleDateString()}</p></div>
                                            <div><p className="text-slate-400">Time</p><p className="text-slate-600 font-medium">{booking.startTime} - {booking.endTime}</p></div>
                                            <div><p className="text-slate-400">Guests</p><p className="text-slate-600 font-medium">{booking.guestCount}</p></div>
                                            <div><p className="text-slate-400">Total</p><p className="text-green-600 font-bold">₹{booking.totalPrice}</p></div>
                                        </div>
                                        {booking.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button onClick={()=>handleStatusUpdate(booking._id,'approved')}
                                                    className="flex-1 py-2 rounded-lg text-xs font-medium text-green-600 transition hover:shadow-sm"
                                                    style={{ background: 'rgba(150,220,150,0.2)', border: '1px solid rgba(150,200,150,0.4)' }}>
                                                    Approve
                                                </button>
                                                <button onClick={()=>handleStatusUpdate(booking._id,'rejected')}
                                                    className="flex-1 py-2 rounded-lg text-xs font-medium text-red-400 transition hover:shadow-sm"
                                                    style={{ background: 'rgba(220,150,150,0.15)', border: '1px solid rgba(200,150,150,0.3)' }}>
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;