import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";
import { formatINR, formatDateIN, timeAgo, truncate } from "../utils/helpers";

// â”€â”€â”€ Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  calendar:   "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  analytics:  "M3 3v18h18M7 13l3-3 3 2 4-5",
  chat:       "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  profile:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  logout:     "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  settings:   "M12 8a4 4 0 100 8 4 4 0 000-8zM2 12h2m16 0h2M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41m0-14.14l-1.41 1.41M6.34 17.66l-1.41 1.41",
  bell:       "M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9",
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

const DASHBOARD_TABS = new Set(["overview", "bookings", "venues", "calendar", "analytics", "chat", "profile", "payments"]);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  COLOR SYSTEM â€” extracted from Image 2
//  Light:  warm ivory bg #f5f0e8, cream cards #fffdf7, gold CTA #C8973A
//  Dark:   true black bg #0a0a0a, charcoal cards #161616, same gold CTA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  primary:     "#4F46E5",
  secondary:   "#6366F1",
  accent:      "#22D3EE",
  primaryLight:"rgba(99,102,241,0.16)",
  primaryDark: "rgba(79,70,229,0.22)",
  heroLight:   "linear-gradient(132deg, #4F46E5 0%, #6366F1 42%, #22D3EE 100%)",
  heroDark:    "linear-gradient(132deg, #312E81 0%, #4338CA 42%, #0E7490 100%)",
  teal:        "linear-gradient(132deg, #4F46E5 0%, #6366F1 70%, #22D3EE 100%)",
  amber:       "linear-gradient(132deg, #4338CA 0%, #4F46E5 100%)",
  green:       "linear-gradient(132deg, #0EA5E9 0%, #22D3EE 100%)",
  purple:      "linear-gradient(132deg, #6366F1 0%, #8B5CF6 100%)",
  red:         "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  redSolid:    "#dc2626",
  sidebarActive: "#4F46E5",
  // Backward-compatible aliases used across existing JSX
  gold: "#4F46E5",
  goldHover: "#4338CA",
  goldLight: "rgba(99,102,241,0.14)",
  goldDark: "rgba(79,70,229,0.22)",
};

// â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Status Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Hero Banner â€” Image 2 style: large serif title, warm gradient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          style={{ color: "rgba(255,255,255,0.72)" }}>Booker Dashboard</p>
        <h1 className="text-4xl font-black text-white mb-2"
          style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>
          Find and Book Your Perfect Venue
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)" }} className="text-sm">
          Welcome back, {name?.split(" ")[0] || "there"} â€” discover premium spaces with instant decisions.
        </p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Missing Credentials Popup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Chat Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChatPanel({ user, initialChatId }) {
  const [chats,    setChats]    = useState([]);
  const [active,   setActive]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef               = useRef(null);
  const activeId                = active?._id || null;

  useEffect(() => {
    let mounted = true;
    const loadChats = async () => {
      try {
        const r = await api.get("/chats");
        if (!mounted) return;
        const list = Array.isArray(r.data) ? r.data : r.data?.chats || [];
        setChats(list);
        if (activeId) {
          const refreshed = list.find((chat) => chat?._id === activeId);
          if (refreshed) setActive(refreshed);
        }
      } catch {
        // Ignore polling errors.
      }
    };

    loadChats();
    const id = setInterval(loadChats, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [activeId]);
  useEffect(() => {
    if (!initialChatId || !chats.length || active) return;
    const requested = chats.find((chat) => chat?._id === initialChatId);
    if (requested) setActive(requested);
  }, [initialChatId, chats, active]);
  useEffect(() => {
    if (!activeId) return;
    let mounted = true;
    const loadMessages = async () => {
      try {
        const r = await api.get(`/chats/${activeId}/messages`);
        if (!mounted) return;
        setMessages(r.data?.messages || r.data || []);
        api.patch(`/chats/${activeId}/read`).catch(() => {});
      } catch {
        // Ignore polling errors.
      }
    };

    loadMessages();
    const id = setInterval(loadMessages, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [activeId]);
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
                  <p className="text-xs text-zinc-400 truncate">
                    {(typeof c.lastMessage === "string" ? c.lastMessage : c.lastMessage?.text)?.slice(0, 28) || op?.email || "â€”"}
                  </p>
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
                placeholder="Type a messageâ€¦"
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

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function BookerDashboard() {
  const { user, logout, login, updateUser } = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const { toasts, push }        = useToast();

  const [tab,  setTab]  = useState(() => {
    const requestedTab = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tab")
      : null;
    return requestedTab && DASHBOARD_TABS.has(requestedTab) ? requestedTab : "venues";
  }); // Image 2 shows venue grid as main view
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" ? window.innerWidth < 1200 : false);
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
  const [smartLocation,    setSmartLocation]    = useState("");
  const [smartDate,        setSmartDate]        = useState("");
  const [smartGuests,      setSmartGuests]      = useState("");
  const [venueTypeFilter,  setVenueTypeFilter]  = useState("All");
  const [bookingFilter,    setBookingFilter]    = useState("all");
  const [raiseBidId,       setRaiseBidId]       = useState(null);
  const [raiseBidAmount,   setRaiseBidAmount]   = useState("");
  const [unreadChats,      setUnreadChats]      = useState(false);
  const [showMissingPopup, setShowMissingPopup] = useState(false);

  const [editMode,       setEditMode]       = useState(false);
  const [profileForm,    setProfileForm]    = useState({ name: "", username: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  const requestedChatId = new URLSearchParams(location.search).get("chatId") || "";

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get("tab");
    if (requestedTab && DASHBOARD_TABS.has(requestedTab) && requestedTab !== tab) {
      setTab(requestedTab);
    }
  }, [location.search, tab]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setSidebarCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [lang, setLang] = useState(() => localStorage.getItem("appLang") || "en");
  const LANGS = [
    { code: "en", native: "English",  font: "DM Sans" },
    { code: "hi", native: "हिंदी",   font: "Noto Sans Devanagari" },
    { code: "te", native: "తెలుగు", font: "Noto Sans Telugu" },
    { code: "ta", native: "தமிழ்",  font: "Noto Sans Tamil" },
    { code: "kn", native: "ಕನ್ನಡ",  font: "Noto Sans Kannada" },
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
  }, [push]);

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
      const updatedUser = r.data?.user || r.data;
      if (r.data?.token) login(updatedUser, r.data.token);
      else if (updatedUser) updateUser(updatedUser);
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

  // Venue type filters â€” Image 2 shows pill buttons: All, Marriage Hall, Rooftop, Resort, Farmhouse, Studio
  const venueTypes = ["All", ...new Set(venues.map((v) => v.venueType || v.type).filter(Boolean))];

  const filteredVenues = venues.filter((v) => {
    const matchActive = v.isActive !== false && v.isApproved;
    const combinedLocation = smartLocation || venueSearch;
    const matchSearch = !combinedLocation ||
      v.name?.toLowerCase().includes(combinedLocation.toLowerCase()) ||
      v.location?.city?.toLowerCase().includes(combinedLocation.toLowerCase()) ||
      v.city?.toLowerCase().includes(combinedLocation.toLowerCase());
    const minGuests = Number(smartGuests);
    const matchGuestCapacity = !Number.isFinite(minGuests) || minGuests <= 0 || Number(v.capacity || 0) >= minGuests;
    const matchType = venueTypeFilter === "All" || (v.venueType || v.type) === venueTypeFilter;
    return matchActive && matchSearch && matchType && matchGuestCapacity;
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
    { key: "overview",  label: "Dashboard", icon: ICONS.overview },
    { key: "bookings",  label: "Bookings",  icon: ICONS.bookings },
    { key: "venues",    label: "Venues",    icon: ICONS.venues },
    { key: "calendar",  label: "Calendar",  icon: ICONS.calendar },
    { key: "analytics", label: "Analytics", icon: ICONS.analytics },
    { key: "chat",      label: "Messages",  icon: ICONS.chat, dot: unreadChats },
    { key: "profile",   label: "Settings",  icon: ICONS.settings },
  ];

  const BOOKING_FILTERS = ["all", "pending", "approved", "confirmed", "paid", "rejected", "expired"];

  // â”€â”€ Page background and card colors based on dark mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Light: warm ivory #f5f0e8 bg, cream white cards
  // Dark:  true black #0a0a0a bg, #161616 cards
  const pageBg     = dark ? "#0B1020" : "#F8FAFC";
  const cardBg     = dark ? "rgba(17,24,39,0.85)" : "rgba(255,255,255,0.82)";
  const cardBorder = dark ? "rgba(99,102,241,0.32)" : "rgba(79,70,229,0.18)";
  const textMain   = dark ? "#E2E8F0" : "#0F172A";
  const textMuted  = dark ? "rgba(226,232,240,0.62)" : "#64748B";
  const sidebarBg  = dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.8)";
  const sidebarBorder = dark ? "rgba(99,102,241,0.28)" : "rgba(79,70,229,0.16)";
  const inputBg    = dark ? "rgba(30,41,59,0.9)" : "rgba(248,250,252,0.92)";

  return (
    <div style={{ fontFamily: `'${currentFont}', sans-serif`, background: pageBg, minHeight: "100vh" }}
      className="flex">

      <Toast toasts={toasts} />

      {showMissingPopup && (
        <MissingCredentials user={user}
          onLater={() => { sessionStorage.setItem("missingCredsDismissed", "1"); setShowMissingPopup(false); }}
          onUpdateNow={() => { setShowMissingPopup(false); setTab("profile"); setEditMode(true); }} />
      )}

      {/* â”€â”€ Sidebar â€” Image 2 style: clean, top-nav feel but sidebar â”€â”€â”€ */}
      <aside style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, backdropFilter: "blur(10px)" }}
        className={`hidden md:block fixed left-0 top-0 h-full z-40 py-4 px-3 transition-all duration-200 ${sidebarCollapsed ? "w-[84px]" : "w-[248px]"}`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")}
            className={`rounded-2xl flex items-center justify-center ${sidebarCollapsed ? "w-11 h-11" : "px-3 h-11"}`}
            style={{ background: "linear-gradient(135deg,#4F46E5,#22D3EE)", color: "#fff" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 12 }}>BYE</span>
          </button>
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="p-2 rounded-xl text-slate-500 hover:bg-white/60">
              <Icon d={ICONS.arrowRight} size={14} />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} className="mb-3 w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-white/60">
            Expand
          </button>
        )}

        <div className="space-y-1.5">
          {TABS.map(({ key, label, icon, dot }) => (
            <button key={key} onClick={() => setTab(key)} title={label}
              className={`relative w-full rounded-xl transition-all ${sidebarCollapsed ? "h-10 px-0 flex items-center justify-center" : "h-10 px-3 flex items-center gap-2.5"}`}
              style={tab === key
                ? { background: C.sidebarActive, color: "#fff", boxShadow: "0 8px 18px rgba(79,70,229,0.35)" }
                : { color: textMuted }}>
              <Icon d={icon} size={17} />
              {!sidebarCollapsed && <span className="text-sm font-semibold">{label}</span>}
              {dot && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className={`mt-4 ${sidebarCollapsed ? "space-y-2" : "space-y-2.5"}`}>
          <button onClick={() => setDark((p) => !p)}
            className={`w-full rounded-xl transition-colors ${sidebarCollapsed ? "h-10 flex items-center justify-center" : "h-10 px-3 flex items-center gap-2"}`}
            style={{ color: textMuted, background: dark ? "rgba(51,65,85,0.35)" : "rgba(248,250,252,0.8)" }}>
            <Icon d={dark ? ICONS.sun : ICONS.moon} size={16} />
            {!sidebarCollapsed && <span className="text-sm font-semibold">{dark ? "Light" : "Dark"} Mode</span>}
          </button>

          <button onClick={() => setTab("profile")}
            className={`w-full rounded-xl transition-colors ${sidebarCollapsed ? "h-10 flex items-center justify-center" : "h-10 px-3 flex items-center gap-2.5"}`}
            style={{ color: textMuted, background: dark ? "rgba(51,65,85,0.35)" : "rgba(248,250,252,0.8)" }}>
            <img src={user?.avatar || avatar(user?.name)} alt="" className="w-6 h-6 rounded-full object-cover" />
            {!sidebarCollapsed && <span className="text-sm font-semibold">Account</span>}
          </button>

          <button onClick={() => { logout(); navigate("/login"); }}
            className={`w-full rounded-xl ${sidebarCollapsed ? "h-10 flex items-center justify-center" : "h-10 px-3 flex items-center gap-2.5"}`}
            style={{ color: "#dc2626", background: "rgba(220,38,38,0.08)" }}>
            <Icon d={ICONS.logout} size={16} />
            {!sidebarCollapsed && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* â”€â”€ Main Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main className={`${sidebarCollapsed ? "md:ml-[84px]" : "md:ml-[248px]"} ml-0 flex-1 min-h-screen p-4 md:p-6 lg:p-8 pb-24 md:pb-8 transition-all duration-200`}>
        <div className="max-w-7xl mx-auto mb-6">
          <div className="saas-card px-4 md:px-5 py-3 md:py-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="relative flex-1 min-w-[220px] md:max-w-xl">
              <Icon d={ICONS.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                placeholder="Search venues, bookings, locations..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none border border-indigo-100 bg-white/80"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-xl border border-indigo-100 bg-white/80 text-slate-500 hover:text-indigo-600 transition-colors">
                <Icon d={ICONS.bell} size={16} />
              </button>
              <button onClick={() => setTab("venues")} className="saas-glow-btn px-4 py-2.5 text-sm font-semibold">
                Quick Book
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="max-w-7xl mx-auto">

            {/* â”€â”€ Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                    <p className="text-center py-12 text-sm" style={{ color: textMuted }}>Loadingâ€¦</p>
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
                              {formatDateIN(b.eventDate)} Â· {formatINR(b.bidAmount)} Â· {timeAgo(b.createdAt)}
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

            {/* â”€â”€ Venues â€” Image 2 exact layout: pill filters + 2-col card grid â”€â”€ */}
            {tab === "venues" && (
              <div className="space-y-5">
                <div className="saas-card p-5 md:p-6 space-y-4">
                  <h1 className="text-3xl md:text-4xl font-black saas-heading" style={{ color: textMain }}>
                    Find and Book Your Perfect Venue
                  </h1>
                  <p className="text-sm" style={{ color: textMuted }}>
                    Search by location, date, and guest capacity to discover spaces tailored for your event.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      value={smartLocation}
                      onChange={(e) => setSmartLocation(e.target.value)}
                      placeholder="Location"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none border border-indigo-100 bg-white/90"
                    />
                    <input
                      type="date"
                      value={smartDate}
                      onChange={(e) => setSmartDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none border border-indigo-100 bg-white/90"
                    />
                    <input
                      type="number"
                      min={1}
                      value={smartGuests}
                      onChange={(e) => setSmartGuests(e.target.value)}
                      placeholder="Guests"
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none border border-indigo-100 bg-white/90"
                    />
                    <button
                      onClick={() => setVenueSearch(smartLocation)}
                      className="saas-glow-btn px-4 py-2.5 text-sm font-semibold"
                    >
                      Smart Search
                    </button>
                  </div>
                </div>

                {/* Image 2: horizontal pill-style type filters */}
                <div className="flex gap-2 flex-wrap">
                  {venueTypes.map((t) => (
                    <button key={t} onClick={() => setVenueTypeFilter(t)}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all border"
                      style={venueTypeFilter === t
                        ? { background: C.primary, color: "#fff", border: `1px solid ${C.primary}` }
                        : {
                            background: "rgba(255,255,255,0.68)",
                            color: textMain,
                            border: `1px solid ${cardBorder}`,
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
                    placeholder="Search venues..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{
                      background: inputBg,
                      color: textMain,
                      border: `1px solid ${cardBorder}`,
                    }} />
                </div>

                {loading ? (
                  <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loading venues...</p>
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

                        {/* Image 2: card body â€” name large, location small, price+rating row, full-width button */}
                        <div className="p-5">
                          {/* Image 2: serif-style venue name */}
                          <p className="text-xl font-black mb-1"
                            style={{ color: textMain, fontFamily: "'Georgia', serif" }}>
                            {v.name}
                          </p>
                          <p className="text-xs mb-1" style={{ color: textMuted }}>Location</p>
                          <p className="text-sm mb-3" style={{ color: dark ? "rgba(245,240,232,0.6)" : "rgba(26,18,9,0.5)" }}>
                            {[v.location?.city || v.city, v.location?.address || v.address].filter(Boolean).join(" | ") || "â€”"}
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
                                  â˜… {v.rating} Stars
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

                <div className="saas-card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold" style={{ color: textMain }}>Map Preview</h3>
                    <span className="text-xs" style={{ color: textMuted }}>Venue discovery</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-indigo-100 bg-white">
                    <iframe
                      title="Venue map preview"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=77.46%2C12.86%2C77.74%2C13.08&layer=mapnik`}
                      className="w-full h-64 border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ My Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "calendar" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black saas-heading" style={{ color: textMain }}>Event Calendar</h1>
                <div className="saas-card p-5">
                  <p className="text-sm mb-4" style={{ color: textMuted }}>
                    Upcoming event timeline based on your active bookings.
                  </p>
                  <div className="space-y-3">
                    {[...bookings]
                      .filter((b) => ["pending", "payment_pending", "confirmed"].includes(b.status))
                      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
                      .slice(0, 8)
                      .map((b) => (
                        <div key={b._id} className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white/70 px-4 py-3">
                          <div>
                            <p className="font-semibold text-sm" style={{ color: textMain }}>{b.venue?.name || "Venue"}</p>
                            <p className="text-xs" style={{ color: textMuted }}>{formatDateIN(b.eventDate)} ï¿½ {b.startTime} - {b.endTime}</p>
                          </div>
                          <Badge status={b.status} />
                        </div>
                      ))}
                    {bookings.length === 0 && (
                      <p className="text-sm" style={{ color: textMuted }}>No scheduled events yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "analytics" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black saas-heading" style={{ color: textMain }}>Booking Analytics</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="saas-card p-5 lg:col-span-2">
                    <p className="text-sm font-semibold mb-4" style={{ color: textMain }}>Bookings Per Month</p>
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - (5 - idx));
                        const label = date.toLocaleString("en-IN", { month: "short" });
                        const value = bookings.filter((b) => {
                          const d = new Date(b.createdAt);
                          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                        }).length;
                        const width = `${Math.max(10, Math.min(100, value * 18))}%`;
                        return (
                          <div key={label} className="grid grid-cols-[56px_1fr_40px] items-center gap-3">
                            <span className="text-xs font-semibold" style={{ color: textMuted }}>{label}</span>
                            <div className="h-2.5 rounded-full bg-indigo-100 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width }} transition={{ duration: 0.6, delay: idx * 0.06 }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg,#4F46E5,#22D3EE)" }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-right" style={{ color: textMain }}>{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="saas-card p-5">
                    <p className="text-sm font-semibold mb-3" style={{ color: textMain }}>Top Metrics</p>
                    <div className="space-y-3 text-sm">
                      <div className="rounded-xl border border-indigo-100 bg-white/75 px-3 py-2.5">
                        <p style={{ color: textMuted }}>Average Bid</p>
                        <p className="font-bold" style={{ color: textMain }}>
                          {formatINR(bookings.length ? bookings.reduce((s, b) => s + (b.bidAmount || 0), 0) / bookings.length : 0)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-indigo-100 bg-white/75 px-3 py-2.5">
                        <p style={{ color: textMuted }}>Confirmation Rate</p>
                        <p className="font-bold" style={{ color: textMain }}>
                          {bookings.length ? `${Math.round((bookings.filter((b) => ["confirmed", "approved"].includes(b.status)).length / bookings.length) * 100)}%` : "0%"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-indigo-100 bg-white/75 px-3 py-2.5">
                        <p style={{ color: textMuted }}>Pending Actions</p>
                        <p className="font-bold" style={{ color: textMain }}>{bookings.filter((b) => ["pending", "payment_pending"].includes(b.status)).length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loadingâ€¦</p>
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
                              {formatDateIN(b.eventDate)} Â· {formatINR(b.bidAmount)} Â· {timeAgo(b.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            {b.status === "pending" && (
                              raiseBidId === b._id ? (
                                <div className="flex items-center gap-2">
                                  <input type="number" value={raiseBidAmount}
                                    onChange={(e) => setRaiseBidAmount(e.target.value)}
                                    placeholder="New amount (â‚¹)"
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

            {/* â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                                {truncate(p.booking?.venue?.name || p.venue?.name || "â€”", 22)}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap" style={{ color: textMuted }}>{formatDateIN(p.createdAt)}</td>
                              <td className="px-5 py-4 font-bold whitespace-nowrap" style={{ color: C.gold }}>{formatINR(p.amount)}</td>
                              <td className="px-5 py-4"><Badge status={p.status || "paid"} /></td>
                              <td className="px-5 py-4 font-mono text-xs" style={{ color: textMuted }}>{p.razorpayPaymentId || "â€”"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* â”€â”€ Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel user={user} initialChatId={requestedChatId} />
                </div>
              </div>
            )}

            {/* â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "profile" && (
              <div className="max-w-xl space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Settings</h1>

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
                            {profileLoading ? "Savingâ€¦" : "Save Changes"}
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

      <nav className="md:hidden saas-mobile-bottom-nav grid grid-cols-4 gap-1">
        {[
          { key: "venues", label: "Venues", icon: ICONS.venues },
          { key: "bookings", label: "Bookings", icon: ICONS.bookings },
          { key: "calendar", label: "Calendar", icon: ICONS.calendar },
          { key: "chat", label: "Chat", icon: ICONS.chat },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-all ${
              tab === item.key ? "saas-sidebar-active" : ""
            }`}
            style={tab === item.key ? {} : { color: textMuted }}
          >
            <Icon d={item.icon} size={14} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}


