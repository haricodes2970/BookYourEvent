import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getAllVenues } from '../services/venueService';
import { getMyBookings, raiseBid } from '../services/bookingService';
import { getMyPayments } from '../services/paymentService';
import { getMyChats, getChatMessages, sendMessage, openChat, markChatRead } from '../services/chatService';
import { formatINR, formatDateIN, statusColor, timeAgo } from '../utils/helpers';
import api from '../utils/axiosInstance';

// ── Icons ─────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IC = {
  overview:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  venues:    'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z',
  bookings:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  payments:  'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  chat:      'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  profile:   'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  logout:    'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  sun:       'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z',
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z',
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  edit:      'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  switch:    'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4',
  filter:    'M3 4h18M7 8h10M11 12h2M13 16h-2',
  bid:       'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  globe:     'M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20',
  check:     'M20 6L9 17l-5-5',
  x:         'M18 6L6 18M6 6l12 12',
  save:      'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M17 21v-8H7v8 M7 3v5h8',
};

// ── Theme ─────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: '#080f14', surface: '#0d1821', surfaceAlt: '#111c27',
    border: '#1a2a38', text: '#e8f0f7', muted: '#5a7a94',
    primary: '#1e9e8c', primaryBg: 'rgba(30,158,140,0.12)',
    sidebar: '#060d12', card: '#0d1821',
  },
  light: {
    bg: '#f0f6fa', surface: '#ffffff', surfaceAlt: '#f7fbfd',
    border: '#daeaf4', text: '#0d1821', muted: '#6a8fa8',
    primary: '#1e7a6e', primaryBg: 'rgba(30,122,110,0.08)',
    sidebar: '#0d1821', card: '#ffffff',
  },
};

// ── Languages ─────────────────────────────────────────────────────────────
const LANGS = {
  en: { label: 'English', font: "'DM Sans', sans-serif", flag: '🇺🇸' },
  hi: { label: 'हिन्दी', font: "'Noto Sans Devanagari', sans-serif", flag: '🇮🇳' },
  te: { label: 'తెలుగు', font: "'Noto Sans Telugu', sans-serif", flag: '🇮🇳' },
  ta: { label: 'தமிழ்', font: "'Noto Sans Tamil', sans-serif", flag: '🇮🇳' },
  kn: { label: 'ಕನ್ನಡ', font: "'Noto Sans Kannada', sans-serif", flag: '🇮🇳' },
};

// ── Status Badge ──────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const c = statusColor(status);
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 50,
      fontSize: 11, fontWeight: 700, background: c.bg, color: c.text,
      textTransform: 'capitalize',
    }}>{status}</span>
  );
};

// ── Missing Credentials Popup ─────────────────────────────────────────────
const MissingCredsPopup = ({ user, onClose, onGoProfile, T }) => {
  const missing = [];
  if (!user?.phone) missing.push('Phone number');
  if (!user?.username) missing.push('Username');
  if (!user?.name) missing.push('Full name');
  if (missing.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        style={{ background: T.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, border: `1px solid ${T.border}`, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
        <h2 style={{ color: T.text, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Complete your profile</h2>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 16 }}>
          The following details are missing from your account:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {missing.map(m => (
            <div key={m} style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', color: '#854d0e', fontWeight: 600, fontSize: 13 }}>
              ⚠️ {m} is missing
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 12, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Later
          </button>
          <button onClick={onGoProfile} style={{ flex: 2, padding: '11px', borderRadius: 12, background: T.primary, border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Update Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Venue Card ────────────────────────────────────────────────────────────
const VenueCard = ({ venue, T, onBook }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
    onClick={onBook}>
    <div style={{ height: 150, background: T.surfaceAlt, position: 'relative', overflow: 'hidden' }}>
      {venue.images?.[0]
        ? <img src={venue.images[0]} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🏛️</div>}
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: 'white' }}>
        {venue.venueType || venue.type || 'Hall'}
      </div>
    </div>
    <div style={{ padding: '14px 16px' }}>
      <h3 style={{ color: T.text, fontWeight: 800, fontSize: 15, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue.name}</h3>
      <p style={{ color: T.muted, fontSize: 12, margin: '0 0 10px' }}>📍 {venue.location?.city || 'N/A'}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: T.primary, fontWeight: 800, fontSize: 15 }}>{formatINR(venue.pricePerHour)}<span style={{ color: T.muted, fontWeight: 400, fontSize: 12 }}>/hr</span></span>
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={e => { e.stopPropagation(); onBook(); }}
          style={{ padding: '7px 14px', borderRadius: 50, background: T.primary, border: 'none', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          Book Now
        </motion.button>
      </div>
    </div>
  </motion.div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const BookerDashboard = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem('booker-theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('bye-lang') || 'en');
  const T = THEMES[theme];

  const [tab, setTab] = useState('overview');
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [showMissingCreds, setShowMissingCreds] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [raiseBidId, setRaiseBidId] = useState(null);
  const [newBidAmount, setNewBidAmount] = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', username: user?.username || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const msgEndRef = useRef(null);

  const showNotice = (msg, isErr = false) => {
    if (isErr) setError(msg); else setNotice(msg);
    setTimeout(() => { setNotice(''); setError(''); }, 3000);
  };

  // ── Check missing credentials on mount ──────────────────────────────
  useEffect(() => {
    if (user && (!user.phone || !user.username)) {
      const dismissed = sessionStorage.getItem('creds-dismissed');
      if (!dismissed) setShowMissingCreds(true);
    }
  }, [user]);

  // ── Load language font ───────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('bye-lang', lang);
    const link = document.getElementById('lang-font');
    if (lang !== 'en') {
      const fontName = LANGS[lang].font.replace(/'/g, '').replace(/ /g, '+');
      const href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700&display=swap`;
      if (link) { link.href = href; } else {
        const el = document.createElement('link');
        el.id = 'lang-font'; el.rel = 'stylesheet'; el.href = href;
        document.head.appendChild(el);
      }
    }
  }, [lang]);

  // ── Data fetching ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, bData] = await Promise.all([
        getAllVenues(),
        getMyBookings(),
      ]);
      setVenues(vData.venues || vData || []);
      setBookings(bData.bookings || bData || []);
    } catch { showNotice('Failed to load data', true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Payments
  useEffect(() => {
    if (tab === 'payments') {
      getMyPayments().then(d => setPayments(d.payments || d || [])).catch(() => {});
    }
  }, [tab]);

  // Chats
  useEffect(() => {
    if (tab === 'chat') {
      getMyChats().then(d => setChats(d || [])).catch(() => {});
    }
  }, [tab]);

  // Messages scroll
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleOpenChat = async (chat) => {
    setActiveChat(chat);
    const msgs = await getChatMessages(chat._id);
    setMessages(msgs || []);
    await markChatRead(chat._id);
  };

  const handleSendMsg = async () => {
    if (!msgText.trim() || !activeChat) return;
    setSendingMsg(true);
    try {
      const msg = await sendMessage(activeChat._id, msgText.trim());
      setMessages(p => [...p, msg]);
      setMsgText('');
    } finally { setSendingMsg(false); }
  };

  const handleRaiseBid = async (bookingId) => {
    if (!newBidAmount) return;
    setBidLoading(true);
    try {
      await raiseBid(bookingId, { newBidAmount: Number(newBidAmount) });
      showNotice('Bid raised! Owner will be notified.');
      setRaiseBidId(null); setNewBidAmount('');
      fetchAll();
    } catch (e) { showNotice(e?.response?.data?.message || 'Failed to raise bid', true); }
    finally { setBidLoading(false); }
  };

  const handleSwitchRole = async () => {
    if (switchingRole) return;
    setSwitchingRole(true);
    try {
      const { data } = await api.patch('/auth/switch-role', { role: 'venueOwner' });
      login(data.user, data.token);
      showNotice('Switched to Venue Owner!');
      setTimeout(() => navigate('/owner/dashboard'), 800);
    } catch { showNotice('Failed to switch role', true); }
    finally { setSwitchingRole(false); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/update-profile', profileForm);
      login(data.user, data.token || localStorage.getItem('token'));
      setEditingProfile(false);
      showNotice('Profile updated!');
    } catch (e) { showNotice(e?.response?.data?.message || 'Failed to update', true); }
    finally { setSavingProfile(false); }
  };

  // ── Filtered data ──────────────────────────────────────────────────
  const filteredVenues = venues.filter(v => {
    const q = searchQuery.toLowerCase();
    return !q || v.name?.toLowerCase().includes(q) || v.location?.city?.toLowerCase().includes(q);
  });

  const filteredBookings = bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter);

  const stats = {
    totalBookings: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length,
    paid: bookings.filter(b => b.status === 'paid').length,
  };

  // ── Nav ────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'overview', icon: 'overview', label: 'Overview' },
    { id: 'venues',   icon: 'venues',   label: 'Venues' },
    { id: 'bookings', icon: 'bookings', label: 'My Bookings' },
    { id: 'payments', icon: 'payments', label: 'Payments' },
    { id: 'chat',     icon: 'chat',     label: 'Chat' },
    { id: 'profile',  icon: 'profile',  label: 'Profile' },
  ];

  const fontFamily = LANGS[lang]?.font || "'DM Sans', sans-serif";

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily, color: T.text }}>

      {/* ── Google Font for language ───────────────────────────────── */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');`}</style>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside style={{
        width: 68, background: T.sidebar, display: 'flex', flexDirection: 'column',
        alignItems: 'center', paddingTop: 20, paddingBottom: 20, gap: 4,
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
        borderRight: `1px solid ${T.border}`,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="BYE" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          <div style={{ display: 'none', width: 38, height: 38, borderRadius: 12, background: T.primary, alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 12 }}>BYE</div>
        </div>

        {NAV.map(item => (
          <motion.button key={item.id} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            onClick={() => setTab(item.id)} title={item.label}
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: tab === item.id ? T.primary : 'transparent',
              color: tab === item.id ? 'white' : T.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', transition: 'all 0.2s',
            }}>
            <Ic d={IC[item.icon]} size={18} />
            {item.id === 'chat' && chats.length > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            )}
          </motion.button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); localStorage.setItem('booker-theme', t); }}
          style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic d={theme === 'dark' ? IC.sun : IC.moon} size={18} />
        </motion.button>

        {/* Logout */}
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => { logout(); navigate('/login'); }}
          style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic d={IC.logout} size={18} />
        </motion.button>

        {/* Avatar */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', marginTop: 8, border: `2px solid ${T.primary}`, cursor: 'pointer' }} onClick={() => setTab('profile')}>
          <img src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, marginLeft: 68, minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>
              {NAV.find(n => n.id === tab)?.label}
            </h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>Welcome back, {user?.name?.split(' ')[0]}</p>
          </div>
          {tab === 'venues' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Ic d={IC.search} size={16} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search venues..."
                  style={{ paddingLeft: 32, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 50, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, fontFamily, outline: 'none', width: 200 }} />
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }}>
                  <Ic d={IC.search} size={14} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        <AnimatePresence>
          {(notice || error) && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ margin: '12px 24px 0', padding: '12px 18px', borderRadius: 12, background: error ? '#fef2f2' : T.primaryBg, border: `1px solid ${error ? '#fecaca' : T.primary}`, color: error ? '#dc2626' : T.primary, fontSize: 14, fontWeight: 600 }}>
              {notice || error}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ padding: '20px 24px' }}>

          {/* ── OVERVIEW ───────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'Total Bookings', value: stats.totalBookings, color: T.primary },
                  { label: 'Pending', value: stats.pending, color: '#f59e0b' },
                  { label: 'Confirmed', value: stats.confirmed, color: '#10b981' },
                  { label: 'Paid', value: stats.paid, color: '#8b5cf6' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 22px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Recent bookings */}
              <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ color: T.text, fontWeight: 700, fontSize: 15, margin: 0 }}>Recent Bookings</h3>
                  <button onClick={() => setTab('bookings')} style={{ fontSize: 13, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
                </div>
                {bookings.slice(0, 5).map((b, i) => (
                  <div key={b._id} style={{ padding: '14px 20px', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{b.venue?.name || 'Venue'}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{formatDateIN(b.eventDate)} • {formatINR(b.bidAmount)}</div>
                    </div>
                    <Badge status={b.status} />
                  </div>
                ))}
                {bookings.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>No bookings yet</div>}
              </div>
            </div>
          )}

          {/* ── VENUES ──────────────────────────────────────────────── */}
          {tab === 'venues' && (
            loading ? <div style={{ textAlign: 'center', padding: 60, color: T.muted }}>Loading venues...</div>
            : filteredVenues.length === 0 ? <div style={{ textAlign: 'center', padding: 60, color: T.muted }}>No venues found</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                {filteredVenues.map(v => (
                  <VenueCard key={v._id} venue={v} T={T} onBook={() => navigate(`/venue/${v._id}`)} />
                ))}
              </div>
            )
          )}

          {/* ── MY BOOKINGS ─────────────────────────────────────────── */}
          {tab === 'bookings' && (
            <div>
              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {['all', 'pending', 'approved', 'paid', 'rejected', 'expired'].map(f => (
                  <button key={f} onClick={() => setBookingFilter(f)}
                    style={{ padding: '8px 16px', borderRadius: 50, border: `1px solid ${bookingFilter === f ? T.primary : T.border}`, background: bookingFilter === f ? T.primary : 'transparent', color: bookingFilter === f ? 'white' : T.muted, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily, textTransform: 'capitalize' }}>
                    {f}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredBookings.length === 0
                  ? <div style={{ textAlign: 'center', padding: 60, color: T.muted, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}` }}>No bookings found</div>
                  : filteredBookings.map(b => (
                    <motion.div key={b._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: T.text, fontSize: 16, marginBottom: 4 }}>{b.venue?.name || 'Venue'}</div>
                          <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>
                            📅 {formatDateIN(b.eventDate)} &nbsp;•&nbsp; 💰 {formatINR(b.bidAmount)} &nbsp;•&nbsp; {timeAgo(b.createdAt)}
                          </div>
                          <Badge status={b.status} />
                        </div>
                        {b.status === 'pending' && (
                          <div>
                            {raiseBidId === b._id ? (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="number" value={newBidAmount} onChange={e => setNewBidAmount(e.target.value)}
                                  placeholder="New amount"
                                  style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 13, fontFamily, outline: 'none', width: 130 }} />
                                <button onClick={() => handleRaiseBid(b._id)} disabled={bidLoading}
                                  style={{ padding: '8px 14px', borderRadius: 10, background: T.primary, border: 'none', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily }}>
                                  {bidLoading ? '...' : 'Raise'}
                                </button>
                                <button onClick={() => setRaiseBidId(null)}
                                  style={{ padding: '8px 10px', borderRadius: 10, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, cursor: 'pointer' }}>
                                  <Ic d={IC.x} size={14} />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setRaiseBidId(b._id)}
                                style={{ padding: '8px 14px', borderRadius: 10, background: T.primaryBg, border: `1px solid ${T.primary}`, color: T.primary, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily }}>
                                💰 Raise Bid
                              </button>
                            )}
                          </div>
                        )}
                        {b.status === 'approved' && (
                          <button onClick={() => navigate(`/venue/${b.venue?._id}`)}
                            style={{ padding: '8px 14px', borderRadius: 10, background: '#dcfce7', border: 'none', color: '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily }}>
                            💳 Pay Now
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ────────────────────────────────────────────── */}
          {tab === 'payments' && (
            <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {payments.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>No payment history</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: T.surfaceAlt }}>
                        {['Venue', 'Date', 'Amount', 'Status', 'Transaction ID'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr key={p._id || i} style={{ borderTop: `1px solid ${T.border}` }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: T.text, fontSize: 14 }}>{p.booking?.venue?.name || p.venue?.name || '—'}</td>
                          <td style={{ padding: '14px 16px', color: T.muted, fontSize: 13 }}>{formatDateIN(p.createdAt)}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: T.primary, fontSize: 14 }}>{formatINR(p.amount)}</td>
                          <td style={{ padding: '14px 16px' }}><Badge status={p.status || 'paid'} /></td>
                          <td style={{ padding: '14px 16px', color: T.muted, fontSize: 12, fontFamily: 'monospace' }}>{p.razorpayPaymentId || p.transactionId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── CHAT ─────────────────────────────────────────────────── */}
          {tab === 'chat' && (
            <div style={{ display: 'grid', gridTemplateColumns: activeChat ? '280px 1fr' : '1fr', gap: 16, height: 'calc(100vh - 160px)' }}>
              {/* Chat list */}
              <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 15, color: T.text }}>Messages</div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {chats.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14 }}>No conversations yet</div>
                  ) : chats.map(c => {
                    const other = c.participants?.find(p => p._id !== user?._id);
                    return (
                      <div key={c._id} onClick={() => handleOpenChat(c)}
                        style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: activeChat?._id === c._id ? T.primaryBg : 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={other?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${other?.name}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: T.text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.name || 'User'}</div>
                          <div style={{ fontSize: 12, color: T.muted }}>{other?.email}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Messages panel */}
              {activeChat && (
                <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}><Ic d={IC.x} size={18} /></button>
                    <span style={{ fontWeight: 700, color: T.text }}>
                      {activeChat.participants?.find(p => p._id !== user?._id)?.name || 'Chat'}
                    </span>
                  </div>
                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.map(m => {
                      const isMine = m.sender?._id === user?._id || m.sender === user?._id;
                      return (
                        <div key={m._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMine ? T.primary : T.surfaceAlt, color: isMine ? 'white' : T.text, fontSize: 14 }}>
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={msgEndRef} />
                  </div>
                  {/* Input */}
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
                    <input value={msgText} onChange={e => setMsgText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMsg()}
                      placeholder="Type a message..."
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 50, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 14, fontFamily, outline: 'none' }} />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleSendMsg} disabled={sendingMsg || !msgText.trim()}
                      style={{ width: 44, height: 44, borderRadius: '50%', background: T.primary, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ic d={IC.send} size={16} />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE ─────────────────────────────────────────────── */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 520 }}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, padding: 28, marginBottom: 16 }}>

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <img src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}`} alt=""
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${T.primary}` }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{user?.name}</div>
                    <div style={{ fontSize: 13, color: T.muted }}>{user?.email}</div>
                    <div style={{ fontSize: 12, color: T.primary, fontWeight: 600, marginTop: 2 }}>👤 Booker</div>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingProfile(!editingProfile)}
                    style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, background: T.primaryBg, border: `1px solid ${T.primary}`, color: T.primary, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ic d={IC.edit} size={14} /> Edit
                  </motion.button>
                </div>

                {/* Edit form */}
                <AnimatePresence>
                  {editingProfile && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', borderTop: `1px solid ${T.border}`, paddingTop: 20, marginBottom: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[['name', 'Full Name'], ['username', 'Username'], ['phone', 'Phone']].map(([k, lbl]) => (
                          <div key={k}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>{lbl}</label>
                            <input value={profileForm[k] || ''} onChange={e => setProfileForm(p => ({ ...p, [k]: e.target.value }))}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 14, fontFamily, outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => setEditingProfile(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontWeight: 600, cursor: 'pointer', fontFamily }}>Cancel</button>
                          <button onClick={handleSaveProfile} disabled={savingProfile} style={{ flex: 2, padding: '11px', borderRadius: 12, background: T.primary, border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily }}>
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Role switch */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>Switch to venue owner to start listing venues.</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSwitchRole} disabled={switchingRole}
                    style={{ width: '100%', padding: '13px', borderRadius: 12, background: T.primaryBg, border: `1.5px solid ${T.primary}`, color: T.primary, fontWeight: 700, fontSize: 14, cursor: switchingRole ? 'not-allowed' : 'pointer', fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ic d={IC.switch} size={16} />
                    {switchingRole ? 'Switching...' : 'Switch to Venue Owner'}
                  </motion.button>
                </div>

                {/* Language */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 10 }}>
                    <Ic d={IC.globe} size={14} /> &nbsp;Language
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                    {Object.entries(LANGS).map(([code, info]) => (
                      <button key={code} onClick={() => setLang(code)}
                        style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${lang === code ? T.primary : T.border}`, background: lang === code ? T.primaryBg : 'transparent', color: lang === code ? T.primary : T.muted, fontWeight: lang === code ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: info.font, textAlign: 'center' }}>
                        {info.flag} {info.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Sign out */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => { logout(); navigate('/login'); }}
                style={{ width: '100%', padding: '13px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ic d={IC.logout} size={16} /> Sign Out
              </motion.button>
            </div>
          )}
        </div>
      </main>

      {/* ── Missing credentials popup ─────────────────────────────── */}
      <AnimatePresence>
        {showMissingCreds && (
          <MissingCredsPopup user={user} T={T}
            onClose={() => { setShowMissingCreds(false); sessionStorage.setItem('creds-dismissed', '1'); }}
            onGoProfile={() => { setShowMissingCreds(false); setTab('profile'); setEditingProfile(true); sessionStorage.setItem('creds-dismissed', '1'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookerDashboard;
