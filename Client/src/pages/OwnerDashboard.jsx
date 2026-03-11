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

// ─── Status Badge ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    pending:    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    approved:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    rejected:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
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
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Venue Modal (Add / Edit) ─────────────────────────────────────────────────
function VenueModal({ mode, venue, onClose, onSave, push }) {
  const [form, setForm] = useState({
    name:         venue?.name         || "",
    description:  venue?.description  || "",
    pricePerHour: venue?.pricePerHour || "",
    capacity:     venue?.capacity     || "",
    city:         venue?.city         || venue?.location?.city   || "",
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
    set("amenities", form.amenities.includes(a)
      ? form.amenities.filter((x) => x !== a)
      : [...form.amenities, a]);

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
        // ✅ Correct endpoint
        await api.post("/venues", fd, { headers: { "Content-Type": "multipart/form-data" } });
        push("Venue added successfully!");
      } else {
        // ✅ Correct endpoint
        await api.patch(`/venues/${venue._id}`, {
          name: form.name, description: form.description,
          pricePerHour: form.pricePerHour, capacity: form.capacity,
          amenities: form.amenities,
        });
        push("Venue updated!");
      }
      onSave();
    } catch (err) {
      push(err.response?.data?.message || "Failed to save venue", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

          <div className="sticky top-0 bg-white dark:bg-zinc-900 px-6 pt-6 pb-4
            border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {mode === "add" ? "Add New Venue" : "Edit Venue"}
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Icon d={ICONS.x} size={18} className="text-zinc-500" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              ["name",         "Venue Name",          "col-span-2"],
              ["description",  "Description",         "col-span-2"],
              ["pricePerHour", "Price per Hour (₹)",  "col-span-1"],
              ["capacity",     "Capacity (people)",   "col-span-1"],
              ["city",         "City",                "col-span-1"],
              ["pincode",      "Pincode",             "col-span-1"],
              ["address",      "Address",             "col-span-2"],
            ].map(([k, label, span]) => (
              <div key={k} className={span}>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">{label}</label>
                {k === "description" ? (
                  <textarea rows={3} value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                      bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                ) : (
                  <input value={form[k]} onChange={(e) => set(k, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                      bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                      focus:outline-none focus:ring-2 focus:ring-violet-500" />
                )}
              </div>
            ))}

            {mode === "add" && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">Venue Type</label>
                <select value={form.venueType} onChange={(e) => set("venueType", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                    bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Select type…</option>
                  {VENUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            <div className="col-span-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                      ${form.amenities.includes(a)
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-400"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {mode === "add" && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block">
                  Images (up to 5)
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed
                  border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-violet-400 transition-colors">
                  <Icon d={ICONS.upload} size={18} className="text-zinc-400" />
                  <span className="text-sm text-zinc-500">Click to upload images</span>
                  <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
                </label>
                {previews.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {previews.map((p, i) => (
                      <img key={i} src={p} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-6 pb-6 flex gap-3 justify-end">
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700
                text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <button onClick={submit} disabled={loading}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white
                text-sm font-semibold disabled:opacity-60 transition-colors">
              {loading ? "Saving…" : mode === "add" ? "Add Venue" : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel() {
  const { user }                  = useAuth();
  const [chats,    setChats]      = useState([]);
  const [active,   setActive]     = useState(null);
  const [messages, setMessages]   = useState([]);
  const [text,     setText]       = useState("");
  const [sending,  setSending]    = useState(false);
  const bottomRef                 = useRef(null);

  // ✅ Correct endpoint
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
      setText(msg);
    } finally {
      setSending(false);
    }
  };

  const opponent = (chat) => chat.participants?.find((p) => p._id !== user?._id);
  const avatar   = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=6d28d9&fontColor=ffffff`;

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
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-3">
              <img src={avatar(opponent(active)?.name)} alt="" className="w-8 h-8 rounded-full" />
              <p className="font-semibold text-zinc-900 dark:text-white text-sm">{opponent(active)?.name}</p>
              <button onClick={() => setActive(null)}
                className="ml-auto p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400">
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
export default function OwnerDashboard() {
  const { user, logout, login } = useAuth();
  const navigate                = useNavigate();
  const { toasts, push }        = useToast();

  const [tab,    setTab]    = useState("overview");
  const [dark,   setDark]   = useState(() => localStorage.getItem("ownerTheme") === "dark");
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats,  setStats]  = useState({ venues: 0, pending: 0, revenue: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal,  setModal]  = useState(null);
  const [unreadChats, setUnreadChats] = useState(false);

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
    localStorage.setItem("ownerTheme", dark ? "dark" : "light");
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
    if (user) setProfileForm({ name: user.name || "", username: user.username || "", phone: user.phone || "" });
  }, [user]);

  // ─── Data fetch ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([
        // ✅ Correct endpoint
        api.get("/venues/owner/mine"),
        api.get("/bookings/owner"),
      ]);
      const v = Array.isArray(vRes.data) ? vRes.data : vRes.data?.venues   || [];
      const b = Array.isArray(bRes.data) ? bRes.data : bRes.data?.bookings || [];
      setVenues(v);
      setBookings(b);
      const revenue = b.filter((x) => x.status === "paid").reduce((s, x) => s + (x.bidAmount || 0), 0);
      const pending = b.filter((x) => ["pending", "bid_raised"].includes(x.status)).length;
      setStats({ venues: v.length, pending, revenue, total: b.length });
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

  // ─── Handlers ────────────────────────────────────────────────────────────
  const updateBookingStatus = async (id, status) => {
    try {
      // ✅ Correct endpoint
      await api.patch(`/bookings/${id}/status`, { status });
      push(status === "approved" ? "Booking approved!" : "Booking rejected");
      fetchData();
    } catch (err) {
      push(err.response?.data?.message || "Failed", "error");
    }
  };

  const toggleVenueActive = async (venue) => {
    try {
      // ✅ Correct endpoint
      await api.patch(`/venues/${venue._id}/toggle-active`);
      push(`Venue ${venue.isActive ? "deactivated" : "activated"}`);
      fetchData();
    } catch {
      push("Failed to update venue", "error");
    }
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      // ✅ Correct endpoint
      const r = await api.patch("/auth/update-profile", profileForm);
      // ✅ login() takes (user, token)
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
      const r = await api.patch("/auth/switch-role", { role: "booker" });
      // ✅ Update AuthContext with new user + token
      login(r.data.user, r.data.token);
      push("Switched to Booker!");
      setTimeout(() => navigate("/booker/dashboard"), 800);
    } catch {
      push("Switch failed", "error");
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  const pendingBookings = bookings.filter((b) => ["pending", "bid_raised"].includes(b.status));

  const avatar = (name) =>
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || "U")}&backgroundColor=6d28d9&fontColor=ffffff`;

  const TABS = [
    { key: "overview",  icon: ICONS.overview },
    { key: "venues",    icon: ICONS.venues },
    { key: "bookings",  icon: ICONS.bookings },
    { key: "chat",      icon: ICONS.chat, dot: unreadChats },
    { key: "profile",   icon: ICONS.profile },
  ];

  return (
    <div style={{ fontFamily: `'${currentFont}', sans-serif` }}
      className={`min-h-screen flex ${dark ? "dark" : ""} bg-zinc-50 dark:bg-zinc-950`}>

      <Toast toasts={toasts} />

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
                    Welcome back, {user?.name?.split(" ")[0]} 👋
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here's your venue overview</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Venues"   value={stats.venues}              accent="violet" />
                  <StatCard label="Pending Bids"   value={stats.pending}             accent="amber" />
                  <StatCard label="Total Revenue"  value={formatINR(stats.revenue)}  accent="emerald" />
                  <StatCard label="Total Bookings" value={stats.total}               accent="sky" />
                </div>

                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-900 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="font-semibold text-zinc-900 dark:text-white">Pending Bids</h2>
                  </div>
                  {loading ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">Loading…</p>
                  ) : pendingBookings.length === 0 ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">No pending bids 🎉</p>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {pendingBookings.map((b) => (
                        <div key={b._id} className="px-6 py-4 flex items-center gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                              {b.venue?.name || "Venue"}
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {b.booker?.name} · {formatDateIN(b.eventDate)} · {formatINR(b.bidAmount)}
                            </p>
                          </div>
                          <Badge status={b.status} />
                          <div className="flex gap-2">
                            <button onClick={() => updateBookingStatus(b._id, "approved")}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700
                                text-white text-xs font-semibold transition-colors">
                              Approve
                            </button>
                            <button onClick={() => updateBookingStatus(b._id, "rejected")}
                              className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30
                                hover:bg-red-200 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors">
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Venues ────────────────────────────────────────── */}
            {tab === "venues" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Venues</h1>
                  <button onClick={() => setModal({ type: "add" })}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700
                      text-white rounded-xl text-sm font-semibold transition-colors">
                    <Icon d={ICONS.plus} size={16} />
                    Add Venue
                  </button>
                </div>

                {loading ? (
                  <p className="text-center text-zinc-400 py-16 text-sm">Loading…</p>
                ) : venues.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700
                    py-16 text-center">
                    <p className="text-zinc-400">No venues yet</p>
                    <button onClick={() => setModal({ type: "add" })}
                      className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white
                        rounded-xl text-sm font-semibold transition-colors">
                      Add your first venue
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {venues.map((v) => (
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
                          <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${v.isActive
                              ? "bg-emerald-500/90 text-white"
                              : "bg-zinc-500/90 text-white"}`}>
                            {v.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-zinc-900 dark:text-white truncate">{v.name}</p>
                          <p className="text-sm text-zinc-400 mt-0.5">
                            {v.location?.city || v.city || "—"} · {formatINR(v.pricePerHour)}/hr
                          </p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <button onClick={() => setModal({ type: "edit", venue: v })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200
                                dark:hover:bg-zinc-700 transition-colors">
                              <Icon d={ICONS.edit} size={13} /> Edit
                            </button>
                            <button onClick={() => setTab("bookings")}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200
                                dark:hover:bg-zinc-700 transition-colors">
                              <Icon d={ICONS.bookings} size={13} /> Bookings
                            </button>
                            <button onClick={() => toggleVenueActive(v)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                ${v.isActive
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100"
                                  : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"}`}>
                              {v.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Bookings ──────────────────────────────────────── */}
            {tab === "bookings" && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">All Bookings</h1>
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700
                  bg-white dark:bg-zinc-900 overflow-hidden">
                  {loading ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">Loading…</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-center text-zinc-400 py-12 text-sm">No bookings yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            {["Venue", "Booker", "Event Date", "Bid Amount", "Status", "When", "Actions"].map((h) => (
                              <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold
                                text-zinc-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                          {bookings.map((b) => (
                            <tr key={b._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-5 py-4 font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                                {truncate(b.venue?.name, 22)}
                              </td>
                              <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                {b.booker?.name || "—"}
                              </td>
                              <td className="px-5 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                {formatDateIN(b.eventDate)}
                              </td>
                              <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                                {formatINR(b.bidAmount)}
                              </td>
                              <td className="px-5 py-4"><Badge status={b.status} /></td>
                              <td className="px-5 py-4 text-zinc-400 text-xs whitespace-nowrap">
                                {timeAgo(b.createdAt)}
                              </td>
                              <td className="px-5 py-4">
                                {["pending", "bid_raised"].includes(b.status) && (
                                  <div className="flex gap-2">
                                    <button onClick={() => updateBookingStatus(b._id, "approved")}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700
                                        text-white text-xs font-semibold transition-colors">
                                      Approve
                                    </button>
                                    <button onClick={() => updateBookingStatus(b._id, "rejected")}
                                      className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30
                                        hover:bg-red-200 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors">
                                      Reject
                                    </button>
                                  </div>
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

            {/* ── Chat ──────────────────────────────────────────── */}
            {tab === "chat" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Messages</h1>
                <div style={{ height: "calc(100vh - 160px)" }}>
                  <ChatPanel />
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
                        bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                        Venue Owner
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

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="Venues"   value={stats.venues}             accent="violet" />
                  <StatCard label="Bookings" value={stats.total}              accent="sky" />
                  <StatCard label="Revenue"  value={formatINR(stats.revenue)} accent="emerald" />
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
                    Switch to Booker
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

      {/* ── Venue Modal ─────────────────────────────────────────── */}
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
