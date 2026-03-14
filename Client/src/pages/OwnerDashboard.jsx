import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  alert:     "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
};

// Gradient constants
const G = {
  hero:    "linear-gradient(135deg,#3DAA6E 0%,#6B4FBB 100%)",
  violet:  "linear-gradient(135deg,#4f46e5,#7c3aed)",
  amber:   "linear-gradient(135deg,#d97706,#f59e0b)",
  emerald: "linear-gradient(135deg,#059669,#14b8a6)",
  sky:     "linear-gradient(135deg,#0284c7,#06b6d4)",
  red:     "linear-gradient(135deg,#dc2626,#e11d48)",
};

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AMENITIES = [
  "AC", "Parking", "WiFi", "Stage", "Catering", "DJ Setup",
  "Generator", "CCTV", "Security", "Elevator", "Wheelchair Access", "Swimming Pool",
];
const VENUE_TYPES = [
  "Wedding Hall", "Banquet Hall", "Conference Room", "Rooftop",
  "Farmhouse", "Resort", "Auditorium", "Lawn", "Club House",
  "Convention Centre", "Terrace", "Studio", "Sports Ground", "Other",
];

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
    confirmed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    rejected:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    cancelled:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    canceled:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    paid:       "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    bid_raised: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    expired:    "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || map.expired}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

// â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ KPI Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KpiCard({ label, value, icon, tone }) {
  const tones = {
    teal:   "bg-emerald-100 text-emerald-600",
    purple: "bg-purple-100 text-purple-600",
    amber:  "bg-amber-100 text-amber-600",
    cyan:   "bg-cyan-100 text-cyan-600",
  };
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 relative">
      <div className={`absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center ${tones[tone] || tones.teal}`}>
        <Icon d={icon} size={16} />
      </div>
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-semibold">{label}</p>
      <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">{value}</p>
    </div>
  );
}

// â”€â”€â”€ Hero Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeroBanner() {
  return (
    <div className="relative rounded-2xl overflow-hidden p-8 h-[200px] flex items-center" style={{ background: G.hero }}>
      <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10" />
      <div className="absolute right-10 -bottom-16 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute left-10 top-8 w-20 h-20 rotate-12 bg-white/10 rounded-2xl" />
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl font-black text-white">Owner Dashboard</h1>
        <p className="text-white/80 text-sm md:text-base mt-2">Oversee Venues &amp; Bookings</p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Venue Modal (Add / Edit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VenueModal({ mode, venue, onClose, onSave, push }) {
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
        push("Venue added!");
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
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

          <div className="sticky top-0 rounded-t-2xl px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800
            flex items-center justify-between bg-white dark:bg-zinc-900">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                {mode === "add" ? "Add New Venue" : "Edit Venue"}
              </h2>
              {mode === "add" && <p className="text-xs text-zinc-400 mt-0.5">Fill in the details to list your venue</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Icon d={ICONS.x} size={18} className="text-zinc-500" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              ["name",         "Venue Name",          "col-span-2"],
              ["description",  "Description",         "col-span-2"],
              ["pricePerHour", "Price per Hour (â‚¹)",  "col-span-1"],
              ["capacity",     "Capacity (people)",   "col-span-1"],
              ["city",         "City",                "col-span-1"],
              ["pincode",      "Pincode",             "col-span-1"],
              ["address",      "Address",             "col-span-2"],
            ].map(([k, label, span]) => (
              <div key={k} className={span}>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">{label}</label>
                {k === "description" ? (
                  <textarea rows={3} value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                      bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                ) : (
                  <input value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                      bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                )}
              </div>
            ))}

            {mode === "add" && (
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">Venue Type</label>
                <select value={form.venueType} onChange={(e) => set("venueType", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                    bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select typeâ€¦</option>
                  {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 block uppercase tracking-wide">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                      ${form.amenities.includes(a) ? "text-white border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-emerald-400"}`}
                    style={form.amenities.includes(a) ? { background: G.emerald } : {}}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {mode === "add" && (
              <div className="col-span-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase tracking-wide">Images (up to 5)</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-emerald-400 transition-colors">
                  <Icon d={ICONS.upload} size={18} className="text-zinc-400" />
                  <span className="text-sm text-zinc-500">Click to upload images</span>
                  <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
                </label>
                {previews.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {previews.map((p, i) => <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover" />)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 pb-6 flex gap-3 justify-end">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <button onClick={submit} disabled={loading}
              className="px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: G.emerald }}>
              {loading ? "Savingâ€¦" : mode === "add" ? "Add Venue" : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// â”€â”€â”€ Chat Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChatPanel({ dark }) {
  const { user }               = useAuth();
  const [chats,    setChats]   = useState([]);
  const [active,   setActive]  = useState(null);
  const [messages, setMessages]= useState([]);
  const [text,     setText]    = useState("");
  const [sending,  setSending] = useState(false);
  const [loading,  setLoading] = useState(false);
  const bottomRef              = useRef(null);
  const isTyping               = false;

  const typingStyles = `
    @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    .dot { width:8px; height:8px; border-radius:50%; background:#9CA3AF; animation: bounce 1s infinite; display:inline-block; margin: 0 2px; }
    .dot:nth-child(2){animation-delay:0.2s} .dot:nth-child(3){animation-delay:0.4s}
  `;

  // FIX: handle both { chats: [] } and plain array
  useEffect(() => {
    api.get("/chats").then((r) => {
      const list = Array.isArray(r.data) ? r.data : r.data?.chats || [];
      setChats(list);
    }).catch(() => {});
  }, []);

  // FIX: handle both { messages: [] } and plain array
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

  // FIX: optimistic UI
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
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=059669&fontColor=ffffff`;

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
                className="ml-auto p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400">
                <Icon d={ICONS.x} size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col justify-end gap-2">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-zinc-400 text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                grouped.map((item) => {
                  if (item.type === "date") {
                    return (
                      <div key={item.key} className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-700" />
                        <span className="text-xs text-zinc-400 px-2 whitespace-nowrap">{item.label}</span>
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-700" />
                      </div>
                    );
                  }
                  const m = item.data;
                  const mine = (m.sender?._id || m.sender) === user?._id;
                  const body = m.text || m.content || "";
                  const senderName = m.sender?.name || "";
                  return (
                    <div key={item.key}
                      className={`flex items-end gap-2 mb-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
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
                          }>
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
export default function OwnerDashboard() {
  const { user, logout, login } = useAuth();
  const navigate                = useNavigate();
  const { toasts, push }        = useToast();

  const [tab,      setTab]      = useState("overview");
  const [dark,     setDark]     = useState(() => localStorage.getItem("ownerTheme") === "dark");
  const [venues,   setVenues]   = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats,    setStats]    = useState({ venues: 0, pending: 0, revenue: 0, total: 0 });
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [unreadChats, setUnreadChats] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const userMenuRef = useRef(null);

  const [editMode,       setEditMode]       = useState(false);
  const [profileForm,    setProfileForm]    = useState({ name: "", username: "", phone: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // REMOVED: lang, LANGS, currentFont â€” multi-language feature removed entirely

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ownerTheme", dark ? "dark" : "light");
  }, [dark]);

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
      const revenue = b.filter((x) => x.status === "paid").reduce((s, x) => s + (x.bidAmount || 0), 0);
      const pending = b.filter((x) => ["pending", "bid_raised"].includes(x.status)).length;
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
      push(status === "approved" ? "Booking approved!" : "Booking rejected");
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

  const pendingBookings = bookings.filter((b) => ["pending", "bid_raised"].includes(b.status));
  const upcomingBookings = bookings.filter((b) => {
    if (!b.eventDate) return false;
    const dt = new Date(b.eventDate);
    return dt >= new Date() && ["approved", "confirmed", "paid"].includes(b.status);
  });
  const activityBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const showcaseVenues = venues.slice(0, 4);
  const avatar = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=059669&fontColor=ffffff`;

  return (
    // FIXED: removed dynamic fontFamily â€” no more language-based font injection
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      className="min-h-screen bg-[#F6F7F9] dark:bg-zinc-950">

      <Toast toasts={toasts} />

      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
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
            <span className="hidden sm:block font-serif text-lg font-bold text-zinc-900 dark:text-white">
              BookYourEvent
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-zinc-600 dark:text-zinc-200">
            <button onClick={() => setTab("venues")}
              className={`transition-colors ${tab === "venues" ? "text-[#3DAA6E]" : "hover:text-[#3DAA6E]"}`}>
              My Venues
            </button>
            <button onClick={() => setTab("bookings")}
              className={`transition-colors ${tab === "bookings" ? "text-[#3DAA6E]" : "hover:text-[#3DAA6E]"}`}>
              Bookings
            </button>
            <button onClick={() => setTab("overview")}
              className={`transition-colors ${tab === "overview" ? "text-[#3DAA6E]" : "hover:text-[#3DAA6E]"}`}>
              Availability
            </button>
            <Link to="/about" className="hover:text-[#3DAA6E] transition-colors">About</Link>
            <Link to="/help" className="hover:text-[#3DAA6E] transition-colors">Contact</Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setDark((p) => !p)}
              className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700
                text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center">
              <Icon d={dark ? ICONS.sun : ICONS.moon} size={16} />
            </button>

            <div ref={userMenuRef} className="relative">
              <button onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <div className="relative">
                  <img src={user?.avatar || avatar(user?.name)} alt=""
                    className="w-8 h-8 rounded-full object-cover" />
                  {unreadChats && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-zinc-900 dark:text-white">
                  Hi, {user?.name?.split(" ")[0] || "Owner"}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                  <button onClick={() => { setModal({ type: "add" }); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    Add Venue
                  </button>
                  <button onClick={() => { setTab("profile"); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    Account Settings
                  </button>
                  <button onClick={() => { logout(); navigate("/login"); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Log Out
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

            {/* â”€â”€ Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "overview" && (
              <div className="space-y-6">
                <HeroBanner />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard label="Total Venues" value={stats.venues} icon={ICONS.venues} tone="teal" />
                  <KpiCard label="Upcoming Bookings" value={upcomingBookings.length} icon={ICONS.bookings} tone="purple" />
                  <KpiCard label="Monthly Revenue" value={formatINR(stats.revenue)} icon={ICONS.zap} tone="amber" />
                  <KpiCard label="Pending Requests" value={pendingBookings.length} icon={ICONS.alert} tone="cyan" />
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">My Venues</h2>
                  <button onClick={() => setTab("venues")}
                    className="text-sm font-semibold text-[#3DAA6E] hover:underline">
                    View all
                  </button>
                </div>

                {showcaseVenues.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 text-center text-zinc-500">
                    No venues yet
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {showcaseVenues.map((v) => {
                      const ratingValue = Number(v.rating || v.avgRating || v.averageRating || 0);
                      const starCount = Math.max(1, Math.min(5, Math.round(ratingValue || 4)));
                      const status = !v.isApproved
                        ? { label: "Pending", style: "bg-amber-100 text-amber-700" }
                        : v.isActive
                          ? { label: "Active", style: "bg-emerald-100 text-emerald-700" }
                          : { label: "Unavailable", style: "bg-zinc-200 text-zinc-600" };
                      const canToggle = !!v.isApproved;
                      return (
                        <div key={v._id} className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                          <div className="relative h-40 bg-zinc-100 dark:bg-zinc-800">
                            {v.images?.[0] ? (
                              <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon d={ICONS.venues} size={32} className="text-zinc-300 dark:text-zinc-600" />
                              </div>
                            )}
                            <span
                              onClick={canToggle ? () => toggleVenueActive(v) : undefined}
                              title={canToggle ? "Toggle availability" : undefined}
                              className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${status.style} ${canToggle ? "cursor-pointer" : ""}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="p-4 space-y-1">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">{v.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {v.location?.city || v.city || "â€”"}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300">
                              {formatINR(v.pricePerHour)}/hr
                            </p>
                            <div className="text-xs text-[#C4973A]">
                              {"\u2605".repeat(starCount)}{"\u2606".repeat(5 - starCount)}
                            </div>
                            <div className="pt-2 grid grid-cols-2 gap-2">
                              <button onClick={() => setModal({ type: "edit", venue: v })}
                                className="py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                Edit Venue
                              </button>
                              <button onClick={() => setTab("bookings")}
                                className="py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                View Bookings
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 dark:text-white">Recent Bookings</h3>
                      <button onClick={() => setTab("bookings")}
                        className="text-sm font-semibold text-[#3DAA6E] hover:underline">
                        View all
                      </button>
                    </div>
                    {loading ? (
                      <p className="text-center text-zinc-400 py-12 text-sm">Loadingâ€¦</p>
                    ) : activityBookings.length === 0 ? (
                      <p className="text-center text-zinc-400 py-12 text-sm">No bookings yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800">
                              {["Venue", "Guests", "Status"].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {activityBookings.map((b) => (
                              <tr key={b._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="px-5 py-3 font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                                  {truncate(b.venue?.name || "â€”", 20)}
                                </td>
                                <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{b.guests || "â€”"}</td>
                                <td className="px-5 py-3"><Badge status={b.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-zinc-900 dark:text-white">Availability</h3>
                      <span className="text-xs text-zinc-400">This month</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-xs text-zinc-400">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                        <div key={d} className="text-center">{d}</div>
                      ))}
                      {Array.from({ length: 28 }).map((_, i) => (
                        <div key={i} className="h-7 rounded-md bg-zinc-100 dark:bg-zinc-800" />
                      ))}
                    </div>
                    {venues.length === 0 && (
                      <p className="mt-4 text-center text-sm text-zinc-400">No venues yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ My Venues â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "venues" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-white">My Venues</h1>
                </div>

                {loading ? (
                  <p className="text-center text-zinc-400 py-16 text-sm">Loadingâ€¦</p>
                ) : venues.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <p className="text-zinc-400">No venues yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {venues.map((v) => {
                      const ratingValue = Number(v.rating || v.avgRating || v.averageRating || 0);
                      const starCount = Math.max(1, Math.min(5, Math.round(ratingValue || 4)));
                      const status = !v.isApproved
                        ? { label: "Pending", style: "bg-amber-100 text-amber-700" }
                        : v.isActive
                          ? { label: "Active", style: "bg-emerald-100 text-emerald-700" }
                          : { label: "Unavailable", style: "bg-zinc-200 text-zinc-600" };
                      const canToggle = !!v.isApproved;
                      return (
                        <div key={v._id} className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                          <div className="relative h-40 bg-zinc-100 dark:bg-zinc-800">
                            {v.images?.[0] ? (
                              <img src={v.images[0]} alt={v.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon d={ICONS.venues} size={32} className="text-zinc-300 dark:text-zinc-600" />
                              </div>
                            )}
                            <span
                              onClick={canToggle ? () => toggleVenueActive(v) : undefined}
                              title={canToggle ? "Toggle availability" : undefined}
                              className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${status.style} ${canToggle ? "cursor-pointer" : ""}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="p-4 space-y-1">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">{v.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {v.location?.city || v.city || "â€”"}
                            </p>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300">
                              {formatINR(v.pricePerHour)}/hr
                            </p>
                            <div className="text-xs text-[#C4973A]">
                              {"\u2605".repeat(starCount)}{"\u2606".repeat(5 - starCount)}
                            </div>
                            <div className="pt-2 grid grid-cols-2 gap-2">
                              <button onClick={() => setModal({ type: "edit", venue: v })}
                                className="py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                Edit Venue
                              </button>
                              <button onClick={() => setTab("bookings")}
                                className="py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                View Bookings
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* â”€â”€ All Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "bookings" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">All Bookings</h1>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
                  {loading ? (
                    <p className="text-center text-zinc-400 py-16 text-sm">Loadingâ€¦</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-center text-zinc-400 py-16 text-sm">No bookings found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            {["Venue", "Booker", "Date", "Bid", "Status", "Action"].map((h) => (
                              <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {bookings.map((b) => (
                            <tr key={b._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                                {truncate(b.venue?.name || "â€”", 20)}
                              </td>
                              <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{b.booker?.name || "â€”"}</td>
                              <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{formatDateIN(b.eventDate)}</td>
                              <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatINR(b.bidAmount)}</td>
                              <td className="px-5 py-4"><Badge status={b.status} /></td>
                              <td className="px-5 py-4">
                                {["pending", "bid_raised"].includes(b.status) ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => updateBookingStatus(b._id, "approved")}
                                      className="px-2.5 py-1 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity"
                                      style={{ background: G.emerald }}>
                                      Approve
                                    </button>
                                    <button onClick={() => updateBookingStatus(b._id, "rejected")}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors">
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-zinc-400">{timeAgo(b.createdAt)}</span>
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

            {/* â”€â”€ Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel dark={dark} />
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
                        <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">Venue Owner</span>
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
                                focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
                            style={{ background: G.emerald }}>
                            {profileLoading ? "Savingâ€¦" : "Save Changes"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Venues"   value={stats.venues}            grad={G.violet}  />
                  <StatCard label="Bookings" value={stats.total}             grad={G.sky}     />
                  <StatCard label="Revenue"  value={formatINR(stats.revenue)} grad={G.emerald} />
                </div>


                <div className="flex flex-col gap-3">
                  <button onClick={handleSwitchRole}
                    className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-700
                      text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Switch to Booker
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

      {/* â”€â”€ Venue Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {modal && (
        <VenueModal
          mode={modal.type}
          venue={modal.venue}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData(); }}
          push={push}
        />
      )}
    </div>
  );
}


