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
        '--primary': '#0F3D2E',
        '--secondary': '#1F6F54',
        '--accent': '#3FAE7C',
        '--bg': '#F7FDF9',
        '--surface': '#FFFFFF',
        '--surface-soft': '#EEF8F2',
        '--text': '#102D23',
        '--muted': '#5F7B70',
        '--border': '#D7E9DF',
    },
    dark: {
        '--primary': '#3FAE7C',
        '--secondary': '#2E8F68',
        '--accent': '#61C695',
        '--bg': '#081C15',
        '--surface': '#103127',
        '--surface-soft': '#13392D',
        '--text': '#E9F8F1',
        '--muted': '#9CB9AE',
        '--border': '#1F4638',
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

    const [theme, setTheme] = useState(() => localStorage.getItem('owner-dashboard-theme') || 'light');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [venues, setVenues] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [editingVenue, setEditingVenue] = useState(null);
    const [savingVenue, setSavingVenue] = useState(false);

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
            gsap.from('.owner-hero-item', {
                y: 24,
                opacity: 0,
                duration: 0.55,
                stagger: 0.08,
                ease: 'power2.out',
            });
            gsap.from('.venue-card', {
                y: 24,
                opacity: 0,
                duration: 0.5,
                stagger: 0.06,
                ease: 'power2.out',
                delay: 0.12,
            });
            gsap.from('.owner-bookings', {
                y: 24,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                delay: 0.2,
            });
        }, rootRef);

        return () => ctx.revert();
    }, [loading, venues.length, selectedVenueId]);

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

    const selectedVenueBookings = useMemo(() => {
        if (!selectedVenueId) return [];
        return bookings.filter((booking) => {
            const venueId = booking.venue?._id || booking.venue;
            return venueId?.toString() === selectedVenueId;
        });
    }, [bookings, selectedVenueId]);

    const metrics = useMemo(() => {
        const approvedVenues = venues.filter((venue) => venue.isApproved).length;
        const pendingVenues = venues.filter((venue) => !venue.isApproved).length;
        const totalRevenue = bookings
            .filter((booking) => booking.status === 'confirmed')
            .reduce((sum, booking) => sum + (booking.ownerAmount || booking.bidAmount || booking.totalPrice || 0), 0);

        return [
            { id: 'total-venues', label: 'Total Venues', value: venues.length },
            { id: 'approved-venues', label: 'Approved Venues', value: approvedVenues },
            { id: 'pending-venues', label: 'Pending Venues', value: pendingVenues },
            { id: 'total-profit', label: 'Total Profit', value: totalRevenue, kind: 'currency' },
            { id: 'total-bookings', label: 'Total Bookings', value: bookings.length },
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
            <div
                className="grid min-h-screen place-items-center bg-[var(--bg)] transition-colors duration-500"
                style={themeMap[theme]}
            >
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-sm font-semibold text-[var(--muted)] shadow-[0_20px_45px_rgba(8,28,21,0.15)]">
                    Loading owner workspace...
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-500"
            style={themeMap[theme]}
        >
            <div
                ref={rootRef}
                className="mx-auto max-w-[1380px] px-4 pb-28 pt-5 font-['Manrope'] md:px-7 md:pt-7"
            >
                <header className="owner-hero-item mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-5 shadow-[0_12px_26px_rgba(8,28,21,0.08)] backdrop-blur md:px-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                Owner Dashboard
                            </p>
                            <h1 className="mt-2 font-['Outfit'] text-3xl font-semibold tracking-tight md:text-4xl">
                                Clean Venue Workspace
                            </h1>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                                Manage venues, monitor bookings, and keep conversations active in one focused view.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleToggleTheme}
                                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/70"
                            >
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void refreshDashboard(true)}
                                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/70"
                            >
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--secondary)]"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {error && (
                    <p className="owner-hero-item mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {error}
                    </p>
                )}

                {notice && (
                    <p className="owner-hero-item mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                        {notice}
                    </p>
                )}

                <AnalyticsStrip metrics={metrics} />

                <section className="owner-hero-item mt-8">
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="font-['Outfit'] text-2xl font-semibold tracking-tight md:text-3xl">My Venues</h2>
                            <p className="text-sm text-[var(--muted)]">
                                Premium, uncluttered control over listing status and performance.
                            </p>
                        </div>
                    </div>

                    {venues.length === 0 ? (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
                            No venues found yet. Create your first venue to start managing bookings.
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {venues.map((venue) => (
                                <VenueCard
                                    key={venue._id}
                                    venue={venue}
                                    bookingCount={bookingCountMap[venue._id] || 0}
                                    selected={selectedVenueId === venue._id}
                                    onEdit={() => setEditingVenue(venue)}
                                    onViewBookings={() => setSelectedVenueId(venue._id)}
                                    onToggleActive={() => void handleToggleVenue(venue)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="owner-bookings mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5 shadow-[0_12px_24px_rgba(8,28,21,0.08)] backdrop-blur md:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-['Outfit'] text-2xl font-semibold tracking-tight">Bookings Overview</h3>
                            <p className="text-sm text-[var(--muted)]">
                                Track booking conversations and payment movement per venue.
                            </p>
                        </div>

                        <select
                            value={selectedVenueId}
                            onChange={(event) => setSelectedVenueId(event.target.value)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        >
                            {venues.map((venue) => (
                                <option value={venue._id} key={venue._id}>
                                    {venue.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedVenueBookings.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No bookings for this venue yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                                        <th className="px-3 py-2">Booker</th>
                                        <th className="px-3 py-2">Date</th>
                                        <th className="px-3 py-2">Time</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedVenueBookings.map((booking) => (
                                        <tr key={booking._id} className="rounded-xl bg-[var(--surface-soft)]/70">
                                            <td className="rounded-l-xl px-3 py-3">
                                                <p className="font-semibold text-[var(--text)]">{booking.booker?.name || 'Booker'}</p>
                                                <p className="text-xs text-[var(--muted)]">
                                                    @{booking.booker?.username || 'user'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 text-[var(--muted)]">{formatDate(booking.eventDate)}</td>
                                            <td className="px-3 py-3 text-[var(--muted)]">
                                                {booking.startTime} - {booking.endTime}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="rounded-r-xl px-3 py-3 text-right font-semibold text-[var(--text)]">
                                                {formatCurrency(booking.bidAmount || booking.totalPrice || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

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
