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
  overview:  "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  venues:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  bookings:  "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  chat:      "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  profile:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  logout:    "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  sun:       "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z",
  moon:      "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  plus:      "M12 5v14M5 12h14",
  edit:      "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  check:     "M20 6L9 17l-5-5",
  x:         "M18 6L6 18M6 6l12 12",
  upload:    "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  send:      "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  zap:       "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  toggle:    "M17 7h1a5 5 0 010 10h-1M7 7H6a5 5 0 000 10h1M8 12h8",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

// ─────────────────────────────────────────────────────────────────────────────
//  COLOR SYSTEM — extracted from Image 1
//
//  Hero gradient: deep forest green → teal → purple → indigo (BOTH modes)
//  Light bg:  white #ffffff, cards white with light border
//  Dark bg:   navy-purple #1a1a2e, sidebar #16213e
//
//  Stat cards — exactly as shown in Image 1:
//   1) Teal/cyan   — Total Venues
//   2) Blue/indigo — Upcoming Bookings
//   3) Amber/gold  — Monthly Revenue
//   4) Purple      — Pending Requests
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  // Hero — Image 1: forest green → teal → purple wave
  heroLight: "linear-gradient(135deg, #1a5c3a 0%, #2d7a4f 25%, #6b3fa0 65%, #3d1c8a 100%)",
  heroDark:  "linear-gradient(135deg, #0d3321 0%, #1a4a30 25%, #4a2070 65%, #251060 100%)",

  // Stat card colors — exactly Image 1 order
  statTeal:   "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",   // teal — Total Venues
  statBlue:   "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",   // blue — Upcoming Bookings
  statAmber:  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",   // amber — Monthly Revenue
  statPurple: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",   // purple — Pending Requests

  // Primary action — Image 1 "View All" button uses teal/green
  primary:     "#0d9488",
  primaryHover:"#0f766e",
  primaryGrad: "linear-gradient(135deg, #0d9488, #059669)",

  // Secondary — purple for active/approve
  purple:     "#7c3aed",
  purpleGrad: "linear-gradient(135deg, #7c3aed, #6d28d9)",

  // Status
  amber:      "linear-gradient(135deg, #f59e0b, #d97706)",
  amberSolid: "#d97706",
  green:      "linear-gradient(135deg, #16a34a, #15803d)",
  greenSolid: "#16a34a",
  red:        "linear-gradient(135deg, #dc2626, #b91c1c)",
  redSolid:   "#dc2626",

  // Sidebar active — teal pill (matches Image 1 primary teal)
  sidebarActive: "#0d9488",
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

// ─── Stat Card — Image 1 style ────────────────────────────────────────────────
function StatCard({ label, value, sub, grad }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }} transition={{ duration: 0.15 }}
      className="rounded-2xl p-5 relative overflow-hidden text-white shadow-lg cursor-default"
      style={{ background: grad }}>
      <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute -right-1 bottom-1 w-10 h-10 rounded-full bg-white/5" />
      <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Hero Banner — Image 1 exact style ───────────────────────────────────────
function HeroBanner({ name, dark }) {
  return (
    <div className="relative rounded-2xl overflow-hidden p-8"
      style={{ background: dark ? C.heroDark : C.heroLight }}>
      {/* Image 1: blobs — teal left-bottom, purple top-right, gold sparkle */}
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full"
        style={{ background: "rgba(139,92,246,0.35)" }} />
      <div className="absolute right-32 bottom-0 w-32 h-32 rounded-full"
        style={{ background: "rgba(13,148,136,0.3)" }} />
      <div className="absolute left-1/3 top-4 w-4 h-4 rounded-full"
        style={{ background: "rgba(245,158,11,0.8)" }} />
      {/* Sparkle star like Image 1 */}
      <div className="absolute right-16 top-6 text-amber-300 text-2xl select-none">✦</div>
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(255,255,255,0.6)" }}>Owner Dashboard</p>
        <h1 className="text-4xl font-black text-white mb-2"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "-0.02em" }}>
          Owner Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)" }} className="text-sm">
          Oversee Venues &amp; Bookings — Welcome back, {name?.split(" ")[0] || "there"} 👋
        </p>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const AMENITIES = [
  "AC", "Parking", "WiFi", "Stage", "Catering", "DJ Setup",
  "Generator", "CCTV", "Security", "Elevator", "Wheelchair Access", "Swimming Pool",
];
const VENUE_TYPES = [
  "Wedding Hall", "Banquet Hall", "Conference Room", "Rooftop",
  "Farmhouse", "Resort", "Auditorium", "Lawn", "Club House",
  "Convention Centre", "Terrace", "Studio", "Sports Ground", "Other",
];

// ─── Venue Modal ──────────────────────────────────────────────────────────────
function VenueModal({ mode, venue, onClose, onSave, push, dark }) {
  const cardBg     = dark ? "#1e1e2e" : "#ffffff";
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain   = dark ? "#e2e8f0" : "#1a1a2e";
  const textMuted  = dark ? "rgba(226,232,240,0.5)" : "rgba(26,26,46,0.45)";
  const inputBg    = dark ? "#2a2a3e" : "#f8f9ff";

  const [form, setForm] = useState({
    name:         venue?.name         || "",
    description:  venue?.description  || "",
    pricePerHour: venue?.pricePerHour || "",
    capacity:     venue?.capacity     || "",
    city:         venue?.city         || venue?.location?.city    || "",
    pincode:      venue?.pincode      || venue?.location?.pincode || "",
    address:      venue?.address      || venue?.location?.address || "",
    venueType:    venue?.venueType    || venue?.type || "",
    amenities:    venue?.amenities    || [],
    images:       [],
  });
  const [loading,  setLoading]  = useState(false);
  const [previews, setPreviews] = useState([]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (a) =>
    set("amenities", form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a]);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    set("images", files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!form.name || !form.pricePerHour) return push("Name and price are required", "error");
    setLoading(true);
    try {
      if (mode === "add") {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k === "images")    v.forEach((f) => fd.append("images", f));
          else if (k === "amenities") v.forEach((a) => fd.append("amenities", a));
          else fd.append(k, v);
        });
        await api.post("/venues", fd, { headers: { "Content-Type": "multipart/form-data" } });
        push("Venue added! Pending admin approval.");
      } else {
        await api.patch(`/venues/${venue._id}`, {
          name: form.name, description: form.description,
          pricePerHour: form.pricePerHour, capacity: form.capacity,
          amenities: form.amenities,
        });
        push("Venue updated!");
      }
      onSave();
    } catch (err) { push(err.response?.data?.message || "Failed to save venue", "error"); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
          style={{ background: cardBg }}>

          <div className="sticky top-0 rounded-t-2xl px-6 pt-6 pb-4 flex items-center justify-between"
            style={{ background: cardBg, borderBottom: `1px solid ${cardBorder}` }}>
            <div>
              <h2 className="text-lg font-black" style={{ color: textMain }}>
                {mode === "add" ? "Add New Venue" : "Edit Venue"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                {mode === "add" ? "Fill details below. Admin will review before publishing." : "Update venue info below."}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70 transition-opacity"
              style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: textMuted }}>
              <Icon d={ICONS.x} size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["name", "Venue Name *", "text", "e.g. The Grand Ballroom"],
                ["pricePerHour", "Price / Hour (₹) *", "number", "e.g. 5000"],
                ["capacity", "Capacity (guests)", "number", "e.g. 200"],
                ["city", "City", "text", "e.g. Bangalore"],
                ["pincode", "Pincode", "text", "e.g. 560001"],
              ].map(([k, label, type, placeholder]) => (
                <div key={k}>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: textMuted }}>{label}</label>
                  <input type={type} value={form[k]} onChange={(e) => set(k, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: inputBg, color: textMain, border: `1px solid ${cardBorder}` }} />
                </div>
              ))}

              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: textMuted }}>Venue Type</label>
                <select value={form.venueType} onChange={(e) => set("venueType", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none appearance-none"
                  style={{ background: inputBg, color: textMain, border: `1px solid ${cardBorder}` }}>
                  <option value="">Select type…</option>
                  {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: textMuted }}>Full Address</label>
              <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)}
                placeholder="Street address…"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: inputBg, color: textMain, border: `1px solid ${cardBorder}` }} />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: textMuted }}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={3} placeholder="Describe your venue…"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                style={{ background: inputBg, color: textMain, border: `1px solid ${cardBorder}` }} />
            </div>

            {/* Amenities */}
            <div>
              <label className="text-xs font-bold mb-2 block" style={{ color: textMuted }}>Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={form.amenities.includes(a)
                      ? { background: C.primaryGrad, color: "#fff", border: "1px solid transparent" }
                      : { background: "transparent", color: textMuted, border: `1px solid ${cardBorder}` }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Images — only for add */}
            {mode === "add" && (
              <div>
                <label className="text-xs font-bold mb-2 block" style={{ color: textMuted }}>Images (up to 5)</label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderColor: C.primary, color: C.primary }}>
                  <Icon d={ICONS.upload} size={18} />
                  <span className="text-sm font-semibold">Choose images</span>
                  <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
                </label>
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {previews.map((p, i) => (
                      <img key={i} src={p} alt="" className="w-20 h-20 object-cover rounded-xl" />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: `1px solid ${cardBorder}`, color: textMuted, background: "transparent" }}>
                Cancel
              </button>
              <button onClick={submit} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 hover:opacity-90"
                style={{ background: C.primaryGrad }}>
                {loading ? "Saving…" : mode === "add" ? "Add Venue" : "Save Changes"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ user, dark }) {
  const cardBg     = dark ? "#1e1e2e" : "#ffffff";
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain   = dark ? "#e2e8f0" : "#1a1a2e";
  const textMuted  = dark ? "rgba(226,232,240,0.5)" : "rgba(26,26,46,0.45)";
  const inputBg    = dark ? "#2a2a3e" : "#f0f0f8";

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
  const avatar   = (name) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=0d9488&fontColor=ffffff`;

  return (
    <div className="flex h-full gap-4">
      <div className="w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <p className="font-bold text-sm" style={{ color: textMain }}>Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && <p className="text-center text-sm mt-8" style={{ color: textMuted }}>No conversations yet</p>}
          {chats.map((c) => {
            const op = opponent(c);
            return (
              <button key={c._id} onClick={() => setActive(c)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={active?._id === c._id ? { background: "rgba(13,148,136,0.12)" } : {}}>
                <img src={avatar(op?.name)} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: textMain }}>{op?.name || "User"}</p>
                  <p className="text-xs truncate" style={{ color: textMuted }}>{c.lastMessage?.content?.slice(0, 28) || op?.email || "—"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: textMuted }}>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
              <img src={avatar(opponent(active)?.name)} alt="" className="w-8 h-8 rounded-full" />
              <p className="font-bold text-sm" style={{ color: textMain }}>{opponent(active)?.name}</p>
              <button onClick={() => setActive(null)} className="ml-auto p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: textMuted }}>
                <Icon d={ICONS.x} size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {messages.map((m, i) => {
                const mine = m.sender?._id === user?._id || m.sender === user?._id;
                const body = m.text || m.content || "";
                return (
                  <div key={m._id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm`}
                      style={mine
                        ? { background: C.primaryGrad, color: "#fff", borderRadius: "16px 16px 4px 16px" }
                        : { background: inputBg, color: textMain, borderRadius: "16px 16px 16px 4px" }}>
                      {body}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="px-4 py-3 flex gap-2" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: inputBg, color: textMain }} />
              <button onClick={send} disabled={sending || !text.trim()}
                className="p-2.5 rounded-xl text-white disabled:opacity-50 hover:opacity-90"
                style={{ background: C.primaryGrad }}>
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
export default function OwnerDashboard() {
  const { user, logout, login } = useAuth();
  const navigate                = useNavigate();
  const { toasts, push }        = useToast();

  const [tab,      setTab]      = useState("overview");
  const [dark,     setDark]     = useState(() => {
    const s = localStorage.getItem("ownerTheme");
    if (s === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return s === "dark";
  });
  const [venues,   setVenues]   = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats,    setStats]    = useState({ venues: 0, pending: 0, revenue: 0, total: 0 });
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [unreadChats, setUnreadChats] = useState(false);

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

  // Theme-computed values
  // Light: pure white bg, white cards — Image 1 light mode
  // Dark:  navy-purple bg #1a1a2e, dark sidebar #16213e — Image 1 dark mode
  const pageBg     = dark ? "#1a1a2e" : "#f4f6fa";
  const cardBg     = dark ? "#1e1e32" : "#ffffff";
  const cardBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain   = dark ? "#e2e8f0" : "#1a1a2e";
  const textMuted  = dark ? "rgba(226,232,240,0.5)" : "rgba(26,26,46,0.45)";
  const sidebarBg  = dark ? "#16213e" : "#ffffff";
  const sidebarBorder = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const inputBg    = dark ? "#2a2a3e" : "#f0f0f8";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ownerTheme", dark ? "dark" : "light");
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
    if (user) setProfileForm({ name: user.name || "", username: user.username || "", phone: user.phone || "" });
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([
        api.get("/venues/owner/mine"),
        api.get("/bookings/owner"),
      ]);
      const v = Array.isArray(vRes.data) ? vRes.data : vRes.data?.venues   || [];
      const b = Array.isArray(bRes.data) ? bRes.data : bRes.data?.bookings || [];
      setVenues(v); setBookings(b);
      const revenue = b.filter((x) => x.status === "confirmed").reduce((s, x) => s + (x.bidAmount || 0), 0);
      const pending = b.filter((x) => ["pending", "payment_pending"].includes(x.status)).length;
      setStats({ venues: v.length, pending, revenue, total: b.length });
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

  const updateBookingStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      push(status === "approved" ? "Booking approved! Booker has 4hrs to pay." : "Booking rejected");
      fetchData();
    } catch (err) { push(err.response?.data?.message || "Failed", "error"); }
  };

  const toggleVenueActive = async (venue) => {
    try {
      await api.patch(`/venues/${venue._id}/toggle-active`);
      push(`Venue ${venue.isActive ? "deactivated" : "activated"}`);
      fetchData();
    } catch { push("Failed to update venue", "error"); }
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
      const r = await api.patch("/auth/switch-role", { role: "booker" });
      login(r.data.user, r.data.token);
      push("Switched to Booker!");
      setTimeout(() => navigate("/booker/dashboard"), 800);
    } catch { push("Switch failed", "error"); }
  };

  const pendingBookings = bookings.filter((b) => ["pending", "payment_pending"].includes(b.status));
  const avatar = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=0d9488&fontColor=ffffff`;

  const TABS = [
    { key: "overview",  icon: ICONS.overview },
    { key: "venues",    icon: ICONS.venues },
    { key: "bookings",  icon: ICONS.bookings },
    { key: "chat",      icon: ICONS.chat,    dot: unreadChats },
    { key: "profile",   icon: ICONS.profile },
  ];

  return (
    <div style={{ fontFamily: `'${currentFont}', sans-serif`, background: pageBg, minHeight: "100vh" }}
      className="flex">

      <Toast toasts={toasts} />

      {/* ── Sidebar — Image 1 style: dark navy in dark mode ──────── */}
      <aside style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
        className="fixed left-0 top-0 h-full w-[68px] flex flex-col items-center z-40 py-4 gap-1">

        {/* Logo — Image 1: small green BYE circle */}
        <button onClick={() => navigate("/")}
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
          style={{ background: C.primaryGrad }}>
          <span style={{ color: "#fff", fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 10 }}>BYE</span>
        </button>

        {TABS.map(({ key, icon, dot }) => (
          <button key={key} onClick={() => setTab(key)} title={key}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={tab === key
              ? { background: C.primaryGrad, color: "#fff", boxShadow: `0 4px 14px rgba(13,148,136,0.45)` }
              : { color: dark ? "rgba(226,232,240,0.4)" : "rgba(26,26,46,0.35)" }}>
            <Icon d={icon} size={18} />
            {dot && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            {key === "overview" && stats.pending > 0 && tab !== key && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                style={{ background: C.statAmber }}>{stats.pending}</span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        <button onClick={() => setDark((p) => !p)}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: dark ? "rgba(226,232,240,0.4)" : "rgba(26,26,46,0.35)" }}>
          <Icon d={dark ? ICONS.sun : ICONS.moon} size={18} />
        </button>

        <button onClick={() => setTab("profile")} className="mt-1">
          <img src={user?.avatar || avatar(user?.name)} alt=""
            className="w-9 h-9 rounded-full object-cover" />
        </button>

        <button onClick={() => { logout(); navigate("/login"); }} title="Logout"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors mt-1 mb-1"
          style={{ color: C.redSolid }}>
          <Icon d={ICONS.logout} size={18} />
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="ml-[68px] flex-1 min-h-screen p-6 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="max-w-6xl mx-auto">

            {/* ── Overview — matches Image 1 layout exactly ─────────── */}
            {tab === "overview" && (
              <div className="space-y-6">
                <HeroBanner name={user?.name} dark={dark} />

                {/* Image 1: 4 stat cards in exact order — teal, blue, amber, purple */}
                <div>
                  <p className="text-sm font-bold mb-3" style={{ color: textMuted }}>Statistics Overview Section</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Venues"      value={stats.venues}            grad={C.statTeal}   />
                    <StatCard label="Upcoming Bookings" value={stats.pending}            grad={C.statBlue}   />
                    <StatCard label="Monthly Revenue"   value={formatINR(stats.revenue)} grad={C.statAmber}  />
                    <StatCard label="Pending Requests"  value={`0/${stats.total}`}       grad={C.statPurple} />
                  </div>
                </div>

                {/* Pending Bids */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="px-6 py-4 flex items-center gap-3"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <Icon d={ICONS.zap} size={16} style={{ color: C.amberSolid }} />
                    <h2 className="font-bold" style={{ color: textMain }}>Pending Bids</h2>
                    {pendingBookings.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ background: C.statAmber }}>{pendingBookings.length}</span>
                    )}
                  </div>
                  {loading ? (
                    <p className="text-center py-12 text-sm" style={{ color: textMuted }}>Loading…</p>
                  ) : pendingBookings.length === 0 ? (
                    <p className="text-center py-12 text-sm" style={{ color: textMuted }}>No pending bids</p>
                  ) : (
                    <div>
                      {pendingBookings.map((b) => (
                        <div key={b._id} className="px-6 py-4 flex items-center gap-4 flex-wrap transition-colors"
                          style={{ borderBottom: `1px solid ${cardBorder}` }}
                          onMouseEnter={(e) => e.currentTarget.style.background = dark ? "#252540" : "#f8f9ff"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: textMain }}>{b.venue?.name || "Venue"}</p>
                            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                              {b.booker?.name || "Booker"} · {b.guestCount} guests · {formatDateIN(b.eventDate)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs" style={{ color: textMuted }}>Bid Amount</p>
                            <p className="font-black text-lg" style={{ color: C.amberSolid }}>{formatINR(b.bidAmount)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateBookingStatus(b._id, "approved")}
                              className="px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90"
                              style={{ background: C.primaryGrad }}>
                              ✓ Approve
                            </button>
                            <button onClick={() => updateBookingStatus(b._id, "rejected")}
                              className="px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90"
                              style={{ background: C.red }}>
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── My Venues — Image 1: grid with status badges ──────── */}
            {tab === "venues" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: textMuted }}>My Venues</p>
                    <p className="text-xs" style={{ color: textMuted }}>Responsive grid of choose venues</p>
                  </div>
                  <div className="flex gap-3 items-center flex-wrap">
                    {/* Image 1: "View All" button with dropdown arrow */}
                    <button onClick={() => setModal({ type: "add" })}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90"
                      style={{ background: C.primaryGrad }}>
                      <Icon d={ICONS.plus} size={16} /> Add Venue
                    </button>
                  </div>
                </div>

                {loading ? (
                  <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loading…</p>
                ) : venues.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl border-2 border-dashed"
                    style={{ borderColor: cardBorder }}>
                    <p className="mb-4" style={{ color: textMuted }}>No venues yet. Add your first!</p>
                    <button onClick={() => setModal({ type: "add" })}
                      className="px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90"
                      style={{ background: C.primaryGrad }}>
                      + Add Venue
                    </button>
                  </div>
                ) : (
                  /* Image 1: 4-column grid (lg), each card with image + status badge + edit/view buttons */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {venues.map((v) => {
                      const img = v.images?.[0];
                      const isActive  = v.isActive !== false;
                      const isPending = !v.isApproved;
                      // Image 1 status labels: Active (green), Pending (amber), Unavailable (red)
                      const statusLabel = isPending ? "Pending" : isActive ? "Active" : "Unavailable";
                      const statusStyle = isPending
                        ? { background: C.statAmber, color: "#fff" }
                        : isActive
                          ? { background: C.greenSolid, color: "#fff" }
                          : { background: C.redSolid, color: "#fff" };

                      return (
                        <motion.div key={v._id} layout whileHover={{ y: -4 }}
                          className="rounded-2xl overflow-hidden group"
                          style={{
                            background: cardBg,
                            border: `1px solid ${cardBorder}`,
                            boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.06)",
                          }}>
                          <div className="relative h-36 overflow-hidden"
                            style={{ background: dark ? "#2a2a3e" : "#e8eaf6" }}>
                            {img ? (
                              <img src={img} alt={v.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon d={ICONS.venues} size={36} style={{ color: textMuted }} />
                              </div>
                            )}
                            {/* Image 1: status badge top-left */}
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                              style={statusStyle}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="p-3">
                            <p className="font-bold text-sm truncate" style={{ color: textMain }}>{v.name}</p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: textMuted }}>
                              📍 {v.location?.city || v.city || "—"}
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-semibold" style={{ color: C.primary }}>
                                {formatINR(v.pricePerHour)}/hr
                              </span>
                              {v.rating && (
                                <span className="text-xs" style={{ color: C.amberSolid }}>★ {v.rating}</span>
                              )}
                            </div>
                            {/* Image 1: "Edit Venue" + "View Bookings" buttons */}
                            <div className="grid grid-cols-2 gap-1.5 mt-3">
                              <button onClick={() => setModal({ type: "edit", venue: v })}
                                className="py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                                style={{ border: `1px solid ${cardBorder}`, color: textMuted, background: "transparent" }}>
                                Edit Venue
                              </button>
                              <button onClick={() => navigate(`/owner/venues/${v._id}`)}
                                className="py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                                style={{ background: C.primaryGrad }}>
                                View Bookings
                              </button>
                            </div>
                            {/* Toggle active */}
                            <button onClick={() => toggleVenueActive(v)}
                              className="mt-1.5 w-full py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                              style={{
                                background: isActive ? "rgba(220,38,38,0.1)" : "rgba(13,148,136,0.1)",
                                color: isActive ? C.redSolid : C.primary,
                              }}>
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── All Bookings ──────────────────────────────────────── */}
            {tab === "bookings" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>All Bookings</h1>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  {loading ? (
                    <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loading…</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-center py-16 text-sm" style={{ color: textMuted }}>No bookings found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                            {["Venue", "Booker", "Date", "Bid", "Status", "Action"].map((h) => (
                              <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                                style={{ color: textMuted }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => (
                            <tr key={b._id} style={{ borderBottom: `1px solid ${cardBorder}` }}
                              onMouseEnter={(e) => e.currentTarget.style.background = dark ? "#252540" : "#f8f9ff"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              <td className="px-5 py-4 font-semibold whitespace-nowrap" style={{ color: textMain }}>
                                {truncate(b.venue?.name || "—", 20)}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap" style={{ color: textMuted }}>{b.booker?.name || "—"}</td>
                              <td className="px-5 py-4 whitespace-nowrap" style={{ color: textMuted }}>{formatDateIN(b.eventDate)}</td>
                              <td className="px-5 py-4 font-bold whitespace-nowrap" style={{ color: C.primary }}>{formatINR(b.bidAmount)}</td>
                              <td className="px-5 py-4"><Badge status={b.status} /></td>
                              <td className="px-5 py-4">
                                {["pending", "payment_pending"].includes(b.status) ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => updateBookingStatus(b._id, "approved")}
                                      className="px-2.5 py-1 rounded-lg text-white text-xs font-bold hover:opacity-90"
                                      style={{ background: C.primaryGrad }}>
                                      Approve
                                    </button>
                                    <button onClick={() => updateBookingStatus(b._id, "rejected")}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                                      style={{ background: "rgba(220,38,38,0.1)", color: C.redSolid }}>
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs" style={{ color: textMuted }}>{timeAgo(b.createdAt)}</span>
                                )}
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

            {/* ── Chat ─────────────────────────────────────────────── */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel user={user} dark={dark} />
                </div>
              </div>
            )}

            {/* ── Profile ──────────────────────────────────────────── */}
            {tab === "profile" && (
              <div className="max-w-xl space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Profile</h1>

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
                          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>Venue Owner</span>
                      </div>
                      {!editMode && (
                        <button onClick={() => setEditMode(true)}
                          className="p-2 rounded-xl hover:opacity-80"
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
                            style={{ background: C.primaryGrad }}>
                            {profileLoading ? "Saving…" : "Save Changes"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mini stats — Image 1 style */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Venues"   value={stats.venues}            grad={C.statTeal}   />
                  <StatCard label="Bookings" value={stats.total}             grad={C.statBlue}   />
                  <StatCard label="Revenue"  value={formatINR(stats.revenue)} grad={C.statAmber}  />
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
                          ? { background: C.primaryGrad, color: "#fff", border: "1px solid transparent" }
                          : { background: "transparent", color: textMuted, border: `1px solid ${cardBorder}` }}>
                        {l.native}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={handleSwitchRole}
                    className="w-full py-3 rounded-xl font-semibold text-sm hover:opacity-80"
                    style={{ border: `1px solid ${cardBorder}`, color: textMain, background: "transparent" }}>
                    Switch to Booker
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

      {/* ── Venue Modal ──────────────────────────────────────────── */}
      {modal && (
        <VenueModal
          mode={modal.type}
          venue={modal.venue}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData(); }}
          push={push}
          dark={dark}
        />
      )}
    </div>
  );
}
