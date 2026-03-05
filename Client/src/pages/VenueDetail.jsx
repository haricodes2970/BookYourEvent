import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVenueById } from '../services/venueService';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { getVenueReviews, addReview } from '../services/reviewService';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

const VenueDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');

    const [bookingData, setBookingData] = useState({
        eventDate: '', startTime: '', endTime: '', guestCount: ''
    });

    useEffect(() => {
        const fetchVenue = async () => {
            try {
                const data = await getVenueById(id);
                setVenue(data.venue);
                const reviewData = await getVenueReviews(id);
                setReviews(reviewData.reviews);
                setAvgRating(reviewData.avgRating);
            } catch (err) {
                setError('Failed to load venue');
            } finally {
                setLoading(false);
            }
        };
        fetchVenue();
    }, [id]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowRight' && lightboxIndex !== null) setLightboxIndex(i => Math.min(i + 1, venue.images.length - 1));
            if (e.key === 'ArrowLeft' && lightboxIndex !== null) setLightboxIndex(i => Math.max(i - 1, 0));
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxIndex, venue]);

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

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewLoading(true);
        setReviewError('');
        setReviewSuccess('');
        try {
            const data = await addReview({ venueId: id, ...reviewForm });
            setReviews([data.review, ...reviews]);
            setReviewSuccess('Review posted!');
            setReviewForm({ rating: 5, comment: '' });
            // Recalculate avg
            const newAvg = ((avgRating * reviews.length) + reviewForm.rating) / (reviews.length + 1);
            setAvgRating(newAvg.toFixed(1));
        } catch (err) {
            setReviewError(err.response?.data?.message || 'Failed to post review');
        } finally {
            setReviewLoading(false);
        }
    };

    const getGoogleMapsUrl = (venue) => {
        const query = encodeURIComponent(`${venue.location?.address}, ${venue.location?.city}`);
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
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
            {/* Lightbox */}
            {lightboxIndex !== null && venue.images?.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.92)' }}
                    onClick={() => setLightboxIndex(null)}>
                    <button className="absolute top-4 right-6 text-white text-3xl font-light hover:opacity-70"
                        onClick={() => setLightboxIndex(null)}>✕</button>
                    {lightboxIndex > 0 && (
                        <button className="absolute left-6 text-white text-4xl hover:opacity-70 z-10"
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i - 1); }}>‹</button>
                    )}
                    <img src={venue.images[lightboxIndex]} alt={`venue-${lightboxIndex}`}
                        className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}/>
                    {lightboxIndex < venue.images.length - 1 && (
                        <button className="absolute right-6 text-white text-4xl hover:opacity-70 z-10"
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i + 1); }}>›</button>
                    )}
                    <p className="absolute bottom-6 text-white text-sm opacity-60">
                        {lightboxIndex + 1} / {venue.images.length}
                    </p>
                </div>
            )}

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
                    <img src="/logo.png" alt="BYE" className="h-14 w-14 rounded-full object-cover shadow-md cursor-pointer"
                        onClick={() => navigate('/')}
                        onError={(e)=>{e.target.style.display='none'}}/>
                    <button onClick={()=>navigate('/booker/dashboard')}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                        ← Browse Venues
                    </button>
                    <button onClick={()=>navigate('/booker/my-bookings')}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                        My Bookings
                    </button>
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

                            <div className="h-48 overflow-hidden cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #c8e8f8, #b0d5ee)' }}
                                onClick={() => venue.images?.length > 0 && setLightboxIndex(0)}>
                                {venue.images && venue.images.length > 0 ? (
                                    <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover hover:scale-105 transition duration-300"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-8xl">
                                        {getEmoji(venue.type)}
                                    </div>
                                )}
                            </div>

                            {venue.images && venue.images.length > 1 && (
                                <div className="flex gap-2 px-4 pt-3 overflow-x-auto pb-1">
                                    {venue.images.map((img, i) => (
                                        <img key={i} src={img} alt={`thumb-${i}`}
                                            onClick={() => setLightboxIndex(i)}
                                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition hover:scale-105"
                                            style={{
                                                border: lightboxIndex === i ? '2px solid #4a8aaa' : '2px solid rgba(255,255,255,0.8)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}/>
                                    ))}
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs px-3 py-1 rounded-full text-slate-500"
                                        style={{ background: 'rgba(150,200,220,0.2)' }}>{venue.type}</span>
                                    <span className="text-xs px-3 py-1 rounded-full text-slate-500"
                                        style={{ background: 'rgba(150,200,220,0.2)' }}>
                                        {venue.bookingType === 'instant' ? '⚡ Instant Booking' : '📋 Manual Approval'}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-700 mb-1">{venue.name}</h2>

                                {/* Avg Rating */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-yellow-400">
                                        {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                                    </span>
                                    <span className="text-slate-500 text-sm font-semibold">{avgRating}</span>
                                    <span className="text-slate-400 text-xs">({reviews.length} reviews)</span>
                                </div>

                                <a href={getGoogleMapsUrl(venue)} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm mb-4 hover:opacity-80 transition"
                                    style={{ color: '#1a73e8' }}>
                                    <span>📍</span>
                                    <span className="underline underline-offset-2">{venue.location?.address}, {venue.location?.city}</span>
                                    <span className="text-xs opacity-60">↗</span>
                                </a>

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
                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Event Date</label>
                                        <input
                                        type="date"
                                        name="eventDate"
                                        value={bookingData.eventDate}
                                        onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        const blocked = venue.blockedDates?.map(d => new Date(d).toISOString().split('T')[0]) || [];
                                        if (blocked.includes(selectedDate)) {
                                        setError('This date is not available. Please choose another date.');
                                        return;
                                        }
                                        setError('');
                                        setBookingData({ ...bookingData, eventDate: selectedDate });
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-blue-400 transition text-sm"
                                        required
                                    />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Start Time</label>
                                            <input type="time" name="startTime" value={bookingData.startTime} onChange={handleChange}
                                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-blue-400 transition text-sm" required/>
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">End Time</label>
                                            <input type="time" name="endTime" value={bookingData.endTime} onChange={handleChange}
                                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-blue-400 transition text-sm" required/>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Number of Guests</label>
                                        <input type="number" name="guestCount" value={bookingData.guestCount} onChange={handleChange}
                                            placeholder={`Max ${venue.capacity} guests`} max={venue.capacity}
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-600 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm" required/>
                                    </div>

                                    {calculatePrice() > 0 && (
                                        <div className="rounded-xl p-4" style={{ background: 'rgba(150,200,220,0.15)', border: '1px solid rgba(150,200,220,0.3)' }}>
                                            <p className="text-slate-400 text-xs mb-1">Estimated Total</p>
                                            <p className="text-slate-700 font-bold text-2xl">₹{calculatePrice()}</p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                {parseInt(bookingData.endTime) - parseInt(bookingData.startTime)} hours × ₹{venue.pricePerHour}/hr
                                            </p>
                                        </div>
                                    )}

                                    {/* Availability Calendar */}
                                    <div>
                                    <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Availability</label>
                                    <AvailabilityCalendar
                                    blockedDates={venue.blockedDates || []}
                                    mode="view"
                                    />
                                    </div>

                                    <button type="submit" disabled={bookingLoading}
                                        className="w-full py-3 rounded-xl font-semibold text-white transition mt-2"
                                        style={{ background: bookingLoading ? '#7a9aaa' : '#1e4d5c' }}>
                                        {bookingLoading ? 'Processing...' : venue.bookingType === 'instant' ? '⚡ Book Now' : '📋 Send Booking Request'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="md:col-span-2 rounded-2xl shadow-lg p-6"
                            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.92)' }}>

                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-700">Reviews</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-yellow-400 text-lg">
                                            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                                        </span>
                                        <span className="text-slate-600 font-bold">{avgRating}</span>
                                        <span className="text-slate-400 text-sm">({reviews.length} reviews)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Add Review Form */}
                            <div className="rounded-xl p-4 mb-6"
                                style={{ background: 'rgba(150,200,220,0.1)', border: '1px solid rgba(150,200,220,0.3)' }}>
                                <h4 className="text-sm font-semibold text-slate-600 mb-3">Write a Review</h4>
                                {reviewError && <p className="text-red-500 text-xs mb-2">{reviewError}</p>}
                                {reviewSuccess && <p className="text-green-500 text-xs mb-2">{reviewSuccess}</p>}
                                <form onSubmit={handleReviewSubmit} className="space-y-3">
                                    <div>
                                        <label className="text-slate-500 text-xs mb-1 block">Rating</label>
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(star => (
                                                <button type="button" key={star}
                                                    onClick={() => setReviewForm({...reviewForm, rating: star})}
                                                    className="text-2xl transition hover:scale-110"
                                                    style={{ color: star <= reviewForm.rating ? '#f59e0b' : '#cbd5e1' }}>
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs mb-1 block">Comment</label>
                                        <textarea value={reviewForm.comment}
                                            onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                            placeholder="Share your experience..." rows={3} required
                                            className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm resize-none"/>
                                    </div>
                                    <button type="submit" disabled={reviewLoading}
                                        className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition"
                                        style={{ background: reviewLoading ? '#7a9aaa' : '#1e4d5c' }}>
                                        {reviewLoading ? 'Posting...' : 'Post Review'}
                                    </button>
                                </form>
                            </div>

                            {/* Reviews List */}
                            {reviews.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-4">No reviews yet. Be the first to review!</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviews.map(review => (
                                        <div key={review._id} className="rounded-xl p-4"
                                            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(150,200,220,0.2)' }}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-slate-700 font-semibold text-sm">{review.reviewer?.name}</p>
                                                    <div className="flex gap-0.5 mt-0.5">
                                                        {[1,2,3,4,5].map(s => (
                                                            <span key={s} style={{ color: s <= review.rating ? '#f59e0b' : '#cbd5e1' }}>★</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-slate-400 text-xs">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="text-slate-500 text-sm">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default VenueDetail;

