import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";
import { formatINR, timeAgo, generateTimeSlots, to12Hour } from "../utils/helpers";

// â”€â”€â”€ Google Fonts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FONT_LINK = `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap`;

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AMENITY_ICONS = {
  "AC": "â„ï¸", "Parking": "ðŸ…¿ï¸", "WiFi": "ðŸ“¶", "Stage": "ðŸŽ­",
  "Catering": "ðŸ½ï¸", "DJ Setup": "ðŸŽ§", "Generator": "âš¡", "CCTV": "ðŸ“¹",
  "Security": "ðŸ’‚", "Elevator": "ðŸ›—", "Wheelchair Access": "â™¿",
  "Swimming Pool": "ðŸŠ", "Decoration": "ðŸŽŠ", "Bridal Room": "ðŸ’",
  "Green Room": "ðŸª´", "Projector": "ðŸ“½ï¸", "Bar": "ðŸ¸", "Valet": "ðŸš—",
};

const ALL_AMENITIES = Object.keys(AMENITY_ICONS);

const EVENT_TYPES = ["Wedding", "Birthday", "Corporate Event", "Engagement",
  "Baby Shower", "Photoshoot", "Conference", "Product Launch", "Anniversary", "Other"];

const TIME_SLOTS = generateTimeSlots(6, 24, 60);
const PLATFORM_FEE_PCT = 0.02;
const PLACEHOLDER_IMAGE = "/placeholder-venue.svg";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const imageFallback = (event) => {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = "1";
  event.currentTarget.src = PLACEHOLDER_IMAGE;
};

const normalizeVenue = (rawVenue) => {
  if (!rawVenue || typeof rawVenue !== "object") return null;

  const location = rawVenue.location && typeof rawVenue.location === "object" ? rawVenue.location : {};
  const ownerObj = rawVenue.owner && typeof rawVenue.owner === "object" ? rawVenue.owner : null;
  const ownerId = ownerObj?._id || ownerObj?.id || (typeof rawVenue.owner === "string" ? rawVenue.owner : "");
  const images = Array.isArray(rawVenue.images)
    ? rawVenue.images.filter((img) => typeof img === "string" && img.trim())
    : [];

  return {
    ...rawVenue,
    _id: rawVenue._id || rawVenue.id,
    venueType: rawVenue.venueType || rawVenue.type || "",
    type: rawVenue.type || rawVenue.venueType || "",
    bookingType: rawVenue.bookingType || "manual",
    address: rawVenue.address || location.address || "",
    city: rawVenue.city || location.city || "",
    pincode: rawVenue.pincode || location.pincode || "",
    images,
    location: {
      ...location,
      address: rawVenue.address || location.address || "",
      city: rawVenue.city || location.city || "",
      pincode: rawVenue.pincode || location.pincode || "",
    },
    owner: ownerObj
      ? { ...ownerObj, _id: ownerId || ownerObj._id || ownerObj.id }
      : ownerId
        ? { _id: ownerId }
        : null,
  };
};

const extractVenueList = (payload) => {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.venues) ? payload.venues : [];
  return list.map(normalizeVenue).filter(Boolean);
};

// â”€â”€â”€ Tiny helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const avg = (arr) => arr.length ? (arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(1) : "0.0";
const avatar = (n) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(n || "U")}&backgroundColor=4f46e5&fontColor=ffffff`;

function Stars({ rating, size = 16 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          fill={s <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

// â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

function ToastList({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl pointer-events-auto
              ${t.type === "success" ? "bg-indigo-600 text-white" : "bg-red-500 text-white"}`}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// â”€â”€â”€ Lightbox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Lightbox({ images, index, onClose }) {
  const [cur, setCur] = useState(index);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCur((p) => (p + 1) % images.length);
      if (e.key === "ArrowLeft") setCur((p) => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] bg-black/95 flex items-center justify-center"
      onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <button onClick={(e) => { e.stopPropagation(); setCur((p) => (p - 1 + images.length) % images.length); }}
        className="absolute left-4 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <motion.img key={cur} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        src={images[cur]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
        onError={imageFallback}
        onClick={(e) => e.stopPropagation()} />
      <button onClick={(e) => { e.stopPropagation(); setCur((p) => (p + 1) % images.length); }}
        className="absolute right-4 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <div className="absolute bottom-4 flex gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setCur(i); }}
            className={`w-2 h-2 rounded-full transition-all ${i === cur ? "bg-white scale-125" : "bg-white/40"}`} />
        ))}
      </div>
    </motion.div>
  );
}

// â”€â”€â”€ Availability Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AvailabilityCalendar({ blockedDates = [], onSelectDate, selectedDate }) {
  const [month, setMonth] = useState(new Date());
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const blocked = new Set(blockedDates.map((d) => new Date(d).toDateString()));

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, mon, d));

  const monthLabel = month.toLocaleString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(new Date(year, mon - 1))}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="font-semibold text-zinc-800 text-sm" style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>{monthLabel}</p>
        <button onClick={() => setMonth(new Date(year, mon + 1))}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-zinc-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const isPast = date < today;
          const isBlocked = blocked.has(date.toDateString());
          const isSelected = selectedDate && date.toDateString() === new Date(selectedDate).toDateString();
          const isToday = date.toDateString() === today.toDateString();

          return (
            <button key={i} disabled={isPast || isBlocked}
              onClick={() => !isPast && !isBlocked && onSelectDate(date.toISOString().split("T")[0])}
              className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-all font-medium
                ${isSelected ? "bg-indigo-600 text-white shadow-md" : ""}
                ${isToday && !isSelected ? "border-2 border-indigo-400 text-indigo-700" : ""}
                ${isBlocked ? "bg-red-100 text-red-400 cursor-not-allowed" : ""}
                ${isPast ? "text-zinc-300 cursor-not-allowed" : ""}
                ${!isPast && !isBlocked && !isSelected ? "hover:bg-indigo-50 text-zinc-700 hover:text-indigo-700" : ""}`}>
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-indigo-500" />
          <span className="text-xs text-zinc-500">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-200" />
          <span className="text-xs text-zinc-500">Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-zinc-200" />
          <span className="text-xs text-zinc-500">Past</span>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Booking Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BookingForm({ venue, selectedDate, onDateChange, onSuccess, push }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const [form, setForm] = useState({
    date: selectedDate || "",
    startTime: "", endTime: "", guests: "",
    eventType: "", specialRequests: "", bidAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => { setForm((p) => ({ ...p, date: selectedDate || "" })); }, [selectedDate]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const calcHours = () => {
    if (!form.startTime || !form.endTime) return 0;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff / 60 : 0;
  };

  const hours = calcHours();
  const basePrice = (venue?.pricePerHour || 0) * hours;
  const platformFee = Math.round(basePrice * PLATFORM_FEE_PCT);
  const total = basePrice + platformFee;

  const isInstant = venue?.bookingType === "instant";

  const handleSubmit = async () => {
    if (!user) return navigate(`/login?next=/venue/${params.id}`);
    if (!form.date) return push("Select an event date", "error");
    if (!form.startTime || !form.endTime) return push("Select start and end time", "error");
    if (hours <= 0) return push("End time must be after start time", "error");
    if (!form.guests) return push("Enter number of guests", "error");

    const guestCount = Number(form.guests);
    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      return push("Enter a valid guest count", "error");
    }
    if (venue?.capacity && guestCount > venue.capacity) {
      return push(`Guest count cannot exceed ${venue.capacity}`, "error");
    }

    const bidAmount = Number(form.bidAmount);
    if (!isInstant && (!Number.isFinite(bidAmount) || bidAmount <= 0)) {
      return push("Enter a valid bid amount", "error");
    }
    if (!isInstant && bidAmount < basePrice) {
      return push(`Bid should be at least ${formatINR(basePrice)}`, "error");
    }

    setLoading(true);
    try {
      const payload = {
        venueId: venue._id,
        eventDate: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        guestCount,
        eventType: form.eventType,
        specialRequests: form.specialRequests,
        bidAmount: isInstant ? undefined : bidAmount,
      };
      const res = await api.post("/api/bookings/create", payload);
      const booking = res.data?.booking || res.data;
      setCreatedBooking(booking);

      if (isInstant) {
        setShowPayment(true);
        push("Booking created. Complete payment to confirm your slot.");
      } else {
        push("Bid submitted! Owner will review shortly.");
        onSuccess?.();
      }
    } catch (err) {
      push(err.response?.data?.message || "Booking failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Razorpay trigger for instant booking payment
  const triggerRazorpay = useCallback(async () => {
    if (!createdBooking?._id) {
      setShowPayment(false);
      return;
    }

    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded || typeof window.Razorpay === "undefined") {
      push("Unable to load payment gateway. Please try again.", "error");
      setShowPayment(false);
      return;
    }

    try {
      const orderRes = await api.post("/api/payments/create-order", { bookingId: createdBooking._id });
      const order = orderRes.data || {};

      const options = {
        key: order.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount || Math.round(total * 100),
        currency: order.currency || "INR",
        name: "BookYourEvent",
        description: `Booking: ${venue?.name}`,
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone || "" },
        theme: { color: "#4f46e5" },
        handler: async (response) => {
          try {
            await api.post("/api/payments/verify", {
              bookingId: order.bookingId || createdBooking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            push("Payment successful! Booking confirmed.");
            setShowPayment(false);
            onSuccess?.();
          } catch (err) {
            push(err.response?.data?.message || "Payment verification failed", "error");
          }
        },
        modal: {
          ondismiss: () => {
            setShowPayment(false);
            push("Payment cancelled. You can retry from My Bookings.", "error");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (failure) => {
        const message = failure?.error?.description || "Payment failed. Please try again.";
        push(message, "error");
        setShowPayment(false);
      });
      rzp.open();
    } catch (err) {
      push(err.response?.data?.message || "Unable to start payment", "error");
      setShowPayment(false);
    }
  }, [createdBooking, total, venue, user, push, onSuccess]);

  useEffect(() => {
    if (showPayment && createdBooking) triggerRazorpay();
  }, [showPayment, createdBooking, triggerRazorpay]);

  const endSlots = TIME_SLOTS.filter((t) => !form.startTime || t > form.startTime);

  return (
    <div className="space-y-4">
      {/* Date */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">Event Date</label>
        <input type="date" value={form.date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => { set("date", e.target.value); onDateChange?.(e.target.value); }}
          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50" />
      </div>

      {/* Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">Start Time</label>
          <select value={form.startTime} onChange={(e) => { set("startTime", e.target.value); set("endTime", ""); }}
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50 appearance-none">
            <option value="">Select</option>
            {TIME_SLOTS.map((t) => <option key={t} value={t}>{to12Hour(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">End Time</label>
          <select value={form.endTime} onChange={(e) => set("endTime", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50 appearance-none">
            <option value="">Select</option>
            {endSlots.map((t) => <option key={t} value={t}>{to12Hour(t)}</option>)}
          </select>
        </div>
      </div>

      {/* Guests */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">Number of Guests</label>
        <input type="number" value={form.guests} min={1} max={venue?.capacity || 9999}
          onChange={(e) => set("guests", e.target.value)}
          placeholder={`Max ${venue?.capacity || "â€”"}`}
          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50" />
      </div>

      {/* Event type */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">Event Type <span className="normal-case text-zinc-400 font-normal">(optional)</span></label>
        <select value={form.eventType} onChange={(e) => set("eventType", e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50 appearance-none">
          <option value="">Select event typeâ€¦</option>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Bid amount â€” only for bid venues */}
      {!isInstant && (
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">Your Bid Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold">INR</span>
            <input type="number" value={form.bidAmount} onChange={(e) => set("bidAmount", e.target.value)}
              placeholder="Enter your offer"
              className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50" />
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Suggested minimum: {formatINR(basePrice || venue?.pricePerHour || 0)}
          </p>
        </div>
      )}

      {/* Special requests */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5 block">Special Requests <span className="normal-case text-zinc-400 font-normal">(optional)</span></label>
        <textarea rows={2} value={form.specialRequests} onChange={(e) => set("specialRequests", e.target.value)}
          placeholder="Any specific requirementsâ€¦"
          className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-zinc-50 resize-none" />
      </div>

      {/* Price breakdown â€” only for instant with hours calculated */}
      {isInstant && hours > 0 && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-2">
          <div className="flex justify-between text-sm text-zinc-600">
            <span>{formatINR(venue?.pricePerHour)}/hr Ã— {hours} hr{hours !== 1 ? "s" : ""}</span>
            <span className="font-medium">{formatINR(basePrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Platform fee (2%)</span>
            <span>{formatINR(platformFee)}</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 flex justify-between font-bold text-zinc-900">
            <span>Total</span>
            <span className="text-indigo-700">{formatINR(total)}</span>
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5">
        {isInstant
          ? "Instant booking: complete payment now to lock this slot."
          : "Bid booking: owner will review bids, and payment is requested only after approval."}
      </p>

      {/* CTA */}
      {!user ? (
        <Link to={`/login?next=/venue/${venue?._id}`}
          className="saas-glow-btn block w-full py-3.5 text-sm font-semibold text-center">
          Login to Book
        </Link>
      ) : (
        <button onClick={handleSubmit} disabled={loading}
          className="saas-glow-btn w-full py-3.5 text-sm font-semibold disabled:opacity-60">
          {loading ? "Processingâ€¦" : isInstant ? "Book Now â†’" : "Submit Bid â†’"}
        </button>
      )}
    </div>
  );
}

// â”€â”€â”€ Reviews Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReviewsSection({ venueId, push }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(`/api/reviews/venue/${venueId}`);
      setReviews(res.data);
    } catch {
      push("Failed to load reviews", "error");
    }
  }, [venueId, push]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useEffect(() => {
    if (!user) return;
    api.get(`/api/bookings/my-bookings`).then((res) => {
      const bookings = Array.isArray(res.data) ? res.data : res.data?.bookings || [];
      const hasPaid = bookings.some((b) => b.venue?._id === venueId && b.status === "confirmed");
      setCanReview(hasPaid);
    }).catch(() => {});
  }, [user, venueId]);

  const ratingCount = (star) => reviews.filter((r) => r.rating === star).length;
  const avgRating = avg(reviews.map((r) => r.rating));
  const shown = reviews.slice(0, page * PER_PAGE);

  const submitReview = async () => {
    if (!form.text.trim()) return push("Write a review first", "error");
    setSubmitting(true);
    try {
      await api.post("/api/reviews", { venueId, rating: form.rating, text: form.text });
      push("Review submitted!");
      setShowForm(false);
      setForm({ rating: 5, text: "" });
      fetchReviews();
    } catch (err) { push(err.response?.data?.message || "Failed", "error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-start gap-8 flex-wrap">
        <div className="text-center">
          <p className="text-5xl font-bold text-zinc-900" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>{avgRating}</p>
          <Stars rating={Number(avgRating)} size={18} />
          <p className="text-xs text-zinc-400 mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 min-w-48 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCount(star);
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-4">{star}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-zinc-400 w-6">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write review */}
      {canReview && !showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-700
            text-sm font-semibold hover:bg-indigo-50 transition-colors">
          + Write a Review
        </button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 space-y-4">
            <p className="font-semibold text-zinc-800">Your Review</p>

            {/* Star selector */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setForm((p) => ({ ...p, rating: s }))}>
                  <svg width="28" height="28" viewBox="0 0 24 24"
                    fill={s <= form.rating ? "#f59e0b" : "none"}
                    stroke="#f59e0b" strokeWidth="2" className="transition-all hover:scale-110">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            <textarea rows={3} value={form.text} onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              placeholder="Share your experienceâ€¦"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-zinc-800 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none" />

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-100">
                Cancel
              </button>
              <button onClick={submitReview} disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60">
                {submitting ? "Submittingâ€¦" : "Submit"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review cards */}
      {reviews.length === 0 ? (
        <p className="text-center text-zinc-400 py-8 text-sm">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {shown.map((r) => (
            <motion.div key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex gap-4 p-5 rounded-2xl border border-zinc-100 bg-white">
              <img src={avatar(r.reviewer?.name)} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-zinc-800 text-sm">{r.reviewer?.name}</p>
                  {r.isVerifiedBooking && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                      âœ“ Verified Booking
                    </span>
                  )}
                  <span className="text-xs text-zinc-400 ml-auto">{timeAgo(r.createdAt)}</span>
                </div>
                <Stars rating={r.rating} size={13} />
                <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">{r.text}</p>
              </div>
            </motion.div>
          ))}

          {shown.length < reviews.length && (
            <button onClick={() => setPage((p) => p + 1)}
              className="w-full py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50">
              Load more reviews
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function VenueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, push } = useToast();

  const [venue, setVenue] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const bookingRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    setLoading(true);
    setSimilar([]);
    api.get(`/api/venues/${id}`)
      .then((res) => {
        const fetchedVenue = normalizeVenue(res.data?.venue || res.data);
        setVenue(fetchedVenue);
        setActiveImage(0);
        setSelectedDate("");

        if (fetchedVenue?.venueType || fetchedVenue?.city) {
          const params = new URLSearchParams();
          if (fetchedVenue.venueType) params.set("type", fetchedVenue.venueType);
          if (fetchedVenue.city) params.set("city", fetchedVenue.city);
          params.set("limit", "4");
          params.set("exclude", id);
          api.get(`/api/venues?${params}`).then((r) => {
            const list = extractVenueList(r.data);
            setSimilar(list.filter((v) => v._id !== id).slice(0, 4));
          }).catch(() => {});
        }
      })
      .catch(() => push("Failed to load venue", "error"))
      .finally(() => setLoading(false));
  }, [id, push]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    push("Link copied!");
  };

  const handleChatOwner = async () => {
    if (!user) return navigate(`/login?next=/venue/${id}`);
    const ownerId = venue?.owner?._id || venue?.owner?.id;
    if (!ownerId) {
      push("Owner chat is unavailable for this venue right now", "error");
      return;
    }
    if (ownerId === user?._id || ownerId === user?.id) {
      push("This is your own venue", "error");
      return;
    }

    setChatLoading(true);
    try {
      const opened = await api.post("/api/chats/open", { otherUserId: ownerId });
      const chatId = opened.data?._id || opened.data?.chat?._id;
      const target = chatId
        ? `/booker/dashboard?tab=chat&chatId=${chatId}`
        : "/booker/dashboard?tab=chat";
      navigate(target);
    } catch { push("Could not open chat", "error"); }
    finally { setChatLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500" style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>Loading venueâ€¦</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-700" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>Venue not found</p>
          <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">â† Back to Home</Link>
        </div>
      </div>
    );
  }

  const images = venue.images?.length ? venue.images : [PLACEHOLDER_IMAGE];
  const blockedDates = venue.blockedDates || [];
  const isInstant = venue.bookingType === "instant";
  const avgRating = venue.avgRating || 0;
  const reviewCount = venue.reviewCount || 0;

  const DESC_LIMIT = 220;
  const descShort = venue.description?.length > DESC_LIMIT;

  const INFO_STRIP = [
    { icon: "ðŸ‘¥", label: "Capacity", value: `Up to ${venue.capacity || "â€”"} guests` },
    { icon: "ðŸ’°", label: "Price", value: `${formatINR(venue.pricePerHour)}/hr` },
    { icon: "ðŸ“…", label: "Booking", value: isInstant ? "âš¡ Instant" : "ðŸ·ï¸ Bid" },
    { icon: "ðŸ›ï¸", label: "Type", value: venue.venueType || "Event Venue" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
        background:
          "radial-gradient(900px 420px at 90% -10%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(900px 420px at -5% 0%, rgba(99,102,241,0.16), transparent 60%), #f8fafc",
      }}
    >
      <ToastList toasts={toasts} />
      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      )}

      {/* â”€â”€ Back nav â”€â”€ */}
      <div className="bg-white/85 backdrop-blur border-b border-indigo-100 px-4 md:px-8 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-indigo-600 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-400 truncate">{venue.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 lg:py-10">
        <div className="flex gap-10 items-start">

          {/* â”€â”€ LEFT COLUMN â”€â”€ */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Hero Gallery */}
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-zinc-200 aspect-[16/9] cursor-pointer group"
                onClick={() => setLightbox(activeImage)}>
                <img src={images[activeImage]} alt={venue.name}
                  onError={imageFallback}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-700">
                          {venue.venueType || "Event Venue"}
                        </span>
                        {isInstant && (
                          <span className="px-3 py-1 rounded-full bg-indigo-500/90 backdrop-blur-sm text-xs font-semibold text-white">
                            Instant Book
                          </span>
                        )}
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-white saas-heading">{venue.name}</p>
                      <p className="text-sm text-white/85">
                        {Number(avgRating).toFixed(1)} rating | {[venue.city, venue.pincode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="saas-glow-btn px-4 py-2.5 text-sm font-semibold"
                    >
                      {isInstant ? "Book Instantly" : "Start Booking"}
                    </button>
                  </div>
                </div>
                <button className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
                  onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                  </svg>
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all
                        ${activeImage === i ? "border-indigo-500 scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}>
                      <img src={img} alt="" onError={imageFallback} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Venue title + rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                {venue.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Stars rating={avgRating} size={16} />
                  <span className="text-sm font-semibold text-zinc-700">{Number(avgRating).toFixed(1)}</span>
                  <span className="text-sm text-zinc-400">Â· {reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
                </div>
                <span className="text-zinc-300">|</span>
                <span className="text-sm text-zinc-500">
                  ðŸ“ {[venue.address, venue.city, venue.pincode].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>

            {/* Info strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INFO_STRIP.map(({ icon, label, value }) => (
                <div key={label} className="saas-card p-4 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-zinc-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="saas-card p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                About this venue
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {descShort && !descExpanded
                  ? venue.description?.slice(0, DESC_LIMIT) + "â€¦"
                  : venue.description}
              </p>
              {descShort && (
                <button onClick={() => setDescExpanded((p) => !p)}
                  className="mt-2 text-sm font-semibold text-indigo-700 hover:underline">
                  {descExpanded ? "Read less â†‘" : "Read more â†“"}
                </button>
              )}
            </div>

            {/* Amenities */}
            <div className="saas-card p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ALL_AMENITIES.map((a) => {
                  const has = venue.amenities?.includes(a);
                  return (
                    <div key={a} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all
                      ${has
                        ? "border-indigo-200 bg-indigo-50 text-indigo-800"
                        : "border-zinc-100 bg-zinc-50 text-zinc-400"}`}>
                      <span className={`text-lg ${!has ? "grayscale opacity-40" : ""}`}>{AMENITY_ICONS[a]}</span>
                      <span className="text-xs font-medium">{a}</span>
                      {!has && <span className="ml-auto text-zinc-300 text-xs">âœ•</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar */}
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                Availability
              </h2>
              <AvailabilityCalendar
                blockedDates={blockedDates}
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            </div>

            {/* Reviews */}
            <div className="saas-card p-6">
              <h2 className="text-lg font-bold text-zinc-900 mb-5" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                Reviews
              </h2>
              <ReviewsSection venueId={id} push={push} />
            </div>

            {/* Owner card */}
            <div className="saas-card p-6 flex items-center gap-5">
              <img src={avatar(venue.owner?.name)} alt="" className="w-14 h-14 rounded-2xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-800">{venue.owner?.name || "Venue Owner"}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Member since {venue.owner?.createdAt ? new Date(venue.owner.createdAt).getFullYear() : "â€”"}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{venue.owner?.totalVenues || 1} venue{(venue.owner?.totalVenues || 1) !== 1 ? "s" : ""} listed</p>
              </div>
              <button onClick={handleChatOwner} disabled={chatLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700
                  text-white text-sm font-semibold transition-colors disabled:opacity-60 flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                {chatLoading ? "Openingâ€¦" : "Chat with Owner"}
              </button>
            </div>

            {/* Similar venues */}
            {similar.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-zinc-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                  Similar Venues
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {similar.map((v) => (
                    <Link key={v._id} to={`/venue/${v._id}`}
                      className="flex-shrink-0 w-60 saas-card saas-card-hover overflow-hidden group">
                      <div className="h-36 bg-zinc-100 overflow-hidden">
                        {v.images?.[0]
                          ? <img src={v.images[0]} alt={v.name} onError={imageFallback} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-3xl">ðŸ›ï¸</div>
                        }
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-zinc-800 text-sm truncate">{v.name}</p>
                        <p className="text-xs text-zinc-400">{v.city} Â· {formatINR(v.pricePerHour)}/hr</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* â”€â”€ RIGHT COLUMN â€” Sticky Booking Form â”€â”€ */}
          <div ref={bookingRef} className="hidden lg:block w-[360px] flex-shrink-0">
            <div className="sticky top-6">
              <div className="rounded-2xl border border-indigo-100 bg-white/95 backdrop-blur shadow-[0_18px_45px_rgba(79,70,229,0.16)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-2xl font-bold text-zinc-900" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                      {formatINR(venue.pricePerHour)}
                      <span className="text-sm font-normal text-zinc-400">/hr</span>
                    </p>
                  </div>
                  {isInstant
                    ? <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">Instant</span>
                    : <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">ðŸ·ï¸ Bid</span>
                  }
                </div>
                <BookingForm
                  venue={venue}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onSuccess={() => push("Booking submitted! Check My Bookings.")}
                  push={push}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* â”€â”€ Mobile sticky bottom bar â”€â”€ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-indigo-100 px-4 py-3
        flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-lg font-bold text-zinc-900">{formatINR(venue.pricePerHour)}<span className="text-xs font-normal text-zinc-400">/hr</span></p>
          {isInstant
            ? <span className="text-xs text-indigo-600 font-semibold">Instant Book</span>
            : <span className="text-xs text-amber-600 font-semibold">ðŸ·ï¸ Bid Required</span>
          }
        </div>
        <button onClick={() => setShowMobileForm(true)}
          className="saas-glow-btn px-6 py-3 text-sm font-semibold">
          {isInstant ? "Book Now" : "Place Bid"}
        </button>
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {showMobileForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={(e) => e.target === e.currentTarget && setShowMobileForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl px-5 pt-5 pb-10 max-h-[92vh] overflow-y-auto">
              <div className="w-12 h-1 bg-zinc-300 rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-zinc-900 text-lg" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
                  {isInstant ? "Book Venue" : "Place a Bid"}
                </p>
                <button onClick={() => setShowMobileForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <BookingForm
                venue={venue}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onSuccess={() => { push("Booking submitted!"); setShowMobileForm(false); }}
                push={push}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

