import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllUsers, deleteUser, updateUserRole,
  approveVenue, adminDeleteVenue, getAllVenuesAdmin, getAllBookingsAdmin
} from '../services/adminService';

/* ─── tiny helpers ─────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString();

const statusStyle = (s) =>
  s === 'approved' || s === true
    ? { bg: 'rgba(0,255,100,0.08)', border: 'rgba(0,255,100,0.25)', color: '#4ade80' }
    : s === 'rejected'
    ? { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.3)', color: '#f87171' }
    : { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.3)', color: '#fb923c' };

/* ─── Cherry Blossom Petals (CSS-only, no framer) ─────── */
const Petals = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
    {[...Array(18)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full opacity-60"
        style={{
          width: `${6 + (i % 5) * 3}px`,
          height: `${4 + (i % 4) * 2}px`,
          background: i % 3 === 0 ? '#f43f5e' : i % 3 === 1 ? '#fb7185' : '#fda4af',
          borderRadius: '50% 0 50% 0',
          left: `${(i * 37 + 10) % 95}%`,
          top: `${(i * 19 + 5) % 80}%`,
          transform: `rotate(${i * 25}deg)`,
          animation: `petalFloat ${4 + (i % 5)}s ease-in-out infinite`,
          animationDelay: `${(i * 0.4) % 4}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes petalFloat {
        0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
        50% { transform: translateY(-18px) rotate(25deg); opacity: 0.9; }
      }
    `}</style>
  </div>
);

/* ─── Sidebar ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'venues',   icon: '🏛️', label: 'Manage Venues' },
  { id: 'users',    icon: '👤', label: 'Manage Users' },
  { id: 'bookings', icon: '📅', label: 'All Bookings' },
  { id: 'analytics',icon: '📊', label: 'Analytics' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const Sidebar = ({ active, setActive }) => (
  <aside
    className="fixed left-0 top-0 h-full w-56 z-20 flex flex-col py-6"
    style={{
      background: 'linear-gradient(180deg,#0e0a0a 0%,#1a0d0d 60%,#0a0808 100%)',
      borderRight: '1px solid rgba(180,30,30,0.2)',
    }}
  >
    {/* Logo area */}
    <div className="flex items-center gap-3 px-5 mb-10">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ background: 'rgba(180,30,30,0.15)', border: '1px solid rgba(180,30,30,0.4)' }}
      >
        ⛩️
      </div>
      <span className="font-bold tracking-widest text-sm" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>
        BYE
      </span>
    </div>

    {/* Nav */}
    <nav className="flex flex-col gap-1 px-3 flex-1">
      {NAV_ITEMS.map(({ id, icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => setActive(id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-full"
            style={{
              background: isActive ? 'rgba(180,30,30,0.25)' : 'transparent',
              borderLeft: isActive ? '3px solid #dc2626' : '3px solid transparent',
              color: isActive ? '#fca5a5' : 'rgba(226,201,160,0.45)',
            }}
          >
            <span className="text-base">{icon}</span>
            {label}
          </button>
        );
      })}
    </nav>

    {/* Bottom samurai silhouette */}
    <div className="px-4 mt-4 opacity-20">
      <svg viewBox="0 0 100 120" className="w-full" fill="rgba(180,30,30,0.6)">
        <ellipse cx="50" cy="18" rx="12" ry="14" />
        <rect x="38" y="30" width="24" height="40" rx="4"/>
        <rect x="20" y="35" width="18" height="6" rx="3"/>
        <rect x="62" y="35" width="18" height="6" rx="3"/>
        <rect x="42" y="70" width="8" height="30" rx="3"/>
        <rect x="52" y="70" width="8" height="30" rx="3"/>
      </svg>
    </div>
  </aside>
);

/* ─── Stat Card ───────────────────────────────────────── */
const StatCard = ({ label, value, color, bg }) => (
  <div
    className="rounded-xl p-4 relative overflow-hidden"
    style={{ background: bg, border: `1px solid ${color}33` }}
  >
    <div
      className="absolute inset-0 opacity-10 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />
    <p className="text-xs mb-1 tracking-wide uppercase" style={{ color: 'rgba(226,201,160,0.5)' }}>{label}</p>
    <p className="text-3xl font-bold" style={{ color, fontFamily: 'serif', textShadow: `0 0 20px ${color}88` }}>
      {value}
    </p>
  </div>
);

/* ─── Venue Card ──────────────────────────────────────── */
const VenueCard = ({ venue, onApprove, onDelete }) => {
  const imgSrc = venue.images?.[0] || venue.image || null;
  const st = statusStyle(venue.isApproved);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
      style={{
        background: 'linear-gradient(145deg,#1a0e0e,#120c0c)',
        border: '1px solid rgba(180,30,30,0.25)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Image / placeholder zone */}
      <div className="relative h-36 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={venue.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1f0a0a,#2a1010)' }}
          >
            <span className="text-5xl opacity-30">🏛️</span>
          </div>
        )}
        {/* Red circle overlay top-right (like samurai moon) */}
        <div
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(180,30,30,0.7)', border: '1px solid rgba(220,38,38,0.5)', color: '#fca5a5' }}
        >
          {venue.type?.charAt(0) || '?'}
        </div>
        {/* gradient fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12"
          style={{ background: 'linear-gradient(to top, #1a0e0e, transparent)' }} />
      </div>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>
              {venue.name}
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full inline-block mt-0.5"
              style={{ background: 'rgba(180,30,30,0.15)', color: '#fca5a5', border: '1px solid rgba(180,30,30,0.3)' }}
            >
              {venue.type}
            </span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
            style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
          >
            {venue.isApproved ? '● Live' : '⏳ Pending'}
          </span>
        </div>

        <p className="text-xs mt-1 truncate" style={{ color: 'rgba(226,201,160,0.45)' }}>
          👤 {venue.owner?.name || 'Unknown'}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(226,201,160,0.35)' }}>
          📍 {venue.location?.city || '—'}
        </p>

        <div
          className="flex items-center justify-between mt-3 pt-2"
          style={{ borderTop: '1px solid rgba(180,30,30,0.15)' }}
        >
          <div>
            <p className="text-xs" style={{ color: 'rgba(226,201,160,0.35)' }}>Hourly Price</p>
            <p className="font-bold text-sm" style={{ color: '#fb923c' }}>
              ₹{venue.pricePerHour}<span className="text-xs font-normal" style={{ color: 'rgba(226,201,160,0.35)' }}>/hr</span>
            </p>
          </div>
          <div className="flex gap-1">
            {!venue.isApproved && (
              <button
                onClick={() => onApprove(venue._id)}
                className="text-xs px-2 py-1 rounded-lg font-medium transition hover:scale-105"
                style={{ background: 'rgba(0,200,80,0.1)', border: '1px solid rgba(0,200,80,0.3)', color: '#4ade80' }}
              >
                ✓ Approve
              </button>
            )}
            <button
              onClick={() => onDelete(venue._id)}
              className="text-xs px-2 py-1 rounded-lg font-medium transition hover:scale-105"
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}
            >
              🗑 Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── User Card ───────────────────────────────────────── */
const UserCard = ({ u, onRoleChange, onDelete }) => {
  const roleColor = u.role === 'admin'
    ? { color: '#f87171', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)' }
    : u.role === 'venueOwner'
    ? { color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)' }
    : { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' };

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(145deg,#150e1a,#0e0a12)',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.35)' }}
        >
          {u.name?.charAt(0).toUpperCase()}
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: roleColor.bg, color: roleColor.color, border: `1px solid ${roleColor.border}` }}
        >
          {u.role}
        </span>
      </div>

      <p className="font-bold text-sm" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>{u.name}</p>
      <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(226,201,160,0.4)' }}>{u.email}</p>
      {u.phone && <p className="text-xs mt-0.5" style={{ color: 'rgba(226,201,160,0.3)' }}>{u.phone}</p>}
      <p className="text-xs mt-1" style={{ color: 'rgba(139,92,246,0.6)' }}>
        Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
      </p>

      <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(139,92,246,0.12)' }}>
        <p className="text-xs mb-1.5" style={{ color: 'rgba(226,201,160,0.3)' }}>Change Role:</p>
        <div className="flex gap-1 flex-wrap">
          {['booker', 'venueOwner', 'admin'].map(role => (
            <button
              key={role}
              onClick={() => onRoleChange(u._id, role)}
              disabled={u.role === role}
              className="text-xs px-2 py-1 rounded-lg transition"
              style={
                u.role === role
                  ? { background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)', cursor: 'default' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(226,201,160,0.35)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }
              }
            >
              {role === 'venueOwner' ? 'Owner' : role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {u.role !== 'admin' && (
        <button
          onClick={() => onDelete(u._id)}
          className="mt-2 w-full text-xs py-1.5 rounded-lg transition hover:bg-red-900/20"
          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171' }}
        >
          Delete User
        </button>
      )}
    </div>
  );
};

/* ─── Booking Card ────────────────────────────────────── */
const BookingCard = ({ booking }) => {
  const st = statusStyle(booking.status);
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'linear-gradient(145deg,#0a1020,#080d18)',
        border: '1px solid rgba(56,189,248,0.18)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-sm" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>
            {booking.booker?.name}
          </p>
          <p className="text-xs" style={{ color: 'rgba(226,201,160,0.4)' }}>{booking.booker?.email}</p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full capitalize"
          style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}
        >
          {booking.status}
        </span>
      </div>

      <p className="text-xs mb-3 font-medium" style={{ color: '#38bdf8' }}>
        📍 {booking.venue?.name}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'Date', val: booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : '—' },
          { label: 'Time', val: `${booking.startTime || '—'} – ${booking.endTime || '—'}` },
          { label: 'Guests', val: booking.guestCount ?? '—' },
          { label: 'Total', val: `₹${booking.totalPrice ?? '—'}`, highlight: true },
        ].map(({ label, val, highlight }) => (
          <div key={label}>
            <p style={{ color: 'rgba(226,201,160,0.3)' }}>{label}</p>
            <p style={{ color: highlight ? '#fb923c' : 'rgba(226,201,160,0.75)', fontWeight: highlight ? 700 : 400 }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Section header with katana divider ─────────────── */
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-4 mb-5">
    <h2 className="text-lg font-bold whitespace-nowrap" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>
      {title}
    </h2>
    <div className="flex-1 flex items-center gap-1">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(180,30,30,0.6), transparent)' }} />
      <svg viewBox="0 0 80 12" width="80" height="12">
        <path d="M0 6 L60 6 L70 2 L80 6 L70 10 Z" fill="rgba(180,30,30,0.4)" />
        <line x1="0" y1="6" x2="60" y2="6" stroke="rgba(180,30,30,0.6)" strokeWidth="1" />
      </svg>
    </div>
  </div>
);

/* ─── Toast ───────────────────────────────────────────── */
const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const isErr = type === 'error';
  return (
    <div
      className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl"
      style={{
        background: isErr ? 'rgba(220,38,38,0.15)' : 'rgba(0,200,80,0.12)',
        border: `1px solid ${isErr ? 'rgba(220,38,38,0.4)' : 'rgba(0,200,80,0.35)'}`,
        color: isErr ? '#f87171' : '#4ade80',
        backdropFilter: 'blur(12px)',
      }}
    >
      {isErr ? '✕ ' : '✓ '}{msg}
    </div>
  );
};

/* ─── MAIN COMPONENT ──────────────────────────────────── */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [activeTab, setActiveTab] = useState('venues');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [u, v, b] = await Promise.all([
        getAllUsers(), getAllVenuesAdmin(), getAllBookingsAdmin(),
      ]);
      setUsers(u.users ?? []);
      setVenues(v.venues ?? []);
      setBookings(b.bookings ?? []);
    } catch { showToast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleApproveVenue = async (id) => {
    try {
      await approveVenue(id);
      setVenues(vs => vs.map(v => v._id === id ? { ...v, isApproved: true } : v));
      showToast('Venue approved');
    } catch { showToast('Failed to approve venue', 'error'); }
  };

  const handleDeleteVenue = async (id) => {
    if (!window.confirm('Delete this venue permanently?')) return;
    try {
      await adminDeleteVenue(id);
      setVenues(vs => vs.filter(v => v._id !== id));
      showToast('Venue deleted');
    } catch { showToast('Failed to delete venue', 'error'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(id);
      setUsers(us => us.filter(u => u._id !== id));
      showToast('User deleted');
    } catch { showToast('Failed to delete user', 'error'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      setUsers(us => us.map(u => u._id === id ? { ...u, role } : u));
      showToast(`Role updated to ${role}`);
    } catch { showToast('Failed to update role', 'error'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  /* derived */
  const pendingVenues = venues.filter(v => !v.isApproved);
  const bookers = users.filter(u => u.role === 'booker');
  const owners  = users.filter(u => u.role === 'venueOwner');

  const filteredVenues   = venues.filter(v => v.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers    = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBookings = bookings.filter(b =>
    b.booker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.venue?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Users',    value: fmt(users.length),        color: '#f87171' },
    { label: 'Bookers',        value: fmt(bookers.length),      color: '#fb923c' },
    { label: 'Venue Owners',   value: fmt(owners.length),       color: '#a78bfa' },
    { label: 'Pending Venues', value: fmt(pendingVenues.length),color: '#38bdf8' },
    { label: 'Total Bookings', value: fmt(bookings.length),     color: '#4ade80' },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(160deg,#0d0808 0%,#120c0c 40%,#0a0a12 100%)' }}
    >
      {/* Sidebar */}
      <Sidebar active={activeTab} setActive={setActiveTab} />

      {/* Main */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">

        {/* Top Navbar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-8 py-3"
          style={{
            background: 'rgba(10,6,6,0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(180,30,30,0.2)',
          }}
        >
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="BYE"
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
              style={{ boxShadow: '0 0 14px rgba(220,38,38,0.4)', border: '1px solid rgba(220,38,38,0.3)' }}
              onClick={() => navigate('/')}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <span className="font-bold text-base tracking-wider" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>
              Admin Dashboard
            </span>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl ml-6 flex-1 max-w-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(180,30,30,0.2)' }}
          >
            <span style={{ color: 'rgba(180,30,30,0.6)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm focus:outline-none flex-1"
              style={{ color: '#e2c9a0', caretColor: '#dc2626' }}
            />
          </div>

          <div className="flex-1" />

          {/* Bell */}
          <button
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110"
            style={{ background: 'rgba(180,30,30,0.1)', border: '1px solid rgba(180,30,30,0.3)' }}
          >
            <span className="text-base">🔔</span>
            {pendingVenues.length > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: '#dc2626', color: '#fff' }}
              >
                {pendingVenues.length}
              </span>
            )}
          </button>

          {/* User */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'rgba(180,30,30,0.2)', border: '1px solid rgba(180,30,30,0.4)', color: '#fca5a5' }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-sm" style={{ color: 'rgba(226,201,160,0.6)' }}>
              {user?.name?.split(' ')[0] ?? 'Admin'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition hover:scale-105"
            style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', color: '#f87171' }}
          >
            Logout
          </button>
        </header>

        {/* Hero Banner */}
        <div
          className="relative overflow-hidden px-8 py-8 flex items-center"
          style={{
            background: 'linear-gradient(135deg,#1a0808 0%,#120c0c 50%,#0d0a18 100%)',
            borderBottom: '1px solid rgba(180,30,30,0.15)',
            minHeight: '160px',
          }}
        >
          <Petals />

          {/* Red moon */}
          <div
            className="absolute right-48 top-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '120px', height: '120px',
              background: 'radial-gradient(circle at 40% 40%, #7f1d1d, #450a0a)',
              boxShadow: '0 0 60px rgba(180,30,30,0.4)',
            }}
          />

          {/* Title text */}
          <div className="relative z-10">
            <h1
              className="text-5xl font-black tracking-widest uppercase"
              style={{
                color: '#e2c9a0',
                fontFamily: 'serif',
                textShadow: '0 0 40px rgba(220,38,38,0.3)',
                letterSpacing: '0.12em',
              }}
            >
              ADMIN DASHBOARD
            </h1>
            <p className="mt-1 text-sm tracking-widest uppercase" style={{ color: 'rgba(180,30,30,0.7)' }}>
              System Overview &amp; Management
            </p>
          </div>

          {/* Tree silhouette */}
          <div className="absolute right-0 top-0 h-full opacity-15 pointer-events-none">
            <svg viewBox="0 0 200 200" height="100%" fill="rgba(180,30,30,0.4)">
              {[60,90,120,150].map((x, i) => (
                <g key={i}>
                  <line x1={x} y1="200" x2={x + (i % 2 === 0 ? -10 : 10)} y2="60"
                    stroke="rgba(180,30,30,0.6)" strokeWidth="2" />
                  {[80, 110, 140].map(y => (
                    <ellipse key={y} cx={x + (y % 40 - 20)} cy={y} rx="20" ry="8"
                      fill="rgba(180,30,30,0.2)" />
                  ))}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="px-8 py-5">
          <SectionHeader title="Statistics cards" />
          <div className="grid grid-cols-5 gap-4">
            {stats.map((s, i) => (
              <StatCard
                key={i}
                label={s.label}
                value={loading ? '—' : s.value}
                color={s.color}
                bg={`${s.color}0d`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 pb-16 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3 animate-spin"
                  style={{ borderColor: 'rgba(220,38,38,0.4)', borderTopColor: '#dc2626' }}
                />
                <p className="text-sm" style={{ color: 'rgba(226,201,160,0.4)' }}>Loading system data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* VENUES */}
              {activeTab === 'venues' && (
                <>
                  <SectionHeader title="Venue cards" />
                  {filteredVenues.length === 0 ? (
                    <p className="text-sm" style={{ color: 'rgba(226,201,160,0.3)' }}>No venues found.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredVenues.map(v => (
                        <VenueCard key={v._id} venue={v} onApprove={handleApproveVenue} onDelete={handleDeleteVenue} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* USERS */}
              {activeTab === 'users' && (
                <>
                  <SectionHeader title="User management" />
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm" style={{ color: 'rgba(226,201,160,0.3)' }}>No users found.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredUsers.map(u => (
                        <UserCard key={u._id} u={u} onRoleChange={handleRoleChange} onDelete={handleDeleteUser} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* BOOKINGS */}
              {activeTab === 'bookings' && (
                <>
                  <SectionHeader title="All Bookings" />
                  {filteredBookings.length === 0 ? (
                    <p className="text-sm" style={{ color: 'rgba(226,201,160,0.3)' }}>No bookings found.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredBookings.map(b => (
                        <BookingCard key={b._id} booking={b} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ANALYTICS placeholder */}
              {activeTab === 'analytics' && (
                <>
                  <SectionHeader title="Analytics" />
                  <div
                    className="rounded-xl p-10 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(180,30,30,0.15)' }}
                  >
                    <p className="text-4xl mb-3">📊</p>
                    <p className="font-bold text-lg" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>Analytics Coming Soon</p>
                    <p className="text-sm mt-1" style={{ color: 'rgba(226,201,160,0.35)' }}>Charts and insights will appear here.</p>
                  </div>
                </>
              )}

              {/* SETTINGS placeholder */}
              {activeTab === 'settings' && (
                <>
                  <SectionHeader title="Settings" />
                  <div
                    className="rounded-xl p-10 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(180,30,30,0.15)' }}
                  >
                    <p className="text-4xl mb-3">⚙️</p>
                    <p className="font-bold text-lg" style={{ color: '#e2c9a0', fontFamily: 'serif' }}>Settings Panel</p>
                    <p className="text-sm mt-1" style={{ color: 'rgba(226,201,160,0.35)' }}>Configuration options will appear here.</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer tagline */}
        <div className="text-center py-3" style={{ borderTop: '1px solid rgba(180,30,30,0.1)' }}>
          <p className="text-xs tracking-widest italic" style={{ color: 'rgba(180,30,30,0.4)' }}>
            EASY. BOOK. ENJOY.
          </p>
        </div>
      </div>

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
};

export default AdminDashboard;
