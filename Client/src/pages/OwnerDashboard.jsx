import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    blockDates,
    createVenueWithImages,
    deleteVenue,
    getAllVenues,
    unblockDate,
} from '../services/venueService';
import { getVenueBookings, updateBookingStatus } from '../services/bookingService';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ChatModal from '../components/ChatModal';
import './OwnerDashboard.css';

const VENUE_TYPES = [
    'Marriage Hall',
    'Party Hall',
    'Conference Room',
    'Shop/Retail',
    'Farmhouse',
    'Rooftop',
    'Studio',
    'Theatre',
    'Sports Ground',
    'Banquet Hall',
    'Resort',
    'Turf',
    'Swimming Pool',
    'Auditorium',
    'Warehouse',
    'Photoshoot Studio',
    'Terrace',
    'Community Hall',
];

const AMENITIES = [
    'AC',
    'Parking',
    'WiFi',
    'Stage',
    'Sound System',
    'Projector',
    'Catering Kitchen',
    'Generator',
    'Washrooms',
    'Changing Rooms',
    'Security',
    'Swimming Pool',
    'Floodlights',
    'Unlimited Food',
];

const STATUS_META = {
    approved: { label: 'Confirmed', tone: 'confirmed' },
    confirmed: { label: 'Confirmed', tone: 'confirmed' },
    expired: { label: 'Expired', tone: 'expired' },
    payment_pending: { label: 'Payment Pending', tone: 'payment' },
    pending: { label: 'Pending', tone: 'pending' },
    rejected: { label: 'Rejected', tone: 'rejected' },
};

const createDefaultFormData = () => ({
    name: '',
    description: '',
    type: VENUE_TYPES[0],
    location: { address: '', city: 'Bangalore', pincode: '' },
    capacity: '',
    pricePerHour: '',
    pricePerDay: '',
    amenities: [],
    bookingType: 'manual',
});

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) {
        return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--';
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const toTimeAgo = (value) => {
    if (!value) {
        return 'Recently';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Recently';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
        return 'Just now';
    }
    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

const OwnerDashboard = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const ownerId = user?.id || user?._id || '';

    const dashboardRef = useRef(null);
    const heroRef = useRef(null);
    const previewUrlsRef = useRef([]);

    const [venues, setVenues] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [calendarVenueId, setCalendarVenueId] = useState('');
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState(createDefaultFormData());
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const [chatOpen, setChatOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState(null);
    const [chatBookingId, setChatBookingId] = useState(null);

    const clearImagePreviews = useCallback(() => {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = [];
        setImages([]);
        setImagePreviews([]);
    }, []);

    const resetVenueForm = useCallback(() => {
        setFormData(createDefaultFormData());
        clearImagePreviews();
    }, [clearImagePreviews]);

    const fetchBookingsForVenue = useCallback(async (venueId) => {
        if (!venueId) {
            setBookings([]);
            return;
        }

        setBookingsLoading(true);
        try {
            const data = await getVenueBookings(venueId);
            const venueBookings = Array.isArray(data?.bookings) ? data.bookings : [];
            venueBookings.sort((a, b) => (b.bidAmount || b.totalPrice || 0) - (a.bidAmount || a.totalPrice || 0));
            setBookings(venueBookings);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load bookings.');
            setBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    }, []);

    const fetchOwnerVenues = useCallback(
        async (showLoader = false) => {
            if (!ownerId) {
                setVenues([]);
                setLoading(false);
                return;
            }

            if (showLoader) {
                setLoading(true);
            }

            try {
                const data = await getAllVenues();
                const allVenues = Array.isArray(data?.venues) ? data.venues : [];
                const ownedVenues = allVenues.filter((venue) => {
                    const venueOwnerId = venue?.owner?._id || venue?.owner?.id || venue?.owner;
                    return String(venueOwnerId) === String(ownerId);
                });

                setVenues(ownedVenues);

                setSelectedVenueId((current) => {
                    if (!ownedVenues.length) {
                        return '';
                    }

                    return ownedVenues.some((venue) => venue._id === current)
                        ? current
                        : ownedVenues[0]._id;
                });

                setCalendarVenueId((current) => {
                    if (!ownedVenues.length) {
                        return '';
                    }

                    return ownedVenues.some((venue) => venue._id === current)
                        ? current
                        : ownedVenues[0]._id;
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load venues.');
            } finally {
                if (showLoader) {
                    setLoading(false);
                }
            }
        },
        [ownerId]
    );

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        void fetchOwnerVenues(true);
    }, [fetchOwnerVenues, navigate, user]);

    useEffect(() => {
        if (!selectedVenueId) {
            setBookings([]);
            return;
        }

        void fetchBookingsForVenue(selectedVenueId);
    }, [fetchBookingsForVenue, selectedVenueId]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.od-nav', {
                y: -18,
                opacity: 0,
                duration: 0.65,
                ease: 'power3.out',
            });

            gsap.from('.od-hero-copy > *', {
                y: 24,
                opacity: 0,
                duration: 0.65,
                stagger: 0.12,
                ease: 'power2.out',
                delay: 0.1,
            });

            gsap.from('.od-primary-btn', {
                scale: 0.95,
                opacity: 0,
                duration: 0.45,
                delay: 0.35,
                ease: 'power2.out',
            });

            gsap.from('.od-stat-card', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power2.out',
                delay: 0.35,
            });

            gsap.from('.od-section', {
                y: 24,
                opacity: 0,
                duration: 0.55,
                stagger: 0.12,
                ease: 'power2.out',
                delay: 0.45,
            });

            gsap.to('.od-orb', {
                x: 12,
                y: -16,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.4,
            });
        }, dashboardRef);

        return () => ctx.revert();
    }, []);

    const activityItems = useMemo(() => {
        return bookings
            .slice()
            .sort((a, b) => {
                const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
                const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
                return bDate - aDate;
            })
            .slice(0, 6)
            .map((booking) => {
                const status = STATUS_META[booking.status] || {
                    label: booking.status || 'Update',
                    tone: 'default',
                };

                const userName = booking.booker?.name || 'Booker';

                return {
                    id: booking._id,
                    tone: status.tone,
                    title: `${userName}: ${status.label}`,
                    subtitle: toTimeAgo(booking.updatedAt || booking.createdAt),
                };
            });
    }, [bookings]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (bookings.length) {
                gsap.from('.od-booking-row', {
                    y: 16,
                    opacity: 0,
                    duration: 0.45,
                    stagger: 0.05,
                    ease: 'power2.out',
                });
            }

            if (activityItems.length) {
                gsap.from('.od-activity-item', {
                    x: 16,
                    opacity: 0,
                    duration: 0.4,
                    stagger: 0.05,
                    ease: 'power2.out',
                });
            }
        }, dashboardRef);

        return () => ctx.revert();
    }, [activityItems.length, bookings.length, selectedVenueId]);

    useEffect(() => {
        const heroElement = heroRef.current;
        if (!heroElement) {
            return undefined;
        }

        const handleMouseMove = (event) => {
            const rect = heroElement.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            gsap.to(heroElement, {
                backgroundPosition: `${50 + x * 8}% ${50 + y * 10}%`,
                duration: 0.9,
                ease: 'power2.out',
                overwrite: true,
            });
        };

        const handleMouseLeave = () => {
            gsap.to(heroElement, {
                backgroundPosition: '50% 50%',
                duration: 1,
                ease: 'power2.out',
            });
        };

        heroElement.addEventListener('mousemove', handleMouseMove);
        heroElement.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            heroElement.removeEventListener('mousemove', handleMouseMove);
            heroElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    useEffect(() => {
        if (!error && !success) {
            return undefined;
        }

        const timerId = setTimeout(() => {
            setError('');
            setSuccess('');
        }, 4200);

        return () => clearTimeout(timerId);
    }, [error, success]);

    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
            previewUrlsRef.current = [];
        };
    }, []);

    const selectedVenue = useMemo(
        () => venues.find((venue) => venue._id === selectedVenueId) || null,
        [selectedVenueId, venues]
    );

    const calendarVenue = useMemo(
        () => venues.find((venue) => venue._id === calendarVenueId) || null,
        [calendarVenueId, venues]
    );

    const filteredBookings = useMemo(() => {
        if (!searchQuery.trim()) {
            return bookings;
        }

        const query = searchQuery.trim().toLowerCase();
        return bookings.filter((booking) => {
            const record = [
                booking.booker?.name,
                booking.booker?.email,
                booking.status,
                booking.startTime,
                booking.endTime,
                String(booking.bidAmount || booking.totalPrice || ''),
                formatDate(booking.eventDate),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return record.includes(query);
        });
    }, [bookings, searchQuery]);

    const upcomingBookings = useMemo(() => {
        const now = new Date().setHours(0, 0, 0, 0);
        return bookings.filter((booking) => {
            const eventTime = new Date(booking.eventDate).getTime();
            const activeStatuses = ['pending', 'payment_pending', 'confirmed'];
            return activeStatuses.includes(booking.status) && eventTime >= now;
        }).length;
    }, [bookings]);

    const totalRevenue = useMemo(() => {
        return bookings
            .filter((booking) => booking.status === 'confirmed')
            .reduce((sum, booking) => sum + (booking.bidAmount || booking.totalPrice || 0), 0);
    }, [bookings]);

    const pendingRequests = useMemo(
        () => bookings.filter((booking) => booking.status === 'pending').length,
        [bookings]
    );

    const blockedDatesSorted = useMemo(() => {
        if (!calendarVenue?.blockedDates) {
            return [];
        }

        return [...calendarVenue.blockedDates].sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );
    }, [calendarVenue]);

    const stats = useMemo(
        () => [
            { icon: 'VN', label: 'Total Venues', value: venues.length },
            { icon: 'BK', label: 'Upcoming Bookings', value: upcomingBookings },
            { icon: 'RV', label: 'Total Revenue', value: `INR ${formatCurrency(totalRevenue)}` },
            { icon: 'RQ', label: 'Pending Requests', value: pendingRequests },
        ],
        [pendingRequests, totalRevenue, upcomingBookings, venues.length]
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const jumpToSection = (sectionId) => {
        const target = document.getElementById(sectionId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const openChatForBooking = (booking) => {
        if (!booking?.booker?._id) {
            return;
        }

        setChatTarget({
            id: booking.booker._id,
            name: booking.booker.name || 'Booker',
            role: 'booker',
        });
        setChatBookingId(booking._id);
        setChatOpen(true);
    };

    const handleStatusUpdate = async (bookingId, nextStatus) => {
        try {
            await updateBookingStatus(bookingId, nextStatus);
            setSuccess(
                nextStatus === 'approved'
                    ? 'Booking approved and payment window started.'
                    : 'Booking rejected successfully.'
            );
            await fetchBookingsForVenue(selectedVenueId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update booking status.');
        }
    };

    const handleDeleteVenue = async (venueId) => {
        const confirmDelete = window.confirm('Delete this venue permanently?');
        if (!confirmDelete) {
            return;
        }

        try {
            await deleteVenue(venueId);
            setSuccess('Venue deleted successfully.');
            await fetchOwnerVenues();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete venue.');
        }
    };

    const handleCalendarDateClick = async (dateValue) => {
        if (!calendarVenueId) {
            return;
        }

        const activeVenue = venues.find((venue) => venue._id === calendarVenueId);
        const blockedSet = new Set(
            (activeVenue?.blockedDates || []).map((date) => new Date(date).toISOString().split('T')[0])
        );

        try {
            let response;
            if (blockedSet.has(dateValue)) {
                response = await unblockDate(calendarVenueId, dateValue);
                setSuccess('Date unblocked.');
            } else {
                response = await blockDates(calendarVenueId, [dateValue]);
                setSuccess('Date blocked.');
            }

            const updatedBlockedDates = response?.blockedDates || [];
            setVenues((current) =>
                current.map((venue) =>
                    venue._id === calendarVenueId
                        ? { ...venue, blockedDates: updatedBlockedDates }
                        : venue
                )
            );
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update calendar date.');
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        if (name.startsWith('location.')) {
            const locationKey = name.split('.')[1];
            setFormData((current) => ({
                ...current,
                location: {
                    ...current.location,
                    [locationKey]: value,
                },
            }));
            return;
        }

        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleAmenityToggle = (amenity) => {
        setFormData((current) => ({
            ...current,
            amenities: current.amenities.includes(amenity)
                ? current.amenities.filter((item) => item !== amenity)
                : [...current.amenities, amenity],
        }));
    };

    const handleImageChange = (event) => {
        const files = Array.from(event.target.files || []);

        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        const previews = files.map((file) => URL.createObjectURL(file));

        previewUrlsRef.current = previews;
        setImages(files);
        setImagePreviews(previews);
    };

    const closeVenueModal = () => {
        setShowForm(false);
        resetVenueForm();
    };

    const handleVenueCreate = async (event) => {
        event.preventDefault();
        setFormLoading(true);

        try {
            const payload = new FormData();
            payload.append('name', formData.name.trim());
            payload.append('description', formData.description.trim());
            payload.append('type', formData.type);
            payload.append('capacity', formData.capacity);
            payload.append('pricePerHour', formData.pricePerHour || 0);
            payload.append('pricePerDay', formData.pricePerDay || 0);
            payload.append('bookingType', formData.bookingType);
            payload.append('location', JSON.stringify(formData.location));
            payload.append('amenities', JSON.stringify(formData.amenities));

            images.forEach((imageFile) => payload.append('images', imageFile));

            await createVenueWithImages(payload);
            setSuccess('Venue created and submitted for admin approval.');
            closeVenueModal();
            await fetchOwnerVenues();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create venue.');
        } finally {
            setFormLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    if (loading) {
        return (
            <div className="owner-dashboard owner-loading-state">
                <div className="od-loading-card">
                    <div className="od-loader" />
                    <p>Loading owner dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="owner-dashboard" ref={dashboardRef}>
            <header className="od-nav">
                <button className="od-brand" onClick={() => navigate('/')}>
                    <span className="od-brand-mark">BYE</span>
                    <span className="od-brand-text">BookYourEvent</span>
                </button>

                <nav className="od-nav-links" aria-label="Owner sections">
                    <button className="od-nav-link" onClick={() => jumpToSection('od-venues-section')}>
                        My Venues
                    </button>
                    <button className="od-nav-link" onClick={() => jumpToSection('od-bookings-section')}>
                        Bookings
                    </button>
                    <button className="od-nav-link" onClick={() => jumpToSection('od-availability-section')}>
                        Availability
                    </button>
                    <button className="od-nav-link" onClick={() => jumpToSection('od-bookings-section')}>
                        Analytics
                    </button>
                    <button className="od-nav-link" onClick={() => jumpToSection('od-bookings-section')}>
                        Messages
                    </button>
                </nav>

                <div className="od-nav-tools">
                    <label className="od-search-shell" htmlFor="owner-search-input">
                        <span className="od-search-label">Search</span>
                        <input
                            id="owner-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search bookings"
                        />
                    </label>

                    <div className="od-user-chip">
                        <span className="od-avatar">{(user?.name || 'O').charAt(0).toUpperCase()}</span>
                        <span className="od-user-name">{user?.name || 'Owner'}</span>
                    </div>

                    <button className="od-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="od-main">
                {(error || success) && (
                    <div className="od-toast-stack">
                        {error && <p className="od-toast od-toast-error">{error}</p>}
                        {success && <p className="od-toast od-toast-success">{success}</p>}
                    </div>
                )}

                <section className="od-hero od-section" ref={heroRef}>
                    <span className="od-orb od-orb-a" />
                    <span className="od-orb od-orb-b" />
                    <span className="od-orb od-orb-c" />

                    <div className="od-hero-copy">
                        <p className="od-tag">OWNER PORTAL</p>
                        <h1>Owner Dashboard</h1>
                        <p>Manage venues, bookings and revenue from one workspace.</p>
                    </div>

                    <button className="od-primary-btn" onClick={() => setShowForm(true)}>
                        Add New Venue
                    </button>
                </section>

                <section className="od-stats-grid">
                    {stats.map((item) => (
                        <article key={item.label} className="od-stat-card">
                            <span className="od-stat-icon">{item.icon}</span>
                            <div>
                                <p className="od-stat-label">{item.label}</p>
                                <p className="od-stat-value">{item.value}</p>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="od-section od-booking-section" id="od-bookings-section">
                    <div className="od-section-header">
                        <h2>Manage Bookings and Bids</h2>
                        <p>
                            Bids are ranked highest first. Approve top bids quickly and keep communication
                            moving.
                        </p>
                    </div>

                    <div className="od-chip-row">
                        {venues.map((venue) => {
                            const active = selectedVenueId === venue._id;
                            return (
                                <button
                                    key={venue._id}
                                    className={`od-chip ${active ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedVenueId(venue._id);
                                        setCalendarVenueId(venue._id);
                                    }}
                                >
                                    {venue.name}
                                </button>
                            );
                        })}
                    </div>

                    <div className="od-booking-layout">
                        <div className="od-table-panel">
                            <div className="od-table-head">
                                <h3>Booking Table</h3>
                                <p>{selectedVenue ? selectedVenue.name : 'Select a venue to view bookings'}</p>
                            </div>

                            <div className="od-table-scroll">
                                <table className="od-table">
                                    <thead>
                                        <tr>
                                            <th>Event Name</th>
                                            <th>Venue</th>
                                            <th>Date</th>
                                            <th>Bid Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookingsLoading && (
                                            <tr>
                                                <td colSpan={6} className="od-empty-row">
                                                    Loading bookings...
                                                </td>
                                            </tr>
                                        )}

                                        {!bookingsLoading && filteredBookings.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="od-empty-row">
                                                    {selectedVenueId
                                                        ? 'No bookings found for this venue.'
                                                        : 'Create a venue and start receiving bookings.'}
                                                </td>
                                            </tr>
                                        )}

                                        {!bookingsLoading &&
                                            filteredBookings.map((booking) => {
                                                const status = STATUS_META[booking.status] || {
                                                    label: booking.status || 'Unknown',
                                                    tone: 'default',
                                                };

                                                return (
                                                    <tr className="od-booking-row" key={booking._id}>
                                                        <td>{booking.booker?.name || 'Event Booking'}</td>
                                                        <td>{selectedVenue?.name || booking.venue?.name || '--'}</td>
                                                        <td>{formatDate(booking.eventDate)}</td>
                                                        <td>
                                                            INR {formatCurrency(booking.bidAmount || booking.totalPrice || 0)}
                                                        </td>
                                                        <td>
                                                            <span className={`od-status od-status-${status.tone}`}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="od-row-actions">
                                                                {booking.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            className="od-action-btn approve"
                                                                            onClick={() =>
                                                                                handleStatusUpdate(
                                                                                    booking._id,
                                                                                    'approved'
                                                                                )
                                                                            }
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            className="od-action-btn reject"
                                                                            onClick={() =>
                                                                                handleStatusUpdate(
                                                                                    booking._id,
                                                                                    'rejected'
                                                                                )
                                                                            }
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {booking.booker?._id && (
                                                                    <button
                                                                        className="od-action-btn message"
                                                                        onClick={() => openChatForBooking(booking)}
                                                                    >
                                                                        {t('chat.withBooker')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <aside className="od-activity-panel">
                            <h3>Recent Activity</h3>
                            {activityItems.length === 0 && (
                                <p className="od-empty-text">No recent activity for this venue yet.</p>
                            )}

                            {activityItems.length > 0 && (
                                <ul className="od-activity-list">
                                    {activityItems.map((item) => (
                                        <li key={item.id} className="od-activity-item">
                                            <span className={`od-activity-dot ${item.tone}`} />
                                            <div>
                                                <p>{item.title}</p>
                                                <span>{item.subtitle}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </aside>
                    </div>
                </section>

                <section className="od-section od-bottom-grid">
                    <div className="od-panel" id="od-venues-section">
                        <div className="od-panel-head">
                            <h3>My Venues</h3>
                            <span>{venues.length} listed</span>
                        </div>

                        {venues.length === 0 && (
                            <p className="od-empty-text">No venues yet. Add your first venue to start.</p>
                        )}

                        {venues.length > 0 && (
                            <div className="od-venue-grid">
                                {venues.map((venue) => {
                                    const active = selectedVenueId === venue._id;
                                    return (
                                        <article
                                            className={`od-venue-card ${active ? 'active' : ''}`}
                                            key={venue._id}
                                        >
                                            <div className="od-venue-cover">
                                                {venue.images?.[0] ? (
                                                    <img src={venue.images[0]} alt={venue.name} />
                                                ) : (
                                                    <span>{venue.name.slice(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="od-venue-content">
                                                <p className="od-venue-name">{venue.name}</p>
                                                <p className="od-venue-meta">
                                                    {venue.location?.city || 'City'}, Cap {venue.capacity || '--'}
                                                </p>
                                                <div className="od-venue-actions">
                                                    <button
                                                        className="od-mini-btn"
                                                        onClick={() => setSelectedVenueId(venue._id)}
                                                    >
                                                        View bookings
                                                    </button>
                                                    <button
                                                        className="od-mini-btn danger"
                                                        onClick={() => handleDeleteVenue(venue._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="od-panel" id="od-availability-section">
                        <div className="od-panel-head">
                            <h3>Availability Calendar</h3>
                            <span>{calendarVenue ? calendarVenue.name : 'No venue selected'}</span>
                        </div>

                        {venues.length > 0 && (
                            <select
                                className="od-select"
                                value={calendarVenueId}
                                onChange={(event) => setCalendarVenueId(event.target.value)}
                            >
                                {venues.map((venue) => (
                                    <option key={venue._id} value={venue._id}>
                                        {venue.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {calendarVenue ? (
                            <div className="od-calendar-wrap">
                                <AvailabilityCalendar
                                    blockedDates={calendarVenue.blockedDates || []}
                                    onDateClick={handleCalendarDateClick}
                                    mode="owner"
                                />
                            </div>
                        ) : (
                            <p className="od-empty-text">Select a venue to manage blocked dates.</p>
                        )}

                        {calendarVenue && (
                            <div className="od-blocked-list">
                                <h4>Blocked Dates</h4>
                                {blockedDatesSorted.length === 0 && (
                                    <p className="od-empty-text">No blocked dates yet.</p>
                                )}
                                {blockedDatesSorted.length > 0 && (
                                    <div className="od-blocked-grid">
                                        {blockedDatesSorted.map((date) => {
                                            const dateKey = new Date(date).toISOString();
                                            return (
                                                <div key={dateKey} className="od-block-item">
                                                    <span>{formatDate(date)}</span>
                                                    <button
                                                        onClick={() =>
                                                            handleCalendarDateClick(
                                                                new Date(date).toISOString().split('T')[0]
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {showForm && (
                <div className="od-modal-backdrop" onClick={closeVenueModal}>
                    <div className="od-modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="od-modal-head">
                            <h3>Add New Venue</h3>
                            <button className="od-modal-close" onClick={closeVenueModal}>
                                x
                            </button>
                        </div>

                        <form className="od-form" onSubmit={handleVenueCreate}>
                            <div className="od-form-grid">
                                <label>
                                    Venue Name
                                    <input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Venue Type
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {VENUE_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Capacity
                                    <input
                                        name="capacity"
                                        type="number"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Booking Type
                                    <select
                                        name="bookingType"
                                        value={formData.bookingType}
                                        onChange={handleInputChange}
                                    >
                                        <option value="manual">Manual Approval</option>
                                        <option value="instant">Instant Booking</option>
                                    </select>
                                </label>

                                <label>
                                    Price per Hour
                                    <input
                                        name="pricePerHour"
                                        type="number"
                                        value={formData.pricePerHour}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Price per Day
                                    <input
                                        name="pricePerDay"
                                        type="number"
                                        value={formData.pricePerDay}
                                        onChange={handleInputChange}
                                    />
                                </label>

                                <label className="od-form-span-2">
                                    Address
                                    <input
                                        name="location.address"
                                        value={formData.location.address}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>

                                <label>
                                    City
                                    <input
                                        name="location.city"
                                        value={formData.location.city}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Pincode
                                    <input
                                        name="location.pincode"
                                        value={formData.location.pincode}
                                        onChange={handleInputChange}
                                    />
                                </label>

                                <label className="od-form-span-2">
                                    Description
                                    <textarea
                                        name="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                            </div>

                            <div className="od-amenities-wrap">
                                <p>Select Amenities</p>
                                <div className="od-amenities-grid">
                                    {AMENITIES.map((amenity) => {
                                        const active = formData.amenities.includes(amenity);
                                        return (
                                            <button
                                                type="button"
                                                key={amenity}
                                                className={`od-amenity-option ${active ? 'active' : ''}`}
                                                onClick={() => handleAmenityToggle(amenity)}
                                            >
                                                {amenity}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <label className="od-file-field">
                                Venue Images
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                            </label>

                            {imagePreviews.length > 0 && (
                                <div className="od-preview-strip">
                                    {imagePreviews.map((preview) => (
                                        <img key={preview} src={preview} alt="Venue preview" />
                                    ))}
                                </div>
                            )}

                            <div className="od-form-actions">
                                <button type="button" className="od-secondary-btn" onClick={closeVenueModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="od-primary-btn small" disabled={formLoading}>
                                    {formLoading ? 'Creating...' : 'Create Venue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {chatOpen && chatTarget && (
                <ChatModal
                    isOpen={chatOpen}
                    otherUser={chatTarget}
                    bookingId={chatBookingId}
                    onClose={() => {
                        setChatOpen(false);
                        setChatTarget(null);
                        setChatBookingId(null);
                    }}
                />
            )}

            <footer className="od-footer-note">Built for faster owner decisions and smoother bookings.</footer>
        </div>
    );
};

export default OwnerDashboard;
