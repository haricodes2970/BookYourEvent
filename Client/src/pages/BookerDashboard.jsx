import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";
import { formatINR, formatDateIN, timeAgo, truncate } from "../utils/helpers";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  overview:   "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  venues:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  bookings:   "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  payments:   "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  chat:       "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  profile:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  logout:     "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  sun:        "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z",
  moon:       "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  search:     "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  send:       "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  edit:       "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  x:          "M18 6L6 18M6 6l12 12",
  check:      "M20 6L9 17l-5-5",
  alert:      "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

// ─────────────────────────────────────────────────────────────────────────────
//  COLOR SYSTEM — extracted from Image 2
//  Light:  warm ivory bg #f5f0e8, cream cards #fffdf7, gold CTA #C8973A
//  Dark:   true black bg #0a0a0a, charcoal cards #161616, same gold CTA
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  // Primary gold — the signature CTA color from Image 2
  gold:        "#C8973A",
  goldHover:   "#B5862F",
  goldLight:   "rgba(200,151,58,0.12)",
  goldDark:    "rgba(200,151,58,0.18)",

  // Hero gradient — warm champagne-to-ivory in light, dark charcoal-to-black in dark
  heroLight:   "linear-gradient(135deg, #2d6a4f 0%, #1b4332 40%, #6b3fa0 80%, #3d1c8a 100%)",
  heroDark:    "linear-gradient(135deg, #1a3a2a 0%, #0d2218 40%, #3d2060 80%, #1e0e4a 100%)",

  // Stat card gradients — kept from original but shifted to match image palette
  teal:        "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",      // teal stat (Total Venues)
  amber:       "linear-gradient(135deg, #d97706 0%, #b45309 100%)",      // amber stat (Upcoming)
  green:       "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",      // green stat (Revenue)
  purple:      "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",      // purple stat (Pending)

  // Error/danger
  red:         "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  redSolid:    "#dc2626",

  // Sidebar active — gold pill in both modes
  sidebarActive: "#C8973A",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            className="px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl pointer-events-auto text-white"
            style={{ background: t.type === "success" ? C.green : C.red }}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, push };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    pending:         "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    payment_pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    approved:        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    confirmed:       "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    rejected:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    paid:            "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    expired:         "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || map.expired}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, grad }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }} transition={{ duration: 0.15 }}
      className="rounded-2xl p-5 relative overflow-hidden text-white shadow-lg cursor-default"
      style={{ background: grad }}>
      <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute -right-1 bottom-1 w-10 h-10 rounded-full bg-white/5" />
      <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </motion.div>
  );
}

// ─── Hero Banner — Image 2 style: large serif title, warm gradient ────────────
function HeroBanner({ name, dark }) {
  return (
    <div className="relative rounded-2xl overflow-hidden p-8"
      style={{ background: dark ? C.heroDark : C.heroLight }}>
      {/* Decorative blobs matching Image 1 owner dashboard style */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full"
        style={{ background: "rgba(107,63,160,0.3)" }} />
      <div className="absolute right-24 -bottom-12 w-40 h-40 rounded-full"
        style={{ background: "rgba(13,148,136,0.25)" }} />
      <div className="absolute right-8 top-8 w-20 h-20 rounded-full"
        style={{ background: "rgba(200,151,58,0.2)" }} />
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(255,255,255,0.6)" }}>Booker Dashboard</p>
        {/* Image 2: large serif-style title */}
        <h1 className="text-4xl font-black text-white mb-2"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "-0.02em" }}>
          Booker Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)" }} className="text-sm">
          Hey, {name?.split(" ")[0] || "there"} 👋  — here's your booking summary
        </p>
      </div>
    </div>
  );
}

// ─── Missing Credentials Popup ────────────────────────────────────────────────
function MissingCredentials({ user, onLater, onUpdateNow }) {
  const missing = [];
  if (!user?.phone) missing.push("phone number");
  if (!user?.username) missing.push("username");
  if (!user?.name) missing.push("full name");
  if (missing.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: C.goldLight }}>
            <Icon d={ICONS.alert} size={18} style={{ color: C.gold }} />
          </div>
          <div>
            <p className="font-bold text-zinc-900 dark:text-white">Complete your profile</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Missing: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{missing.join(", ")}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onLater}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700
              text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Later
          </button>
          <button onClick={onUpdateNow}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background: C.gold }}>
            Update Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ user }) {
  const [chats,    setChats]    = useState([]);
  const [active,   setActive]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => { api.get("/chats").then((r) => setChats(r.data?.chats || r.data || [])).catch(() => {}); }, []);
  useEffect(() => {
    if (!active) return;
    api.get(`/chats/${active._id}/messages`).then((r) => { setMessages(r.data?.messages || r.data || []); scrollBottom(); }).catch(() => {});
    api.patch(`/chats/${active._id}/read`).catch(() => {});
  }, [active]);
  useEffect(() => { scrollBottom(); }, [messages]);
  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const send = async () => {
    if (!text.trim() || !active || sending) return;
    const msg = text.trim(); setText(""); setSending(true);
    try { const r = await api.post(`/chats/${active._id}/messages`, { text: msg }); setMessages((p) => [...p, r.data?.message || r.data]); }
    catch { setText(msg); } finally { setSending(false); }
  };

  const opponent = (chat) => chat.participants?.find((p) => p._id !== user?._id);
  const avatar   = (name) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=c8973a&fontColor=ffffff`;

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden
        border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900">
        <div className="p-4 border-b border-stone-200 dark:border-zinc-800">
          <p className="font-bold text-zinc-900 dark:text-white text-sm">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && <p className="text-center text-zinc-400 text-sm mt-8">No conversations yet</p>}
          {chats.map((c) => {
            const op = opponent(c);
            return (
              <button key={c._id} onClick={() => setActive(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={active?._id === c._id ? { background: C.goldLight } : {}}>
                <img src={avatar(op?.name)} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{op?.name || "User"}</p>
                  <p className="text-xs text-zinc-400 truncate">{c.lastMessage?.content?.slice(0, 28) || op?.email || "—"}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 font-bold"
                    style={{ background: C.gold }}>{c.unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden
        border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-400 text-sm">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={avatar(opponent(active)?.name)} alt="" className="w-8 h-8 rounded-full" />
                <p className="font-bold text-zinc-900 dark:text-white text-sm">{opponent(active)?.name}</p>
              </div>
              <button onClick={() => setActive(null)} className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400">
                <Icon d={ICONS.x} size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {messages.map((m, i) => {
                const mine = m.sender?._id === user?._id || m.sender === user?._id;
                const body = m.text || m.content || "";
                return (
                  <div key={m._id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm
                      ${mine ? "text-white rounded-br-sm" : "bg-stone-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-sm"}`}
                      style={mine ? { background: C.gold } : {}}>
                      {body}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="px-4 py-3 border-t border-stone-100 dark:border-zinc-800 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                  focus:outline-none placeholder:text-zinc-400"
                style={{ outline: "none" }}
                onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${C.gold}40`}
                onBlur={(e) => e.target.style.boxShadow = "none"} />
              <button onClick={send} disabled={sending || !text.trim()}
                className="p-2.5 rounded-xl text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: C.gold }}>
                <Icon d={ICONS.send} size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookerDashboard() {
  const { user, logout, login } = useAuth();
  const navigate                = useNavigate();
  const { toasts, push }        = useToast();

  const [tab,  setTab]  = useState("venues"); // Image 2 shows venue grid as main view
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("bookerTheme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return saved === "dark";
  });

  const [bookings,  setBookings]  = useState([]);
  const [venues,    setVenues]    = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [stats,     setStats]     = useState({ total: 0, pending: 0, confirmed: 0, paid: 0 });
  const [loading,   setLoading]   = useState(true);

  const [venueSearch,      setVenueSearch]      = useState("");
  const [venueTypeFilter,  setVenueTypeFilter]  = useState("All");
  const [bookingFilter,    setBookingFilter]    = useState("all");
  const [raiseBidId,       setRaiseBidId]       = useState(null);
  const [raiseBidAmount,   setRaiseBidAmount]   = useState("");
  const [unreadChats,      setUnreadChats]      = useState(false);
  const [showMissingPopup, setShowMissingPopup] = useState(false);

  const [editMode,       setEditMode]       = useState(false);
  const [profileForm,    setProfileForm]    = useState({ name: "", username: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  const [lang, setLang] = useState(() => localStorage.getItem("appLang") || "en");
  const LANGS = [
    { code: "en", native: "English",  font: "DM Sans" },
    { code: "hi", native: "हिन्दी",    font: "Noto Sans Devanagari" },
    { code: "te", native: "తెలుగు",   font: "Noto Sans Telugu" },
    { code: "ta", native: "தமிழ்",    font: "Noto Sans Tamil" },
    { code: "kn", native: "ಕನ್ನಡ",    font: "Noto Sans Kannada" },
  ];
  const currentFont = LANGS.find((l) => l.code === lang)?.font || "DM Sans";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bookerTheme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (lang !== "en") {
      const id = "lang-font";
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id; link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${currentFont.replace(/ /g, "+")}&display=swap`;
        document.head.appendChild(link);
      }
    }
    localStorage.setItem("appLang", lang);
  }, [lang, currentFont]);

  useEffect(() => {
    if (!user) return;
    const dismissed = sessionStorage.getItem("missingCredsDismissed");
    if (!dismissed && (!user.phone || !user.username)) setShowMissingPopup(true);
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, vRes, pRes] = await Promise.all([
        api.get("/bookings/my-bookings"),
        api.get("/venues"),
        api.get("/payments/my-payments"),
      ]);
      const b = Array.isArray(bRes.data) ? bRes.data : bRes.data?.bookings || [];
      const v = Array.isArray(vRes.data) ? vRes.data : vRes.data?.venues   || [];
      const p = Array.isArray(pRes.data) ? pRes.data : pRes.data?.payments || [];
      setBookings(b); setVenues(v); setPayments(p);
      setStats({
        total:     b.length,
        pending:   b.filter((x) => ["pending", "payment_pending"].includes(x.status)).length,
        confirmed: b.filter((x) => ["approved", "confirmed"].includes(x.status)).length,
        paid:      b.filter((x) => x.status === "paid").length,
      });
    } catch { push("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    api.get("/chats").then((r) => {
      const list = Array.isArray(r.data) ? r.data : r.data?.chats || [];
      setUnreadChats(list.some((c) => c.unreadCount > 0));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || "", username: user.username || "", phone: user.phone || "" });
  }, [user]);

  const handleRaiseBid = async (bookingId) => {
    if (!raiseBidAmount || isNaN(raiseBidAmount)) return push("Enter a valid amount", "error");
    try {
      await api.patch(`/bookings/${bookingId}/raise-bid`, { newBidAmount: Number(raiseBidAmount) });
      push("Bid raised!"); setRaiseBidId(null); setRaiseBidAmount(""); fetchData();
    } catch (err) { push(err.response?.data?.message || "Failed to raise bid", "error"); }
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      const r = await api.patch("/auth/update-profile", profileForm);
      if (r.data.token) login(r.data.user, r.data.token);
      push("Profile updated!"); setEditMode(false);
    } catch (err) { push(err.response?.data?.message || "Failed to update profile", "error"); }
    finally { setProfileLoading(false); }
  };

  const handleSwitchRole = async () => {
    try {
      const r = await api.patch("/auth/switch-role", { role: "venueOwner" });
      login(r.data.user, r.data.token);
      push("Switched to Venue Owner!");
      setTimeout(() => navigate("/owner/dashboard"), 800);
    } catch { push("Switch failed", "error"); }
  };

  // Venue type filters — Image 2 shows pill buttons: All, Marriage Hall, Rooftop, Resort, Farmhouse, Studio
  const venueTypes = ["All", ...new Set(venues.map((v) => v.venueType || v.type).filter(Boolean))];

  const filteredVenues = venues.filter((v) => {
    const matchActive = v.isActive !== false && v.isApproved;
    const matchSearch = !venueSearch ||
      v.name?.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.location?.city?.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.city?.toLowerCase().includes(venueSearch.toLowerCase());
    const matchType = venueTypeFilter === "All" || (v.venueType || v.type) === venueTypeFilter;
    return matchActive && matchSearch && matchType;
  });

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    if (bookingFilter === "pending") return ["pending", "payment_pending"].includes(b.status);
    return b.status === bookingFilter;
  });

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const avatar = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=c8973a&fontColor=ffffff`;

  const TABS = [
    { key: "overview",  icon: ICONS.overview },
    { key: "venues",    icon: ICONS.venues },
    { key: "bookings",  icon: ICONS.bookings },
    { key: "payments",  icon: ICONS.payments },
    { key: "chat",      icon: ICONS.chat,    dot: unreadChats },
    { key: "profile",   icon: ICONS.profile },
  ];

  const BOOKING_FILTERS = ["all", "pending", "approved", "confirmed", "paid", "rejected", "expired"];

  // ── Page background and card colors based on dark mode ─────────────────────
  // Light: warm ivory #f5f0e8 bg, cream white cards
  // Dark:  true black #0a0a0a bg, #161616 cards
  const pageBg    = dark ? "#0a0a0a" : "#f5f0e8";
  const cardBg    = dark ? "#161616" : "#fffdf7";
  const cardBorder = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const textMain  = dark ? "#f5f0e8" : "#1a1209";
  const textMuted = dark ? "rgba(245,240,232,0.5)" : "rgba(26,18,9,0.45)";
  const sidebarBg = dark ? "#111111" : "#fffff8";
  const sidebarBorder = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
  const inputBg   = dark ? "#1e1e1e" : "#f0ebe0";

  return (
    <div style={{ fontFamily: `'${currentFont}', sans-serif`, background: pageBg, minHeight: "100vh" }}
      className="flex">

      <Toast toasts={toasts} />

      {showMissingPopup && (
        <MissingCredentials user={user}
          onLater={() => { sessionStorage.setItem("missingCredsDismissed", "1"); setShowMissingPopup(false); }}
          onUpdateNow={() => { setShowMissingPopup(false); setTab("profile"); setEditMode(true); }} />
      )}

      {/* ── Sidebar — Image 2 style: clean, top-nav feel but sidebar ─── */}
      <aside style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
        className="fixed left-0 top-0 h-full w-[68px] flex flex-col items-center z-40 py-4 gap-1">

        {/* Logo — Image 2: circular B.Y monogram */}
        <button onClick={() => navigate("/")}
          className="w-11 h-11 rounded-full flex items-center justify-center mb-4 flex-shrink-0"
          style={{ background: "transparent", border: `2px solid ${C.gold}` }}>
          <span style={{ color: C.gold, fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 11, letterSpacing: "-0.02em" }}>B.Y</span>
        </button>

        {TABS.map(({ key, icon, dot }) => (
          <button key={key} onClick={() => setTab(key)} title={key}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={tab === key
              ? { background: C.gold, color: "#fff", boxShadow: `0 4px 14px ${C.gold}50` }
              : { color: dark ? "rgba(245,240,232,0.4)" : "rgba(26,18,9,0.35)" }}>
            <Icon d={icon} size={18} />
            {dot && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
        ))}

        <div className="flex-1" />

        <button onClick={() => setDark((p) => !p)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: dark ? "rgba(245,240,232,0.4)" : "rgba(26,18,9,0.35)" }}>
          <Icon d={dark ? ICONS.sun : ICONS.moon} size={18} />
        </button>

        <button onClick={() => setTab("profile")} className="mt-1">
          <img src={user?.avatar || avatar(user?.name)} alt=""
            className="w-9 h-9 rounded-full object-cover"
            style={{ ring: `2px solid ${C.gold}60` }} />
        </button>

        <button onClick={() => { logout(); navigate("/login"); }} title="Logout"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors mt-1 mb-1"
          style={{ color: "#dc2626" }}>
          <Icon d={ICONS.logout} size={18} />
        </button>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="ml-[68px] flex-1 min-h-screen p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="max-w-6xl mx-auto">

            {/* ── Overview ──────────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-6">
                <HeroBanner name={user?.name} dark={dark} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Bookings" value={stats.total}     grad={C.teal}   />
                  <StatCard label="Pending"         value={stats.pending}   grad={C.amber}  />
                  <StatCard label="Confirmed"       value={stats.confirmed} grad={C.purple} />
                  <StatCard label="Paid"            value={stats.paid}      grad={C.green}  />
                </div>

                <div className="rounded-2xl overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="px-6 py-4 flex items-center justify-between"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <h2 className="font-bold text-sm" style={{ color: textMain }}>Recent Bookings</h2>
                    <button onClick={() => setTab("bookings")}
                      className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80"
                      style={{ color: C.gold }}>
                      View all <Icon d={ICONS.arrowRight} size={13} />
                    </button>
                  </div>
                  {loading ? (
                    <p className="text-center py-12 text-sm" style={{ color: textMuted }}>Loading…</p>
                  ) : recentBookings.length === 0 ? (
                    <p className="text-center py-12 text-sm" style={{ color: textMuted }}>No bookings yet</p>
                  ) : (
                    <div>
                      {recentBookings.map((b) => (
                        <div key={b._id} className="px-6 py-4 flex items-center gap-4 transition-colors"
                          style={{ borderBottom: `1px solid ${cardBorder}` }}
                          onMouseEnter={(e) => e.currentTarget.style.background = dark ? "#1e1e1e" : "#f8f4ec"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: textMain }}>{b.venue?.name || "Venue"}</p>
                            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                              {formatDateIN(b.eventDate)} · {formatINR(b.bidAmount)} · {timeAgo(b.createdAt)}
                            </p>
                          </div>
                          <Badge status={b.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Venues — Image 2 exact layout: pill filters + 2-col card grid ── */}
            {tab === "venues" && (
              <div className="space-y-5">
                {/* Image 2: large serif title */}
                <h1 className="text-4xl font-black" style={{
                  color: textMain,
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  letterSpacing: "-0.02em",
                }}>
                  Booker Dashboard
                </h1>

                {/* Image 2: horizontal pill-style type filters */}
                <div className="flex gap-2 flex-wrap">
                  {venueTypes.map((t) => (
                    <button key={t} onClick={() => setVenueTypeFilter(t)}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all border"
                      style={venueTypeFilter === t
                        ? { background: C.gold, color: "#fff", border: `1px solid ${C.gold}` }
                        : {
                            background: "transparent",
                            color: textMain,
                            border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)"}`,
                          }}>
                      {t}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                  <Icon d={ICONS.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: textMuted }} />
                  <input value={venueSearch} onChange={(e) => setVenueSearch(e.target.value)}
                    placeholder="Search venues…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{
                      background: inputBg,
                      color: textMain,
                      border: `1px solid ${cardBorder}`,
                    }} />
                </div>

                {loading ? (
                  <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loading venues…</p>
                ) : filteredVenues.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl border-2 border-dashed"
                    style={{ borderColor: cardBorder }}>
                    <p style={{ color: textMuted }}>No venues found</p>
                  </div>
                ) : (
                  /* Image 2: 2-column grid on desktop, full card with large image */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredVenues.map((v) => (
                      <motion.div key={v._id} layout whileHover={{ y: -4 }}
                        className="rounded-2xl overflow-hidden group"
                        style={{
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 2px 16px rgba(0,0,0,0.06)",
                        }}>
                        {/* Image 2: tall image, type badge top-right */}
                        <div className="relative h-48 overflow-hidden"
                          style={{ background: dark ? "#222" : "#e8e2d5" }}>
                          {v.images?.[0] ? (
                            <img src={v.images[0]} alt={v.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon d={ICONS.venues} size={40} style={{ color: textMuted }} />
                            </div>
                          )}
                          {/* Image 2: type badge top-right, dark pill */}
                          {(v.venueType || v.type) && (
                            <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold"
                              style={{ background: "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(4px)" }}>
                              {v.venueType || v.type}
                            </span>
                          )}
                        </div>

                        {/* Image 2: card body — name large, location small, price+rating row, full-width button */}
                        <div className="p-5">
                          {/* Image 2: serif-style venue name */}
                          <p className="text-xl font-black mb-1"
                            style={{ color: textMain, fontFamily: "'Georgia', serif" }}>
                            {v.name}
                          </p>
                          <p className="text-xs mb-1" style={{ color: textMuted }}>Location</p>
                          <p className="text-sm mb-3" style={{ color: dark ? "rgba(245,240,232,0.6)" : "rgba(26,18,9,0.5)" }}>
                            {[v.location?.city || v.city, v.location?.address || v.address].filter(Boolean).join(" | ") || "—"}
                          </p>

                          {/* Image 2: price + rating inline */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-xs" style={{ color: textMuted }}>Price per Hour</p>
                              <p className="font-bold text-sm" style={{ color: textMain }}>{formatINR(v.pricePerHour)} / hr</p>
                            </div>
                            {v.rating && (
                              <div>
                                <p className="text-xs" style={{ color: textMuted }}>Rating</p>
                                <p className="font-bold text-sm flex items-center gap-1" style={{ color: C.gold }}>
                                  ★ {v.rating} Stars
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Image 2: full-width gold "View Details" button */}
                          <button onClick={() => navigate(`/venue/${v._id}`)}
                            className="w-full py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                            style={{ background: C.gold, color: "#fff" }}>
                            View Details
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── My Bookings ─────────────────────────────────────────── */}
            {tab === "bookings" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>My Bookings</h1>
                <div className="flex gap-1 p-1 rounded-xl w-fit flex-wrap"
                  style={{ background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)" }}>
                  {BOOKING_FILTERS.map((f) => (
                    <button key={f} onClick={() => setBookingFilter(f)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                      style={bookingFilter === f
                        ? { background: C.gold, color: "#fff" }
                        : { color: textMuted }}>
                      {f}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loading…</p>
                ) : filteredBookings.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl border-2 border-dashed"
                    style={{ borderColor: cardBorder }}>
                    <p style={{ color: textMuted }}>No bookings in this category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map((b) => (
                      <motion.div key={b._id} layout
                        className="rounded-2xl p-5 transition-shadow hover:shadow-md"
                        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-bold" style={{ color: textMain }}>{b.venue?.name || "Venue"}</p>
                              <Badge status={b.status} />
                            </div>
                            <p className="text-sm mt-1" style={{ color: textMuted }}>
                              {formatDateIN(b.eventDate)} · {formatINR(b.bidAmount)} · {timeAgo(b.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            {["pending", "payment_pending"].includes(b.status) && (
                              raiseBidId === b._id ? (
                                <div className="flex items-center gap-2">
                                  <input type="number" value={raiseBidAmount}
                                    onChange={(e) => setRaiseBidAmount(e.target.value)}
                                    placeholder="New amount (₹)"
                                    className="w-32 px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                                    style={{ background: inputBg, color: textMain, border: `1px solid ${cardBorder}` }} />
                                  <button onClick={() => handleRaiseBid(b._id)}
                                    className="p-1.5 rounded-lg text-white"
                                    style={{ background: C.green }}>
                                    <Icon d={ICONS.check} size={14} />
                                  </button>
                                  <button onClick={() => { setRaiseBidId(null); setRaiseBidAmount(""); }}
                                    className="p-1.5 rounded-lg"
                                    style={{ background: inputBg, color: textMuted }}>
                                    <Icon d={ICONS.x} size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setRaiseBidId(b._id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                  style={{ background: dark ? "rgba(200,151,58,0.15)" : "rgba(200,151,58,0.12)", color: C.gold }}>
                                  Raise Bid
                                </button>
                              )
                            )}
                            {b.status === "payment_pending" && (
                              <button onClick={() => navigate(`/venue/${b.venue?._id}`)}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:opacity-90"
                                style={{ background: C.gold }}>
                                Pay Now
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Payments ─────────────────────────────────────────────── */}
            {tab === "payments" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Payments</h1>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  {payments.length === 0 ? (
                    <p className="text-center py-16 text-sm" style={{ color: textMuted }}>No payments yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                            {["Venue", "Date", "Amount", "Status", "Transaction ID"].map((h) => (
                              <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                                style={{ color: textMuted }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p._id} style={{ borderBottom: `1px solid ${cardBorder}` }}
                              onMouseEnter={(e) => e.currentTarget.style.background = dark ? "#1e1e1e" : "#f8f4ec"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              <td className="px-5 py-4 font-semibold whitespace-nowrap" style={{ color: textMain }}>
                                {truncate(p.booking?.venue?.name || p.venue?.name || "—", 22)}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap" style={{ color: textMuted }}>{formatDateIN(p.createdAt)}</td>
                              <td className="px-5 py-4 font-bold whitespace-nowrap" style={{ color: C.gold }}>{formatINR(p.amount)}</td>
                              <td className="px-5 py-4"><Badge status={p.status || "paid"} /></td>
                              <td className="px-5 py-4 font-mono text-xs" style={{ color: textMuted }}>{p.razorpayPaymentId || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Chat ─────────────────────────────────────────────────── */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel user={user} />
                </div>
              </div>
            )}

            {/* ── Profile ──────────────────────────────────────────────── */}
            {tab === "profile" && (
              <div className="max-w-xl space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Profile</h1>

                {/* Profile card with hero gradient */}
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-6 relative" style={{ background: dark ? C.heroDark : C.heroLight }}>
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-4">
                      <img src={user?.avatar || avatar(user?.name)} alt=""
                        className="w-16 h-16 rounded-2xl object-cover"
                        style={{ border: "3px solid rgba(255,255,255,0.3)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-black text-white truncate">{user?.name}</p>
                        <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{user?.email}</p>
                        <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>Booker</span>
                      </div>
                      {!editMode && (
                        <button onClick={() => setEditMode(true)}
                          className="p-2 rounded-xl hover:opacity-80 transition-opacity"
                          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                          <Icon d={ICONS.edit} size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {editMode && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 space-y-3 overflow-hidden"
                        style={{ background: cardBg, borderTop: `1px solid ${cardBorder}` }}>
                        {[["name", "Full Name", "text"], ["username", "Username", "text"], ["phone", "Phone Number", "tel"]].map(([k, label, type]) => (
                          <div key={k}>
                            <label className="text-xs font-bold mb-1.5 block" style={{ color: textMuted }}>{label}</label>
                            <input type={type} value={profileForm[k]}
                              onChange={(e) => setProfileForm((p) => ({ ...p, [k]: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                              style={{ background: inputBg, color: textMain, border: `1px solid ${cardBorder}` }} />
                          </div>
                        ))}
                        <div className="flex gap-3 pt-1">
                          <button onClick={() => setEditMode(false)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                            style={{ border: `1px solid ${cardBorder}`, color: textMuted, background: "transparent" }}>
                            Cancel
                          </button>
                          <button onClick={handleSaveProfile} disabled={profileLoading}
                            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 hover:opacity-90"
                            style={{ background: C.gold }}>
                            {profileLoading ? "Saving…" : "Save Changes"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Language */}
                <div className="rounded-2xl p-5"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  <p className="text-sm font-bold mb-3" style={{ color: textMain }}>Language</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.map((l) => (
                      <button key={l.code} onClick={() => setLang(l.code)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all"
                        style={lang === l.code
                          ? { background: C.gold, color: "#fff", border: `1px solid ${C.gold}` }
                          : { background: "transparent", color: textMuted, border: `1px solid ${cardBorder}` }}>
                        {l.native}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={handleSwitchRole}
                    className="w-full py-3 rounded-xl font-semibold text-sm hover:opacity-80 transition-opacity"
                    style={{ border: `1px solid ${cardBorder}`, color: textMain, background: "transparent" }}>
                    Switch to Venue Owner
                  </button>
                  <button onClick={() => { logout(); navigate("/login"); }}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90"
                    style={{ background: C.red }}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
