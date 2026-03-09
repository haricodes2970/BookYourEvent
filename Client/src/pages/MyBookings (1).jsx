import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyBookings, raiseBid } from '../services/bookingService';
import PaymentModal from '../components/PaymentModal';

/* ── Countdown hook ── */
const useCountdown = (deadline) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [urgent, setUrgent]     = useState(false);
    useEffect(() => {
        if (!deadline) return;
        const tick = () => {
            const diff = new Date(deadline) - new Date();
            if (diff <= 0) { setTimeLeft('EXPIRED'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setUrgent(diff < 3600000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [deadline]);
    return { timeLeft, urgent };
};

const CountdownBadge = ({ deadline }) => {
    const { timeLeft, urgent } = useCountdown(deadline);
    if (!timeLeft) return null;
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: urgent ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${urgent ? '#fecaca' : '#fde68a'}`,
            borderRadius: 50, padding: '4px 12px', marginBottom: 10,
        }}>
            <span style={{ fontSize: 12 }}>{urgent ? '🔴' : '⏰'}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: urgent ? '#dc2626' : '#b45309' }}>
                {timeLeft === 'EXPIRED' ? 'Deadline passed' : `Pay within: ${timeLeft}`}
            </span>
        </div>
    );
};

const getEmoji = (type) => ({
    'Resort': '🏖️', 'Rooftop': '🌆', 'Farmhouse': '🌾',
    'Marriage Hall': '💒', 'Party Hall': '🎉',
    'Conference Room': '🏢', 'Banquet Hall': '🍽️',
    'Auditorium': '🎭', 'Studio': '🎬', 'Turf': '⚽',
}[type] || '🏛️');

const statusCfg = (status) => ({
    pending:         { bg: '#fffbeb', color: '#b45309', label: '⏳ Pending Review',  border: '#fde68a' },
    payment_pending: { bg: '#eff6ff', color: '#1d4ed8', label: '💳 Pay Now!',        border: '#bfdbfe' },
    confirmed:       { bg: '#f0fdf4', color: '#16a34a', label: '✅ Confirmed',        border: '#bbf7d0' },
    approved:        { bg: '#f0fdf4', color: '#16a34a', label: '✅ Confirmed',        border: '#bbf7d0' },
    rejected:        { bg: '#fef2f2', color: '#dc2626', label: '❌ Rejected',         border: '#fecaca' },
    expired:         { bg: '#f9fafb', color: '#6b7280', label: '🕐 Expired',         border: '#e5e7eb' },
}[status] || { bg: '#f9fafb', color: '#6b7280', label: status, border: '#e5e7eb' });

const FILTERS = ['all', 'pending', 'payment_pending', 'confirmed', 'rejected', 'expired'];

const MyBookings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [bookings, setBookings]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const [filter, setFilter]             = useState('all');
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

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'Segoe UI', sans-serif" }}>

            {/* ── NAVBAR — matches BookerDashboard exactly ── */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center',
                padding: '0 32px', height: 64,
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => navigate('/')}>
                    <img src="/logo.png" alt="BYE"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}/>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a', letterSpacing: '0.02em' }}>BYE</span>
                </div>

                {/* Nav Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 40 }}>
                    {[
                        { label: 'Browse', path: '/booker/dashboard' },
                        { label: 'My Bookings', path: null },
                        { label: 'About', path: '/about' },
                        { label: 'Help', path: null },
                    ].map(({ label, path }) => (
                        <button key={label}
                            onClick={() => path && navigate(path)}
                            style={{
                                padding: '8px 14px', borderRadius: 8, border: 'none',
                                background: !path ? 'transparent' : 'transparent',
                                fontWeight: label === 'My Bookings' ? 700 : 500,
                                fontSize: 14,
                                color: label === 'My Bookings' ? '#c9a84c' : '#555',
                                cursor: 'pointer',
                                borderBottom: label === 'My Bookings' ? '2px solid #c9a84c' : '2px solid transparent',
                                transition: 'all 0.15s',
                            }}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#f5f5f5', border: '1px solid #e8e8e8',
                    borderRadius: 50, padding: '8px 18px',
                    marginLeft: 24, flex: 1, maxWidth: 280,
                }}>
                    <span style={{ fontSize: 14, color: '#aaa' }}>🔍</span>
                    <input placeholder="Search venues..."
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#333', width: '100%' }}/>
                </div>

                <div style={{ flex: 1 }}/>

                {/* Notification bell */}
                <button style={{
                    width: 38, height: 38, borderRadius: '50%',
                    border: '1px solid #e8e8e8', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', marginRight: 12, fontSize: 16,
                }}>🔔</button>

                {/* User avatar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px', borderRadius: 50,
                    border: '1px solid #e8e8e8', background: '#fff',
                    cursor: 'pointer',
                }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#c9a84c', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 12,
                    }}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                        Hi, {user?.name?.split(' ')[0] || 'User'}
                    </span>
                    <span style={{ fontSize: 10, color: '#aaa' }}>▼</span>
                </div>

                <button onClick={handleLogout}
                    style={{
                        marginLeft: 10, padding: '8px 16px', borderRadius: 8,
                        border: '1px solid #e8e8e8', background: '#fff',
                        fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer',
                    }}>
                    Log Out
                </button>
            </nav>

            {/* ── PAGE CONTENT ── */}
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 80px' }}>

                {/* Page Header */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                            color: '#c9a84c', textTransform: 'uppercase',
                            background: '#fffbeb', padding: '3px 10px', borderRadius: 50,
                            border: '1px solid #fde68a',
                        }}>📅 MY BOOKINGS</span>
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', margin: 0 }}>
                        Manage Bookings & Bids
                    </h1>
                    <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                        Track all your venue bids — pay when approved, raise bids to win slots
                    </p>
                </div>

                {/* Success Alert */}
                {success && (
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                        fontSize: 13, fontWeight: 600, color: '#16a34a',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        {success}
                    </div>
                )}

                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                        fontSize: 13, color: '#dc2626',
                    }}>
                        {error}
                    </div>
                )}

                {/* Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 18px', borderRadius: 50, border: 'none',
                                background: filter === f ? '#1a1a1a' : '#fff',
                                color: filter === f ? '#fff' : '#555',
                                fontWeight: filter === f ? 700 : 500,
                                fontSize: 13, cursor: 'pointer',
                                boxShadow: filter === f ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                                border: filter === f ? 'none' : '1px solid #e8e8e8',
                                transition: 'all 0.15s',
                            }}>
                            {f === 'payment_pending' ? '💳 Pay Now'
                                : f === 'all' ? 'All'
                                : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                    <span style={{ marginLeft: 8, fontSize: 13, color: '#aaa' }}>
                        {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Bookings Grid */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                border: '3px solid #f0f0f0',
                                borderTopColor: '#c9a84c',
                                animation: 'spin 0.8s linear infinite',
                                margin: '0 auto 12px',
                            }}/>
                            <p style={{ color: '#aaa', fontSize: 13 }}>Loading bookings...</p>
                        </div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                        <p style={{ color: '#888', fontSize: 15, marginBottom: 20 }}>
                            No {filter === 'all' ? '' : filter} bookings found.
                        </p>
                        <button onClick={() => navigate('/booker/dashboard')}
                            style={{
                                padding: '12px 28px', borderRadius: 50, border: 'none',
                                background: '#1a1a1a', color: '#fff',
                                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            }}>
                            Browse Venues
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                        gap: 20,
                    }}>
                        {filteredBookings.map(booking => {
                            const sc          = statusCfg(booking.status);
                            const isPayPending = booking.status === 'payment_pending';
                            const isPending    = booking.status === 'pending';
                            const amount       = booking.bidAmount || booking.totalPrice;

                            return (
                                <div key={booking._id} style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    border: isPayPending
                                        ? '2px solid #bfdbfe'
                                        : '1px solid #f0f0f0',
                                    boxShadow: isPayPending
                                        ? '0 0 0 4px rgba(59,130,246,0.06), 0 4px 16px rgba(0,0,0,0.06)'
                                        : '0 2px 12px rgba(0,0,0,0.05)',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isPayPending ? '0 0 0 4px rgba(59,130,246,0.06), 0 4px 16px rgba(0,0,0,0.06)' : '0 2px 12px rgba(0,0,0,0.05)'; }}>

                                    {/* Card Header */}
                                    <div style={{
                                        padding: '16px 20px',
                                        background: isPayPending
                                            ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
                                            : 'linear-gradient(135deg, #fafafa, #f5f5f5)',
                                        borderBottom: '1px solid #f0f0f0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 12,
                                                background: '#fff', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                border: '1px solid #f0f0f0',
                                            }}>
                                                {getEmoji(booking.venue?.type)}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 800, fontSize: 14, color: '#1a1a1a', margin: 0 }}>
                                                    {booking.venue?.name || 'Unknown Venue'}
                                                </p>
                                                <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>
                                                    Bid: ₹{amount?.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700, padding: '4px 10px',
                                            borderRadius: 50, background: sc.bg, color: sc.color,
                                            border: `1px solid ${sc.border}`, whiteSpace: 'nowrap',
                                        }}>
                                            {sc.label}
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: '16px 20px' }}>

                                        {/* Location */}
                                        <p style={{ fontSize: 12, color: '#aaa', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            📍 {booking.venue?.location?.address || booking.venue?.location?.city || '—'}
                                        </p>

                                        {/* Countdown */}
                                        {isPayPending && booking.paymentDeadline && (
                                            <CountdownBadge deadline={booking.paymentDeadline}/>
                                        )}

                                        {/* Pending bid note */}
                                        {isPending && (
                                            <div style={{
                                                background: '#fffbeb', border: '1px solid #fde68a',
                                                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                                            }}>
                                                <p style={{ fontSize: 12, fontWeight: 700, color: '#b45309', margin: 0 }}>
                                                    🏷️ Your current bid: ₹{amount?.toLocaleString('en-IN')}
                                                </p>
                                                <p style={{ fontSize: 11, color: '#aaa', margin: '3px 0 0' }}>
                                                    Waiting for owner to review all bids
                                                </p>
                                            </div>
                                        )}

                                        {/* Info Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                            {[
                                                { label: 'Date',    value: new Date(booking.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                                                { label: 'Time',    value: `${booking.startTime} — ${booking.endTime}` },
                                                { label: 'Guests',  value: `${booking.guestCount} people` },
                                                { label: isPayPending ? 'Amount to Pay' : 'Bid Amount',
                                                  value: `₹${amount?.toLocaleString('en-IN')}`,
                                                  highlight: isPayPending },
                                            ].map((item, j) => (
                                                <div key={j} style={{
                                                    background: item.highlight ? '#eff6ff' : '#fafafa',
                                                    borderRadius: 10, padding: '10px 12px',
                                                    border: `1px solid ${item.highlight ? '#bfdbfe' : '#f0f0f0'}`,
                                                }}>
                                                    <p style={{ fontSize: 11, color: '#aaa', margin: '0 0 3px' }}>{item.label}</p>
                                                    <p style={{
                                                        fontSize: 13, fontWeight: 700, margin: 0,
                                                        color: item.highlight ? '#1d4ed8' : '#333',
                                                    }}>{item.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* PAY NOW BUTTON */}
                                        {isPayPending && (
                                            <button
                                                onClick={() => { setPayBooking(booking); setShowPayment(true); }}
                                                style={{
                                                    width: '100%', padding: '13px', borderRadius: 12,
                                                    border: 'none', cursor: 'pointer',
                                                    background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                                                    color: '#fff', fontWeight: 700, fontSize: 14,
                                                    boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                                                    transition: 'opacity 0.15s',
                                                }}
                                                onMouseEnter={e => e.target.style.opacity = '0.9'}
                                                onMouseLeave={e => e.target.style.opacity = '1'}>
                                                💳 Pay ₹{amount?.toLocaleString('en-IN')} Now →
                                            </button>
                                        )}

                                        {/* RAISE BID */}
                                        {isPending && (
                                            raiseBidId === booking._id ? (
                                                <div style={{ marginTop: 8 }}>
                                                    {bidError && (
                                                        <p style={{ color: '#dc2626', fontSize: 11, marginBottom: 6 }}>{bidError}</p>
                                                    )}
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <input
                                                            type="number"
                                                            placeholder={`Min ₹${amount + 1}`}
                                                            value={newBidAmount}
                                                            onChange={e => setNewBidAmount(e.target.value)}
                                                            style={{
                                                                flex: 1, borderRadius: 10, padding: '9px 12px',
                                                                border: '1px solid #fde68a', background: '#fffbeb',
                                                                fontSize: 13, outline: 'none', color: '#333',
                                                            }}/>
                                                        <button onClick={() => handleRaiseBid(booking._id)}
                                                            disabled={bidLoading}
                                                            style={{
                                                                padding: '9px 16px', borderRadius: 10, border: 'none',
                                                                background: '#b45309', color: '#fff',
                                                                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                                                                opacity: bidLoading ? 0.7 : 1,
                                                            }}>
                                                            {bidLoading ? '...' : 'Submit'}
                                                        </button>
                                                        <button onClick={() => { setRaiseBidId(null); setBidError(''); }}
                                                            style={{
                                                                padding: '9px 14px', borderRadius: 10,
                                                                border: '1px solid #e8e8e8', background: '#fff',
                                                                fontSize: 12, color: '#777', cursor: 'pointer',
                                                            }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => setRaiseBidId(booking._id)}
                                                    style={{
                                                        width: '100%', padding: '11px', borderRadius: 12,
                                                        border: '1px solid #fde68a', background: '#fffbeb',
                                                        color: '#b45309', fontWeight: 700, fontSize: 13,
                                                        cursor: 'pointer', marginTop: 8, transition: 'all 0.15s',
                                                    }}>
                                                    🔺 Raise My Bid
                                                </button>
                                            )
                                        )}

                                        {/* Owner info */}
                                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                                            <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>
                                                Venue Owner: <span style={{ color: '#555', fontWeight: 600 }}>
                                                    {booking.venue?.owner?.name || '—'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                <p style={{ fontSize: 11, color: '#ccc', letterSpacing: '0.15em', fontStyle: 'italic' }}>
                    EASY. BOOK. ENJOY.
                </p>
            </div>

            {/* Payment Modal */}
            {showPayment && payBooking && (
                <PaymentModal
                    isOpen={showPayment}
                    bookingData={{
                        ...payBooking,
                        totalPrice: payBooking.bidAmount || payBooking.totalPrice,
                        venueName: payBooking.venue?.name,
                    }}
                    onClose={() => { setShowPayment(false); setPayBooking(null); }}
                    onSuccess={() => {
                        setShowPayment(false); setPayBooking(null);
                        setSuccess('🎉 Payment successful! Booking confirmed.');
                        fetchBookings();
                    }}
                />
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default MyBookings;
