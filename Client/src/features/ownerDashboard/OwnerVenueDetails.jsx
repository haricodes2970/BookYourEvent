import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../context/AuthContext';
import { getVenueById } from '../../services/venueService';
import { getOwnerBookings } from '../../services/bookingService';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';

gsap.registerPlugin(ScrollTrigger);

const formatCurrency = (value = 0) =>
    `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const OwnerVenueDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const rootRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [venue, setVenue] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [timeRange, setTimeRange] = useState('30d');

    useEffect(() => {
        const loadData = async () => {
            try {
                setError('');
                const [venueRes, bookingRes] = await Promise.all([
                    getVenueById(id),
                    getOwnerBookings(),
                ]);
                setVenue(venueRes?.venue || null);
                const allBookings = Array.isArray(bookingRes?.bookings) ? bookingRes.bookings : [];
                setBookings(
                    allBookings.filter((booking) => {
                        const venueId = booking.venue?._id || booking.venue;
                        return venueId && venueId.toString() === id;
                    })
                );
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load venue details');
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [id]);

    useEffect(() => {
        if (!rootRef.current || loading) return;

        const ctx = gsap.context(() => {
            gsap.from('.ovd-section', {
                y: 30,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                stagger: 0.08,
            });

            ScrollTrigger.batch('.ovd-reveal', {
                start: 'top 80%',
                once: true,
                onEnter: (els) => {
                    gsap.fromTo(
                        els,
                        { y: 30, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.4,
                            ease: 'power2.out',
                            stagger: 0.06,
                        }
                    );
                },
            });
        }, rootRef);

        return () => ctx.revert();
    }, [loading]);

    const today = useMemo(() => new Date(), []);

    const kpis = useMemo(() => {
        if (!venue) return [];

        const confirmed = bookings.filter((b) => b.status === 'confirmed');
        const pending = bookings.filter((b) => b.status === 'pending');

        const monthCutoff = new Date();
        monthCutoff.setDate(monthCutoff.getDate() - 30);

        const revenueThisMonth = confirmed
            .filter((b) => {
                const date = new Date(b.eventDate || b.createdAt);
                return !Number.isNaN(date.getTime()) && date >= monthCutoff;
            })
            .reduce(
                (sum, b) => sum + (b.ownerAmount || b.bidAmount || b.totalPrice || 0),
                0
            );

        const upcomingEvents = confirmed.filter((b) => {
            const date = new Date(b.eventDate);
            return !Number.isNaN(date.getTime()) && date >= today;
        });

        const occupancyRate =
            venue.capacity && upcomingEvents.length
                ? Math.min(100, Math.round((upcomingEvents.length / 30) * 100))
                : 0;

        const avgRating = Number(venue.avgRating || venue.rating || 0).toFixed(1);

        return [
            {
                id: 'venue-total-bookings',
                label: 'Total bookings',
                value: bookings.length,
                meta: 'All time',
            },
            {
                id: 'venue-revenue-month',
                label: 'Revenue this month',
                value: formatCurrency(revenueThisMonth),
                meta: 'Last 30 days',
            },
            {
                id: 'venue-upcoming',
                label: 'Upcoming events',
                value: upcomingEvents.length,
                meta: 'Next 90 days',
            },
            {
                id: 'venue-occupancy',
                label: 'Occupancy rate',
                value: `${occupancyRate}%`,
                meta: 'Projected',
            },
            {
                id: 'venue-rating',
                label: 'Average rating',
                value: avgRating,
                meta: `${venue.reviewCount || venue.reviewsCount || 0} reviews`,
            },
        ];
    }, [bookings, today, venue]);

    const upcomingEvents = useMemo(() => {
        return bookings
            .filter((b) => {
                const date = new Date(b.eventDate);
                return (
                    b.status === 'confirmed' &&
                    !Number.isNaN(date.getTime()) &&
                    date >= today
                );
            })
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
            .slice(0, 6);
    }, [bookings, today]);

    const pendingRequests = useMemo(
        () =>
            bookings
                .filter((b) => b.status === 'pending')
                .sort(
                    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                )
                .slice(0, 8),
        [bookings]
    );

    if (!user || user.role !== 'venueOwner') {
        return null;
    }

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#0F172A] text-[#16A34A]">
                <div className="flex flex-col items-center gap-3 animate-pulse">
                    <div className="text-3xl">🏛️</div>
                    <p className="text-xs tracking-[0.26em] uppercase font-semibold">
                        Loading venue workspace...
                    </p>
                </div>
            </div>
        );
    }

    if (!venue) {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">
                <div className="space-y-3 text-center">
                    <p className="text-4xl">🕳️</p>
                    <p className="text-sm font-medium">Venue not found</p>
                    <button
                        type="button"
                        onClick={() => navigate('/owner/dashboard')}
                        className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-100 hover:bg-slate-800"
                    >
                        ⬅ Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    const statusLabel = !venue.isActive
        ? 'Disabled'
        : venue.isApproved
        ? 'Live'
        : 'Under review';

    return (
        <div
            ref={rootRef}
            className="min-h-screen bg-[#020617] text-slate-100"
            style={{
                fontFamily:
                    "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            {/* Top bar */}
            <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900 text-xs hover:bg-slate-800"
                        >
                            ←
                        </button>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                                Venue workspace
                            </p>
                            <p className="text-sm font-medium text-slate-50">
                                {venue.name}
                            </p>
                        </div>
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                        <button
                            type="button"
                            className="rounded-full border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-800"
                        >
                            View public listing
                        </button>
                        <button
                            type="button"
                            className="rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400"
                        >
                            Edit venue
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 space-y-8">
                {/* Header */}
                <section className="ovd-section space-y-5">
                    <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                        <article className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-5 sm:p-6">
                            <div className="relative z-10 space-y-3 sm:space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                                        {statusLabel}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-50">
                                        {venue.name}
                                    </h1>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        {venue.location?.address}, {venue.location?.city}{' '}
                                        {venue.location?.pincode
                                            ? `• ${venue.location.pincode}`
                                            : null}
                                    </p>
                                </div>
                                <p className="max-w-xl text-[11px] text-slate-400">
                                    This workspace is dedicated to everything that happens inside this
                                    venue — bookings, availability, performance, media and reviews in
                                    one place.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400">
                                    <span>👥 Capacity: {venue.capacity || '--'} guests</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-600" />
                                    <span>
                                        Price:{' '}
                                        {venue.pricePerHour
                                            ? `${formatCurrency(venue.pricePerHour)}/hr`
                                            : '--'}
                                    </span>
                                </div>
                            </div>
                            {venue.images?.[0] && (
                                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-60 mix-blend-screen sm:block">
                                    <img
                                        src={venue.images[0]}
                                        alt={venue.name}
                                        className="h-full w-full object-cover opacity-60"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent" />
                                </div>
                            )}
                        </article>

                        <aside className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Quick actions
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                                <button
                                    type="button"
                                    className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-left text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/90"
                                >
                                    <span className="text-lg">📷</span>
                                    <span>Upload photos</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-left text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/90"
                                >
                                    <span className="text-lg">🗓️</span>
                                    <span>Manage availability</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-left text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/90"
                                >
                                    <span className="text-lg">📈</span>
                                    <span>View revenue</span>
                                </button>
                                <button
                                    type="button"
                                    className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-left text-slate-100 hover:border-rose-500/60 hover:bg-slate-900/90"
                                >
                                    <span className="text-lg">⏸️</span>
                                    <span>Disable venue</span>
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-[11px] text-rose-400">
                                    {error}
                                </p>
                            )}
                        </aside>
                    </div>
                </section>

                {/* KPI cards */}
                <section className="ovd-section ovd-reveal space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Performance snapshot
                            </p>
                            <p className="text-xs text-slate-400">
                                How this venue is performing right now.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {kpis.map((metric) => (
                            <article
                                key={metric.id}
                                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                                <div className="relative space-y-1.5">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        {metric.label}
                                    </p>
                                    <p className="text-base font-semibold text-slate-50">
                                        {metric.value}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{metric.meta}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Analytics + calendar */}
                <section className="ovd-section ovd-reveal grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.5fr)]">
                    <article className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Revenue & bookings
                                </p>
                                <p className="text-xs text-slate-400">
                                    Plug in your chart library here for this venue.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-100 outline-none"
                                >
                                    <option value="7d">7 days</option>
                                    <option value="30d">30 days</option>
                                    <option value="90d">90 days</option>
                                    <option value="month">This month</option>
                                </select>
                            </div>
                        </div>
                        <div className="relative mt-2 h-40 sm:h-48 rounded-2xl border border-dashed border-slate-800 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-transparent">
                            <div className="absolute inset-0 grid grid-cols-12 gap-1 px-4 pb-3 pt-6">
                                {Array.from({ length: 12 }).map((_, index) => (
                                    <div
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={index}
                                        className="flex items-end justify-center"
                                    >
                                        <div
                                            className="w-2 rounded-full bg-gradient-to-t from-emerald-500/25 via-emerald-400/80 to-emerald-300"
                                            style={{
                                                height: `${30 + (index % 5) * 12}%`,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-5 pb-2 text-[9px] text-slate-500">
                                <span>Week 1</span>
                                <span>Week 2</span>
                                <span>Week 3</span>
                                <span>Week 4</span>
                            </div>
                        </div>
                    </article>

                    <article className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Availability calendar
                                </p>
                                <p className="text-xs text-slate-400">
                                    Block dates, visualise booked days and keep this venue accurate.
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-400">
                                Owner mode
                            </span>
                        </div>
                        <AvailabilityCalendar
                            blockedDates={venue.blockedDates || []}
                            mode="owner"
                        />
                    </article>
                </section>

                {/* Upcoming events & booking requests */}
                <section className="ovd-section ovd-reveal grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.8fr)]">
                    <article className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Upcoming events
                                </p>
                                <p className="text-xs text-slate-400">
                                    Confirmed events scheduled for this venue.
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-400">
                                {upcomingEvents.length} upcoming
                            </span>
                        </div>
                        {upcomingEvents.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-800 text-[11px] text-slate-500">
                                No upcoming events yet.
                            </div>
                        ) : (
                            <ul className="space-y-2 text-[11px]">
                                {upcomingEvents.map((booking) => (
                                    <li
                                        key={booking._id}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 hover:border-emerald-500/60"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-400">
                                                {formatDate(booking.eventDate).split(' ')[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-50">
                                                    {booking.eventName ||
                                                        booking.occasion ||
                                                        'Event'}
                                                </p>
                                                <p className="truncate text-[10px] text-slate-400">
                                                    {booking.booker?.name || 'Guest'} •{' '}
                                                    {booking.guestCount || '--'} guests
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400">
                                                {booking.startTime} – {booking.endTime}
                                            </p>
                                            <p className="mt-1 text-[10px] font-semibold text-emerald-400">
                                                {formatCurrency(
                                                    booking.ownerAmount ||
                                                        booking.bidAmount ||
                                                        booking.totalPrice ||
                                                        0
                                                )}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>

                    <article className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Booking requests
                                </p>
                                <p className="text-xs text-slate-400">
                                    Recent booking requests for this venue.
                                </p>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-[11px]">
                                    <thead>
                                        <tr className="bg-slate-900/70 text-left text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">Event</th>
                                            <th className="px-3 py-3">Requested date</th>
                                            <th className="px-3 py-3">Guests</th>
                                            <th className="px-3 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {pendingRequests.map((booking) => (
                                            <tr
                                                key={booking._id}
                                                className="hover:bg-emerald-500/5"
                                            >
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
                                                            {booking.booker?.name?.charAt(
                                                                0
                                                            ) || 'U'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium text-slate-50">
                                                                {booking.booker?.name ||
                                                                    'Guest'}
                                                            </p>
                                                            <p className="truncate text-[9px] text-slate-500">
                                                                @
                                                                {booking.booker?.username ||
                                                                    'user'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 max-w-[140px] truncate text-slate-100">
                                                    {booking.eventType ||
                                                        booking.occasion ||
                                                        'Event'}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-slate-100">
                                                    {formatDate(booking.eventDate)}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-slate-100">
                                                    {booking.guestCount || '--'}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-400">
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {pendingRequests.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-3 py-10 text-center text-[11px] text-slate-500"
                                                >
                                                    No pending booking requests for this venue.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </article>
                </section>

                {/* Photos, amenities, reviews shells */}
                <section className="ovd-section ovd-reveal grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)]">
                    <article className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Photo gallery
                                </p>
                                <p className="text-xs text-slate-400">
                                    Upload, reorder and manage up to 20 images.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] text-slate-100 hover:bg-slate-800"
                            >
                                Upload images
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {venue.images?.slice(0, 6).map((src, index) => (
                                <div
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={index}
                                    className="relative aspect-video overflow-hidden rounded-xl border border-slate-800 bg-slate-900"
                                >
                                    <img
                                        src={src}
                                        alt={venue.name}
                                        className="h-full w-full object-cover"
                                    />
                                    {index === 0 && (
                                        <span className="absolute left-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[9px] text-slate-200">
                                            Cover
                                        </span>
                                    )}
                                </div>
                            ))}
                            {(!venue.images || venue.images.length === 0) && (
                                <div className="col-span-3 flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-800 text-[11px] text-slate-500">
                                    No photos uploaded yet.
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Amenities & info
                                </p>
                                <p className="text-xs text-slate-400">
                                    Manage what guests see about this venue.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 text-[11px] sm:grid-cols-2">
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    Amenities
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(venue.amenities || [
                                        'Parking',
                                        'WiFi',
                                        'Sound system',
                                        'Air conditioning',
                                    ]).map((item) => (
                                        <span
                                            key={item}
                                            className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] text-slate-100"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                    Basic info
                                </p>
                                <ul className="space-y-1.5 text-[11px] text-slate-300">
                                    <li>
                                        <span className="text-slate-500">Capacity: </span>
                                        {venue.capacity || '--'} guests
                                    </li>
                                    <li>
                                        <span className="text-slate-500">Hourly price: </span>
                                        {venue.pricePerHour
                                            ? formatCurrency(venue.pricePerHour)
                                            : '--'}
                                    </li>
                                    {venue.contactPhone && (
                                        <li>
                                            <span className="text-slate-500">Contact: </span>
                                            {venue.contactPhone}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="space-y-2 text-[11px]">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Description
                            </p>
                            <p className="text-slate-300">
                                {venue.description ||
                                    'Describe what makes this venue unique, the type of events it is perfect for, and any rules or restrictions guests should know.'}
                            </p>
                        </div>
                    </article>
                </section>

                {/* Reviews */}
                <section className="ovd-section ovd-reveal rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Reviews
                            </p>
                            <p className="text-xs text-slate-400">
                                What guests are saying about this venue.
                            </p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-lg font-semibold text-emerald-400">
                                {Number(venue.avgRating || venue.rating || 0).toFixed(1)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                                {venue.reviewCount || venue.reviewsCount || 0} reviews
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-dashed border-slate-800 p-4 text-[11px] text-slate-400">
                            Reviews from guests for this venue will appear here so you can
                            understand satisfaction and spot issues quickly.
                        </div>
                        <div className="rounded-2xl border border-dashed border-slate-800 p-4 text-[11px] text-slate-400">
                            You can keep an eye on average ratings over time and respond to
                            feedback from your guests.
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default OwnerVenueDetails;

