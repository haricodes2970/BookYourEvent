import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllVenues } from '../services/venueService';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const useDark = () => {
    const [dark, setDark] = useState(false);
    return { dark, toggle: () => setDark(d => !d) };
};

const ThemeToggle = ({ dark, toggle }) => (
    <motion.button onClick={toggle} whileTap={{ scale: 0.95 }}
        style={{
            width: 60, height: 30, borderRadius: 999, padding: 3,
            display: 'flex', alignItems: 'center', cursor: 'pointer',
            border: 'none', flexShrink: 0,
            background: dark ? '#2a2a2a' : '#f1ede5',
            boxShadow: dark ? '0 0 10px rgba(212,175,55,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'background 0.35s ease',
        }}>
        <motion.div layout animate={{ x: dark ? 30 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                width: 24, height: 24, borderRadius: '50%',
                background: dark ? '#D4AF37' : '#C8A45B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>{dark ? '🌙' : '☀️'}</motion.div>
    </motion.button>
);

const VENUE_TYPES = [
    'All', 'Marriage Hall', 'Party Hall', 'Conference Room', 'Farmhouse',
    'Rooftop', 'Studio', 'Banquet Hall', 'Resort', 'Turf', 'Auditorium',
    'Warehouse', 'Photoshoot Studio', 'Terrace', 'Community Hall'
];

const venueEmoji = (type) => ({
    'Resort': '🏖️', 'Rooftop': '🌆', 'Farmhouse': '🌾',
    'Marriage Hall': '💒', 'Party Hall': '🎉', 'Conference Room': '🏢',
    'Banquet Hall': '🍽️', 'Turf': '⚽', 'Studio': '🎨',
    'Auditorium': '🎭', 'Terrace': '🌅', 'Warehouse': '🏗️',
    'Photoshoot Studio': '📸', 'Community Hall': '🏘️',
}[type] || '🏛️');

const VenueCard = ({ venue, dark, onClick, index, inView }) => {
    const T = {
        card:    dark ? '#1E1E1E' : '#FFFFFF',
        border:  dark ? '#333333' : '#E6E2D9',
        name:    dark ? '#F3F3F3' : '#1F1F1F',
        sub:     dark ? '#9a9a9a' : '#6b7280',
        tag:     dark ? 'rgba(212,175,55,0.15)' : 'rgba(200,164,91,0.12)',
        tagText: dark ? '#D4AF37' : '#C8A45B',
        badge:   dark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.92)',
        badgeText: dark ? '#D4AF37' : '#C8A45B',
        btn:     dark ? 'rgba(212,175,55,0.12)' : 'rgba(200,164,91,0.1)',
        btnBorder: dark ? 'rgba(212,175,55,0.4)' : 'rgba(200,164,91,0.4)',
        btnText: dark ? '#D4AF37' : '#C8A45B',
        divider: dark ? '#2a2a2a' : '#f0ece4',
    };
    const stars = venue.rating ? Math.round(venue.rating * 2) / 2 : 4.5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: 'easeOut' }}
            whileHover={{ y: -8, boxShadow: dark ? '0 24px 50px rgba(212,175,55,0.12)' : '0 24px 50px rgba(200,164,91,0.18)' }}
            onClick={onClick}
            style={{
                background: T.card, borderRadius: 18,
                border: `1px solid ${T.border}`,
                overflow: 'hidden', cursor: 'pointer',
                boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.07)',
                transition: 'box-shadow 0.3s ease',
            }}>
            <div style={{ position: 'relative', height: 175, overflow: 'hidden',
                background: dark ? 'linear-gradient(135deg,#1a2a1a,#2a1a0a)' : 'linear-gradient(135deg,#e8dfc8,#d4c8a8)' }}>
                {venue.images?.length > 0 ? (
                    <motion.img src={venue.images[0]} alt={venue.name}
                        whileHover={{ scale: 1.08 }} transition={{ duration: 0.4 }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
                        {venueEmoji(venue.type)}
                    </div>
                )}
                <div style={{ position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }}/>
                <div style={{ position: 'absolute', top: 10, left: 10, background: T.badge,
                    backdropFilter: 'blur(8px)', borderRadius: 50, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700, color: T.badgeText, border: `1px solid ${T.btnBorder}` }}>
                    {venue.type}
                </div>
                {venue.bookingType === 'instant' && (
                    <div style={{ position: 'absolute', top: 10, right: 10,
                        background: dark ? 'rgba(212,175,55,0.2)' : 'rgba(200,164,91,0.15)',
                        backdropFilter: 'blur(8px)', borderRadius: 50, padding: '3px 10px',
                        fontSize: 11, fontWeight: 700, color: T.badgeText, border: `1px solid ${T.btnBorder}` }}>
                        ⚡ Instant
                    </div>
                )}
                <div style={{ position: 'absolute', bottom: 10, left: 12,
                    display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#D4AF37', fontSize: 13 }}>
                        {'★'.repeat(Math.floor(stars))}{stars % 1 ? '½' : ''}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600 }}>
                        {stars.toFixed(1)}
                    </span>
                </div>
            </div>
            <div style={{ padding: '14px 16px 16px' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800,
                    color: T.name, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {venue.name}
                </h3>
                <p style={{ fontSize: 12, color: T.sub, marginBottom: 12,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    📍 {venue.location?.address}, {venue.location?.city}
                </p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {['AC Hall', 'Parking', venue.type === 'Resort' ? 'Pool' : 'Stage'].map((tag, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 50,
                            background: T.tag, color: T.tagText, fontWeight: 600 }}>{tag}</span>
                    ))}
                </div>
                <div style={{ borderTop: `1px solid ${T.divider}`, paddingTop: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17,
                            fontWeight: 900, color: dark ? '#D4AF37' : '#C8A45B' }}>
                            ₹{venue.pricePerHour?.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: 11, color: T.sub, fontWeight: 500 }}>/hr</span>
                    </div>
                    <motion.button whileHover={{ background: 'linear-gradient(135deg,#C8A45B,#E3C67A)', color: 'white' }}
                        whileTap={{ scale: 0.96 }}
                        onClick={e => { e.stopPropagation(); onClick(); }}
                        style={{ padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                            background: T.btn, border: `1.5px solid ${T.btnBorder}`,
                            color: T.btnText, cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.2s ease' }}>
                        View Details
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

const BookerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { dark, toggle } = useDark();

    const [venues, setVenues]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [searchQuery, setSearchQuery]     = useState('');
    const [selectedType, setSelectedType]   = useState('All');
    const [selectedCity, setSelectedCity]   = useState('All');
    const [maxPrice, setMaxPrice]           = useState('');
    const [bookingTypeFilter, setBookingTypeFilter] = useState('All');
    const [showFilters, setShowFilters]     = useState(false);
    const [profileOpen, setProfileOpen]     = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const gridRef  = useRef(null);
    const gridView = useInView(gridRef, { once: false, amount: 0.05 });

    useEffect(() => {
        getAllVenues()
            .then(data => setVenues(data.venues))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };
    const cities = ['All', ...new Set(venues.map(v => v.location?.city).filter(Boolean))];
    const activeFilters = [selectedType, selectedCity, maxPrice, bookingTypeFilter].filter(f => f && f !== 'All').length;

    const filteredVenues = venues.filter(v => {
        const q = searchQuery.toLowerCase();
        return (
            (v.name.toLowerCase().includes(q) ||
             v.type.toLowerCase().includes(q) ||
             v.location?.city?.toLowerCase().includes(q)) &&
            (selectedType === 'All' || v.type === selectedType) &&
            (selectedCity === 'All' || v.location?.city === selectedCity) &&
            (!maxPrice || v.pricePerHour <= parseInt(maxPrice)) &&
            (bookingTypeFilter === 'All' || v.bookingType === bookingTypeFilter)
        );
    });

    const clearFilters = () => {
        setSelectedType('All'); setSelectedCity('All');
        setMaxPrice(''); setBookingTypeFilter('All'); setSearchQuery('');
    };

    const T = {
        bg:        dark ? '#121212' : '#F8F6F2',
        navBg:     dark ? 'rgba(18,18,18,0.92)' : 'rgba(248,246,242,0.92)',
        navBorder: dark ? '#2a2a2a' : '#E6E2D9',
        card:      dark ? '#1E1E1E' : '#FFFFFF',
        border:    dark ? '#333333' : '#E6E2D9',
        title:     dark ? '#F3F3F3' : '#1F1F1F',
        sub:       dark ? '#9a9a9a' : '#6b7280',
        gold:      dark ? '#D4AF37' : '#C8A45B',
        goldLight: dark ? 'rgba(212,175,55,0.12)' : 'rgba(200,164,91,0.1)',
        goldBorder:dark ? 'rgba(212,175,55,0.35)' : 'rgba(200,164,91,0.35)',
        input:     dark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
        filterBg:  dark ? '#1A1A1A' : '#FFFFFF',
        shadow:    dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.08)',
    };

    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');
                ::-webkit-scrollbar { width: 5px; height: 5px; }
                ::-webkit-scrollbar-track { background: ${dark ? '#1a1a1a' : '#f1ede5'}; }
                ::-webkit-scrollbar-thumb { background: #C8A45B; border-radius: 10px; }
                select { appearance: none; }
                input[type=range] { accent-color: #C8A45B; }
                input[type=radio] { accent-color: #C8A45B; }
                * { box-sizing: border-box; }
            `}</style>

            {/* ── NAVBAR ── */}
            <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'sticky', top: 0, zIndex: 100,
                    background: T.navBg, backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${T.navBorder}`,
                    padding: '0 16px',
                    boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

                    {/* Logo */}
                    <motion.div whileHover={{ scale: 1.05 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={() => navigate('/')}>
                        <img src="/logo.png" alt="BYE"
                            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover',
                                boxShadow: `0 0 0 2px ${T.gold}` }}
                            onError={e => { e.target.style.display='none'; }}/>
                        <span style={{ fontFamily:"'Playfair Display', serif", fontWeight: 700,
                            fontSize: 14, color: T.title }}>BYE</span>
                    </motion.div>

                    {/* Desktop nav links */}
                    <div style={{ display: 'flex', gap: 4 }} className="hidden-mobile">
                        {[
                            { label: 'Browse', active: true, action: null },
                            { label: 'My Bookings', active: false, action: () => navigate('/booker/my-bookings') },
                            { label: 'About', active: false, action: () => navigate('/about') },
                            { label: 'Help', active: false, action: () => navigate('/help') },
                        ].map((item, i) => (
                            <motion.button key={i} whileHover={{ color: T.gold }}
                                onClick={item.action || undefined}
                                style={{ padding: '6px 12px', borderRadius: 8,
                                    background: item.active ? T.goldLight : 'transparent',
                                    border: item.active ? `1px solid ${T.goldBorder}` : '1px solid transparent',
                                    color: item.active ? T.gold : T.sub,
                                    fontSize: 13, fontWeight: item.active ? 700 : 500,
                                    cursor: 'pointer', fontFamily: 'inherit' }}>
                                {item.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Desktop search */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                        background: T.input, borderRadius: 50, padding: '7px 16px',
                        border: `1px solid ${T.border}`, width: 220 }}
                        className="hidden-mobile">
                        <span style={{ color: T.gold, fontSize: 14 }}>🔍</span>
                        <input type="text" placeholder="Search venues..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            style={{ background: 'transparent', border: 'none', outline: 'none',
                                fontSize: 13, color: T.title, width: '100%', fontFamily: 'inherit' }}/>
                    </div>

                    {/* Right controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ThemeToggle dark={dark} toggle={toggle}/>

                        {/* Profile — desktop */}
                        <div style={{ position: 'relative' }} className="hidden-mobile">
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setProfileOpen(o => !o)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '6px 12px 6px 8px', borderRadius: 50,
                                    background: T.goldLight, border: `1.5px solid ${T.goldBorder}`,
                                    cursor: 'pointer', fontFamily: 'inherit' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%',
                                    background: `linear-gradient(135deg,${dark?'#D4AF37':'#C8A45B'},#E3C67A)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: 12, fontWeight: 800 }}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: T.title }}>
                                    {user?.name?.split(' ')[0] || 'User'}
                                </span>
                                <span style={{ fontSize: 10, color: T.sub }}>▼</span>
                            </motion.button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ position: 'absolute', right: 0, top: '110%',
                                            background: T.filterBg, border: `1px solid ${T.border}`,
                                            borderRadius: 14, padding: '8px 0',
                                            boxShadow: T.shadow, minWidth: 180, zIndex: 200 }}>
                                        {[
                                            { label: '📋 My Bookings', action: () => navigate('/booker/my-bookings') },
                                            { label: '🚪 Log Out', action: handleLogout, danger: true },
                                        ].map((item, i) => (
                                            <motion.button key={i} whileHover={{ background: T.goldLight }}
                                                onClick={() => { item.action(); setProfileOpen(false); }}
                                                style={{ width: '100%', padding: '10px 18px', textAlign: 'left',
                                                    background: 'transparent', border: 'none',
                                                    color: item.danger ? '#ef4444' : T.title,
                                                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                                    fontFamily: 'inherit',
                                                    borderTop: i === 1 ? `1px solid ${T.border}` : 'none' }}>
                                                {item.label}
                                            </motion.button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile hamburger */}
                        <motion.button whileTap={{ scale: 0.95 }}
                            onClick={() => setMobileMenuOpen(o => !o)}
                            className="show-mobile"
                            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.border}`,
                                background: T.card, display: 'none', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>
                            {mobileMenuOpen ? '✕' : '☰'}
                        </motion.button>
                    </div>
                </div>

                {/* Mobile search bar */}
                <div className="show-mobile" style={{ display: 'none', padding: '8px 0 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                        background: T.input, borderRadius: 50, padding: '8px 16px',
                        border: `1px solid ${T.border}` }}>
                        <span style={{ color: T.gold, fontSize: 14 }}>🔍</span>
                        <input type="text" placeholder="Search venues..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            style={{ background: 'transparent', border: 'none', outline: 'none',
                                fontSize: 13, color: T.title, width: '100%', fontFamily: 'inherit' }}/>
                    </div>
                </div>

                {/* Mobile menu dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                            className="show-mobile"
                            style={{ overflow: 'hidden', borderTop: `1px solid ${T.border}`, display: 'none' }}>
                            <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {[
                                    { label: '🏛️ Browse Venues', action: () => {} },
                                    { label: '📋 My Bookings', action: () => navigate('/booker/my-bookings') },
                                    { label: 'ℹ️ About', action: () => navigate('/about') },
                                    { label: '❓ Help & Contact', action: () => navigate('/help') },
                                    { label: '🚪 Log Out', action: handleLogout, danger: true },
                                ].map((item, i) => (
                                    <button key={i}
                                        onClick={() => { item.action(); setMobileMenuOpen(false); }}
                                        style={{ padding: '12px 16px', textAlign: 'left', background: 'transparent',
                                            border: 'none', color: item.danger ? '#ef4444' : T.title,
                                            fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                            fontFamily: 'inherit', borderRadius: 8,
                                            borderTop: item.danger ? `1px solid ${T.border}` : 'none' }}>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* ── PAGE HEADER ── */}
            <div style={{ padding: '24px 16px 16px', maxWidth: 1400, margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ display: 'flex', alignItems: 'flex-end',
                        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: T.goldLight, borderRadius: 50, padding: '4px 14px',
                            border: `1px solid ${T.goldBorder}`, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                                textTransform: 'uppercase', color: T.gold }}>✨ Explore</span>
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(1.5rem,4vw,2.4rem)', fontWeight: 900,
                            color: T.title, lineHeight: 1.1, marginBottom: 4 }}>
                            Booker Dashboard
                        </h1>
                        <p style={{ fontSize: 13, color: T.sub }}>
                            {loading ? 'Loading venues...' : `${filteredVenues.length} venues available`}
                        </p>
                    </div>

                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', borderRadius: 50, cursor: 'pointer',
                            background: showFilters ? T.goldLight : T.card,
                            border: `1.5px solid ${showFilters ? T.goldBorder : T.border}`,
                            color: showFilters ? T.gold : T.sub,
                            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                            boxShadow: showFilters ? `0 4px 14px rgba(200,164,91,0.2)` : T.shadow }}>
                        <span>🎛️ Filters</span>
                        {activeFilters > 0 && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                style={{ background: T.gold, color: 'white', fontSize: 10, fontWeight: 800,
                                    width: 18, height: 18, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {activeFilters}
                            </motion.span>
                        )}
                    </motion.button>
                </motion.div>
            </div>

            {/* ── FILTER PANEL ── */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden', padding: '0 16px 16px', maxWidth: 1400, margin: '0 auto' }}>
                        <div style={{ background: T.filterBg, border: `1px solid ${T.border}`,
                            borderRadius: 20, padding: '20px', boxShadow: T.shadow }}>
                            <div style={{ display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                                        textTransform: 'uppercase', color: T.gold, display: 'block', marginBottom: 8 }}>
                                        Venue Type
                                    </label>
                                    <select value={selectedType} onChange={e => setSelectedType(e.target.value)}
                                        style={{ width: '100%', borderBottom: `2px solid ${T.goldBorder}`,
                                            background: 'transparent', color: T.title, padding: '8px 4px',
                                            fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                                        {VENUE_TYPES.map(t => <option key={t} value={t}
                                            style={{ background: T.filterBg }}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                                        textTransform: 'uppercase', color: T.gold, display: 'block', marginBottom: 8 }}>
                                        City
                                    </label>
                                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                                        style={{ width: '100%', borderBottom: `2px solid ${T.goldBorder}`,
                                            background: 'transparent', color: T.title, padding: '8px 4px',
                                            fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                                        {cities.map(c => <option key={c} value={c}
                                            style={{ background: T.filterBg }}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                                        textTransform: 'uppercase', color: T.gold, display: 'block', marginBottom: 8 }}>
                                        Max Price {maxPrice ? `— ₹${parseInt(maxPrice).toLocaleString('en-IN')}` : ''}
                                    </label>
                                    <input type="range" min="500" max="50000" step="500"
                                        value={maxPrice || 50000} onChange={e => setMaxPrice(e.target.value)}
                                        style={{ width: '100%' }}/>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.sub }}>
                                        <span>₹500</span><span>₹50,000</span>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                                        textTransform: 'uppercase', color: T.gold, display: 'block', marginBottom: 8 }}>
                                        Booking Type
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {['All','instant','manual'].map(bt => (
                                            <label key={bt} style={{ display: 'flex', alignItems: 'center',
                                                gap: 8, cursor: 'pointer', fontSize: 13, color: T.title }}>
                                                <input type="radio" name="bt" value={bt}
                                                    checked={bookingTypeFilter === bt}
                                                    onChange={() => setBookingTypeFilter(bt)}/>
                                                {bt === 'All' ? '🏛️ All' : bt === 'instant' ? '⚡ Instant' : '📋 Manual'}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {activeFilters > 0 && (
                                <button onClick={clearFilters}
                                    style={{ marginTop: 16, fontSize: 12, color: T.sub,
                                        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    ✕ Clear all filters
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── QUICK FILTER CHIPS ── */}
            <div style={{ padding: '0 16px 16px', maxWidth: 1400, margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {VENUE_TYPES.slice(0, 10).map((type, i) => {
                        const active = selectedType === type;
                        return (
                            <motion.button key={type}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setSelectedType(type)}
                                style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 999,
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                    background: active ? 'linear-gradient(135deg,#C8A45B,#E3C67A)' : T.card,
                                    border: `1.5px solid ${active ? 'transparent' : T.border}`,
                                    color: active ? 'white' : T.sub,
                                    boxShadow: active ? '0 4px 14px rgba(200,164,91,0.35)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                                {type}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* ── VENUE GRID ── */}
            <div ref={gridRef} style={{ padding: '0 16px 80px', maxWidth: 1400, margin: '0 auto' }}>
                {loading ? (
                    <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,280px), 1fr))', gap: 16 }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.div key={i}
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
                                style={{ height: 280, borderRadius: 18,
                                    background: dark ? '#1E1E1E' : '#F0ECE4',
                                    border: `1px solid ${T.border}` }}/>
                        ))}
                    </div>
                ) : filteredVenues.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '60px 24px' }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>🏛️</div>
                        <p style={{ color: T.sub, fontSize: 15, marginBottom: 16 }}>No venues found.</p>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={clearFilters}
                            style={{ padding: '10px 24px', borderRadius: 50, border: 'none',
                                background: 'linear-gradient(135deg,#C8A45B,#E3C67A)',
                                color: 'white', fontWeight: 700, fontSize: 13,
                                cursor: 'pointer', fontFamily: 'inherit' }}>
                            Clear Filters
                        </motion.button>
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,280px), 1fr))',
                        gap: 16 }}>
                        {filteredVenues.map((venue, i) => (
                            <VenueCard key={venue._id} venue={venue} dark={dark}
                                index={i} inView={gridView}
                                onClick={() => navigate(`/venue/${venue._id}`)}/>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom tagline */}
            <p style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                color: T.sub, fontSize: 11, fontStyle: 'italic',
                letterSpacing: '2px', pointerEvents: 'none', zIndex: 10 }}>
                EASY. BOOK. ENJOY.
            </p>

            {/* ── MOBILE CSS ── */}
            <style>{`
                @media (max-width: 768px) {
                    .hidden-mobile { display: none !important; }
                    .show-mobile { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .show-mobile { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default BookerDashboard;