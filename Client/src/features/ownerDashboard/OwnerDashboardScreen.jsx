import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../../context/AuthContext';
import { getOwnerBookings } from '../../services/bookingService';
import { getOwnerVenues, toggleVenueActive, updateVenue } from '../../services/venueService';
import AnalyticsStrip from './components/AnalyticsStrip';
import EditVenueModal from './components/EditVenueModal';
import OwnerFloatingChat from './components/OwnerFloatingChat';
import VenueCard from './components/VenueCard';

const themeMap = {
    light: {
        '--primary': '#059669', // Emerald 600
        '--primary-hover': '#047857',
        '--secondary': '#10b981', // Emerald 500
        '--accent': '#34d399', // Emerald 400
        '--bg': '#f0fdf4', // Mint-white
        '--page-bg': 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
        '--surface': '#ffffff',
        '--surface-soft': '#f1f5f9',
        '--text': '#064e3b',
        '--text-muted': '#374151',
        '--border': '#d1fae5',
        '--sidebar-bg': '#064e3b',
        '--sidebar-text': '#ecfdf5',
        '--sidebar-active': '#10b981',
        '--card-shadow': '0 10px 30px -10px rgba(5, 150, 105, 0.15)',
    },
    dark: {
        '--primary': '#10b981',
        '--primary-hover': '#34d399',
        '--secondary': '#059669',
        '--accent': '#6ee7b7',
        '--bg': '#022c22',
        '--page-bg': 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
        '--surface': '#065f46',
        '--surface-soft': '#064e3b',
        '--text': '#ecfdf5',
        '--text-muted': '#a7f3d0',
        '--border': '#064e3b',
        '--sidebar-bg': '#011c16',
        '--sidebar-text': '#d1fae5',
        '--sidebar-active': '#10b981',
        '--card-shadow': '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
    },
};

const formatCurrency = (value = 0) =>
    `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const OwnerDashboardScreen = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const rootRef = useRef(null);

    const [theme, setTheme] = useState(() => localStorage.getItem('owner-dashboard-theme') || 'dark');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [venues, setVenues] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [editingVenue, setEditingVenue] = useState(null);
    const [savingVenue, setSavingVenue] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const currentUserId = (user?.id || user?._id || '').toString();

    const refreshDashboard = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            setRefreshing(silent);
            setError('');

            try {
                const [venueData, bookingData] = await Promise.all([getOwnerVenues(), getOwnerBookings()]);
                const nextVenues = Array.isArray(venueData?.venues) ? venueData.venues : [];
                const nextBookings = Array.isArray(bookingData?.bookings) ? bookingData.bookings : [];

                setVenues(nextVenues);
                setBookings(nextBookings);
                setSelectedVenueId((current) => {
                    if (!nextVenues.length) return '';
                    if (current && nextVenues.some((venue) => venue._id === current)) return current;
                    return nextVenues[0]._id;
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load owner dashboard');
            } finally {
                if (!silent) setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'venueOwner') {
            navigate('/booker/dashboard');
            return;
        }
        void refreshDashboard();
    }, [navigate, refreshDashboard, user]);

    useEffect(() => {
        localStorage.setItem('owner-dashboard-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (!rootRef.current || loading) return;

        const ctx = gsap.context(() => {
            gsap.from('.sidebar-item', {
                x: -20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.05,
                ease: 'power2.out',
            });
            gsap.from('.dash-main-item', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power3.out',
            });
        }, rootRef);

        return () => ctx.revert();
    }, [loading]);

    useEffect(() => {
        if (!error && !notice) return;
        const timeoutId = window.setTimeout(() => {
            setError('');
            setNotice('');
        }, 3500);
        return () => window.clearTimeout(timeoutId);
    }, [error, notice]);

    const bookingCountMap = useMemo(() => {
        return bookings.reduce((acc, booking) => {
            const venueId = booking.venue?._id || booking.venue;
            if (!venueId) return acc;
            const key = venueId.toString();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }, [bookings]);

    const metrics = useMemo(() => {
        const approvedVenues = venues.filter((venue) => venue.isApproved).length;
        const pendingVenues = venues.filter((venue) => !venue.isApproved).length;
        const totalRevenue = bookings
            .filter((booking) => booking.status === 'confirmed')
            .reduce((sum, booking) => sum + (booking.ownerAmount || booking.bidAmount || booking.totalPrice || 0), 0);

        return [
            { id: 'total-venues', label: 'Total Venues', value: venues.length, icon: '🏛️', color: '#10b981' },
            { id: 'approved-venues', label: 'Approved', value: approvedVenues, icon: '✅', color: '#34d399' },
            { id: 'pending-venues', label: 'Pending', value: pendingVenues, icon: '⏳', color: '#fbbf24' },
            { id: 'total-bookings', label: 'Bookings', value: bookings.length, icon: '📅', color: '#60a5fa' },
            { id: 'total-profit', label: 'Total Profit', value: totalRevenue, kind: 'currency', icon: '💰', color: '#10b981' },
        ];
    }, [bookings, venues]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleToggleTheme = () => {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
    };

    const handleToggleVenue = async (venue) => {
        try {
            const data = await toggleVenueActive(venue._id, !venue.isActive);
            const updatedVenue = data?.venue;
            setVenues((current) =>
                current.map((item) => (item._id === venue._id ? { ...item, ...updatedVenue } : item))
            );
            setNotice(updatedVenue?.isActive ? 'Venue enabled' : 'Venue disabled');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to toggle venue');
        }
    };

    const handleSaveVenue = async (payload) => {
        if (!editingVenue?._id) return;
        setSavingVenue(true);
        try {
            const data = await updateVenue(editingVenue._id, payload);
            const updated = data?.venue;
            setVenues((current) =>
                current.map((venue) => (venue._id === updated?._id ? updated : venue))
            );
            setEditingVenue(null);
            setNotice('Venue details updated');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update venue');
        } finally {
            setSavingVenue(false);
        }
    };

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#022c22] text-[#10b981]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="text-4xl">🏛️</div>
                    <p className="font-['Outfit'] font-semibold tracking-widest uppercase">Loading Workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={rootRef}
            className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-500 overflow-hidden"
            style={{ ...themeMap[theme], fontFamily: "'Manrope', sans-serif" }}
        >
            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
                .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
                .glass-dark { background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .float { animation: float 3s ease-in-out infinite; }
            `}</style>

            {/* Sidebar */}
            <aside className="w-64 hidden xl:flex flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] p-6 fixed h-full z-50">
                <div className="flex items-center gap-3 mb-12 sidebar-item">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-xl shadow-lg shadow-emerald-900/40">🌿</div>
                    <span className="font-['Outfit'] font-bold text-xl tracking-tight">BYE Owner</span>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    {[
                        { id: 'overview', icon: '📊', label: 'Overview' },
                        { id: 'venues', icon: '🏛️', label: 'My Venues' },
                        { id: 'bookings', icon: '📅', label: 'Bookings' },
                        { id: 'chat', icon: '💬', label: 'Messages' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === item.id 
                                    ? 'bg-[var(--sidebar-active)] text-white shadow-lg shadow-emerald-500/20' 
                                    : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                            }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto sidebar-item pt-6 border-t border-white/10">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                        <span>🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 xl:ml-64 relative min-h-screen overflow-y-auto">
                {/* Navbar */}
                <header className="sticky top-0 z-40 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="font-['Outfit'] font-bold text-xl capitalize">{activeTab}</h2>
                        {refreshing && <span className="text-xs text-[var(--primary)] animate-pulse">Updating...</span>}
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleToggleTheme}
                            className="w-10 h-10 rounded-full glass-dark flex items-center justify-center transition-transform hover:scale-110"
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <div className="h-8 w-px bg-[var(--border)]" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold">{user?.name || 'Owner'}</p>
                                <p className="text-[10px] text-[var(--accent)] uppercase tracking-widest">Venue Partner</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center font-bold text-white uppercase shadow-inner">
                                {user?.name?.charAt(0) || 'O'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 max-w-7xl mx-auto space-y-10">
                    {/* Hero Banner */}
                    <section className="dash-main-item relative overflow-hidden rounded-3xl p-8 md:p-12 glass shadow-2xl bg-gradient-to-br from-[#065f46] to-[#011c16] text-white">
                        <div className="relative z-10">
                            <h1 className="font-['Outfit'] text-4xl md:text-5xl font-black mb-4 leading-tight">
                                Fresh Venue <br/><span className="text-[var(--primary)]">Growth,</span> simplified.
                            </h1>
                            <p className="text-emerald-100/70 max-w-md text-sm md:text-base mb-8 font-medium">
                                Track your workspace performance, manage bookings, and grow your venue footprint with our partners.
                            </p>
                            <button 
                                onClick={() => void refreshDashboard(true)}
                                className="bg-[var(--primary)] hover:bg-[var(--accent)] px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                            >
                                ✨ Sync Data
                            </button>
                        </div>
                        {/* Decorative orbs */}
                        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[var(--primary)] opacity-10 blur-[100px] rounded-full float" />
                        <div className="absolute right-20 bottom-10 w-40 h-40 bg-[var(--accent)] opacity-5 blur-[60px] rounded-full float" style={{ animationDelay: '1s' }} />
                    </section>

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-head-shake">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {notice && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-sm font-semibold flex items-center gap-3">
                            <span>✅</span> {notice}
                        </div>
                    )}

                    <div className="dash-main-item">
                        <AnalyticsStrip metrics={metrics} />
                    </div>

                    <section className="dash-main-item space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h3 className="font-['Outfit'] text-2xl font-bold">Your Venues</h3>
                                <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-widest mt-1">Live Inventory</p>
                            </div>
                            <button className="text-sm font-bold text-[var(--primary)] hover:underline">View All →</button>
                        </div>

                        {venues.length === 0 ? (
                            <div className="p-12 rounded-3xl border-2 border-dashed border-[var(--border)] flex flex-col items-center text-center opacity-50">
                                <span className="text-4xl mb-4">🏠</span>
                                <p className="font-semibold">No venues listed yet.</p>
                                <p className="text-xs max-w-xs mt-2 text-[var(--text-muted)]">Post your first venue to start receiving bookings and growing your profit.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {venues.map((venue) => (
                                    <VenueCard
                                        key={venue._id}
                                        venue={venue}
                                        bookingCount={bookingCountMap[venue._id] || 0}
                                        selected={selectedVenueId === venue._id}
                                        onEdit={() => setEditingVenue(venue)}
                                        onViewBookings={() => { setSelectedVenueId(venue._id); setActiveTab('bookings'); }}
                                        onToggleActive={() => void handleToggleVenue(venue)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="dash-main-item space-y-6 pb-20">
                        <div className="flex items-center justify-between px-2">
                            <div>
                                <h3 className="font-['Outfit'] text-2xl font-bold">Recent Bookings</h3>
                                <p className="text-xs text-[var(--accent)] font-semibold uppercase tracking-widest mt-1">Conversion Stream</p>
                            </div>
                            <select
                                value={selectedVenueId}
                                onChange={(e) => setSelectedVenueId(e.target.value)}
                                className="bg-[var(--surface-soft)] border border-[var(--border)] text-sm rounded-xl px-4 py-2 outline-none font-bold focus:ring-2 ring-[var(--primary)]/30"
                            >
                                {venues.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                            </select>
                        </div>

                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-[var(--surface-soft)]/50 text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] border-b border-[var(--border)]">
                                            <th className="px-6 py-4">Booker</th>
                                            <th className="px-6 py-4">Event Date</th>
                                            <th className="px-6 py-4">Schedule</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {bookings.filter(b => (b.venue?._id || b.venue) === selectedVenueId).map((booking) => (
                                            <tr key={booking._id} className="hover:bg-[var(--primary)]/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-[var(--primary)]">
                                                            {booking.booker?.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{booking.booker?.name || 'Guest'}</p>
                                                            <p className="text-[10px] opacity-60">@{booking.booker?.username || 'user'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{formatDate(booking.eventDate)}</td>
                                                <td className="px-6 py-4 font-medium opacity-70 italic">{booking.startTime} - {booking.endTime}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                        booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-gray-500/10 text-gray-500'
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-emerald-500">
                                                    {formatCurrency(booking.ownerAmount || booking.bidAmount || booking.totalPrice || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                        {bookings.filter(b => (b.venue?._id || b.venue) === selectedVenueId).length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center opacity-40 font-bold italic italic">No active bookings found for this venue.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <OwnerFloatingChat currentUserId={currentUserId} />

            <EditVenueModal
                venue={editingVenue}
                onClose={() => setEditingVenue(null)}
                onSave={handleSaveVenue}
                saving={savingVenue}
            />
        </div>
    );
};

export default OwnerDashboardScreen;
