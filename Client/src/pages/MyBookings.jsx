import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, raiseBid } from '../services/bookingService';
import PaymentModal from '../components/PaymentModal';

/* ── Countdown hook ── */
const useCountdown = (deadline) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [urgent, setUrgent] = useState(false);

    useEffect(() => {
        if (!deadline) return;
        const tick = () => {
            const diff = new Date(deadline) - new Date();
            if (diff <= 0) { setTimeLeft('EXPIRED'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setUrgent(diff < 3600000); // under 1hr = urgent
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [deadline]);

    return { timeLeft, urgent };
};

/* ── Countdown badge ── */
const CountdownBadge = ({ deadline }) => {
    const { timeLeft, urgent } = useCountdown(deadline);
    if (!timeLeft) return null;
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: urgent ? 'rgba(220,38,38,0.1)' : 'rgba(234,179,8,0.1)',
            border: `1px solid ${urgent ? 'rgba(220,38,38,0.3)' : 'rgba(234,179,8,0.3)'}`,
            borderRadius: 50, padding: '4px 12px', marginBottom: 10,
        }}>
            <span style={{ fontSize: 12 }}>{urgent ? '🔴' : '⏰'}</span>
            <span style={{
                fontSize: 12, fontWeight: 700,
                color: urgent ? '#dc2626' : '#b45309',
            }}>
                {timeLeft === 'EXPIRED' ? 'Deadline passed' : `Pay within: ${timeLeft}`}
            </span>
        </div>
    );
};

const MyBookings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [filter, setFilter]         = useState('all');
    const [showPayment, setShowPayment]   = useState(false);
    const [payBooking, setPayBooking]     = useState(null);
    const [raiseBidId, setRaiseBidId]     = useState(null);
    const [newBidAmount, setNewBidAmount] = useState('');
    const [bidLoading, setBidLoading]     = useState(false);
    const [bidError, setBidError]         = useState('');
    const [success, setSuccess]           = useState('');

    const fetchBookings = async () => {
        try {
            const data = await getMyBookings();
            setBookings(data.bookings);
        } catch { setError('Failed to load bookings'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredBookings = bookings.filter(b =>
        filter === 'all' ? true : b.status === filter
    );

    /* ── Status config ── */
    const statusCfg = (status) => ({
        pending:         { bg: 'rgba(234,179,8,0.1)',    color: '#b45309', label: '⏳ Pending Review',    border: 'rgba(234,179,8,0.3)'    },
        payment_pending: { bg: 'rgba(59,130,246,0.1)',   color: '#1d4ed8', label: '💳 Pay Now!',          border: 'rgba(59,130,246,0.3)'   },
        confirmed:       { bg: 'rgba(34,197,94,0.1)',    color: '#16a34a', label: '✅ Confirmed',          border: 'rgba(34,197,94,0.3)'    },
        approved:        { bg: 'rgba(34,197,94,0.1)',    color: '#16a34a', label: '✅ Confirmed',          border: 'rgba(34,197,94,0.3)'    },
        rejected:        { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626', label: '❌ Rejected',           border: 'rgba(239,68,68,0.3)'    },
        expired:         { bg: 'rgba(107,114,128,0.1)',  color: '#6b7280', label: '🕐 Expired',           border: 'rgba(107,114,128,0.3)'  },
    }[status] || { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: status, border: 'rgba(107,114,128,0.3)' });

    const getEmoji = (type) => ({
        'Resort': '🏖️', 'Rooftop': '🌆', 'Farmhouse': '🌾',
        'Marriage Hall': '💒', 'Party Hall': '🎉',
        'Conference Room': '🏢', 'Banquet Hall': '🍽️',
    }[type] || '🏛️');

    /* ── Raise bid ── */
    const handleRaiseBid = async (bookingId) => {
        if (!newBidAmount) return;
        setBidLoading(true); setBidError('');
        try {
            await raiseBid(bookingId, { newBidAmount: Number(newBidAmount), message: '' });
            setSuccess('Bid raised! Owner will be notified.');
            setRaiseBidId(null); setNewBidAmount('');
            fetchBookings();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setBidError(err.response?.data?.message || 'Failed to raise bid');
        } finally { setBidLoading(false); }
    };

    const FILTERS = ['all', 'pending', 'payment_pending', 'confirmed', 'rejected', 'expired'];

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
                    <button className="text-sm font-bold text-slate-800 transition">My Bookings</button>
                    <button onClick={()=>navigate('/about')}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 transition">About</button>
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
                <p className="text-slate-400 text-xs tracking-widest uppercase mt-0.5">Track All Your Venue Bids & Bookings</p>
            </div>

            {/* Alerts */}
            {success && (
                <div className="relative z-10 mx-8 mb-3 px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#16a34a' }}>
                    {success}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="relative z-10 px-8 mb-4 flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                    <button key={f} onClick={()=>setFilter(f)}
                        className="px-4 py-2 rounded-lg text-xs font-medium transition capitalize"
                        style={filter === f
                            ? { background: 'rgba(255,255,255,0.9)', color: '#1e4d5c', border: '1px solid rgba(150,200,220,0.5)', fontWeight: 700 }
                            : { background: 'rgba(255,255,255,0.5)', color: '#888', border: '1px solid rgba(255,255,255,0.7)' }
                        }>
                        {f === 'payment_pending' ? '💳 Pay Now' : f.charAt(0).toUpperCase() + f.slice(1)}
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
                        {filteredBookings.map(booking => {
                            const sc = statusCfg(booking.status);
                            const isPayPending = booking.status === 'payment_pending';
                            const isPending    = booking.status === 'pending';

                            return (
                                <div key={booking._id}
                                    className="rounded-2xl overflow-hidden shadow-sm transition hover:shadow-lg hover:-translate-y-0.5"
                                    style={{
                                        background: 'rgba(255,255,255,0.85)',
                                        border: isPayPending
                                            ? '2px solid rgba(59,130,246,0.4)'
                                            : '1px solid rgba(255,255,255,0.95)',
                                        boxShadow: isPayPending ? '0 0 0 3px rgba(59,130,246,0.1)' : undefined,
                                    }}>

                                    {/* Card Top */}
                                    <div className="h-16 flex items-center px-5 justify-between"
                                        style={{ background: isPayPending
                                            ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
                                            : 'linear-gradient(135deg, #c8e8f8, #b0d5ee)' }}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getEmoji(booking.venue?.type)}</span>
                                            <div>
                                                <p className="text-slate-700 font-bold text-sm truncate max-w-32">{booking.venue?.name}</p>
                                                <p className="text-slate-500 text-xs">Bid: ₹{(booking.bidAmount || booking.totalPrice)?.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs px-3 py-1 rounded-full font-bold"
                                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                            {sc.label}
                                        </span>
                                    </div>

                                    <div className="p-4">
                                        <p className="text-slate-400 text-xs mb-3">📍 {booking.venue?.location?.address}</p>

                                        {/* Countdown for payment_pending */}
                                        {isPayPending && booking.paymentDeadline && (
                                            <CountdownBadge deadline={booking.paymentDeadline} />
                                        )}

                                        {/* Bid history badge for pending */}
                                        {isPending && (
                                            <div className="mb-3" style={{
                                                background: 'rgba(234,179,8,0.08)',
                                                border: '1px solid rgba(234,179,8,0.25)',
                                                borderRadius: 10, padding: '8px 12px',
                                            }}>
                                                <p className="text-xs font-semibold" style={{ color: '#b45309' }}>
                                                    🏷️ Your current bid: ₹{(booking.bidAmount || booking.totalPrice)?.toLocaleString('en-IN')}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">Waiting for owner to review all bids</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            {[
                                                { l: 'Date', v: new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                                                { l: 'Time', v: `${booking.startTime} — ${booking.endTime}` },
                                                { l: 'Guests', v: `${booking.guestCount} people` },
                                                { l: isPayPending ? 'Amount to Pay' : 'Bid Amount',
                                                  v: `₹${(booking.bidAmount || booking.totalPrice)?.toLocaleString('en-IN')}`,
                                                  highlight: isPayPending },
                                            ].map((item, j) => (
                                                <div key={j} className="rounded-lg p-2.5"
                                                    style={{ background: item.highlight ? 'rgba(59,130,246,0.08)' : 'rgba(200,230,245,0.2)' }}>
                                                    <p className="text-slate-400 text-xs">{item.l}</p>
                                                    <p className="font-semibold text-xs mt-0.5"
                                                        style={{ color: item.highlight ? '#1d4ed8' : '#475569' }}>{item.v}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* PAY NOW BUTTON */}
                                        {isPayPending && (
                                            <button
                                                onClick={() => { setPayBooking(booking); setShowPayment(true); }}
                                                className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 hover:-translate-y-0.5"
                                                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', boxShadow: '0 6px 18px rgba(59,130,246,0.35)' }}>
                                                💳 Pay ₹{booking.bidAmount?.toLocaleString('en-IN')} Now →
                                            </button>
                                        )}

                                        {/* RAISE BID BUTTON for pending */}
                                        {isPending && (
                                            raiseBidId === booking._id ? (
                                                <div style={{ marginTop: 8 }}>
                                                    {bidError && <p style={{ color: '#dc2626', fontSize: 11, marginBottom: 4 }}>{bidError}</p>}
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            placeholder={`Min ₹${(booking.bidAmount || booking.totalPrice) + 1}`}
                                                            value={newBidAmount}
                                                            onChange={e => setNewBidAmount(e.target.value)}
                                                            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                                                            style={{ border: '1px solid rgba(234,179,8,0.4)', background: 'rgba(255,255,255,0.8)' }}
                                                        />
                                                        <button onClick={() => handleRaiseBid(booking._id)} disabled={bidLoading}
                                                            className="px-3 py-2 rounded-lg text-xs font-bold text-white"
                                                            style={{ background: '#b45309', opacity: bidLoading ? 0.7 : 1 }}>
                                                            {bidLoading ? '...' : 'Submit'}
                                                        </button>
                                                        <button onClick={() => { setRaiseBidId(null); setBidError(''); }}
                                                            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500"
                                                            style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => setRaiseBidId(booking._id)}
                                                    className="w-full py-2.5 rounded-xl text-sm font-bold mt-2 transition hover:opacity-90"
                                                    style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#b45309' }}>
                                                    🔺 Raise My Bid
                                                </button>
                                            )
                                        )}

                                        <div className="pt-3 mt-2" style={{ borderTop: '1px solid rgba(150,200,220,0.2)' }}>
                                            <p className="text-slate-400 text-xs">
                                                Venue Owner: <span className="text-slate-500 font-medium">{booking.venue?.owner?.name || '—'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPayment && payBooking && (
                <PaymentModal
                    booking={payBooking}
                    venue={payBooking.venue}
                    onClose={() => { setShowPayment(false); setPayBooking(null); }}
                    onSuccess={() => {
                        setShowPayment(false); setPayBooking(null);
                        setSuccess('🎉 Payment successful! Booking confirmed.');
                        fetchBookings();
                    }}
                />
            )}
        </div>
    );
};

export default MyBookings;
