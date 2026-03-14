import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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

// Gradient constants
const G = {
  hero:    "linear-gradient(135deg,#4f46e5 0%,#7c3aed 45%,#a855f7 75%,#0891b2 100%)",
  violet:  "linear-gradient(135deg,#4f46e5,#7c3aed)",
  amber:   "linear-gradient(135deg,#d97706,#f59e0b)",
  sky:     "linear-gradient(135deg,#0284c7,#06b6d4)",
  emerald: "linear-gradient(135deg,#059669,#14b8a6)",
  red:     "linear-gradient(135deg,#dc2626,#e11d48)",
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
            style={{ background: t.type === "success" ? G.emerald : G.red }}>
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

// â”€â”€â”€ Hero Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeroBanner({ name }) {
  return (
    <div className="relative rounded-2xl overflow-hidden p-7" style={{ background: G.hero }}>
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5" />
      <div className="absolute right-8 -bottom-20 w-40 h-40 rounded-full bg-white/5" />
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Booker Dashboard</p>
        <h1 className="text-3xl font-black text-white mb-1">Hey, {name?.split(" ")[0] || "there"} ðŸ‘‹</h1>
        <p className="text-white/65 text-sm">Here's your booking summary</p>
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
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Icon d={ICONS.alert} size={18} className="text-amber-600 dark:text-amber-400" />
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
            style={{ background: G.violet }}>
            Update Now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// â”€â”€â”€ Chat Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChatPanel({ user, dark }) {
  const [chats,    setChats]    = useState([]);
  const [active,   setActive]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const bottomRef               = useRef(null);
  const isTyping                = false;

  const typingStyles = `
    @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    .dot { width:8px; height:8px; border-radius:50%; background:#9CA3AF; animation: bounce 1s infinite; display:inline-block; margin: 0 2px; }
    .dot:nth-child(2){animation-delay:0.2s} .dot:nth-child(3){animation-delay:0.4s}
  `;

  // FIX: handle both { chats: [] } and plain array responses
  useEffect(() => {
    api.get("/chats").then((r) => {
      const list = Array.isArray(r.data) ? r.data : r.data?.chats || [];
      setChats(list);
    }).catch(() => {});
  }, []);

  // FIX: handle both { messages: [] } and plain array, plus show loading state
  useEffect(() => {
    if (!active) return;
    setLoading(true);
    api.get(`/chats/${active._id}/messages`)
      .then((r) => {
        const msgs = Array.isArray(r.data) ? r.data : r.data?.messages || [];
        setMessages(msgs);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
    api.patch(`/chats/${active._id}/read`).catch(() => {});
  }, [active]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
  }, [messages]);

  // FIX: optimistic UI â€” show message instantly, replace with server response
  const send = async () => {
    if (!text.trim() || !active || sending) return;
    const draft = text.trim();
    setText("");
    setSending(true);
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      text: draft,
      sender: user,
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setMessages((p) => [...p, tempMsg]);
    try {
      const r = await api.post(`/chats/${active._id}/messages`, { text: draft });
      const saved = r.data?.message || r.data;
      setMessages((p) => p.map((m) => m._id === tempMsg._id ? saved : m));
    } catch {
      setMessages((p) => p.filter((m) => m._id !== tempMsg._id));
      setText(draft);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const opponent = (chat) => chat.participants?.find((p) => p._id !== user?._id);
  const avatarUrl = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=6d28d9&fontColor=ffffff`;

  const fmtTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // Group messages by date for separator labels
  const grouped = [];
  let lastDate = null;
  messages.forEach((m) => {
    const day = m.createdAt ? new Date(m.createdAt).toDateString() : null;
    if (day && day !== lastDate) {
      grouped.push({ type: "date", label: fmtDate(m.createdAt), key: `d-${m.createdAt}` });
      lastDate = day;
    }
    grouped.push({ type: "msg", data: m, key: m._id });
  });

  return (
    <div className="flex h-full gap-4" data-theme={dark ? "dark" : "light"}>
      <style>{typingStyles}</style>
      {/* â”€â”€ Contact List â”€â”€ */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-700">
          <p className="font-bold text-zinc-900 dark:text-white text-sm">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && (
            <p className="text-center text-zinc-400 text-sm mt-8 px-4">No conversations yet</p>
          )}
          {chats.map((c) => {
            const op = opponent(c);
            const isActive = active?._id === c._id;
            const lastMsg = c.lastMessage?.text || c.lastMessage?.content || "";
            return (
              <button key={c._id} onClick={() => setActive(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-[3px]
                  ${isActive
                    ? "bg-zinc-50 dark:bg-zinc-700/40 border-[#3DAA6E]"
                    : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-700/50"}`}>
                <img src={avatarUrl(op?.name)} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{op?.name || "User"}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{lastMsg || op?.email || "â€”"}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 font-bold"
                    style={{ background: G.violet }}>{c.unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ Message Area â”€â”€ */}
      <div className="flex-1 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" className="text-zinc-300 dark:text-zinc-600">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <p className="text-zinc-400 text-sm">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-3">
              <img src={avatarUrl(opponent(active)?.name)} alt="" className="w-8 h-8 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{opponent(active)?.name || "User"}</p>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#3DAA6E]" />
                  <span>Online</span>
                </div>
              </div>
              <button onClick={() => { setActive(null); setMessages([]); }}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400">
                <Icon d={ICONS.x} size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col justify-end gap-2">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-zinc-400 text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                grouped.map((item) => {
                  // Date separator
                  if (item.type === "date") {
                    return (
                      <div key={item.key} className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-700" />
                        <span className="text-xs text-zinc-400 px-2 whitespace-nowrap">{item.label}</span>
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-700" />
                      </div>
                    );
                  }
                  // Message bubble
                  const m = item.data;
                  const mine = (m.sender?._id || m.sender) === user?._id;
                  const body = m.text || m.content || "";
                  const senderName = m.sender?.name || "";
                  return (
                    <div key={item.key}
                      className={`flex items-end gap-2 mb-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Avatar only on received messages */}
                      {!mine && (
                        <img src={avatarUrl(senderName)} alt=""
                          className="w-7 h-7 rounded-full flex-shrink-0 mb-1" />
                      )}
                      <div className={`max-w-[65%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                        {!mine && senderName && (
                          <p className="text-[11px] font-semibold text-zinc-500 mb-1 ml-1">{senderName}</p>
                        )}
                        <div className="px-4 py-2.5 text-sm leading-relaxed"
                          style={mine
                            ? {
                                background: "#3DAA6E",
                                color: "#fff",
                                borderRadius: "18px 18px 4px 18px",
                                opacity: m._temp ? 0.65 : 1,
                              }
                            : {
                                background: dark ? "#2A2A2A" : "#F3F4F6",
                                color: dark ? "#E5E7EB" : "#111827",
                                borderRadius: "18px 18px 18px 4px",
                              }
                          }
                        >
                          {body}
                        </div>
                        <p className="text-[10px] mt-1 px-1 text-zinc-400">{fmtTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex items-center ml-1">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-700 flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm
                  resize-none focus:outline-none focus:ring-2 focus:ring-[#3DAA6E] placeholder:text-zinc-400"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
              <button onClick={send} disabled={sending || !text.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: "#3DAA6E" }}>
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
  const { user, logout, login } = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const { toasts, push }        = useToast();

  const [tab,  setTab]  = useState("venues");
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
  const [venueCategory,    setVenueCategory]    = useState("All");
  const [userMenuOpen,     setUserMenuOpen]     = useState(false);
  const [logoError,        setLogoError]        = useState(false);
  const userMenuRef                              = useRef(null);
  const [bookingFilter,    setBookingFilter]    = useState("all");
  const [raiseBidId,       setRaiseBidId]       = useState(null);
  const [raiseBidAmount,   setRaiseBidAmount]   = useState("");
  const [unreadChats,      setUnreadChats]      = useState(false);
  const [showMissingPopup, setShowMissingPopup] = useState(false);

  const [editMode,       setEditMode]       = useState(false);
  const [profileForm,    setProfileForm]    = useState({ name: "", username: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // REMOVED: lang, LANGS, currentFont â€” multi-language feature removed entirely

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("bookerTheme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextTab = params.get("tab");
    if (nextTab && ["overview", "venues", "bookings", "payments", "chat", "profile"].includes(nextTab)) {
      setTab(nextTab);
    }
  }, [location.search]);

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
        pending:   b.filter((x) => ["pending", "bid_raised"].includes(x.status)).length,
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

  useEffect(() => {
    const handleClick = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  const filteredVenues = venues.filter((v) => {
    if (v.isActive === false) return false;
    const type = `${v.venueType || v.type || ""}`.toLowerCase();
    const categoryMatch = venueCategory === "All"
      ? true
      : venueCategory === "Marriage Hall"
        ? ["wedding", "marriage", "banquet", "hall"].some((k) => type.includes(k))
        : type.includes(venueCategory.toLowerCase());
    if (!categoryMatch) return false;
    if (!venueSearch) return true;
    const q = venueSearch.toLowerCase();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.location?.city?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q)
    );
  });

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

  const BOOKING_FILTERS = ["all", "pending", "approved", "paid", "rejected", "expired"];
  const CATEGORY_PILLS = ["All", "Marriage Hall", "Rooftop", "Resort", "Farmhouse", "Studio"];

  return (
    // FIXED: removed dynamic fontFamily â€” no more language-based font injection
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      className={`min-h-screen bg-[#F5F0E8] dark:bg-zinc-950 ${dark ? "dark" : ""}`}>

      <Toast toasts={toasts} />

      {showMissingPopup && (
        <MissingCredentials user={user}
          onLater={() => { sessionStorage.setItem("missingCredsDismissed", "1"); setShowMissingPopup(false); }}
          onUpdateNow={() => { setShowMissingPopup(false); setTab("profile"); setEditMode(true); }} />
      )}

      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-[#E6DDCF] dark:border-zinc-800 bg-[#F5F0E8]/90 dark:bg-zinc-950/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3DAA6E] flex items-center justify-center overflow-hidden">
              {logoError ? (
                <span className="text-[13px] font-bold text-white leading-4 text-center">
                  BookYour<br />Event
                </span>
              ) : (
                <img src="/logo.png" alt="BookYourEvent"
                  style={{ width: 40, height: 40, objectFit: "contain" }}
                  onError={() => setLogoError(true)} />
              )}
            </div>
            <span className="hidden sm:block font-serif text-lg font-bold text-[#3E2F1C] dark:text-white">
              BookYourEvent
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5C4A2A] dark:text-zinc-200">
            <button onClick={() => setTab("venues")}
              className={`transition-colors ${tab === "venues" ? "text-[#3DAA6E]" : "hover:text-[#3DAA6E]"}`}>
              Browse Venues
            </button>
            <button onClick={() => setTab("bookings")}
              className={`transition-colors ${tab === "bookings" ? "text-[#3DAA6E]" : "hover:text-[#3DAA6E]"}`}>
              My Bookings
            </button>
            <Link to="/about" className="hover:text-[#3DAA6E] transition-colors">About</Link>
            <Link to="/help" className="hover:text-[#3DAA6E] transition-colors">Contact</Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Icon d={ICONS.search} size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C8B6A] dark:text-zinc-400 pointer-events-none" />
              <input value={venueSearch} onChange={(e) => setVenueSearch(e.target.value)}
                placeholder="Search venues..."
                className="w-48 lg:w-64 pl-9 pr-3 py-2 rounded-full border border-[#D1C4A8] bg-white
                  text-sm text-[#3E2F1C] placeholder:text-[#9C8B6A]
                  focus:outline-none focus:ring-2 focus:ring-[#C4973A]
                  dark:bg-zinc-900 dark:text-white dark:border-zinc-700" />
            </div>

            <button onClick={() => setDark((p) => !p)}
              className="w-9 h-9 rounded-full border border-[#D1C4A8] dark:border-zinc-700
                text-[#5C4A2A] dark:text-zinc-200 hover:bg-white/70 dark:hover:bg-zinc-800 flex items-center justify-center">
              <Icon d={dark ? ICONS.sun : ICONS.moon} size={16} />
            </button>

            <div ref={userMenuRef} className="relative">
              <button onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-[#D1C4A8] dark:border-zinc-700
                  bg-white dark:bg-zinc-900 hover:bg-[#FFF8ED] dark:hover:bg-zinc-800 transition-colors">
                <img src={user?.avatar || avatar(user?.name)} alt=""
                  className="w-8 h-8 rounded-full object-cover" />
                <span className="hidden sm:block text-sm font-semibold text-[#3E2F1C] dark:text-white">
                  {user?.name
                    ? `${user.name.split(" ")[0]} ${user.name.split(" ")[1]?.[0] || ""}.`
                    : "Account"}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-[#E6DDCF] dark:border-zinc-700
                  bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                  <button onClick={() => { setTab("profile"); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#3E2F1C] dark:text-zinc-200 hover:bg-[#FFF8ED] dark:hover:bg-zinc-800">
                    Profile
                  </button>
                  <button onClick={() => { setTab("chat"); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#3E2F1C] dark:text-zinc-200 hover:bg-[#FFF8ED] dark:hover:bg-zinc-800 flex items-center justify-between">
                    <span>Messages</span>
                    {unreadChats && <span className="w-2 h-2 rounded-full bg-red-500" />}
                  </button>
                  <button onClick={() => { setTab("payments"); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#3E2F1C] dark:text-zinc-200 hover:bg-[#FFF8ED] dark:hover:bg-zinc-800">
                    Payments
                  </button>
                  <button onClick={() => { logout(); navigate("/login"); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="space-y-8">

            <div>
              <h1 className="text-4xl font-serif font-bold text-[#3E2F1C] dark:text-white">Booker Dashboard</h1>
              <p className="text-sm text-[#7A6645] dark:text-zinc-400 mt-1">Find and book the perfect venue</p>
            </div>

            {/* â”€â”€ Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "overview" && (
              <div className="space-y-6">
                <HeroBanner name={user?.name} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Bookings" value={stats.total}     grad={G.violet}  />
                  <StatCard label="Pending"         value={stats.pending}   grad={G.amber}   />
                  <StatCard label="Confirmed"       value={stats.confirmed} grad={G.sky}     />
                  <StatCard label="Paid"            value={stats.paid}      grad={G.emerald} />
                </div>

                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="font-bold text-zinc-900 dark:text-white">Recent Bookings</h2>
                    <button onClick={() => setTab("bookings")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                      View all <Icon d={ICONS.arrowRight} size={13} />
                    </button>
                  </div>
                  {loading ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">Loadingâ€¦</p>
                  ) : recentBookings.length === 0 ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">No bookings yet</p>
                  ) : (
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                      {recentBookings.map((b) => (
                        <div key={b._id} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{b.venue?.name || "Venue"}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">
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

            {/* â”€â”€ Venues â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "venues" && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_PILLS.map((pill) => (
                    <button key={pill} onClick={() => setVenueCategory(pill)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors
                        ${venueCategory === pill
                          ? "bg-[#C4973A] text-white border-transparent"
                          : "bg-white text-[#5C4A2A] border-[#D1C4A8] hover:border-[#C4973A]"}
                        dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200`}>
                      {pill}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <p className="text-center text-[#9C8B6A] dark:text-zinc-400 py-16 text-sm">Loading venuesâ€¦</p>
                ) : filteredVenues.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl border-2 border-dashed border-[#D1C4A8] dark:border-zinc-700">
                    <p className="text-[#9C8B6A] dark:text-zinc-400">No venues found</p>
                    {venueSearch && (
                      <button onClick={() => setVenueSearch("")}
                        className="mt-2 text-sm text-[#3DAA6E] dark:text-emerald-400 hover:underline">
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredVenues.map((v) => {
                      const ratingValue = Number(v.rating || v.avgRating || v.averageRating || 0);
                      const starCount = Math.max(1, Math.min(5, Math.round(ratingValue || 4)));
                      return (
                        <motion.div key={v._id} layout whileHover={{ y: -4 }}
                          className="rounded-xl bg-white dark:bg-zinc-900 overflow-hidden
                            shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                          <div className="relative h-[200px] bg-zinc-100 dark:bg-zinc-800">
                            {v.images?.[0] ? (
                              <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon d={ICONS.venues} size={40} className="text-zinc-300 dark:text-zinc-600" />
                              </div>
                            )}
                            {(v.venueType || v.type) && (
                              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">
                                {v.venueType || v.type}
                              </span>
                            )}
                          </div>
                          <div className="p-5 space-y-2">
                            <p className="text-xl font-bold text-[#3E2F1C] dark:text-white">{v.name}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {v.location?.city || v.city || "â€”"}
                            </p>
                            <p className="text-sm text-[#5C4A2A] dark:text-zinc-300">
                              <span className="font-semibold">Price per Hour:</span> {formatINR(v.pricePerHour)}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-[#5C4A2A] dark:text-zinc-300">Rating:</span>
                              <span className="text-[#C4973A]">
                                {"\u2605".repeat(starCount)}{"\u2606".repeat(5 - starCount)}
                              </span>
                            </div>
                            <button onClick={() => navigate(`/venue/${v._id}`)}
                              className="mt-2 w-full py-2.5 rounded-lg text-white text-sm font-bold hover:opacity-90 transition-opacity"
                              style={{ background: "#C4973A" }}>
                              View Details
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* â”€â”€ My Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "bookings" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">My Bookings</h1>
                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl w-fit flex-wrap">
                  {BOOKING_FILTERS.map((f) => (
                    <button key={f} onClick={() => setBookingFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
                        ${bookingFilter === f
                          ? "text-white shadow-sm"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                      style={bookingFilter === f ? { background: G.violet } : {}}>
                      {f}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <p className="text-center text-zinc-400 py-16 text-sm">Loadingâ€¦</p>
                ) : filteredBookings.length === 0 ? (
                  <div className="py-16 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-zinc-400">No bookings in this category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map((b) => (
                      <motion.div key={b._id} layout
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-bold text-zinc-900 dark:text-white">{b.venue?.name || "Venue"}</p>
                              <Badge status={b.status} />
                            </div>
                            <p className="text-sm text-zinc-400 mt-1">
                              {formatDateIN(b.eventDate)} Â· {formatINR(b.bidAmount)} Â· {timeAgo(b.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-end">
                            {["pending", "bid_raised"].includes(b.status) && (
                              raiseBidId === b._id ? (
                                <div className="flex items-center gap-2">
                                  <input type="number" value={raiseBidAmount}
                                    onChange={(e) => setRaiseBidAmount(e.target.value)}
                                    placeholder="New amount (â‚¹)"
                                    className="w-32 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700
                                      bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3DAA6E]" />
                                  <button onClick={() => handleRaiseBid(b._id)} className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <Icon d={ICONS.check} size={14} />
                                  </button>
                                  <button onClick={() => { setRaiseBidId(null); setRaiseBidAmount(""); }} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                    <Icon d={ICONS.x} size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setRaiseBidId(b._id)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold hover:bg-blue-200 transition-colors">
                                  Raise Bid
                                </button>
                              )
                            )}
                            {b.status === "approved" && (
                              <button onClick={() => navigate(`/venue/${b.venue?._id}`)}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity"
                                style={{ background: G.violet }}>
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

            {/* â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "payments" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Payments</h1>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                  {payments.length === 0 ? (
                    <p className="text-center text-zinc-400 py-16 text-sm">No payments yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            {["Venue", "Date", "Amount", "Status", "Transaction ID"].map((h) => (
                              <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {payments.map((p) => (
                            <tr key={p._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                                {truncate(p.booking?.venue?.name || p.venue?.name || "â€”", 22)}
                              </td>
                              <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{formatDateIN(p.createdAt)}</td>
                              <td className="px-5 py-4 font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">{formatINR(p.amount)}</td>
                              <td className="px-5 py-4"><Badge status={p.status || "paid"} /></td>
                              <td className="px-5 py-4 font-mono text-xs text-zinc-400">{p.razorpayPaymentId || "â€”"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* â”€â”€ Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel user={user} dark={dark} />
                </div>
              </div>
            )}

            {/* â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "profile" && (
              <div className="max-w-xl space-y-5">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Profile</h1>

                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-6 relative" style={{ background: G.hero }}>
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-4">
                      <img src={user?.avatar || avatar(user?.name)} alt=""
                        className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/30" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-black text-white truncate">{user?.name}</p>
                        <p className="text-sm text-white/70 truncate">{user?.email}</p>
                        <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">Booker</span>
                      </div>
                      {!editMode && (
                        <button onClick={() => setEditMode(true)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                          <Icon d={ICONS.edit} size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {editMode && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-zinc-900 border-x border-b border-zinc-200 dark:border-zinc-700
                          rounded-b-2xl p-5 space-y-3 overflow-hidden">
                        {[["name", "Full Name", "text"], ["username", "Username", "text"], ["phone", "Phone Number", "tel"]].map(([k, label, type]) => (
                          <div key={k}>
                            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block">{label}</label>
                            <input type={type} value={profileForm[k]}
                              onChange={(e) => setProfileForm((p) => ({ ...p, [k]: e.target.value }))}
                              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700
                                bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                                focus:outline-none focus:ring-2 focus:ring-[#3DAA6E]" />
                          </div>
                        ))}
                        <div className="flex gap-3 pt-1">
                          <button onClick={() => setEditMode(false)}
                            className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700
                              text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            Cancel
                          </button>
                          <button onClick={handleSaveProfile} disabled={profileLoading}
                            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
                            style={{ background: G.violet }}>
                            {profileLoading ? "Savingâ€¦" : "Save Changes"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>


                <div className="flex flex-col gap-3">
                  <button onClick={handleSwitchRole}
                    className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-700
                      text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Switch to Venue Owner
                  </button>
                  <button onClick={() => { logout(); navigate("/login"); }}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: G.red }}>
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



