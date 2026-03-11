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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-2xl pointer-events-auto
              ${t.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
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
    pending:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    approved:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    rejected:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    paid:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    bid_raised: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    expired:    "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
    confirmed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || map.expired}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  const accents = {
    violet:  "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    amber:   "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    sky:     "from-sky-500/10 to-sky-500/5 border-sky-500/20",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-gradient-to-br p-5 ${accents[accent] || accents.violet}`}>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
    </motion.div>
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
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Icon d={ICONS.alert} size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-white">Complete your profile</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Missing: <span className="font-medium text-zinc-700 dark:text-zinc-300">{missing.join(", ")}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onLater}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700
              text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Later
          </button>
          <button onClick={onUpdateNow}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700
              text-white text-sm font-semibold transition-colors">
            Update Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ user }) {
  const [chats, setChats]     = useState([]);
  const [active, setActive]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef             = useRef(null);

  // ✅ Correct endpoint — no /api/ prefix (axiosInstance baseURL already has /api)
  useEffect(() => {
    api.get("/chats").then((r) => setChats(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) return;
    // ✅ Correct endpoint
    api.get(`/chats/${active._id}/messages`)
      .then((r) => { setMessages(r.data || []); scrollBottom(); })
      .catch(() => {});
    api.patch(`/chats/${active._id}/read`).catch(() => {});
  }, [active]);

  useEffect(() => { scrollBottom(); }, [messages]);
  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const send = async () => {
    if (!text.trim() || !active || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      // ✅ Correct endpoint — POST /chats/:chatId/messages with { text }
      const r = await api.post(`/chats/${active._id}/messages`, { text: msg });
      setMessages((p) => [...p, r.data]);
    } catch {
      setText(msg); // restore on fail
    } finally {
      setSending(false);
    }
  };

  const opponent = (chat) => chat.participants?.find((p) => p._id !== user?._id);
  const avatar   = (name) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=6d28d9&fontColor=ffffff`;

  return (
    <div className="flex h-full gap-4">
      {/* Thread list */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl border border-zinc-200
        dark:border-zinc-700 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-700">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && (
            <p className="text-center text-zinc-400 text-sm mt-8">No conversations yet</p>
          )}
          {chats.map((c) => {
            const op = opponent(c);
            return (
              <button key={c._id} onClick={() => setActive(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${active?._id === c._id
                    ? "bg-violet-50 dark:bg-violet-900/20"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50"}`}>
                <img src={avatar(op?.name)} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{op?.name || "User"}</p>
                  <p className="text-xs text-zinc-400 truncate">{op?.email}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-violet-600 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Message window */}
      <div className="flex-1 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700
        bg-white dark:bg-zinc-800/50 overflow-hidden">
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-400 text-sm">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={avatar(opponent(active)?.name)} alt="" className="w-8 h-8 rounded-full" />
                <p className="font-semibold text-zinc-900 dark:text-white text-sm">{opponent(active)?.name}</p>
              </div>
              <button onClick={() => setActive(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400">
                <Icon d={ICONS.x} size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {messages.map((m, i) => {
                const mine = m.sender?._id === user?._id || m.sender === user?._id;
                // ✅ handle both m.text and m.content from backend
                const body = m.text || m.content || "";
                return (
                  <div key={m._id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm
                      ${mine
                        ? "bg-violet-600 text-white rounded-br-sm"
                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-bl-sm"}`}>
                      {body}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-700 flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-700
                  text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500
                  placeholder:text-zinc-400" />
              <button onClick={send} disabled={sending || !text.trim()}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50">
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

  const [tab,  setTab]  = useState("overview");
  const [dark, setDark] = useState(() => localStorage.getItem("bookerTheme") === "dark");

  // Data
  const [bookings,  setBookings]  = useState([]);
  const [venues,    setVenues]    = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [stats,     setStats]     = useState({ total: 0, pending: 0, confirmed: 0, paid: 0 });
  const [loading,   setLoading]   = useState(true);

  // UI state
  const [venueSearch,    setVenueSearch]    = useState("");
  const [bookingFilter,  setBookingFilter]  = useState("all");
  const [raiseBidId,     setRaiseBidId]     = useState(null);
  const [raiseBidAmount, setRaiseBidAmount] = useState("");
  const [unreadChats,    setUnreadChats]    = useState(false);
  const [showMissingPopup, setShowMissingPopup] = useState(false);

  // Profile edit
  const [editMode,       setEditMode]       = useState(false);
  const [profileForm,    setProfileForm]    = useState({ name: "", username: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Language
  const [lang, setLang] = useState(() => localStorage.getItem("appLang") || "en");
  const LANGS = [
    { code: "en", label: "English",  native: "English",  font: "DM Sans" },
    { code: "hi", label: "Hindi",    native: "हिन्दी",    font: "Noto Sans Devanagari" },
    { code: "te", label: "Telugu",   native: "తెలుగు",   font: "Noto Sans Telugu" },
    { code: "ta", label: "Tamil",    native: "தமிழ்",    font: "Noto Sans Tamil" },
    { code: "kn", label: "Kannada",  native: "ಕನ್ನಡ",    font: "Noto Sans Kannada" },
  ];
  const currentFont = LANGS.find((l) => l.code === lang)?.font || "DM Sans";

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bookerTheme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (lang !== "en") {
      const id = "lang-font";
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id   = id;
        link.rel  = "stylesheet";
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

  // ─── Data fetch ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, vRes, pRes] = await Promise.all([
        // ✅ Correct endpoints — no /api/ prefix
        api.get("/bookings/my-bookings"),
        api.get("/venues"),
        api.get("/payments/my-payments"),
      ]);
      const b = Array.isArray(bRes.data) ? bRes.data : bRes.data?.bookings || [];
      const v = Array.isArray(vRes.data) ? vRes.data : vRes.data?.venues   || [];
      const p = Array.isArray(pRes.data) ? pRes.data : pRes.data?.payments || [];
      setBookings(b);
      setVenues(v);
      setPayments(p);
      setStats({
        total:     b.length,
        pending:   b.filter((x) => ["pending", "bid_raised"].includes(x.status)).length,
        confirmed: b.filter((x) => x.status === "approved" || x.status === "confirmed").length,
        paid:      b.filter((x) => x.status === "paid").length,
      });
    } catch {
      push("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    // ✅ Correct endpoint
    api.get("/chats").then((r) => {
      const list = Array.isArray(r.data) ? r.data : [];
      setUnreadChats(list.some((c) => c.unreadCount > 0));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || "", username: user.username || "", phone: user.phone || "" });
  }, [user]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleRaiseBid = async (bookingId) => {
    if (!raiseBidAmount || isNaN(raiseBidAmount)) return push("Enter a valid amount", "error");
    try {
      // ✅ Correct endpoint
      await api.patch(`/bookings/${bookingId}/raise-bid`, { newBidAmount: Number(raiseBidAmount) });
      push("Bid raised successfully!");
      setRaiseBidId(null); setRaiseBidAmount("");
      fetchData();
    } catch (err) {
      push(err.response?.data?.message || "Failed to raise bid", "error");
    }
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      // ✅ Correct endpoint
      const r = await api.patch("/auth/update-profile", profileForm);
      // ✅ login() takes (user, token) — not just token
      if (r.data.token) login(r.data.user, r.data.token);
      push("Profile updated!");
      setEditMode(false);
    } catch (err) {
      push(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSwitchRole = async () => {
    try {
      // ✅ Correct endpoint
      const r = await api.patch("/auth/switch-role", { role: "venueOwner" });
      // ✅ Update AuthContext with new user + token
      login(r.data.user, r.data.token);
      push("Switched to Venue Owner!");
      setTimeout(() => navigate("/owner/dashboard"), 800);
    } catch {
      push("Switch failed", "error");
    }
  };

  // ─── Derived data ─────────────────────────────────────────────────────────
  const filteredVenues = venues.filter((v) =>
    v.isActive !== false && (
      !venueSearch ||
      v.name?.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.location?.city?.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.city?.toLowerCase().includes(venueSearch.toLowerCase())
    )
  );

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === "all") return true;
    if (bookingFilter === "pending") return ["pending", "bid_raised"].includes(b.status);
    return b.status === bookingFilter;
  });

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const avatar = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=6d28d9&fontColor=ffffff`;

  const TABS = [
    { key: "overview",  icon: ICONS.overview },
    { key: "venues",    icon: ICONS.venues },
    { key: "bookings",  icon: ICONS.bookings },
    { key: "payments",  icon: ICONS.payments },
    { key: "chat",      icon: ICONS.chat,    dot: unreadChats },
    { key: "profile",   icon: ICONS.profile },
  ];

  const BOOKING_FILTERS = ["all", "pending", "approved", "paid", "rejected", "expired"];

  return (
    <div style={{ fontFamily: `'${currentFont}', sans-serif` }}
      className={`min-h-screen flex ${dark ? "dark" : ""} bg-zinc-50 dark:bg-zinc-950`}>

      <Toast toasts={toasts} />

      {/* Missing credentials popup */}
      {showMissingPopup && (
        <MissingCredentials
          user={user}
          onLater={() => {
            sessionStorage.setItem("missingCredsDismissed", "1");
            setShowMissingPopup(false);
          }}
          onUpdateNow={() => {
            setShowMissingPopup(false);
            setTab("profile");
            setEditMode(true);
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-0 h-full w-[68px] flex flex-col items-center
        bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-40 py-4 gap-1">

        {/* Logo */}
        <button onClick={() => navigate("/")}
          className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center mb-4 flex-shrink-0">
          <span className="text-white font-black text-sm">B</span>
        </button>

        {TABS.map(({ key, icon, dot }) => (
          <button key={key} onClick={() => setTab(key)} title={key}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${tab === key
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            <Icon d={icon} size={18} />
            {dot && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
        ))}

        <div className="flex-1" />

        {/* Theme toggle */}
        <button onClick={() => setDark((p) => !p)}
          className="w-10 h-10 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800
            flex items-center justify-center transition-colors">
          <Icon d={dark ? ICONS.sun : ICONS.moon} size={18} />
        </button>

        {/* Avatar */}
        <button onClick={() => setTab("profile")} className="mt-1">
          <img src={user?.avatar || avatar(user?.name)} alt=""
            className="w-9 h-9 rounded-full object-cover" />
        </button>

        {/* Logout */}
        <button onClick={() => { logout(); navigate("/login"); }} title="Logout"
          className="w-10 h-10 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
            flex items-center justify-center transition-colors mt-1 mb-1">
          <Icon d={ICONS.logout} size={18} />
        </button>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="ml-[68px] flex-1 min-h-screen p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="max-w-6xl mx-auto">

            {/* ── Overview ──────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Hey, {user?.name?.split(" ")[0]} 👋
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here's your booking summary</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Bookings" value={stats.total}     accent="violet" />
                  <StatCard label="Pending"         value={stats.pending}   accent="amber" />
                  <StatCard label="Confirmed"       value={stats.confirmed} accent="sky" />
                  <StatCard label="Paid"            value={stats.paid}      accent="emerald" />
                </div>

                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="font-semibold text-zinc-900 dark:text-white">Recent Bookings</h2>
                    <button onClick={() => setTab("bookings")}
                      className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
                      View all <Icon d={ICONS.arrowRight} size={13} />
                    </button>
                  </div>
                  {loading ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">Loading…</p>
                  ) : recentBookings.length === 0 ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">No bookings yet</p>
                  ) : (
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      {recentBookings.map((b) => (
                        <div key={b._id} className="px-6 py-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                              {b.venue?.name || "Venue"}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
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

            {/* ── Venues ────────────────────────────────────────── */}
            {tab === "venues" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Browse Venues</h1>
                  <div className="relative max-w-sm w-full">
                    <Icon d={ICONS.search} size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input value={venueSearch} onChange={(e) => setVenueSearch(e.target.value)}
                      placeholder="Search by name or city…"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700
                        bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-400" />
                  </div>
                </div>

                {loading ? (
                  <p className="text-center text-zinc-400 py-16 text-sm">Loading venues…</p>
                ) : filteredVenues.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-zinc-400">No venues found</p>
                    {venueSearch && (
                      <button onClick={() => setVenueSearch("")}
                        className="mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline">
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredVenues.map((v) => (
                      <motion.div key={v._id} layout
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-700
                          bg-white dark:bg-zinc-900 overflow-hidden group">
                        <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800">
                          {v.images?.[0] ? (
                            <img src={v.images[0]} alt={v.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon d={ICONS.venues} size={40} className="text-zinc-300 dark:text-zinc-600" />
                            </div>
                          )}
                          {(v.venueType || v.type) && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold
                              bg-black/50 text-white backdrop-blur-sm">
                              {v.venueType || v.type}
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-zinc-900 dark:text-white truncate">{v.name}</p>
                          <p className="text-sm text-zinc-400 mt-0.5">
                            📍 {v.location?.city || v.city || "—"} · {formatINR(v.pricePerHour)}/hr
                          </p>
                          <button onClick={() => navigate(`/venue/${v._id}`)}
                            className="mt-3 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700
                              text-white text-sm font-semibold transition-colors">
                            Book Now
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── My Bookings ───────────────────────────────────── */}
            {tab === "bookings" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Bookings</h1>

                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl w-fit flex-wrap">
                  {BOOKING_FILTERS.map((f) => (
                    <button key={f} onClick={() => setBookingFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                        ${bookingFilter === f
                          ? "bg-white dark:bg-zinc-700 text-violet-600 dark:text-violet-400 shadow-sm"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
                      {f}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <p className="text-center text-zinc-400 py-16 text-sm">Loading…</p>
                ) : filteredBookings.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-zinc-400">No bookings in this category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map((b) => (
                      <motion.div key={b._id} layout
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-700
                          bg-white dark:bg-zinc-900 p-5">
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-semibold text-zinc-900 dark:text-white">
                                {b.venue?.name || "Venue"}
                              </p>
                              <Badge status={b.status} />
                            </div>
                            <p className="text-sm text-zinc-400 mt-1">
                              {formatDateIN(b.eventDate)} · {formatINR(b.bidAmount)} · {timeAgo(b.createdAt)}
                            </p>
                          </div>

                          <div className="flex gap-2 flex-wrap justify-end">
                            {["pending", "bid_raised"].includes(b.status) && (
                              raiseBidId === b._id ? (
                                <div className="flex items-center gap-2">
                                  <input type="number" value={raiseBidAmount}
                                    onChange={(e) => setRaiseBidAmount(e.target.value)}
                                    placeholder="New amount (₹)"
                                    className="w-32 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700
                                      bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                                      focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                  <button onClick={() => handleRaiseBid(b._id)}
                                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                                    <Icon d={ICONS.check} size={14} />
                                  </button>
                                  <button onClick={() => { setRaiseBidId(null); setRaiseBidAmount(""); }}
                                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 transition-colors">
                                    <Icon d={ICONS.x} size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setRaiseBidId(b._id)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30
                                    text-blue-700 dark:text-blue-400 text-xs font-semibold
                                    hover:bg-blue-200 transition-colors">
                                  Raise Bid
                                </button>
                              )
                            )}
                            {b.status === "approved" && (
                              <button onClick={() => navigate(`/venue/${b.venue?._id}`)}
                                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700
                                  text-white text-xs font-semibold transition-colors">
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

            {/* ── Payments ──────────────────────────────────────── */}
            {tab === "payments" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Payments</h1>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-900 overflow-hidden">
                  {payments.length === 0 ? (
                    <p className="text-center text-zinc-400 py-16 text-sm">No payments yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            {["Venue", "Date", "Amount", "Status", "Transaction ID"].map((h) => (
                              <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold
                                text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {payments.map((p) => (
                            <tr key={p._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-4 font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                                {truncate(p.booking?.venue?.name || p.venue?.name || "—", 22)}
                              </td>
                              <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                {formatDateIN(p.createdAt)}
                              </td>
                              <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                                {formatINR(p.amount)}
                              </td>
                              <td className="px-5 py-4"><Badge status={p.status || "paid"} /></td>
                              <td className="px-5 py-4">
                                <span className="font-mono text-xs text-zinc-400">
                                  {p.razorpayPaymentId || "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Chat ──────────────────────────────────────────── */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel user={user} />
                </div>
              </div>
            )}

            {/* ── Profile ───────────────────────────────────────── */}
            {tab === "profile" && (
              <div className="max-w-xl space-y-5">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profile</h1>

                {/* User card + edit */}
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-900 p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <img src={user?.avatar || avatar(user?.name)} alt=""
                      className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-zinc-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-sm text-zinc-400 truncate">{user?.email}</p>
                      <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                        bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                        Booker
                      </span>
                    </div>
                    {!editMode && (
                      <button onClick={() => setEditMode(true)}
                        className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                        <Icon d={ICONS.edit} size={16} />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {editMode && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3 overflow-hidden">
                        {[
                          ["name",     "Full Name",     "text"],
                          ["username", "Username",      "text"],
                          ["phone",    "Phone Number",  "tel"],
                        ].map(([k, label, type]) => (
                          <div key={k}>
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">{label}</label>
                            <input type={type} value={profileForm[k]}
                              onChange={(e) => setProfileForm((p) => ({ ...p, [k]: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700
                                bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                                focus:outline-none focus:ring-2 focus:ring-violet-500" />
                          </div>
                        ))}
                        <div className="flex gap-3 pt-1">
                          <button onClick={() => setEditMode(false)}
                            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700
                              text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            Cancel
                          </button>
                          <button onClick={handleSaveProfile} disabled={profileLoading}
                            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700
                              text-white text-sm font-semibold disabled:opacity-60 transition-colors">
                            {profileLoading ? "Saving…" : "Save Changes"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Language */}
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Language</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.map((l) => (
                      <button key={l.code} onClick={() => setLang(l.code)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                          ${lang === l.code
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-400"}`}>
                        {l.native}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button onClick={handleSwitchRole}
                    className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-700
                      text-zinc-700 dark:text-zinc-300 font-medium text-sm
                      hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Switch to Venue Owner
                  </button>
                  <button onClick={() => { logout(); navigate("/login"); }}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700
                      text-white font-semibold text-sm transition-colors">
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
