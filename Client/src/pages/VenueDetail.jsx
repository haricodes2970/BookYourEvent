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
        eventDate: '', startTime: '', endTime: '', guestCount: ''
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
            await createBooking({ venueId: id, ...bookingData, guestCount: parseInt(bookingData.guestCount) });
            setSuccess(venue.bookingType === 'instant' ? 'Booking confirmed!' : 'Booking request sent! Waiting for owner approval.');
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const getEmoji = (type) => {
        const map = {
            'Resort': '🏖️', 'Rooftop': '🌆', 'Farmhouse': '🌾',
            'Marriage Hall': '💒', 'Party Hall': '🎉', 'Conference Room': '🏢',
            'Banquet Hall': '🍽️', 'Turf': '⚽', 'Studio': '🎨',
            'Auditorium': '🎭', 'Terrace': '🌇', 'Community Hall': '🏛️',
        };
        return map[type] || '🏛️';
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center" style={{
            background: 'linear-gradient(180deg, #b8dff0 0%, #cce8f4 20%, #dff0f8 45%, #eef7fb 70%, #f5fafd 100%)'
        }}>
            <p className="text-slate-400">Loading venue...</p>
        </div>
    );

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
            background: 'linear-gradient(180deg, #b8dff0 0%, #cce8f4 20%, #dff0f8 45%, #eef7fb 70%, #f5fafd 100%)'
        }}>
            {/* Birds */}
            <svg className="absolute top-20 left-16 opacity-25 z-0 pointer-events-none" width="180" height="80" viewBox="0 0 180 80">
                <path d="M10 40 Q24 26 38 40 Q24 33 10 40Z" fill="#4a8aaa"/>
                <path d="M48 25 Q62 12 76 25 Q62 18 48 25Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.7"/>
            </svg>
            <svg className="absolute top-14 right-24 opacity-25 z-0 pointer-events-none" width="160" height="70" viewBox="0 0 160 70">
                <path d="M120 30 Q134 17 148 30 Q134 23 120 30Z" fill="#4a8aaa"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M130 52 Q144 39 158 52 Q144 45 130 52Z" fill="#4a8aaa" opacity="0.6"/>
            </svg>

            {/* Wildflowers */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#a8d4e8" opacity="0.25"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={130+(i%5)*8} stroke="#7aaabb" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={122+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)}
                                fill={['#b8d8ec','#c8dff0','#d4c8e0','#c0d8e8','#d8e8c0','#e8d4b8'][i%6]} opacity="0.7"/>
                        </g>
                    ))}
                </svg>
            </div>

            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 text-xs italic z-10 tracking-widest pointer-events-none">
                EASY. BOOK. ENJOY.
            </p>

            {/* Navbar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-4">
                <div className="flex items-center gap-8">
                    <img src="/logo.png" alt="BYE" className="h-14 w-14 rounded-full object-cover shadow-md"
                        onError={(e)=>{e.target.style.display='none'}}/>
                    <button onClick={()=>navigate('/booker/dashboard')}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                        ← Browse Venues
                    </button>
                    <button onClick={()=>navigate('/booker/my-bookings')}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                        My Bookings
                    </button>
                    <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">About</a>
                    <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">Contact</a>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm font-medium">Hi, {user?.name?.split(' ')[0]}</span>
                    <button onClick={()=>navigate('/booker/dashboard')}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
                        Dashboard
                    </button>
                </div>
            </nav>

            {/* Page Title */}
            <div className="relative z-10 px-8 pt-2 pb-4">
                <h1 className="text-2xl font-bold text-slate-700">Venue Details</h1>
                <p className="text-slate-400 text-xs tracking-widest uppercase mt-0.5">Review & Book Your Venue</p>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 px-8 pb-24">
                {error && <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-4 text-sm">{success}</div>}

                {venue && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Venue Info Card */}
                        <div className="rounded-2xl overflow-hidden shadow-lg"
                            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.92)' }}>

                            {/* Emoji Banner */}
                            <div className="h-48 flex items-center justify-center text-8xl"
                                style={{ background: 'linear-gradient(135deg, #c8e8f8, #b0d5ee)' }}>
                                {getEmoji(venue.type)}
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs px-3 py-1 rounded-full text-slate-500"
                                        style={{ background: 'rgba(150,200,220,0.2)' }}>
                                        {venue.type}
                                    </span>
                                    <span className="text-xs px-3 py-1 rounded-full text-slate-500"
                                        style={{ background: 'rgba(150,200,220,0.2)' }}>
                                        {venue.bookingType === 'instant' ? '⚡ Instant Booking' : '📋 Manual Approval'}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-700 mb-1">{venue.name}</h2>
                                <p className="text-slate-400 text-sm mb-4">📍 {venue.location?.address}, {venue.location?.city}</p>
                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">{venue.description}</p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="rounded-xl p-4" style={{ background: 'rgba(200,230,245,0.3)' }}>
                                        <p className="text-slate-400 text-xs">Capacity</p>
                                        <p className="text-slate-700 font-bold text-xl">{venue.capacity}</p>
                                        <p className="text-slate-400 text-xs">max guests</p>
                                    </div>
                                    <div className="rounded-xl p-4" style={{ background: 'rgba(200,230,245,0.3)' }}>
                                        <p className="text-slate-400 text-xs">Price</p>
                                        <p className="text-slate-700 font-bold text-xl">₹{venue.pricePerHour}</p>
                                        <p className="text-slate-400 text-xs">per hour</p>
                                    </div>
                                </div>

                                {/* Amenities */}
                                {venue.amenities?.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Amenities</p>
                                        <div className="flex flex-wrap gap-2">
                                            {venue.amenities.map((a, i) => (
                                                <span key={i} className="text-xs px-3 py-1 rounded-full text-slate-500"
                                                    style={{ background: 'rgba(150,200,220,0.2)', border: '1px solid rgba(150,200,220,0.3)' }}>
                                                    {a}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Owner Info */}
                                <div className="pt-4" style={{ borderTop: '1px solid rgba(150,200,220,0.2)' }}>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Venue Owner</p>
                                    <p className="text-slate-600 font-semibold text-sm">{venue.owner?.name}</p>
                                    <p className="text-slate-400 text-xs">{venue.owner?.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Booking Form Card */}
                        <div className="rounded-2xl shadow-lg"
                            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.92)' }}>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-700 mb-1">Book This Venue</h3>
                                <p className="text-slate-400 text-xs mb-6">Fill in your event details below</p>

                                <form onSubmit={handleBooking} className="space-y-5">
                                    {/* Date */}
                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Event Date</label>
                                        <input
                                            type="date"
                                            name="eventDate"
                                            value={bookingData.eventDate}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-blue-400 transition text-sm"
                                            required
                                        />
                                    </div>

                                    {/* Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Start Time</label>
                                            <input
                                                type="time"
                                                name="startTime"
                                                value={bookingData.startTime}
                                                onChange={handleChange}
                                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-blue-400 transition text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">End Time</label>
                                            <input
                                                type="time"
                                                name="endTime"
                                                value={bookingData.endTime}
                                                onChange={handleChange}
                                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-blue-400 transition text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Guests */}
                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Number of Guests</label>
                                        <input
                                            type="number"
                                            name="guestCount"
                                            value={bookingData.guestCount}
                                            onChange={handleChange}
                                            placeholder={`Max ${venue.capacity} guests`}
                                            max={venue.capacity}
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm"
                                            required
                                        />
                                    </div>

                                    {/* Price Estimate */}
                                    {calculatePrice() > 0 && (
                                        <div className="rounded-xl p-4" style={{ background: 'rgba(150,200,220,0.15)', border: '1px solid rgba(150,200,220,0.3)' }}>
                                            <p className="text-slate-400 text-xs mb-1">Estimated Total</p>
                                            <p className="text-slate-700 font-bold text-2xl">₹{calculatePrice()}</p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                {parseInt(bookingData.endTime) - parseInt(bookingData.startTime)} hours × ₹{venue.pricePerHour}/hr
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={bookingLoading}
                                        className="w-full py-3 rounded-xl font-semibold text-white transition mt-2"
                                        style={{ background: bookingLoading ? '#7a9aaa' : '#1e4d5c' }}>
                                        {bookingLoading ? 'Processing...' : venue.bookingType === 'instant' ? '⚡ Book Now' : '📋 Send Booking Request'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VenueDetail;