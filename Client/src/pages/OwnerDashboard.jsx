import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "../context/AuthContext";
import { getOwnerBookings, updateBookingStatus } from "../services/bookingService";
import {
  getOwnerVenues, toggleVenueActive, updateVenue,
} from '../services/venueService';
import { formatINR, formatDateIN, statusColor, timeAgo } from '../utils/helpers';

// ── Icons ─────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  home:     'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  venues:   'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z',
  bookings: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  profile:  'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  chat:     'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  add:      'M12 5v14M5 12h14',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  logout:   'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  x:        'M18 6L6 18M6 6l12 12',
  sun:      'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z',
  moon:     'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  calendar: 'M8 2v4M16 2v4M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  image:    'M21 19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5-5 6',
  switch:   'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4',
};

// ── Themes ────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:         '#0a0f1a',
    surface:    '#111827',
    surfaceAlt: '#1a2332',
    border:     '#1e2d40',
    text:       '#f0f6ff',
    muted:      '#4a6a8a',
    primary:    '#00c4a7',
    primaryBg:  'rgba(0,196,167,0.1)',
    sidebar:    '#070c14',
    card:       '#111827',
    danger:     '#ef4444',
    success:    '#22c55e',
    warning:    '#f59e0b',
  },
  light: {
    bg:         '#f4f7fb',
    surface:    '#ffffff',
    surfaceAlt: '#f0f4f8',
    border:     '#e2eaf4',
    text:       '#0d1a2d',
    muted:      '#7a95b0',
    primary:    '#0d9f8a',
    primaryBg:  'rgba(13,159,138,0.08)',
    sidebar:    '#0d1a2d',
    card:       '#ffffff',
    danger:     '#dc2626',
    success:    '#16a34a',
    warning:    '#d97706',
  },
};

const NAV = [
  { id: 'overview',  icon: 'home',     label: 'Overview' },
  { id: 'venues',    icon: 'venues',   label: 'Venues' },
  { id: 'bookings',  icon: 'bookings', label: 'Bookings' },
  { id: 'chat',      icon: 'chat',     label: 'Chat' },
  { id: 'profile',   icon: 'profile',  label: 'Profile' },
];

// ── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, color, T, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 20, padding: '22px 24px',
      display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      position: 'relative', overflow: 'hidden',
    }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 20px 0 80px', background: color + '14' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        <Icon d={ICONS[icon]} size={17} />
      </div>
    </div>
    <div style={{ fontSize: 30, fontWeight: 900, color: T.text, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{sub}</div>}
  </motion.div>
);

const Badge = ({ status }) => {
  const c = statusColor(status);
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, textTransform: 'capitalize' }}>{status}</span>;
};

// ── Add Venue Modal ───────────────────────────────────────────────────────
const AddVenueModal = ({ onClose, onSave, T }) => {
  const [form, setForm] = useState({ name: '', description: '', pricePerHour: '', capacity: '', city: '', pincode: '', address: '', amenities: '', venueType: 'hall' });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.pricePerHour || !form.city) { setError('Name, price, and city are required.'); return; }
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'amenities') v.split(',').map(a => a.trim()).filter(Boolean).forEach(a => fd.append('amenities[]', a));
        else fd.append(k, v);
      });
      fd.append('location[city]', form.city);
      fd.append('location[pincode]', form.pincode);
      fd.append('location[address]', form.address);
      images.forEach(f => fd.append('images', f));
      await onSave(fd);
      onClose();
    } catch (e) { setError(e?.response?.data?.message || 'Failed to create venue'); }
    finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
        transition={{ type: 'spring', damping: 24 }}
        style={{ background: T.surface, borderRadius: 24, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: T.text, fontSize: 20, fontWeight: 800, margin: 0 }}>Add New Venue</h2>
          <button onClick={onClose} style={{ background: T.surfaceAlt, border: 'none', color: T.muted, cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex' }}><Icon d={ICONS.x} size={18} /></button>
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Venue Name *</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. The Grand Hall" /></div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your venue..." /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Price / Hour (₹) *</label><input style={inp} type="number" value={form.pricePerHour} onChange={e => set('pricePerHour', e.target.value)} placeholder="5000" /></div>
            <div><label style={lbl}>Capacity</label><input style={inp} type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="200" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>City *</label><input style={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Bangalore" /></div>
            <div><label style={lbl}>Pincode</label><input style={inp} value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="560001" /></div>
          </div>
          <div><label style={lbl}>Address</label><input style={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" /></div>
          <div>
            <label style={lbl}>Venue Type</label>
            <select style={inp} value={form.venueType} onChange={e => set('venueType', e.target.value)}>
              {['hall','outdoor','rooftop','banquet','conference','farmhouse','other'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div><label style={lbl}>Amenities (comma-separated)</label><input style={inp} value={form.amenities} onChange={e => set('amenities', e.target.value)} placeholder="Parking, AC, Catering, WiFi" /></div>
          <div>
            <label style={lbl}>Images (up to 5)</label>
            <div style={{ border: `2px dashed ${T.border}`, borderRadius: 14, padding: 20, textAlign: 'center', background: T.surfaceAlt }}>
              <input type="file" multiple accept="image/*" style={{ display: 'none' }} id="venue-images" onChange={e => setImages(Array.from(e.target.files).slice(0, 5))} />
              <label htmlFor="venue-images" style={{ cursor: 'pointer', color: T.muted, fontSize: 13, display: 'block' }}>
                <Icon d={ICONS.image} size={28} />
                <div style={{ marginTop: 8 }}>{images.length > 0 ? `${images.length} image(s) selected` : 'Click to upload images'}</div>
              </label>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 14, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '13px', borderRadius: 14, background: saving ? T.muted : T.primary, border: 'none', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Creating...' : 'Create Venue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Edit Venue Modal ──────────────────────────────────────────────────────
const EditVenueModal = ({ venue, onClose, onSave, T }) => {
  const [form, setForm] = useState({ name: venue?.name || '', description: venue?.description || '', pricePerHour: venue?.pricePerHour || '', capacity: venue?.capacity || '', amenities: (venue?.amenities || []).join(', ') });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    setSaving(true);
    try { await onSave(venue._id, { ...form, amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean) }); onClose(); }
    finally { setSaving(false); }
  };
  const inp = { width: '100%', padding: '11px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93 }} animate={{ scale: 1 }} exit={{ scale: 0.93 }}
        style={{ background: T.surface, borderRadius: 24, padding: 28, width: '100%', maxWidth: 480, border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ color: T.text, fontSize: 18, fontWeight: 800, margin: 0 }}>Edit Venue</h2>
          <button onClick={onClose} style={{ background: T.surfaceAlt, border: 'none', color: T.muted, cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex' }}><Icon d={ICONS.x} size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['name','Venue Name'],['description','Description'],['pricePerHour','Price / Hour (₹)'],['capacity','Capacity'],['amenities','Amenities (comma-separated)']].map(([k, lbl]) => (
            <div key={k}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>{lbl}</label>
              {k === 'description' ? <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form[k]} onChange={e => set(k, e.target.value)} /> : <input style={inp} value={form[k]} onChange={e => set(k, e.target.value)} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 14, border: `1px solid ${T.border}`, background: 'transparent', color: T.muted, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 14, background: T.primary, border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
const OwnerDashboardScreen = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('owner-theme') || 'dark'; } catch { return 'dark'; }
  });
  const T = THEMES[theme] || THEMES.dark;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('owner-theme', next); } catch {}
  };

  const [tab, setTab] = useState('overview');
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState('');
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [statusLoading, setStatusLoading] = useState({});
  const [switchingRole, setSwitchingRole] = useState(false);

  const showNotice = (msg, isError = false) => {
    if (isError) setNoticeError(msg); else setNotice(msg);
    setTimeout(() => { setNotice(''); setNoticeError(''); }, 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, bData] = await Promise.all([getOwnerVenues(), getOwnerBookings()]);
      setVenues(vData.venues || vData || []);
      setBookings(bData.bookings || bData || []);
    } catch { showNotice('Failed to load data', true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = {
    totalVenues:  venues.length,
    activeVenues: venues.filter(v => v.isActive).length,
    pendingBids:  bookings.filter(b => b.status === 'pending').length,
    totalRevenue: bookings.filter(b => b.status === 'paid').reduce((s, b) => s + (b.ownerAmount || b.bidAmount || 0), 0),
  };

  const handleToggleActive = async (venue) => {
    try {
      await toggleVenueActive(venue._id, !venue.isActive);
      setVenues(vs => vs.map(v => v._id === venue._id ? { ...v, isActive: !v.isActive } : v));
      showNotice(`${venue.name} ${venue.isActive ? 'deactivated' : 'activated'}`);
    } catch { showNotice('Failed to update venue', true); }
  };

  const handleUpdateVenue = async (id, payload) => {
    await updateVenue(id, payload);
    setVenues(vs => vs.map(v => v._id === id ? { ...v, ...payload } : v));
    showNotice('Venue updated successfully');
  };

  const handleCreateVenue = async (formData) => {
    const { createVenueWithImages: create } = await import('../services/venueService');
    const result = await create(formData);
    setVenues(vs => [...vs, result.venue || result]);
    showNotice('Venue created successfully');
  };

  const handleBookingAction = async (bookingId, status) => {
    setStatusLoading(s => ({ ...s, [bookingId]: true }));
    try {
      await updateBookingStatus(bookingId, status);
      setBookings(bs => bs.map(b => b._id === bookingId ? { ...b, status } : b));
      showNotice(`Booking ${status}`);
    } catch { showNotice('Failed to update booking', true); }
    finally { setStatusLoading(s => ({ ...s, [bookingId]: false })); }
  };

  const handleSwitchRole = async () => {
    if (switchingRole) return;
    const newRole = user.role === 'booker' ? 'venueOwner' : 'booker';
    setSwitchingRole(true);
    try {
      const api = (await import('../utils/axiosInstance')).default;
      const { data } = await api.patch('/auth/switch-role', { role: newRole });
      login(data.user, data.token);
      showNotice(`Switched to ${newRole === 'booker' ? 'Booker' : 'Venue Owner'}`);
      setTimeout(() => navigate(newRole === 'booker' ? '/booker/dashboard' : '/owner/dashboard'), 800);
    } catch { showNotice('Failed to switch role', true); }
    finally { setSwitchingRole(false); }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const allBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: T.text, transition: 'background 0.25s, color 0.25s' }}>

      {/* ─────────────── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside style={{
        width: 72, background: T.sidebar,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 0', gap: 4,
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
        borderRight: `1px solid ${T.border}`,
        transition: 'background 0.25s',
      }}>
        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ marginBottom: 20, cursor: 'pointer', position: 'relative' }}>
          <img src="/logo.png" alt="BYE"
            style={{ width: 42, height: 42, borderRadius: 14, objectFit: 'cover', border: `2px solid ${T.primary}`, display: 'block' }}
            onError={e => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; e.target.parentNode.querySelector('.logo-fallback').style.display = 'flex'; }} />
          <div className="logo-fallback" style={{ display: 'none', width: 42, height: 42, borderRadius: 14, background: T.primary, alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>BYE</div>
        </div>

        {/* Nav items */}
        {NAV.map(item => {
          const active = tab === item.id;
          return (
            <motion.button key={item.id}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={() => setTab(item.id)}
              title={item.label}
              style={{
                width: 46, height: 46, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: active ? T.primary : 'transparent',
                color: active ? '#fff' : T.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s', position: 'relative',
              }}>
              <Icon d={ICONS[item.icon]} size={19} />
              {active && (
                <div style={{ position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)', width: 3, height: 22, borderRadius: 2, background: T.primary }} />
              )}
            </motion.button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <motion.button whileTap={{ scale: 0.92 }} onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          style={{ width: 46, height: 46, borderRadius: 14, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, transition: 'all 0.2s' }}>
          <Icon d={theme === 'dark' ? ICONS.sun : ICONS.moon} size={18} />
        </motion.button>

        {/* Logout */}
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => { logout(); navigate('/login'); }} title="Sign out"
          style={{ width: 46, height: 46, borderRadius: 14, border: 'none', background: 'transparent', color: T.danger, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <Icon d={ICONS.logout} size={18} />
        </motion.button>

        {/* Avatar */}
        <div onClick={() => setTab('profile')} style={{ cursor: 'pointer' }}>
          <img src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`} alt=""
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.primary}`, display: 'block' }} />
        </div>
      </aside>

      {/* ─────────────── MAIN CONTENT ─────────────────────────────────── */}
      <main style={{ flex: 1, marginLeft: 72, paddingBottom: 80, minHeight: '100vh' }}>

        {/* Top bar */}
        <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: T.text, margin: 0, letterSpacing: '-0.3px' }}>
              {NAV.find(n => n.id === tab)?.label}
            </h1>
            <p style={{ fontSize: 13, color: T.muted, margin: '3px 0 0', fontWeight: 500 }}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </p>
          </div>
          {tab === 'venues' && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddVenue(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 50, background: T.primary, border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${T.primary}50` }}>
              <Icon d={ICONS.add} size={16} /> Add Venue
            </motion.button>
          )}
        </div>

        {/* Toast */}
        <AnimatePresence>
          {(notice || noticeError) && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ margin: '16px 28px 0', padding: '12px 18px', borderRadius: 14, background: noticeError ? '#fef2f2' : T.primaryBg, border: `1px solid ${noticeError ? '#fecaca' : T.primary}`, color: noticeError ? T.danger : T.primary, fontSize: 14, fontWeight: 600 }}>
              {notice || noticeError}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ padding: '20px 28px' }}>

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard label="Total Venues" value={stats.totalVenues} sub={`${stats.activeVenues} active`} icon="venues" color={T.primary} T={T} delay={0} />
                <StatCard label="Pending Bids" value={stats.pendingBids} sub="Awaiting action" icon="bookings" color={T.warning} T={T} delay={0.06} />
                <StatCard label="Revenue" value={formatINR(stats.totalRevenue)} sub="From paid bookings" icon="home" color={T.success} T={T} delay={0.12} />
                <StatCard label="Total Bookings" value={bookings.length} sub={`${bookings.filter(b => b.status === 'paid').length} paid`} icon="calendar" color="#8b5cf6" T={T} delay={0.18} />
              </div>

              <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: T.text, fontWeight: 800, fontSize: 16, margin: 0 }}>Pending Bids</h3>
                    <p style={{ color: T.muted, fontSize: 12, margin: '2px 0 0' }}>Approve or reject incoming bookings</p>
                  </div>
                  <button onClick={() => setTab('bookings')} style={{ fontSize: 13, color: T.primary, background: T.primaryBg, border: 'none', cursor: 'pointer', fontWeight: 700, padding: '7px 14px', borderRadius: 50 }}>View all →</button>
                </div>
                {loading ? (
                  <div style={{ padding: 48, textAlign: 'center', color: T.muted }}>Loading...</div>
                ) : pendingBookings.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                    <p style={{ color: T.muted, fontSize: 14 }}>No pending bids — all caught up!</p>
                  </div>
                ) : pendingBookings.slice(0, 5).map((b, i) => (
                  <motion.div key={b._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ padding: '14px 22px', borderBottom: i < Math.min(pendingBookings.length, 5) - 1 ? `1px solid ${T.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: T.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, flexShrink: 0 }}>
                        <Icon d={ICONS.calendar} size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: T.text, fontSize: 14 }}>{b.venue?.name || 'Venue'}</div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{b.booker?.name} • {formatDateIN(b.eventDate)} • {formatINR(b.bidAmount)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleBookingAction(b._id, 'approved')} disabled={statusLoading[b._id]}
                        style={{ padding: '8px 16px', borderRadius: 10, background: '#dcfce7', color: '#166534', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓ Approve</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleBookingAction(b._id, 'rejected')} disabled={statusLoading[b._id]}
                        style={{ padding: '8px 16px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✕ Reject</motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── VENUES ───────────────────────────────────────────── */}
          {tab === 'venues' && (
            loading ? <div style={{ textAlign: 'center', padding: 60, color: T.muted }}>Loading venues...</div>
            : venues.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: 60, background: T.surface, borderRadius: 24, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🏛️</div>
                <p style={{ color: T.text, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>No venues yet</p>
                <p style={{ color: T.muted, fontSize: 14, marginBottom: 24 }}>Add your first venue to start receiving bookings</p>
                <button onClick={() => setShowAddVenue(true)} style={{ padding: '13px 28px', borderRadius: 50, background: T.primary, border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add Venue</button>
              </motion.div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {venues.map((venue, i) => (
                  <motion.div key={venue._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}>
                    <div style={{ height: 170, background: T.surfaceAlt, position: 'relative', overflow: 'hidden' }}>
                      {venue.images?.[0] ? <img src={venue.images[0]} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, flexDirection: 'column', gap: 8 }}>
                          <Icon d={ICONS.image} size={36} /><span style={{ fontSize: 12 }}>No image</span>
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: venue.isActive ? '#dcfce7' : '#fee2e2', color: venue.isActive ? '#166534' : '#991b1b' }}>
                        {venue.isActive ? '● Active' : '● Inactive'}
                      </div>
                      {!venue.isApproved && <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700, background: '#fef9c3', color: '#854d0e' }}>Pending Approval</div>}
                    </div>
                    <div style={{ padding: '18px 20px' }}>
                      <h3 style={{ color: T.text, fontWeight: 800, fontSize: 16, margin: '0 0 4px' }}>{venue.name}</h3>
                      <p style={{ color: T.muted, fontSize: 13, margin: '0 0 4px' }}>📍 {venue.location?.city || 'Location N/A'}</p>
                      <p style={{ color: T.primary, fontWeight: 800, fontSize: 15, margin: '0 0 16px' }}>{formatINR(venue.pricePerHour)}<span style={{ color: T.muted, fontWeight: 400, fontSize: 12 }}>/hr</span></p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button onClick={() => setEditingVenue(venue)} style={{ padding: '10px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
                        <button onClick={() => navigate(`/owner/venues/${venue._id}`)} style={{ padding: '10px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>📋 Bookings</button>
                        <button onClick={() => handleToggleActive(venue)} style={{ gridColumn: '1 / -1', padding: '10px', borderRadius: 12, border: 'none', background: venue.isActive ? '#fee2e2' : '#dcfce7', color: venue.isActive ? '#991b1b' : '#166534', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {venue.isActive ? '⏸ Deactivate' : '▶ Activate'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* ── BOOKINGS ─────────────────────────────────────────── */}
          {tab === 'bookings' && (
            <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              {loading ? <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>Loading...</div>
              : allBookings.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: T.muted, fontSize: 14 }}>No bookings yet</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: T.surfaceAlt }}>
                        {['Venue','Booker','Date','Amount','Status','Action'].map(h => (
                          <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allBookings.map((b, i) => (
                        <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} style={{ borderTop: `1px solid ${T.border}` }}>
                          <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 700, color: T.text }}>{b.venue?.name || '—'}</td>
                          <td style={{ padding: '14px 18px', fontSize: 13, color: T.muted }}>
                            <div style={{ fontWeight: 600, color: T.text }}>{b.booker?.name || '—'}</div>
                            <div style={{ fontSize: 11 }}>{b.booker?.email}</div>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13, color: T.muted, whiteSpace: 'nowrap' }}>{formatDateIN(b.eventDate)}</td>
                          <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 800, color: T.primary }}>{formatINR(b.bidAmount)}</td>
                          <td style={{ padding: '14px 18px' }}><Badge status={b.status} /></td>
                          <td style={{ padding: '14px 18px' }}>
                            {b.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => handleBookingAction(b._id, 'approved')} disabled={statusLoading[b._id]} style={{ padding: '7px 12px', borderRadius: 9, background: '#dcfce7', color: '#166534', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✓</button>
                                <button onClick={() => handleBookingAction(b._id, 'rejected')} disabled={statusLoading[b._id]} style={{ padding: '7px 12px', borderRadius: 9, background: '#fee2e2', color: '#991b1b', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>✕</button>
                              </div>
                            ) : <span style={{ fontSize: 12, color: T.muted }}>{timeAgo(b.updatedAt)}</span>}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── CHAT ─────────────────────────────────────────────── */}
          {tab === 'chat' && (
            <div style={{ background: T.surface, borderRadius: 20, border: `1px solid ${T.border}`, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: T.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                <Icon d={ICONS.chat} size={30} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: T.text, fontWeight: 800, fontSize: 20, margin: '0 0 8px' }}>Messages</h3>
                <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>Chat with bookers about their bookings</p>
              </div>
              <button onClick={() => navigate('/chat')}
                style={{ padding: '12px 32px', borderRadius: 50, background: T.primary, border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${T.primary}50` }}>
                Open Chat →
              </button>
            </div>
          )}

          {/* ── PROFILE ──────────────────────────────────────────── */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 500 }}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: T.surface, borderRadius: 24, border: `1px solid ${T.border}`, padding: 28, marginBottom: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <img src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`} alt=""
                    style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${T.primary}`, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: T.text }}>{user?.name}</div>
                    <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{user?.email}</div>
                    <div style={{ fontSize: 12, color: T.primary, fontWeight: 700, marginTop: 6, background: T.primaryBg, padding: '3px 10px', borderRadius: 50, display: 'inline-block' }}>
                      {user?.role === 'venueOwner' ? '🏛️ Venue Owner' : '👤 Booker'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[['Venues', stats.totalVenues], ['Bookings', bookings.length], ['Revenue', formatINR(stats.totalRevenue)]].map(([label, val]) => (
                    <div key={label} style={{ background: T.surfaceAlt, borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{val}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 3, fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                  <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Switch between booker and venue owner mode instantly.</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSwitchRole} disabled={switchingRole}
                    style={{ width: '100%', padding: '14px', borderRadius: 14, background: switchingRole ? T.muted : T.primaryBg, border: `1.5px solid ${T.primary}`, color: T.primary, fontWeight: 700, fontSize: 14, cursor: switchingRole ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Icon d={ICONS.switch} size={16} />
                    {switchingRole ? 'Switching...' : `Switch to ${user?.role === 'venueOwner' ? 'Booker' : 'Venue Owner'}`}
                  </motion.button>
                </div>
              </motion.div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => { logout(); navigate('/login'); }}
                style={{ width: '100%', padding: '14px', borderRadius: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon d={ICONS.logout} size={16} /> Sign Out
              </motion.button>
            </div>
          )}
        </div>
      </main>

      {/* ─────────────── MOBILE BOTTOM NAV ───────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: T.sidebar, borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '10px 8px 16px', zIndex: 200,
        transition: 'background 0.25s',
      }}>
        {NAV.map(item => {
          const active = tab === item.id;
          return (
            <motion.button key={item.id} onClick={() => setTab(item.id)} whileTap={{ scale: 0.88 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 14px', borderRadius: 14, border: 'none', background: active ? T.primaryBg : 'transparent', color: active ? T.primary : T.muted, cursor: 'pointer', minWidth: 52, transition: 'all 0.2s' }}>
              <Icon d={ICONS[item.icon]} size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* ─────────────── MODALS ──────────────────────────────────────── */}
      <AnimatePresence>
        {showAddVenue && <AddVenueModal onClose={() => setShowAddVenue(false)} onSave={handleCreateVenue} T={T} />}
        {editingVenue && <EditVenueModal venue={editingVenue} onClose={() => setEditingVenue(null)} onSave={handleUpdateVenue} T={T} />}
      </AnimatePresence>
    </div>
  );
};

export default OwnerDashboardScreen;
