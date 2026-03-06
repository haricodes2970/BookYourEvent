import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllUsers, deleteUser, updateUserRole,
  approveVenue, adminDeleteVenue, getAllVenuesAdmin, getAllBookingsAdmin
} from '../services/adminService';

/* ════════════════════════════════════════════════════════
   THEME CONTEXT
════════════════════════════════════════════════════════ */
const ThemeContext = createContext({ isDark: true });
const useTheme = () => useContext(ThemeContext);

/* ── Dark token map ── */
const dark = {
  pageBg:             'linear-gradient(160deg,#0d0808 0%,#120c0c 40%,#0a0a12 100%)',
  sidebarBg:          'linear-gradient(180deg,#0e0a0a 0%,#1a0d0d 60%,#0a0808 100%)',
  sidebarBorder:      'rgba(180,30,30,0.2)',
  navBg:              'rgba(10,6,6,0.88)',
  navBorder:          'rgba(180,30,30,0.2)',
  heroBg:             'linear-gradient(135deg,#1a0808 0%,#120c0c 50%,#0d0a18 100%)',
  heroBorder:         'rgba(180,30,30,0.15)',
  cardBg:             'linear-gradient(145deg,#1a0e0e,#120c0c)',
  cardBorder:         'rgba(180,30,30,0.25)',
  cardBgUser:         'linear-gradient(145deg,#150e1a,#0e0a12)',
  cardBorderUser:     'rgba(139,92,246,0.2)',
  cardBgBook:         'linear-gradient(145deg,#0a1020,#080d18)',
  cardBorderBook:     'rgba(56,189,248,0.18)',
  notifBg:            'linear-gradient(160deg,#1c0a0a 0%,#110808 100%)',
  inputBg:            'rgba(255,255,255,0.04)',
  inputBorder:        'rgba(180,30,30,0.2)',
  text:               '#e2c9a0',
  textMuted:          'rgba(226,201,160,0.5)',
  textFaint:          'rgba(226,201,160,0.32)',
  sectionLine:        'rgba(180,30,30,0.6)',
  divider:            'rgba(180,30,30,0.15)',
  placeholderBg:      'linear-gradient(135deg,#1f0a0a,#2a1010)',
  cardShadow:         '0 4px 24px rgba(0,0,0,0.5)',
  emptyCardBg:        'rgba(255,255,255,0.03)',
  navInactiveSidebar: 'rgba(226,201,160,0.42)',
};

/* ── Light token map ── */
const light = {
  pageBg:             'linear-gradient(160deg,#fdf6ec 0%,#f5ece0 40%,#ede4f5 100%)',
  sidebarBg:          'linear-gradient(180deg,#2a0a0a 0%,#3d1010 60%,#1e0808 100%)',
  sidebarBorder:      'rgba(180,30,30,0.35)',
  navBg:              'rgba(253,246,236,0.94)',
  navBorder:          'rgba(180,30,30,0.18)',
  heroBg:             'linear-gradient(135deg,#f5e6d3 0%,#ecddd0 50%,#e8dff5 100%)',
  heroBorder:         'rgba(180,30,30,0.2)',
  cardBg:             'linear-gradient(145deg,#ffffff,#fdf4ea)',
  cardBorder:         'rgba(180,30,30,0.18)',
  cardBgUser:         'linear-gradient(145deg,#faf5ff,#f3eaff)',
  cardBorderUser:     'rgba(139,92,246,0.22)',
  cardBgBook:         'linear-gradient(145deg,#f0f8ff,#e8f4ff)',
  cardBorderBook:     'rgba(56,189,248,0.22)',
  notifBg:            'linear-gradient(160deg,#fff8f2 0%,#fff2ea 100%)',
  inputBg:            'rgba(180,30,30,0.05)',
  inputBorder:        'rgba(180,30,30,0.2)',
  text:               '#2d1507',
  textMuted:          'rgba(45,21,7,0.55)',
  textFaint:          'rgba(45,21,7,0.35)',
  sectionLine:        'rgba(180,30,30,0.45)',
  divider:            'rgba(180,30,30,0.1)',
  placeholderBg:      'linear-gradient(135deg,#fde8e8,#ffd6d6)',
  cardShadow:         '0 4px 16px rgba(180,30,30,0.07)',
  emptyCardBg:        'rgba(180,30,30,0.03)',
  navInactiveSidebar: 'rgba(226,201,160,0.42)',
};

/* ════════════════════════════════════════════════════════
   GLOBAL STYLES (cursor + keyframes)
════════════════════════════════════════════════════════ */
const GlobalStyles = ({ isDark }) => (
  <style>{`
    *, *::before, *::after {
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg transform='translate(16,16)'%3E%3Cpath d='M0-13 L2.5-2.5 L13 0 L2.5 2.5 L0 13 L-2.5 2.5 L-13 0 L-2.5-2.5Z' fill='%23dc2626' opacity='0.92'/%3E%3Cpath d='M0-13 L2.5-2.5 L13 0 L2.5 2.5 L0 13 L-2.5 2.5 L-13 0 L-2.5-2.5Z' fill='none' stroke='%23fca5a5' stroke-width='0.7'/%3E%3Ccircle cx='0' cy='0' r='2.5' fill='%23e2c9a0'/%3E%3C/g%3E%3C/svg%3E") 16 16, crosshair !important;
    }
    button, a, [role="button"], select {
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Crect x='17' y='2' width='2' height='22' rx='1' fill='%23d1d5db'/%3E%3Cpath d='M17 2 L15 7 L18 5 L21 7 L19 2Z' fill='%23f1f5f9'/%3E%3Crect x='14' y='22' width='8' height='3' rx='1.5' fill='%238b0000'/%3E%3Crect x='16.5' y='25' width='3' height='7' rx='1.5' fill='%233d1a00'/%3E%3Ccircle cx='18' cy='32' r='1.8' fill='%23e2c9a0'/%3E%3C/svg%3E") 18 2, pointer !important;
    }
    @keyframes slideDown {
      from { opacity:0; transform:translateY(-10px) scale(0.96); }
      to   { opacity:1; transform:translateY(0) scale(1); }
    }
    @keyframes bellRing {
      0%,100%{transform:rotate(0deg);}
      15%{transform:rotate(20deg);}
      30%{transform:rotate(-16deg);}
      45%{transform:rotate(12deg);}
      60%{transform:rotate(-8deg);}
      75%{transform:rotate(4deg);}
    }
    @keyframes pulseBadge {
      0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.7);}
      50%{box-shadow:0 0 0 5px rgba(220,38,38,0);}
    }
    @keyframes petalFloat {
      0%,100%{transform:translateY(0) rotate(0deg); opacity:0.55;}
      50%{transform:translateY(-18px) rotate(25deg); opacity:0.85;}
    }
    @keyframes themePop {
      0%{transform:scale(1);}
      40%{transform:scale(1.22) rotate(18deg);}
      100%{transform:scale(1) rotate(0deg);}
    }
    .bell-ring   { animation: bellRing 0.65s ease-in-out; }
    .notif-drop  { animation: slideDown 0.18s ease-out forwards; }
    .pulse-badge { animation: pulseBadge 1.8s ease infinite; }
    .theme-pop   { animation: themePop 0.38s ease-out; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:${isDark?'rgba(180,30,30,0.35)':'rgba(180,30,30,0.22)'}; border-radius:4px; }
  `}</style>
);

/* ════════════════════════════════════════════════════════
   THEME TOGGLE
════════════════════════════════════════════════════════ */
const ThemeToggle = ({ isDark, onToggle }) => {
  const [pop, setPop] = useState(false);
  const handle = () => { setPop(true); onToggle(); setTimeout(()=>setPop(false),400); };

  return (
    <button onClick={handle} title={isDark?'Light mode':'Dark mode'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105 ${pop?'theme-pop':''}`}
      style={{
        background: isDark ? 'rgba(253,224,71,0.1)' : 'rgba(15,23,42,0.07)',
        border: `1px solid ${isDark ? 'rgba(253,224,71,0.28)' : 'rgba(15,23,42,0.14)'}`,
        color: isDark ? '#fde047' : '#1e293b',
      }}>
      {/* Pill track */}
      <div className="relative w-10 h-5 rounded-full transition-all duration-300"
        style={{
          background: isDark ? 'linear-gradient(90deg,#1e1b4b,#312e81)' : 'linear-gradient(90deg,#fde68a,#fb923c)',
          border: `1px solid ${isDark ? 'rgba(99,102,241,0.45)' : 'rgba(251,146,60,0.55)'}`,
        }}>
        {/* Thumb */}
        <div className="absolute top-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            left: isDark ? '1px' : '21px',
            background: isDark ? '#1e1b4b' : '#fff',
            boxShadow: isDark ? '0 0 6px rgba(99,102,241,0.7)' : '0 0 6px rgba(251,146,60,0.6)',
            fontSize: '9px',
          }}>
          {isDark ? '🌙' : '☀️'}
        </div>
      </div>
      <span style={{ fontSize:'11px', letterSpacing:'0.04em', fontWeight:600 }}>
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

/* ════════════════════════════════════════════════════════
   NOTIFICATION PANEL
════════════════════════════════════════════════════════ */
const NotificationPanel = ({ pendingVenues, onApprove, onClose, onNavigate }) => {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const timeAgo = (date) => {
    if (!date) return 'recently';
    const d = Math.floor((Date.now()-new Date(date))/60000);
    if (d<1) return 'just now';
    if (d<60) return `${d}m ago`;
    if (d<1440) return `${Math.floor(d/60)}h ago`;
    return `${Math.floor(d/1440)}d ago`;
  };

  return (
    <div ref={ref} className="notif-drop absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
      style={{
        background: t.notifBg,
        border: '1px solid rgba(180,30,30,0.35)',
        boxShadow: isDark
          ? '0 24px 60px rgba(0,0,0,0.75),0 0 30px rgba(180,30,30,0.1)'
          : '0 20px 50px rgba(180,30,30,0.12),0 4px 20px rgba(0,0,0,0.09)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom:'1px solid rgba(180,30,30,0.18)', background:'rgba(180,30,30,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm">⛩️</span>
          <span className="font-bold text-sm tracking-wide" style={{ color:t.text, fontFamily:'serif' }}>Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingVenues.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background:'rgba(220,38,38,0.15)', color:'#f87171', border:'1px solid rgba(220,38,38,0.3)' }}>
              {pendingVenues.length} new
            </span>
          )}
          <button onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition hover:bg-black/10"
            style={{ color: t.textMuted }}>✕</button>
        </div>
      </div>

      {/* Items */}
      <div className="overflow-y-auto" style={{ maxHeight:'320px' }}>
        {pendingVenues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="text-3xl" style={{ opacity:0.2 }}>🗡️</span>
            <p className="text-xs tracking-wide" style={{ color:t.textFaint }}>All clear — no pending approvals</p>
          </div>
        ) : pendingVenues.map((venue, i) => (
          <div key={venue._id} className="px-4 py-3 transition-colors hover:bg-black/[0.02]"
            style={{ borderBottom: i<pendingVenues.length-1 ? '1px solid rgba(180,30,30,0.09)' : 'none' }}>
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                style={{ border:'1px solid rgba(180,30,30,0.28)' }}>
                {venue.images?.[0]||venue.image
                  ? <img src={venue.images?.[0]||venue.image} alt="" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center text-lg"
                      style={{ background:'rgba(180,30,30,0.1)' }}>🏛️</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color:t.text }}>{venue.name}</p>
                <p className="text-xs truncate" style={{ color:t.textMuted }}>
                  {venue.owner?.name||'Unknown'} · {venue.location?.city||'—'}
                </p>
                <p className="text-xs mt-0.5" style={{ color:'rgba(251,146,60,0.75)' }}>
                  ⏳ Pending · {timeAgo(venue.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <button onClick={() => onApprove(venue._id)}
                className="flex-1 text-xs py-1.5 rounded-lg font-medium transition hover:scale-105"
                style={{ background:'rgba(0,200,80,0.1)', border:'1px solid rgba(0,200,80,0.28)', color:'#4ade80' }}>
                ✓ Approve
              </button>
              <button onClick={() => { onNavigate('venues'); onClose(); }}
                className="flex-1 text-xs py-1.5 rounded-lg font-medium transition hover:scale-105"
                style={{ background:'rgba(180,30,30,0.1)', border:'1px solid rgba(180,30,30,0.28)', color:'#fca5a5' }}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {pendingVenues.length > 0 && (
        <div className="px-4 py-2.5 text-center"
          style={{ borderTop:'1px solid rgba(180,30,30,0.13)', background:'rgba(180,30,30,0.04)' }}>
          <button onClick={() => { onNavigate('venues'); onClose(); }}
            className="text-xs uppercase tracking-widest transition hover:opacity-70"
            style={{ color:'rgba(220,38,38,0.65)', fontFamily:'serif' }}>
            Manage all pending venues →
          </button>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id:'venues',    icon:'🏛️', label:'Manage Venues' },
  { id:'users',     icon:'👤', label:'Manage Users'  },
  { id:'bookings',  icon:'📅', label:'All Bookings'  },
  { id:'analytics', icon:'📊', label:'Analytics'     },
  { id:'settings',  icon:'⚙️', label:'Settings'      },
];

const Sidebar = ({ active, setActive }) => {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  return (
    <aside className="fixed left-0 top-0 h-full w-56 z-20 flex flex-col py-6"
      style={{ background:t.sidebarBg, borderRight:`1px solid ${t.sidebarBorder}` }}>

      <div className="flex items-center gap-3 px-5 mb-10">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ background:'rgba(180,30,30,0.18)', border:'1px solid rgba(180,30,30,0.45)' }}>⛩️</div>
        <span className="font-bold tracking-widest text-sm" style={{ color:'#e2c9a0', fontFamily:'serif' }}>BYE</span>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        {NAV_ITEMS.map(({ id, icon, label }) => {
          const isActive = active===id;
          return (
            <button key={id} onClick={() => setActive(id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-full"
              style={{
                background: isActive ? 'rgba(180,30,30,0.28)' : 'transparent',
                borderLeft: isActive ? '3px solid #dc2626' : '3px solid transparent',
                color: isActive ? '#fca5a5' : t.navInactiveSidebar,
              }}>
              <span className="text-base">{icon}</span>{label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 mt-4 opacity-20">
        <svg viewBox="0 0 100 120" className="w-full" fill="rgba(180,30,30,0.6)">
          <ellipse cx="50" cy="18" rx="12" ry="14"/>
          <rect x="38" y="30" width="24" height="40" rx="4"/>
          <rect x="20" y="35" width="18" height="6" rx="3"/>
          <rect x="62" y="35" width="18" height="6" rx="3"/>
          <rect x="42" y="70" width="8" height="30" rx="3"/>
          <rect x="52" y="70" width="8" height="30" rx="3"/>
        </svg>
      </div>
    </aside>
  );
};

/* ════════════════════════════════════════════════════════
   HELPERS + PETALS + SECTION HEADER
════════════════════════════════════════════════════════ */
const fmt = (n) => Number(n??0).toLocaleString();
const statusStyle = (s) =>
  s==='approved'||s===true
    ? { bg:'rgba(0,200,80,0.08)',  border:'rgba(0,200,80,0.25)',  color:'#4ade80' }
    : s==='rejected'
    ? { bg:'rgba(220,38,38,0.08)', border:'rgba(220,38,38,0.3)',  color:'#f87171' }
    : { bg:'rgba(251,146,60,0.08)',border:'rgba(251,146,60,0.3)', color:'#fb923c' };

const Petals = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
    {[...Array(18)].map((_,i) => (
      <div key={i} className="absolute" style={{
        width:`${6+(i%5)*3}px`, height:`${4+(i%4)*2}px`,
        background: i%3===0?'#f43f5e': i%3===1?'#fb7185':'#fda4af',
        borderRadius:'50% 0 50% 0',
        left:`${(i*37+10)%95}%`, top:`${(i*19+5)%80}%`,
        transform:`rotate(${i*25}deg)`,
        animation:`petalFloat ${4+(i%5)}s ease-in-out infinite`,
        animationDelay:`${(i*0.4)%4}s`,
        opacity:0.6,
      }}/>
    ))}
  </div>
);

const SectionHeader = ({ title }) => {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  return (
    <div className="flex items-center gap-4 mb-5">
      <h2 className="text-lg font-bold whitespace-nowrap" style={{ color:t.text, fontFamily:'serif' }}>{title}</h2>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 h-px" style={{ background:`linear-gradient(90deg,${t.sectionLine},transparent)` }}/>
        <svg viewBox="0 0 80 12" width="80" height="12">
          <path d="M0 6 L60 6 L70 2 L80 6 L70 10 Z" fill="rgba(180,30,30,0.35)"/>
          <line x1="0" y1="6" x2="60" y2="6" stroke="rgba(180,30,30,0.55)" strokeWidth="1"/>
        </svg>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   CARDS
════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, color }) => {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  return (
    <div className="rounded-xl p-4 relative overflow-hidden"
      style={{ background:`${color}${isDark?'0d':'16'}`, border:`1px solid ${color}33` }}>
      <p className="text-xs mb-1 tracking-wide uppercase" style={{ color:t.textMuted }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color, fontFamily:'serif', textShadow: isDark?`0 0 20px ${color}88`:'none' }}>
        {value}
      </p>
    </div>
  );
};

const VenueCard = ({ venue, onApprove, onDelete }) => {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const imgSrc = venue.images?.[0]||venue.image||null;
  const st = statusStyle(venue.isApproved);

  return (
    <div className="rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
      style={{ background:t.cardBg, border:`1px solid ${t.cardBorder}`, boxShadow:t.cardShadow }}>
      <div className="relative h-36 overflow-hidden">
        {imgSrc
          ? <img src={imgSrc} alt={venue.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
          : <div className="w-full h-full flex items-center justify-center" style={{ background:t.placeholderBg }}>
              <span className="text-5xl opacity-25">🏛️</span>
            </div>}
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background:'rgba(180,30,30,0.75)', border:'1px solid rgba(220,38,38,0.5)', color:'#fca5a5' }}>
          {venue.type?.charAt(0)||'?'}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12"
          style={{ background:`linear-gradient(to top,${isDark?'#1a0e0e':'#ffffff'},transparent)` }}/>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color:t.text, fontFamily:'serif' }}>{venue.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full inline-block mt-0.5"
              style={{ background:'rgba(180,30,30,0.1)', color:'#dc2626', border:'1px solid rgba(180,30,30,0.22)' }}>
              {venue.type}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
            style={{ background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>
            {venue.isApproved ? '● Live' : '⏳ Pending'}
          </span>
        </div>
        <p className="text-xs mt-1 truncate" style={{ color:t.textMuted }}>👤 {venue.owner?.name||'Unknown'}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color:t.textFaint }}>📍 {venue.location?.city||'—'}</p>
        <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop:`1px solid ${t.divider}` }}>
          <div>
            <p className="text-xs" style={{ color:t.textFaint }}>Hourly Price</p>
            <p className="font-bold text-sm" style={{ color:'#fb923c' }}>
              ₹{venue.pricePerHour}<span className="text-xs font-normal" style={{ color:t.textFaint }}>/hr</span>
            </p>
          </div>
          <div className="flex gap-1">
            {!venue.isApproved && (
              <button onClick={() => onApprove(venue._id)}
                className="text-xs px-2 py-1 rounded-lg font-medium transition hover:scale-105"
                style={{ background:'rgba(0,200,80,0.1)', border:'1px solid rgba(0,200,80,0.28)', color:'#4ade80' }}>
                ✓ Approve
              </button>
            )}
            <button onClick={() => onDelete(venue._id)}
              className="text-xs px-2 py-1 rounded-lg font-medium transition hover:scale-105"
              style={{ background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.28)', color:'#f87171' }}>
              🗑 Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserCard = ({ u, onRoleChange, onDelete }) => {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const rc = u.role==='admin'
    ? { color:'#f87171', bg:'rgba(220,38,38,0.1)',  border:'rgba(220,38,38,0.28)'  }
    : u.role==='venueOwner'
    ? { color:'#fb923c', bg:'rgba(251,146,60,0.1)', border:'rgba(251,146,60,0.28)' }
    : { color:'#60a5fa', bg:'rgba(96,165,250,0.1)', border:'rgba(96,165,250,0.28)' };

  return (
    <div className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ background:t.cardBgUser, border:`1px solid ${t.cardBorderUser}`, boxShadow:t.cardShadow }}>
      <div className="flex justify-between items-start mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background:'rgba(139,92,246,0.15)', color:'#a78bfa', border:'1px solid rgba(139,92,246,0.35)' }}>
          {u.name?.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background:rc.bg, color:rc.color, border:`1px solid ${rc.border}` }}>{u.role}</span>
      </div>
      <p className="font-bold text-sm" style={{ color:t.text, fontFamily:'serif' }}>{u.name}</p>
      <p className="text-xs mt-0.5 truncate" style={{ color:t.textMuted }}>{u.email}</p>
      {u.phone && <p className="text-xs mt-0.5" style={{ color:t.textFaint }}>{u.phone}</p>}
      <p className="text-xs mt-1" style={{ color:'rgba(139,92,246,0.65)' }}>
        Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
      </p>
      <div className="mt-3 pt-2" style={{ borderTop:'1px solid rgba(139,92,246,0.12)' }}>
        <p className="text-xs mb-1.5" style={{ color:t.textFaint }}>Change Role:</p>
        <div className="flex gap-1 flex-wrap">
          {['booker','venueOwner','admin'].map(role => (
            <button key={role} onClick={() => onRoleChange(u._id,role)} disabled={u.role===role}
              className="text-xs px-2 py-1 rounded-lg transition"
              style={u.role===role
                ? { background:'rgba(139,92,246,0.2)', color:'#a78bfa', border:'1px solid rgba(139,92,246,0.4)', cursor:'default' }
                : { background: isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)', color:t.textMuted, border:`1px solid ${isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.1)'}` }}>
              {role==='venueOwner'?'Owner':role.charAt(0).toUpperCase()+role.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {u.role!=='admin' && (
        <button onClick={() => onDelete(u._id)}
          className="mt-2 w-full text-xs py-1.5 rounded-lg transition"
          style={{ background:'rgba(220,38,38,0.07)', border:'1px solid rgba(220,38,38,0.2)', color:'#f87171' }}>
          Delete User
        </button>
      )}
    </div>
  );
};

const BookingCard = ({ booking }) => {
  const { isDark } = useTheme();
  const t = isDark ? dark : light;
  const st = statusStyle(booking.status);
  return (
    <div className="rounded-xl p-4"
      style={{ background:t.cardBgBook, border:`1px solid ${t.cardBorderBook}`, boxShadow:t.cardShadow }}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-semibold text-sm" style={{ color:t.text, fontFamily:'serif' }}>{booking.booker?.name}</p>
          <p className="text-xs" style={{ color:t.textMuted }}>{booking.booker?.email}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full capitalize"
          style={{ background:st.bg, border:`1px solid ${st.border}`, color:st.color }}>{booking.status}</span>
      </div>
      <p className="text-xs mb-3 font-medium" style={{ color:'#38bdf8' }}>📍 {booking.venue?.name}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label:'Date', val: booking.eventDate?new Date(booking.eventDate).toLocaleDateString():'—' },
          { label:'Time', val:`${booking.startTime||'—'} – ${booking.endTime||'—'}` },
          { label:'Guests', val:booking.guestCount??'—' },
          { label:'Total', val:`₹${booking.totalPrice??'—'}`, hi:true },
        ].map(({ label,val,hi }) => (
          <div key={label}>
            <p style={{ color:t.textFaint }}>{label}</p>
            <p style={{ color: hi?'#fb923c':t.text, fontWeight:hi?700:400 }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   TOAST + SAMURAI SVG
════════════════════════════════════════════════════════ */
const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const e = type==='error';
  return (
    <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl"
      style={{
        background: e?'rgba(220,38,38,0.15)':'rgba(0,200,80,0.12)',
        border:`1px solid ${e?'rgba(220,38,38,0.4)':'rgba(0,200,80,0.35)'}`,
        color: e?'#f87171':'#4ade80', backdropFilter:'blur(12px)',
      }}>
      {e?'✕ ':'✓ '}{msg}
    </div>
  );
};

const SamuraiHero = () => (
  <div className="absolute right-32 top-1/2 -translate-y-1/2" style={{ width:'200px', height:'200px' }}>
    <div className="absolute inset-0 rounded-full" style={{
      background:'radial-gradient(circle at 40% 35%,#7f1d1d 0%,#450a0a 60%,transparent 100%)',
      boxShadow:'0 0 80px rgba(180,30,30,0.6),0 0 40px rgba(180,30,30,0.3)',
    }}/>
    <svg viewBox="0 0 200 220" className="absolute inset-0 w-full h-full"
      style={{ filter:'drop-shadow(0 0 12px rgba(180,30,30,0.8))' }}>
      <ellipse cx="100" cy="38" rx="18" ry="20" fill="#1a0505"/>
      <path d="M72 32 Q60 20 65 10 Q80 28 82 34Z" fill="#2a0808"/>
      <path d="M128 32 Q140 20 135 10 Q120 28 118 34Z" fill="#2a0808"/>
      <path d="M88 18 Q100 5 112 18 Q100 14 88 18Z" fill="#3d0c0c"/>
      <rect x="86" y="48" width="28" height="16" rx="4" fill="#2a0808"/>
      <rect x="90" y="52" width="8" height="4" rx="1" fill="#1a0505"/>
      <rect x="102" y="52" width="8" height="4" rx="1" fill="#1a0505"/>
      <rect x="92" y="62" width="16" height="10" rx="2" fill="#1a0505"/>
      <path d="M60 72 Q50 65 55 58 Q70 68 72 78Z" fill="#2a0808"/>
      <path d="M140 72 Q150 65 145 58 Q130 68 128 78Z" fill="#2a0808"/>
      <path d="M58 80 Q45 75 48 68 Q64 76 66 86Z" fill="#1a0505"/>
      <path d="M142 80 Q155 75 152 68 Q136 76 134 86Z" fill="#1a0505"/>
      <rect x="72" y="72" width="56" height="60" rx="6" fill="#1a0505"/>
      <line x1="80" y1="82" x2="120" y2="82" stroke="#3d0c0c" strokeWidth="1.5"/>
      <line x1="80" y1="92" x2="120" y2="92" stroke="#3d0c0c" strokeWidth="1.5"/>
      <line x1="80" y1="102" x2="120" y2="102" stroke="#3d0c0c" strokeWidth="1.5"/>
      <line x1="80" y1="112" x2="120" y2="112" stroke="#3d0c0c" strokeWidth="1.5"/>
      <circle cx="100" cy="97" r="8" fill="none" stroke="#8b0000" strokeWidth="1.5"/>
      <circle cx="100" cy="97" r="4" fill="#8b0000" opacity="0.7"/>
      <rect x="56" y="78" width="18" height="50" rx="6" fill="#1a0505"/>
      <rect x="126" y="78" width="18" height="50" rx="6" fill="#1a0505"/>
      <rect x="57" y="100" width="16" height="20" rx="3" fill="#2a0808"/>
      <rect x="127" y="100" width="16" height="20" rx="3" fill="#2a0808"/>
      <ellipse cx="65" cy="135" rx="7" ry="9" fill="#1a0505"/>
      <ellipse cx="135" cy="135" rx="7" ry="9" fill="#1a0505"/>
      <rect x="138" y="60" width="3" height="90" rx="1.5" fill="#c0c0c0"/>
      <rect x="133" y="122" width="13" height="4" rx="2" fill="#8b0000"/>
      <rect x="138" y="126" width="3" height="25" rx="1.5" fill="#3d1a00"/>
      <path d="M72 130 Q68 145 72 160 L88 160 L88 130Z" fill="#1a0505"/>
      <path d="M128 130 Q132 145 128 160 L112 160 L112 130Z" fill="#1a0505"/>
      <rect x="88" y="130" width="24" height="32" rx="2" fill="#1a0505"/>
      <rect x="80" y="160" width="16" height="45" rx="4" fill="#150404"/>
      <rect x="104" y="160" width="16" height="45" rx="4" fill="#150404"/>
      <rect x="79" y="175" width="18" height="22" rx="3" fill="#1a0505"/>
      <rect x="103" y="175" width="18" height="22" rx="3" fill="#1a0505"/>
      <ellipse cx="88" cy="207" rx="12" ry="6" fill="#0d0303"/>
      <ellipse cx="112" cy="207" rx="12" ry="6" fill="#0d0303"/>
    </svg>
  </div>
);

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDark, setIsDark]       = useState(true);
  const [users, setUsers]         = useState([]);
  const [venues, setVenues]       = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bellAnim, setBellAnim]   = useState(false);
  const [toast, setToast]         = useState({ msg:'', type:'' });
  const [activeTab, setActiveTab] = useState('venues');
  const [searchQuery, setSearchQuery] = useState('');
  const bellRef = useRef(null);
  const t = isDark ? dark : light;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [u,v,b] = await Promise.all([getAllUsers(), getAllVenuesAdmin(), getAllBookingsAdmin()]);
      setUsers(u.users??[]);
      setVenues(v.venues??[]);
      setBookings(b.bookings??[]);
    } catch { showToast('Failed to load data','error'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'' }), 3000);
  };

  const handleApproveVenue = async (id) => {
    try {
      await approveVenue(id);
      setVenues(vs => vs.map(v => v._id===id ? {...v,isApproved:true} : v));
      showToast('Venue approved');
    } catch { showToast('Failed to approve venue','error'); }
  };

  const handleDeleteVenue = async (id) => {
    if (!window.confirm('Delete this venue permanently?')) return;
    try {
      await adminDeleteVenue(id);
      setVenues(vs => vs.filter(v => v._id!==id));
      showToast('Venue deleted');
    } catch { showToast('Failed to delete venue','error'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(id);
      setUsers(us => us.filter(u => u._id!==id));
      showToast('User deleted');
    } catch { showToast('Failed to delete user','error'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      setUsers(us => us.map(u => u._id===id ? {...u,role} : u));
      showToast(`Role updated to ${role}`);
    } catch { showToast('Failed to update role','error'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const pendingVenues = venues.filter(v => !v.isApproved);
  const bookers       = users.filter(u => u.role==='booker');
  const owners        = users.filter(u => u.role==='venueOwner');
  const q = searchQuery.toLowerCase();
  const filteredVenues   = venues.filter(v => v.name?.toLowerCase().includes(q));
  const filteredUsers    = users.filter(u => u.name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q));
  const filteredBookings = bookings.filter(b => b.booker?.name?.toLowerCase().includes(q)||b.venue?.name?.toLowerCase().includes(q));

  const stats = [
    { label:'Total Users',    value:fmt(users.length),         color:'#f87171' },
    { label:'Bookers',        value:fmt(bookers.length),       color:'#fb923c' },
    { label:'Venue Owners',   value:fmt(owners.length),        color:'#a78bfa' },
    { label:'Pending Venues', value:fmt(pendingVenues.length), color:'#38bdf8' },
    { label:'Total Bookings', value:fmt(bookings.length),      color:'#4ade80' },
  ];

  return (
    <ThemeContext.Provider value={{ isDark }}>
      <GlobalStyles isDark={isDark}/>

      <div className="min-h-screen flex" style={{ background:t.pageBg }}>
        <Sidebar active={activeTab} setActive={setActiveTab}/>

        <div className="flex-1 ml-56 flex flex-col min-h-screen">

          {/* ─── NAVBAR ─── */}
          <header className="sticky top-0 z-20 flex items-center gap-3 px-8 py-3"
            style={{ background:t.navBg, backdropFilter:'blur(16px)', borderBottom:`1px solid ${t.navBorder}` }}>

            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="BYE"
                className="w-10 h-10 rounded-full object-cover"
                style={{ boxShadow:'0 0 14px rgba(220,38,38,0.4)', border:'1px solid rgba(220,38,38,0.3)' }}
                onClick={() => navigate('/')}
                onError={e => { e.target.style.display='none'; }}/>
              <span className="font-bold text-base tracking-wider" style={{ color:t.text, fontFamily:'serif' }}>
                Admin Dashboard
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl ml-4 flex-1 max-w-sm"
              style={{ background:t.inputBg, border:`1px solid ${t.inputBorder}` }}>
              <span style={{ color:'rgba(180,30,30,0.6)' }}>🔍</span>
              <input type="text" placeholder="Search..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm focus:outline-none flex-1"
                style={{ color:t.text, caretColor:'#dc2626' }}/>
            </div>

            <div className="flex-1"/>

            {/* ✨ Theme Toggle */}
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)}/>

            {/* 🔔 Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  setNotifOpen(o => !o);
                  if (!notifOpen && pendingVenues.length>0) {
                    setBellAnim(true);
                    setTimeout(()=>setBellAnim(false),700);
                  }
                }}
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110"
                style={{
                  background: notifOpen?'rgba(180,30,30,0.25)':'rgba(180,30,30,0.1)',
                  border:`1px solid ${notifOpen?'rgba(220,38,38,0.5)':'rgba(180,30,30,0.3)'}`,
                  boxShadow: notifOpen?'0 0 14px rgba(220,38,38,0.3)':'none',
                }}>
                <span className={`text-base select-none ${bellAnim?'bell-ring':''}`}>🔔</span>
                {pendingVenues.length>0 && (
                  <span className="pulse-badge absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-bold"
                    style={{ background:'#dc2626', color:'#fff', fontSize:'9px' }}>
                    {pendingVenues.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationPanel
                  pendingVenues={pendingVenues}
                  onApprove={handleApproveVenue}
                  onClose={() => setNotifOpen(false)}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}
            </div>

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background:'rgba(180,30,30,0.2)', border:'1px solid rgba(180,30,30,0.4)', color:'#fca5a5' }}>
                {user?.name?.charAt(0)?.toUpperCase()??'A'}
              </div>
              <span className="text-sm" style={{ color:t.textMuted }}>{user?.name?.split(' ')[0]??'Admin'}</span>
            </div>

            <button onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium transition hover:scale-105"
              style={{ background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.35)', color:'#f87171' }}>
              Logout
            </button>
          </header>

          {/* ─── HERO ─── */}
          <div className="relative overflow-hidden px-8 py-8 flex items-center"
            style={{ background:t.heroBg, borderBottom:`1px solid ${t.heroBorder}`, minHeight:'160px' }}>
            <Petals/>
            <div className="relative z-10">
              <h1 className="text-5xl font-black tracking-widest uppercase"
                style={{ color:t.text, fontFamily:'serif', textShadow: isDark?'0 0 40px rgba(220,38,38,0.3)':'none', letterSpacing:'0.12em' }}>
                ADMIN DASHBOARD
              </h1>
              <p className="mt-1 text-sm tracking-widest uppercase" style={{ color:'rgba(180,30,30,0.7)' }}>
                System Overview &amp; Management
              </p>
            </div>
            <SamuraiHero/>
            <div className="absolute right-0 top-0 h-full opacity-15 pointer-events-none">
              <svg viewBox="0 0 200 200" height="100%">
                {[60,90,120,150].map((x,i) => (
                  <g key={i}>
                    <line x1={x} y1="200" x2={x+(i%2===0?-10:10)} y2="60" stroke="rgba(180,30,30,0.6)" strokeWidth="2"/>
                    {[80,110,140].map(y => (
                      <ellipse key={y} cx={x+(y%40-20)} cy={y} rx="20" ry="8" fill="rgba(180,30,30,0.2)"/>
                    ))}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* ─── STATS ─── */}
          <div className="px-8 py-5">
            <SectionHeader title="Statistics cards"/>
            <div className="grid grid-cols-5 gap-4">
              {stats.map((s,i) => (
                <StatCard key={i} label={s.label} value={loading?'—':s.value} color={s.color}/>
              ))}
            </div>
          </div>

          {/* ─── CONTENT ─── */}
          <div className="flex-1 px-8 pb-16 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full border-2 mx-auto mb-3 animate-spin"
                    style={{ borderColor:'rgba(220,38,38,0.3)', borderTopColor:'#dc2626' }}/>
                  <p className="text-sm" style={{ color:t.textFaint }}>Loading system data...</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab==='venues' && (
                  <><SectionHeader title="Venue cards"/>
                    {filteredVenues.length===0
                      ? <p className="text-sm" style={{ color:t.textFaint }}>No venues found.</p>
                      : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredVenues.map(v => <VenueCard key={v._id} venue={v} onApprove={handleApproveVenue} onDelete={handleDeleteVenue}/>)}
                        </div>}
                  </>
                )}
                {activeTab==='users' && (
                  <><SectionHeader title="User management"/>
                    {filteredUsers.length===0
                      ? <p className="text-sm" style={{ color:t.textFaint }}>No users found.</p>
                      : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredUsers.map(u => <UserCard key={u._id} u={u} onRoleChange={handleRoleChange} onDelete={handleDeleteUser}/>)}
                        </div>}
                  </>
                )}
                {activeTab==='bookings' && (
                  <><SectionHeader title="All Bookings"/>
                    {filteredBookings.length===0
                      ? <p className="text-sm" style={{ color:t.textFaint }}>No bookings found.</p>
                      : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredBookings.map(b => <BookingCard key={b._id} booking={b}/>)}
                        </div>}
                  </>
                )}
                {activeTab==='analytics' && (
                  <><SectionHeader title="Analytics"/>
                    <div className="rounded-xl p-10 text-center" style={{ background:t.emptyCardBg, border:`1px solid ${t.divider}` }}>
                      <p className="text-4xl mb-3">📊</p>
                      <p className="font-bold text-lg" style={{ color:t.text, fontFamily:'serif' }}>Analytics Coming Soon</p>
                      <p className="text-sm mt-1" style={{ color:t.textFaint }}>Charts and insights will appear here.</p>
                    </div>
                  </>
                )}
                {activeTab==='settings' && (
                  <><SectionHeader title="Settings"/>
                    <div className="rounded-xl p-10 text-center" style={{ background:t.emptyCardBg, border:`1px solid ${t.divider}` }}>
                      <p className="text-4xl mb-3">⚙️</p>
                      <p className="font-bold text-lg" style={{ color:t.text, fontFamily:'serif' }}>Settings Panel</p>
                      <p className="text-sm mt-1" style={{ color:t.textFaint }}>Configuration options will appear here.</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="text-center py-3" style={{ borderTop:`1px solid ${t.divider}` }}>
            <p className="text-xs tracking-widest italic" style={{ color:'rgba(180,30,30,0.45)' }}>EASY. BOOK. ENJOY.</p>
          </div>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type}/>
    </ThemeContext.Provider>
  );
};

export default AdminDashboard;
