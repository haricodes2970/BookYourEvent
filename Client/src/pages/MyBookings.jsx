import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/bookingService';

const MyBookings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await getMyBookings();
                setBookings(data.bookings);
            } catch (err) {
                setError('Failed to load bookings');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredBookings = bookings.filter(b => filter === 'all' ? true : b.status === filter);

    const getStatusStyle = (status) => {
        if (status === 'approved') return { background: 'rgba(0,180,100,0.1)', color: '#00aa66', border: '1px solid rgba(0,180,100,0.2)' };
        if (status === 'rejected') return { background: 'rgba(220,80,80,0.1)', color: '#cc4444', border: '1px solid rgba(220,80,80,0.2)' };
        if (status === 'cancelled') return { background: 'rgba(150,150,150,0.1)', color: '#888888', border: '1px solid rgba(150,150,150,0.2)' };
        return { background: 'rgba(200,160,0,0.1)', color: '#aa8800', border: '1px solid rgba(200,160,0,0.2)' };
    };

    const getEmoji = (type) => {
        const map = { 'Resort': '🏖️', 'Rooftop': '🌆', 'Farmhouse': '🌾', 'Marriage Hall': '💒', 'Party Hall': '🎉', 'Conference Room': '🏢', 'Banquet Hall': '🍽️' };
        return map[type] || '🏛️';
    };

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
            </svg>

            {/* Wildflowers */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#a8d4e8" opacity="0.25"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={130+(i%5)*8} stroke="#7aaabb" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={122+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)}
                                fill={['#b8d8ec','#c8dff0','#d4c8e0','#c0d8e8'][i%4]} opacity="0.7"/>
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
                        Browse Venues
                    </button>
                    <button className="text-sm font-bold text-slate-800 transition">
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
                    <button onClick={handleLogout}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 transition hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }}>
                        Log Out
                    </button>
                </div>
            </nav>

            {/* Page Title */}
            <div className="relative z-10 px-8 pt-2 pb-4">
                <h1 className="text-2xl font-bold text-slate-700">My Bookings</h1>
                <p className="text-slate-400 text-xs tracking-widest uppercase mt-0.5">Track All Your Venue Bookings</p>
            </div>

            {/* Filter Tabs */}
            <div className="relative z-10 px-8 mb-4 flex gap-3">
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                    <button key={f} onClick={()=>setFilter(f)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition capitalize"
                        style={filter === f
                            ? { background: 'rgba(255,255,255,0.9)', color: '#1e4d5c', border: '1px solid rgba(150,200,220,0.5)', fontWeight: 700 }
                            : { background: 'rgba(255,255,255,0.5)', color: '#888', border: '1px solid rgba(255,255,255,0.7)' }
                        }>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
                <span className="ml-2 text-slate-400 text-sm self-center">
                    {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 px-8 pb-24 overflow-y-auto">
                {error && <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <p className="text-slate-400 text-sm">Loading your bookings...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <p className="text-slate-400 text-sm">No {filter === 'all' ? '' : filter} bookings found.</p>
                        <button onClick={()=>navigate('/booker/dashboard')}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                            style={{ background: '#1e4d5c' }}>
                            Browse Venues
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBookings.map(booking => (
                            <div key={booking._id} className="rounded-2xl overflow-hidden shadow-sm transition hover:shadow-lg hover:-translate-y-0.5"
                                style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.95)' }}>

                                {/* Card Top */}
                                <div className="h-16 flex items-center px-5 justify-between"
                                    style={{ background: 'linear-gradient(135deg, #c8e8f8, #b0d5ee)' }}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getEmoji(booking.venue?.type)}</span>
                                        <p className="text-slate-700 font-bold text-sm truncate max-w-32">{booking.venue?.name}</p>
                                    </div>
                                    <span className="text-xs px-3 py-1 rounded-full font-medium capitalize"
                                        style={getStatusStyle(booking.status)}>
                                        {booking.status}
                                    </span>
                                </div>

                                <div className="p-4">
                                    <p className="text-slate-400 text-xs mb-3">📍 {booking.venue?.location?.address}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="rounded-lg p-2.5" style={{ background: 'rgba(200,230,245,0.2)' }}>
                                            <p className="text-slate-400 text-xs">Date</p>
                                            <p className="text-slate-600 font-semibold text-xs mt-0.5">
                                                {new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="rounded-lg p-2.5" style={{ background: 'rgba(200,230,245,0.2)' }}>
                                            <p className="text-slate-400 text-xs">Time</p>
                                            <p className="text-slate-600 font-semibold text-xs mt-0.5">{booking.startTime} — {booking.endTime}</p>
                                        </div>
                                        <div className="rounded-lg p-2.5" style={{ background: 'rgba(200,230,245,0.2)' }}>
                                            <p className="text-slate-400 text-xs">Guests</p>
                                            <p className="text-slate-600 font-semibold text-xs mt-0.5">{booking.guestCount} people</p>
                                        </div>
                                        <div className="rounded-lg p-2.5" style={{ background: 'rgba(200,230,245,0.2)' }}>
                                            <p className="text-slate-400 text-xs">Total Paid</p>
                                            <p className="text-slate-700 font-bold text-sm mt-0.5">₹{booking.totalPrice}</p>
                                        </div>
                                    </div>

                                    <div className="pt-3" style={{ borderTop: '1px solid rgba(150,200,220,0.2)' }}>
                                        <p className="text-slate-400 text-xs">Owner: <span className="text-slate-500 font-medium">{booking.venue?.owner?.name}</span></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;