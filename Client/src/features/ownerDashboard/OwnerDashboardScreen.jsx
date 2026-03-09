import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../context/AuthContext';
import { getOwnerBookings } from '../../services/bookingService';
import { getOwnerVenues, toggleVenueActive, updateVenue } from '../../services/venueService';
import AnalyticsStrip from './components/AnalyticsStrip';
import EditVenueModal from './components/EditVenueModal';
import OwnerFloatingChat from './components/OwnerFloatingChat';
import VenueCard from './components/VenueCard';

gsap.registerPlugin(ScrollTrigger);

const themeMap = {
    light: {
        '--primary': '#16A34A',
        '--primary-hover': '#15803D',
        '--secondary': '#14532D',
        '--accent': '#34D399',
        '--bg': '#F8FAFC',
        '--page-bg': 'linear-gradient(135deg, #F8FAFC 0%, #ECFDF5 100%)',
        '--surface': '#FFFFFF',
        '--surface-soft': '#EFF6FF',
        '--text': '#020617',
        '--text-muted': '#64748B',
        '--border': '#E2E8F0',
        '--sidebar-bg': '#0F172A',
        '--sidebar-text': '#E5E7EB',
        '--sidebar-active': '#16A34A',
        '--card-shadow': '0 18px 45px -18px rgba(15, 23, 42, 0.25)',
    },
    dark: {
        '--primary': '#16A34A',
        '--primary-hover': '#22C55E',
        '--secondary': '#22C55E',
        '--accent': '#34D399',
        '--bg': '#0F172A',
        '--page-bg': 'linear-gradient(145deg, #020617 0%, #0F172A 40%, #022C22 100%)',
        '--surface': '#020617',
        '--surface-soft': '#020617',
        '--text': '#F9FAFB',
        '--text-muted': '#9CA3AF',
        '--border': '#1E293B',
        '--sidebar-bg': '#020617',
        '--sidebar-text': '#E5E7EB',
        '--sidebar-active': '#16A34A',
        '--card-shadow': '0 24px 60px -24px rgba(0, 0, 0, 0.7)',
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
    const sidebarRef = useRef(null);

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
    const [activeTab, setActiveTab] = useState('dashboard');
    const [timeRange, setTimeRange] = useState('last_30_days');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
            // Sidebar items slide-in
            gsap.from('.sidebar-item', {
                x: -20,
                opacity: 0,
                duration: 0.4,
                stagger: 0.04,
                ease: 'power2.out',
            });

            // Hero + sections on initial load
            gsap.from('.dash-main-item', {
                y: 24,
                opacity: 0,
                duration: 0.5,
                stagger: 0.08,
                ease: 'power3.out',
            });

            // Scroll-based section reveals
            ScrollTrigger.batch('.dash-section', {
                start: 'top 80%',
                once: true,
                onEnter: (elements) => {
                    gsap.fromTo(
                        elements,
                        { y: 30, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.4,
                            ease: 'power2.out',
                            stagger: 0.08,
                        }
                    );
                },
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

    const today = useMemo(() => new Date(), []);

    const dashboardMetrics = useMemo(() => {
        const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
        const pendingRequests = bookings.filter((booking) => booking.status === 'pending').length;

        const monthlyCutoff = new Date();
        monthlyCutoff.setDate(monthlyCutoff.getDate() - 30);

        const monthlyRevenue = confirmedBookings
            .filter((booking) => {
                const date = new Date(booking.eventDate || booking.createdAt);
                return !Number.isNaN(date.getTime()) && date >= monthlyCutoff;
            })
            .reduce(
                (sum, booking) =>
                    sum + (booking.ownerAmount || booking.bidAmount || booking.totalPrice || 0),
                0
            );

        const upcomingEvents = confirmedBookings.filter((booking) => {
            const date = new Date(booking.eventDate);
            return !Number.isNaN(date.getTime()) && date >= today;
        });

        const venuesWithUpcoming = new Set(
            upcomingEvents
                .map((booking) => booking.venue?._id || booking.venue)
                .filter(Boolean)
                .map((id) => id.toString())
        );

        const occupancyRate =
            venues.length === 0 ? 0 : Math.round((venuesWithUpcoming.size / venues.length) * 100);

        return [
            {
                id: 'total-bookings',
                label: 'Total Bookings',
                value: bookings.length,
                icon: '📦',
                color: '#16A34A',
            },
            {
                id: 'monthly-revenue',
                label: 'Monthly Revenue',
                value: monthlyRevenue,
                kind: 'currency',
                icon: '💸',
                color: '#22C55E',
            },
            {
                id: 'upcoming-events',
                label: 'Upcoming Events',
                value: upcomingEvents.length,
                icon: '📅',
                color: '#0EA5E9',
            },
            {
                id: 'pending-requests',
                label: 'Pending Requests',
                value: pendingRequests,
                icon: '⏳',
                color: '#F59E0B',
            },
            {
                id: 'occupancy-rate',
                label: 'Occupancy Rate',
                value: occupancyRate,
                icon: '📈',
                color: '#A855F7',
            },
        ];
    }, [bookings, today, venues.length]);

    const upcomingEvents = useMemo(() => {
        return bookings
            .filter((booking) => {
                const date = new Date(booking.eventDate);
                return (
                    booking.status === 'confirmed' &&
                    !Number.isNaN(date.getTime()) &&
                    date >= today
                );
            })
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
            .slice(0, 5);
    }, [bookings, today]);

    const recentPendingBookings = useMemo(() => {
        return bookings
            .filter((booking) => booking.status === 'pending')
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 8);
    }, [bookings]);

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

    const handleToggleSidebar = () => {
        if (!sidebarRef.current) {
            setSidebarCollapsed((current) => !current);
            return;
        }

        const nextCollapsed = !sidebarCollapsed;
        setSidebarCollapsed(nextCollapsed);

        const targetWidth = nextCollapsed ? 80 : 260;

        gsap.to(sidebarRef.current, {
            width: targetWidth,
            duration: 0.25,
            ease: 'power2.out',
        });
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
            <div className="grid min-h-screen place-items-center bg-[#0F172A] text-[#16A34A]">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="text-4xl">🌿</div>
                    <p className="font-['Inter'] font-semibold tracking-[0.28em] text-xs uppercase">
                        Preparing BookYourEvnt owner space...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={rootRef}
            className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-500 overflow-hidden"
            style={{ ...themeMap[theme], fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        >
            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 10px; }
                .glass { background: rgba(15, 23, 42, 0.82); backdrop-filter: blur(20px); border: 1px solid rgba(148, 163, 184, 0.25); }
                .glass-light { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(24px); border: 1px solid rgba(226, 232, 240, 0.9); }
                .glass-dark { background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(30, 64, 175, 0.7); }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .float { animation: float 3s ease-in-out infinite; }
            `}</style>

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className="hidden xl:flex flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] px-4 py-6 fixed h-full z-50"
                style={{ width: sidebarCollapsed ? 80 : 260 }}
            >
                <div className="flex items-center justify-between mb-10 sidebar-item px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-lg shadow-lg shadow-emerald-900/40">
                            🌿
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <span className="block text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-400">
                                    BookYourEvnt
                                </span>
                                <span className="font-['Inter'] font-semibold text-sm tracking-tight">
                                    Owner Console
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleSidebar}
                        className="hidden xl:inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-xs hover:bg-white/10 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        {sidebarCollapsed ? '›' : '‹'}
                    </button>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {[
                        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
                        { id: 'bookings', icon: '📅', label: 'Bookings' },
                        { id: 'events', icon: '🎉', label: 'Events' },
                        { id: 'venues', icon: '🏛️', label: 'Venues' },
                        { id: 'calendar', icon: '🗓️', label: 'Calendar' },
                        { id: 'revenue', icon: '📈', label: 'Revenue' },
                        { id: 'payouts', icon: '💵', label: 'Payouts' },
                        { id: 'messages', icon: '💬', label: 'Messages' },
                        { id: 'reviews', icon: '⭐', label: 'Reviews' },
                        { id: 'settings', icon: '⚙️', label: 'Settings' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`sidebar-item flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                                activeTab === item.id
                                    ? 'bg-[var(--sidebar-active)] text-white shadow-[0_18px_45px_rgba(22,163,74,0.65)]'
                                    : 'hover:bg-white/5 text-slate-300'
                            }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto sidebar-item pt-5 border-t border-white/10">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-3 w-full text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"
                    >
                        <span>⇦</span>
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 xl:ml-[260px] relative min-h-screen overflow-y-auto">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-5 sm:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="hidden xl:block text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">
                            {activeTab === 'dashboard' ? 'Overview' : activeTab}
                        </div>
                        <h2 className="font-['Inter'] font-semibold text-lg sm:text-xl">
                            Owner Dashboard
                        </h2>
                        {refreshing && (
                            <span className="text-[11px] text-[var(--primary)] animate-pulse">
                                Syncing latest data…
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-[var(--surface-soft)] border border-[var(--border)] rounded-full px-3 py-1.5 text-xs text-[var(--text-muted)] min-w-[200px]">
                            <span className="text-[13px]">⌕</span>
                            <input
                                placeholder="Search venues, bookings, guests..."
                                className="bg-transparent outline-none w-full text-[11px] placeholder:text-slate-500"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleTheme}
                            className="h-9 w-9 rounded-full glass-dark flex items-center justify-center text-xs transition-transform hover:scale-105"
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        <button
                            type="button"
                            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-soft)] border border-[var(--border)] text-xs hover:bg-[var(--surface)] transition"
                            aria-label="Notifications"
                        >
                            🔔
                        </button>
                        <button
                            type="button"
                            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-soft)] border border-[var(--border)] text-xs hover:bg-[var(--surface)] transition"
                            aria-label="Inbox"
                        >
                            💬
                        </button>

                        <div className="h-7 w-px bg-[var(--border)] hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-medium text-[var(--text)]">
                                    {user?.name || 'Owner'}
                                </p>
                                <p className="text-[10px] text-[var(--accent)] uppercase tracking-[0.22em]">
                                    Venue Owner
                                </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center font-semibold text-white uppercase shadow-inner text-xs">
                                {user?.name?.charAt(0) || 'O'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-10">
                    {/* Welcome + Quick Actions */}
                    <section className="dash-main-item dash-section grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
                        <article className="relative overflow-hidden rounded-3xl p-7 sm:p-9 glass text-slate-50 shadow-[0_28px_80px_rgba(0,0,0,0.65)]">
                            <div className="relative z-10 space-y-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300/70">
                                    Welcome back, {user?.name?.split(' ')[0] || 'Owner'}
                                </p>
                                <h1 className="font-['Inter'] text-3xl sm:text-4xl font-semibold leading-tight">
                                    Your venues are{' '}
                                    <span className="text-[var(--accent)]">ready to book.</span>
                                </h1>
                                <p className="max-w-md text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                                    Monitor bookings, revenue and utilisation across all your spaces,
                                    and keep every event on track from a single premium workspace.
                                </p>

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => void refreshDashboard(true)}
                                        className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold tracking-wide text-white shadow-[0_18px_40px_rgba(22,163,74,0.55)] transition-transform hover:bg-[var(--primary-hover)] active:scale-95"
                                    >
                                        ✨ Sync data
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-white/5 px-4 py-2 text-[11px] font-medium text-emerald-100 hover:bg-white/10 transition"
                                    >
                                        Live today • {bookings.length} bookings
                                    </button>
                                </div>
                            </div>

                            {/* Decorative blobs */}
                            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/30 blur-[90px]" />
                            <div className="pointer-events-none absolute right-10 bottom-0 h-40 w-40 rounded-full bg-sky-400/40 blur-[80px]" />
                        </article>

                        {/* Quick actions */}
                        <aside className="dash-section bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                        Quick actions
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-[var(--text)]">
                                        Create, publish and manage in two taps.
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-500">
                                    GSAP enhanced
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                                <button
                                    type="button"
                                    className="flex flex-col items-start gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 font-medium hover:border-[var(--primary)]/70 hover:bg-[var(--surface)] hover:shadow-md transition-all active:scale-95"
                                >
                                    <span className="text-lg">🎉</span>
                                    <span>Create event</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col items-start gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 font-medium hover:border-[var(--primary)]/70 hover:bg-[var(--surface)] hover:shadow-md transition-all active:scale-95"
                                >
                                    <span className="text-lg">🏛️</span>
                                    <span>Add venue</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col items-start gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 font-medium hover:border-[var(--primary)]/70 hover:bg-[var(--surface)] hover:shadow-md transition-all active:scale-95"
                                >
                                    <span className="text-lg">🗓️</span>
                                    <span>Manage slots</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col items-start gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 font-medium hover:border-[var(--primary)]/70 hover:bg-[var(--surface)] hover:shadow-md transition-all active:scale-95"
                                >
                                    <span className="text-lg">📈</span>
                                    <span>View revenue</span>
                                </button>
                            </div>
                        </aside>
                    </section>

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-head-shake">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {notice && (
                        <div className="p-4 bg-emerald-500/8 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-3">
                            <span>✅</span> {notice}
                        </div>
                    )}

                    {/* KPI Overview */}
                    <section className="dash-main-item dash-section space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-['Inter'] text-sm sm:text-base font-semibold text-[var(--text)]">
                                    Today at a glance
                                </h3>
                                <p className="text-[11px] text-[var(--text-muted)]">
                                    Bookings, revenue and utilisation across your portfolio.
                                </p>
                            </div>
                        </div>
                        <AnalyticsStrip metrics={dashboardMetrics} />
                    </section>

                    {/* Analytics + Upcoming events */}
                    <section className="dash-section grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)]">
                        {/* Revenue / Bookings analytics */}
                        <article className="dash-main-item bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-['Inter'] text-sm sm:text-base font-semibold text-[var(--text)]">
                                        Revenue & bookings
                                    </h3>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        Lightweight trend view. Plug in your chart library here.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={timeRange}
                                        onChange={(e) => setTimeRange(e.target.value)}
                                        className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-[11px] text-[var(--text)] outline-none"
                                    >
                                        <option value="today">Today</option>
                                        <option value="last_7_days">Last 7 days</option>
                                        <option value="last_30_days">Last 30 days</option>
                                        <option value="this_month">This month</option>
                                        <option value="custom">Custom range</option>
                                    </select>
                                </div>
                            </div>

                            {/* Faux chart for now – designed container for a future chart.js/recharts embed */}
                            <div className="relative mt-2 h-44 sm:h-52 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent border border-dashed border-[var(--border)] overflow-hidden">
                                <div className="absolute inset-0 grid grid-cols-12 gap-1 px-4 pb-3 pt-6">
                                    {[...Array(12)].map((_, index) => (
                                        <div
                                            // eslint-disable-next-line react/no-array-index-key
                                            key={index}
                                            className="flex items-end justify-center"
                                        >
                                            <div
                                                className="w-2 rounded-full bg-gradient-to-t from-emerald-500/15 via-emerald-400/70 to-emerald-300"
                                                style={{
                                                    height: `${35 + (index % 4) * 10}%`,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-5 pb-2 text-[10px] text-[var(--text-muted)]">
                                    <span>Mon</span>
                                    <span>Wed</span>
                                    <span>Fri</span>
                                    <span>Sun</span>
                                </div>
                            </div>
                        </article>

                        {/* Upcoming events */}
                        <article className="dash-main-item bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-['Inter'] text-sm sm:text-base font-semibold text-[var(--text)]">
                                        Upcoming events
                                    </h3>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        Next 5 confirmed bookings across your venues.
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-500">
                                    {upcomingEvents.length || 0} upcoming
                                </span>
                            </div>

                            {upcomingEvents.length === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-[11px] text-[var(--text-muted)]">
                                    <span className="mb-2 text-2xl">🌓</span>
                                    No upcoming confirmed events. New bookings will appear here.
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {upcomingEvents.map((booking) => (
                                        <li
                                            key={booking._id}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-[var(--surface-soft)]/40 px-3 py-2.5 text-xs hover:border-[var(--border)] hover:bg-[var(--surface-soft)] transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-8 w-8 rounded-full bg-emerald-500/10 grid place-items-center text-xs font-semibold text-emerald-500">
                                                    {formatDate(booking.eventDate).split(' ')[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-[var(--text)]">
                                                        {booking.venue?.name || 'Venue'}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">
                                                        {booking.startTime} – {booking.endTime} •{' '}
                                                        {booking.booker?.name || 'Guest'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
                                                confirmed
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    </section>

                    {/* Venues + Booking requests table */}
                    <section className="dash-section grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)] pb-16">
                        {/* Venues */}
                        <article className="dash-main-item space-y-4">
                            <div className="flex items-center justify-between gap-3 px-1">
                                <div>
                                    <h3 className="font-['Inter'] text-sm sm:text-base font-semibold text-[var(--text)]">
                                        Your venues
                                    </h3>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        Inventory, status and performance snapshots.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="text-[11px] font-medium text-[var(--primary)] hover:underline"
                                >
                                    View all
                                </button>
                            </div>

                            {venues.length === 0 ? (
                                <div className="p-10 rounded-3xl border-2 border-dashed border-[var(--border)] flex flex-col items-center text-center text-[11px] text-[var(--text-muted)]">
                                    <span className="text-3xl mb-3">🏠</span>
                                    <p className="font-medium text-[var(--text)]">
                                        No venues listed yet.
                                    </p>
                                    <p className="mt-1 max-w-xs">
                                        Publish your first venue to start receiving booking
                                        requests and revenue insights.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {venues.map((venue) => (
                                        <VenueCard
                                            key={venue._id}
                                            venue={venue}
                                            bookingCount={bookingCountMap[venue._id] || 0}
                                            selected={selectedVenueId === venue._id}
                                            onEdit={() => setEditingVenue(venue)}
                                            onViewBookings={() => {
                                                setSelectedVenueId(venue._id);
                                                setActiveTab('bookings');
                                            }}
                                            onToggleActive={() => void handleToggleVenue(venue)}
                                        />
                                    ))}
                                </div>
                            )}
                        </article>

                        {/* Recent booking requests */}
                        <article className="dash-main-item space-y-4">
                            <div className="flex items-center justify-between gap-3 px-1">
                                <div>
                                    <h3 className="font-['Inter'] text-sm sm:text-base font-semibold text-[var(--text)]">
                                        Recent booking requests
                                    </h3>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        Approve, decline or inspect new demand.
                                    </p>
                                </div>
                                <select
                                    value={selectedVenueId}
                                    onChange={(e) => setSelectedVenueId(e.target.value)}
                                    className="bg-[var(--surface-soft)] border border-[var(--border)] text-[11px] rounded-full px-3 py-1.5 outline-none text-[var(--text)]"
                                >
                                    <option value="">All venues</option>
                                    {venues.map((v) => (
                                        <option key={v._id} value={v._id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--surface-soft)]/60 text-[var(--text-muted)] font-semibold uppercase tracking-[0.16em] text-[9px] border-b border-[var(--border)]">
                                                <th className="px-4 sm:px-5 py-3">Booker</th>
                                                <th className="px-4 sm:px-5 py-3">Venue</th>
                                                <th className="px-4 sm:px-5 py-3">Date</th>
                                                <th className="px-4 sm:px-5 py-3">Schedule</th>
                                                <th className="px-4 sm:px-5 py-3 text-right">
                                                    Est. profit
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {recentPendingBookings
                                                .filter((b) => {
                                                    if (!selectedVenueId) return true;
                                                    const venueId =
                                                        b.venue?._id || b.venue || '';
                                                    return (
                                                        venueId &&
                                                        venueId.toString() === selectedVenueId
                                                    );
                                                })
                                                .map((booking) => (
                                                    <tr
                                                        key={booking._id}
                                                        className="hover:bg-[var(--primary)]/4 transition-colors group"
                                                    >
                                                        <td className="px-4 sm:px-5 py-3">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-semibold text-[var(--primary)]">
                                                                    {booking.booker?.name?.charAt(
                                                                        0
                                                                    ) || 'U'}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="truncate font-medium">
                                                                        {booking.booker?.name ||
                                                                            'Guest'}
                                                                    </p>
                                                                    <p className="text-[9px] opacity-60 truncate">
                                                                        @
                                                                        {booking.booker
                                                                            ?.username || 'user'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-5 py-3 max-w-[140px] truncate">
                                                            {booking.venue?.name || 'Venue'}
                                                        </td>
                                                        <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                                                            {formatDate(booking.eventDate)}
                                                        </td>
                                                        <td className="px-4 sm:px-5 py-3 whitespace-nowrap text-[10px] opacity-80">
                                                            {booking.startTime} –{' '}
                                                            {booking.endTime}
                                                        </td>
                                                        <td className="px-4 sm:px-5 py-3 text-right font-semibold text-emerald-500">
                                                            {formatCurrency(
                                                                booking.ownerAmount ||
                                                                    booking.bidAmount ||
                                                                    booking.totalPrice ||
                                                                    0
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            {recentPendingBookings.filter((b) => {
                                                if (!selectedVenueId) return true;
                                                const venueId = b.venue?._id || b.venue || '';
                                                return (
                                                    venueId &&
                                                    venueId.toString() === selectedVenueId
                                                );
                                            }).length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan="5"
                                                        className="px-4 sm:px-5 py-10 text-center text-[11px] text-[var(--text-muted)] italic"
                                                    >
                                                        No recent booking requests for this
                                                        selection.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </article>
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
