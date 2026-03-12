import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  calendar:  "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  analytics: "M3 3v18h18M7 13l3-3 3 2 4-5",
  chat:      "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  profile:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  settings:  "M12 8a4 4 0 100 8 4 4 0 000-8zM2 12h2m16 0h2M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41m0-14.14l-1.41 1.41M6.34 17.66l-1.41 1.41",
  bell:      "M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9",
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  COLOR SYSTEM â€” extracted from Image 1
//
//  Hero gradient: deep forest green â†’ teal â†’ purple â†’ indigo (BOTH modes)
//  Light bg:  white #ffffff, cards white with light border
//  Dark bg:   navy-purple #1a1a2e, sidebar #16213e
//
//  Stat cards â€” exactly as shown in Image 1:
//   1) Teal/cyan   â€” Total Venues
//   2) Blue/indigo â€” Upcoming Bookings
//   3) Amber/gold  â€” Monthly Revenue
//   4) Purple      â€” Pending Requests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  heroLight: "linear-gradient(132deg, #4F46E5 0%, #6366F1 42%, #22D3EE 100%)",
  heroDark:  "linear-gradient(132deg, #312E81 0%, #4338CA 42%, #0E7490 100%)",

  statTeal:   "linear-gradient(135deg, #4F46E5 0%, #6366F1 65%, #22D3EE 100%)",
  statBlue:   "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
  statAmber:  "linear-gradient(135deg, #0EA5E9 0%, #22D3EE 100%)",
  statPurple: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",

  primary:     "#4F46E5",
  primaryHover:"#4338CA",
  primaryGrad: "linear-gradient(135deg, #4F46E5, #6366F1 60%, #22D3EE)",

  purple:     "#7C3AED",
  purpleGrad: "linear-gradient(135deg, #7C3AED, #6D28D9)",

  amber:      "linear-gradient(135deg, #0EA5E9, #22D3EE)",
  amberSolid: "#0EA5E9",
  green:      "linear-gradient(135deg, #059669, #10B981)",
  greenSolid: "#059669",
  red:        "linear-gradient(135deg, #DC2626, #B91C1C)",
  redSolid:   "#DC2626",
  sidebarActive: "#4F46E5",
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

// â”€â”€â”€ Stat Card â€” Image 1 style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ label, value, sub, grad, bars = [42, 68, 54, 86, 64] }) {
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
      <div className="mt-3 flex items-end gap-1.5 h-8">
        {bars.map((h, idx) => (
          <motion.span
            key={`${label}-${idx}`}
            initial={{ height: 4, opacity: 0.4 }}
            animate={{ height: `${h}%`, opacity: 0.9 }}
            transition={{ duration: 0.45, delay: idx * 0.05 }}
            className="w-1.5 rounded-full bg-white/70"
          />
        ))}
      </div>
    </motion.div>
  );
}

// â”€â”€â”€ Hero Banner â€” Image 1 exact style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeroBanner({ name, dark }) {
  return (
    <div className="relative rounded-2xl overflow-hidden p-8"
      style={{ background: dark ? C.heroDark : C.heroLight }}>
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full"
        style={{ background: "rgba(99,102,241,0.35)" }} />
      <div className="absolute right-32 bottom-0 w-32 h-32 rounded-full"
        style={{ background: "rgba(34,211,238,0.3)" }} />
      <div className="absolute left-1/3 top-4 w-4 h-4 rounded-full"
        style={{ background: "rgba(255,255,255,0.75)" }} />
      <div className="absolute right-16 top-6 text-cyan-100 text-2xl select-none">*</div>
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{ color: "rgba(255,255,255,0.7)" }}>Owner Dashboard</p>
        <h1 className="text-4xl font-black text-white mb-2"
          style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>
          Run Your Venue Business
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)" }} className="text-sm">
          Track bookings, revenue, and conversations in one workspace. Welcome back, {name?.split(" ")[0] || "there"}.
        </p>
      </div>
    </div>
  );
}

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

// â”€â”€â”€ Venue Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                ["pricePerHour", "Price / Hour (â‚¹) *", "number", "e.g. 5000"],
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
                  <option value="">Select typeâ€¦</option>
                  {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: textMuted }}>Full Address</label>
              <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)}
                placeholder="Street addressâ€¦"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: inputBg, color: textMain, border: `1px solid ${cardBorder}` }} />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: textMuted }}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={3} placeholder="Describe your venueâ€¦"
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

            {/* Images â€” only for add */}
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
                {loading ? "Savingâ€¦" : mode === "add" ? "Add Venue" : "Save Changes"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// â”€â”€â”€ Chat Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const avatar   = (name) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=4f46e5&fontColor=ffffff`;

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
                style={active?._id === c._id ? { background: "rgba(79,70,229,0.12)" } : {}}>
                <img src={avatar(op?.name)} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: textMain }}>{op?.name || "User"}</p>
                  <p className="text-xs truncate" style={{ color: textMuted }}>{c.lastMessage?.content?.slice(0, 28) || op?.email || "â€”"}</p>
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
                placeholder="Type a messageâ€¦"
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

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OwnerDashboard() {
  const { user, logout, login } = useAuth();
  const navigate                = useNavigate();
  const { toasts, push }        = useToast();

  const [tab,      setTab]      = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" ? window.innerWidth < 1200 : false);
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
  const [globalSearch, setGlobalSearch] = useState("");

  const [lang, setLang] = useState(() => localStorage.getItem("appLang") || "en");
  const LANGS = [
    { code: "en", native: "English",  font: "DM Sans" },
    { code: "hi", native: "à¤¹à¤¿à¤¨à¥à¤¦à¥€",    font: "Noto Sans Devanagari" },
    { code: "te", native: "à°¤à±†à°²à±à°—à±",   font: "Noto Sans Telugu" },
    { code: "ta", native: "à®¤à®®à®¿à®´à¯",    font: "Noto Sans Tamil" },
    { code: "kn", native: "à²•à²¨à³à²¨à²¡",    font: "Noto Sans Kannada" },
  ];
  const currentFont = LANGS.find((l) => l.code === lang)?.font || "DM Sans";

  const pageBg     = dark ? "#0B1020" : "#F8FAFC";
  const cardBg     = dark ? "rgba(17,24,39,0.85)" : "rgba(255,255,255,0.82)";
  const cardBorder = dark ? "rgba(99,102,241,0.32)" : "rgba(79,70,229,0.18)";
  const textMain   = dark ? "#E2E8F0" : "#0F172A";
  const textMuted  = dark ? "rgba(226,232,240,0.62)" : "#64748B";
  const sidebarBg  = dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.8)";
  const sidebarBorder = dark ? "rgba(99,102,241,0.28)" : "rgba(79,70,229,0.16)";
  const inputBg    = dark ? "rgba(30,41,59,0.9)" : "rgba(248,250,252,0.92)";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("ownerTheme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setSidebarCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
  }, [push]);

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
  const query = globalSearch.trim().toLowerCase();
  const filteredVenues = !query
    ? venues
    : venues.filter((v) =>
        [v.name, v.city, v.location?.city, v.venueType, v.type]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(query))
      );
  const filteredBookingsForTable = !query
    ? bookings
    : bookings.filter((b) =>
        [b._id, b.venue?.name, b.booker?.name, b.status]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(query))
      );
  const avatar = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=4f46e5&fontColor=ffffff`;

  const TABS = [
    { key: "overview",  label: "Dashboard", icon: ICONS.overview },
    { key: "bookings",  label: "Bookings",  icon: ICONS.bookings },
    { key: "venues",    label: "Venues",    icon: ICONS.venues },
    { key: "calendar",  label: "Calendar",  icon: ICONS.calendar },
    { key: "analytics", label: "Analytics", icon: ICONS.analytics },
    { key: "chat",      label: "Messages",  icon: ICONS.chat, dot: unreadChats },
    { key: "profile",   label: "Settings",  icon: ICONS.settings },
  ];

  return (
    <div style={{ fontFamily: `'${currentFont}', sans-serif`, background: pageBg, minHeight: "100vh" }}
      className="flex">

      <Toast toasts={toasts} />

      <aside style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, backdropFilter: "blur(10px)" }}
        className={`hidden md:block fixed left-0 top-0 h-full z-40 py-4 px-3 transition-all duration-200 ${sidebarCollapsed ? "w-[84px]" : "w-[248px]"}`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")}
            className={`rounded-2xl flex items-center justify-center ${sidebarCollapsed ? "w-11 h-11" : "px-3 h-11"}`}
            style={{ background: "linear-gradient(135deg,#4F46E5,#22D3EE)", color: "#fff" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 12 }}>BYE</span>
          </button>
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="p-2 rounded-xl hover:bg-white/60" style={{ color: textMuted }}>
              <Icon d={ICONS.arrowRight} size={14} />
            </button>
          )}
        </div>

        {sidebarCollapsed && (
          <button onClick={() => setSidebarCollapsed(false)} className="mb-3 w-full py-2 rounded-xl text-xs font-semibold hover:bg-white/60" style={{ color: textMuted }}>
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

      <main className={`${sidebarCollapsed ? "md:ml-[84px]" : "md:ml-[248px]"} ml-0 flex-1 min-h-screen p-4 md:p-6 lg:p-8 pb-24 md:pb-8 transition-all duration-200`}>
        <div className="max-w-7xl mx-auto mb-6">
          <div className="saas-card px-4 md:px-5 py-3 md:py-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="relative flex-1 min-w-[220px] md:max-w-xl">
              <Icon d={ICONS.search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search bookings, venues, customers..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none border border-indigo-100 bg-white/80"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-xl border border-indigo-100 bg-white/80 text-slate-500 hover:text-indigo-600 transition-colors">
                <Icon d={ICONS.bell} size={16} />
              </button>
              <button onClick={() => setModal({ type: "add" })} className="saas-glow-btn px-4 py-2.5 text-sm font-semibold">
                Add Venue
              </button>
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="max-w-7xl mx-auto">

            {/* â”€â”€ Overview â€” matches Image 1 layout exactly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "overview" && (
              <div className="space-y-6">
                <HeroBanner name={user?.name} dark={dark} />

                {/* Image 1: 4 stat cards in exact order â€” teal, blue, amber, purple */}
                <div>
                  <p className="text-sm font-bold mb-3" style={{ color: textMuted }}>Live Performance Snapshot</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Venues"      value={stats.venues}            grad={C.statTeal}   />
                    <StatCard label="Upcoming Bookings" value={stats.pending}            grad={C.statBlue}   />
                    <StatCard label="Monthly Revenue"   value={formatINR(stats.revenue)} grad={C.statAmber}  />
                    <StatCard label="Pending Requests"  value={stats.pending} sub={`${stats.total} total`} grad={C.statPurple} />
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
                    <p className="text-center py-12 text-sm" style={{ color: textMuted }}>Loadingâ€¦</p>
                  ) : pendingBookings.length === 0 ? (
                    <p className="text-center py-12 text-sm" style={{ color: textMuted }}>No pending bids</p>
                  ) : (
                    <div>
                      {pendingBookings.map((b) => (
                        <div key={b._id} className="px-6 py-4 flex items-center gap-4 flex-wrap transition-colors"
                          style={{ borderBottom: `1px solid ${cardBorder}` }}
                          onMouseEnter={(e) => e.currentTarget.style.background = dark ? "rgba(79,70,229,0.12)" : "#EEF2FF"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: textMain }}>{b.venue?.name || "Venue"}</p>
                            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                              {b.booker?.name || "Booker"} Â· {b.guestCount} guests Â· {formatDateIN(b.eventDate)}
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
                              âœ“ Approve
                            </button>
                            <button onClick={() => updateBookingStatus(b._id, "rejected")}
                              className="px-3 py-1.5 rounded-xl text-white text-xs font-bold hover:opacity-90"
                              style={{ background: C.red }}>
                              âœ• Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* â”€â”€ My Venues â€” Image 1: grid with status badges â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                  <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loadingâ€¦</p>
                ) : filteredVenues.length === 0 ? (
                  <div className="py-20 text-center rounded-2xl border-2 border-dashed"
                    style={{ borderColor: cardBorder }}>
                    <p className="mb-4" style={{ color: textMuted }}>
                      {query ? "No venues found for your search." : "No venues yet. Add your first!"}
                    </p>
                    <button onClick={() => setModal({ type: "add" })}
                      className="px-6 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90"
                      style={{ background: C.primaryGrad }}>
                      + Add Venue
                    </button>
                  </div>
                ) : (
                  /* Image 1: 4-column grid (lg), each card with image + status badge + edit/view buttons */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredVenues.map((v) => {
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
                              ðŸ“ {v.location?.city || v.city || "â€”"}
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs font-semibold" style={{ color: C.primary }}>
                                {formatINR(v.pricePerHour)}/hr
                              </span>
                              {v.rating && (
                                <span className="text-xs" style={{ color: C.amberSolid }}>â˜… {v.rating}</span>
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
                                background: isActive ? "rgba(220,38,38,0.1)" : "rgba(79,70,229,0.1)",
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

            {tab === "calendar" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Event Calendar</h1>
                <div className="saas-card p-5">
                  <p className="text-sm mb-4" style={{ color: textMuted }}>
                    Upcoming events from approved and pending bookings.
                  </p>
                  <div className="space-y-3">
                    {[...bookings]
                      .filter((b) => ["pending", "payment_pending", "approved", "confirmed"].includes(b.status))
                      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
                      .slice(0, 10)
                      .map((b) => (
                        <div key={b._id} className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white/70 px-4 py-3">
                          <div>
                            <p className="font-semibold text-sm" style={{ color: textMain }}>{b.venue?.name || "Venue"}</p>
                            <p className="text-xs" style={{ color: textMuted }}>{formatDateIN(b.eventDate)} | {b.booker?.name || "Customer"}</p>
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
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Analytics</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="saas-card p-5 lg:col-span-2">
                    <p className="text-sm font-semibold mb-4" style={{ color: textMain }}>Revenue Per Month</p>
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - (5 - idx));
                        const label = date.toLocaleString("en-IN", { month: "short" });
                        const value = bookings
                          .filter((b) => {
                            const d = new Date(b.createdAt);
                            return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear() && ["approved", "confirmed", "paid"].includes(b.status);
                          })
                          .reduce((sum, b) => sum + (b.bidAmount || 0), 0);
                        const width = `${Math.max(8, Math.min(100, Math.round(value / 2000) * 12))}%`;
                        return (
                          <div key={label} className="grid grid-cols-[56px_1fr_86px] items-center gap-3">
                            <span className="text-xs font-semibold" style={{ color: textMuted }}>{label}</span>
                            <div className="h-2.5 rounded-full bg-indigo-100 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width }}
                                transition={{ duration: 0.6, delay: idx * 0.06 }}
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg,#4F46E5,#22D3EE)" }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-right" style={{ color: textMain }}>{formatINR(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="saas-card p-5">
                    <p className="text-sm font-semibold mb-3" style={{ color: textMain }}>Venue Popularity</p>
                    <div className="space-y-3 text-sm">
                      {[...venues]
                        .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
                        .slice(0, 4)
                        .map((v) => (
                          <div key={v._id} className="rounded-xl border border-indigo-100 bg-white/75 px-3 py-2.5">
                            <p className="font-semibold truncate" style={{ color: textMain }}>{v.name}</p>
                            <p style={{ color: textMuted }}>{Number(v.views || 0)} views</p>
                          </div>
                        ))}
                      {venues.length === 0 && <p style={{ color: textMuted }}>No venue data yet.</p>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label="Total Bookings" value={stats.total} grad={C.statTeal} />
                  <StatCard label="Pending" value={stats.pending} grad={C.statBlue} />
                  <StatCard label="Revenue" value={formatINR(stats.revenue)} grad={C.statPurple} />
                </div>
              </div>
            )}

            {/* â”€â”€ All Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "bookings" && (
              <div className="space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>All Bookings</h1>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  {loading ? (
                    <p className="text-center py-16 text-sm" style={{ color: textMuted }}>Loadingâ€¦</p>
                  ) : filteredBookingsForTable.length === 0 ? (
                    <p className="text-center py-16 text-sm" style={{ color: textMuted }}>No bookings found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${cardBorder}` }}>
                            {["Booking ID", "Venue", "Customer", "Date", "Status", "Actions"].map((h) => (
                              <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                                style={{ color: textMuted }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookingsForTable.map((b) => (
                            <tr key={b._id} style={{ borderBottom: `1px solid ${cardBorder}` }}
                              onMouseEnter={(e) => e.currentTarget.style.background = dark ? "rgba(79,70,229,0.12)" : "#EEF2FF"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              <td className="px-5 py-4 font-mono text-xs whitespace-nowrap" style={{ color: textMuted }}>
                                #{String(b._id || "").slice(-6)}
                              </td>
                              <td className="px-5 py-4 font-semibold whitespace-nowrap" style={{ color: textMain }}>
                                {truncate(b.venue?.name || "â€”", 20)}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap" style={{ color: textMuted }}>{b.booker?.name || "â€”"}</td>
                              <td className="px-5 py-4 whitespace-nowrap" style={{ color: textMuted }}>{formatDateIN(b.eventDate)}</td>
                              <td className="px-5 py-4"><Badge status={b.status} /></td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => navigate(`/venue/${b.venue?._id}`)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold"
                                    style={{ background: "rgba(79,70,229,0.12)", color: C.primary }}
                                  >
                                    View
                                  </button>
                                  {["pending", "payment_pending"].includes(b.status) && (
                                    <>
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
                                    </>
                                  )}
                                  {!["pending", "payment_pending"].includes(b.status) && (
                                    <span className="text-xs self-center" style={{ color: textMuted }}>{timeAgo(b.createdAt)}</span>
                                  )}
                                </div>
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

            {/* â”€â”€ Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel user={user} dark={dark} />
                </div>
              </div>
            )}

            {/* â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {tab === "profile" && (
              <div className="max-w-xl space-y-5">
                <h1 className="text-2xl font-black" style={{ color: textMain }}>Settings</h1>

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
                            {profileLoading ? "Savingâ€¦" : "Save Changes"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mini stats â€” Image 1 style */}
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

      <nav className="md:hidden saas-mobile-bottom-nav grid grid-cols-4 gap-1">
        {[
          { key: "overview", label: "Home", icon: ICONS.overview },
          { key: "bookings", label: "Bookings", icon: ICONS.bookings },
          { key: "venues", label: "Venues", icon: ICONS.venues },
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

      {/* â”€â”€ Venue Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

