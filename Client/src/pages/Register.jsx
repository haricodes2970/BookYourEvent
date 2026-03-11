import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { registerUser, verifyOTP, resendOTP } from "../services/authService";

// ─── Floating decorative shapes (same as Login) ───────────────────────────────
const SHAPES = [
  { top: "12%", left: "6%",  size: 28, color: "#b2dfdb", rotate: 20,  delay: 0 },
  { top: "22%", left: "18%", size: 16, color: "#ff8a65", rotate: 0,   delay: 0.4 },
  { top: "38%", left: "4%",  size: 22, color: "#ce93d8", rotate: 45,  delay: 0.8 },
  { top: "58%", left: "14%", size: 14, color: "#f48fb1", rotate: 0,   delay: 0.3 },
  { top: "72%", left: "7%",  size: 32, color: "#a5d6a7", rotate: -15, delay: 0.6 },
  { top: "85%", left: "22%", size: 18, color: "#80cbc4", rotate: 30,  delay: 1.0 },
  { top: "8%",  left: "55%", size: 14, color: "#80cbc4", rotate: 0,   delay: 0.5 },
  { top: "15%", left: "72%", size: 20, color: "#b2dfdb", rotate: -20, delay: 0.2 },
  { top: "30%", left: "88%", size: 26, color: "#a5d6a7", rotate: 15,  delay: 0.7 },
  { top: "65%", left: "82%", size: 16, color: "#ff8a65", rotate: 0,   delay: 0.9 },
  { top: "80%", left: "90%", size: 22, color: "#ce93d8", rotate: -30, delay: 0.1 },
  { top: "90%", left: "65%", size: 12, color: "#f48fb1", rotate: 0,   delay: 0.5 },
];

function FloatingShape({ top, left, size, color, rotate, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.7, scale: 1, y: [0, -10, 0] }}
      transition={{ opacity: { duration: 0.6, delay }, scale: { duration: 0.6, delay },
        y: { duration: 3 + delay, repeat: Infinity, ease: "easeInOut", delay } }}
      style={{ position: "absolute", top, left, width: size, height: size,
        backgroundColor: color, borderRadius: "40% 60% 55% 45% / 45% 55% 60% 40%",
        transform: `rotate(${rotate}deg)` }}
    />
  );
}

// ─── Venue SVG Illustration (mirrored feel from Login) ────────────────────────
function VenueIllustration() {
  return (
    <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-xs mx-auto">
      {/* Ground */}
      <ellipse cx="170" cy="255" rx="130" ry="16" fill="#b2dfdb" opacity="0.4" />
      {/* Main building */}
      <rect x="75" y="100" width="190" height="150" rx="4" fill="#cfd8dc" />
      <rect x="75" y="100" width="190" height="30" rx="4" fill="#90a4ae" />
      {/* Columns */}
      {[100, 130, 160, 190, 220].map((x, i) => (
        <rect key={i} x={x} y="130" width="10" height="120" fill="#b0bec5" />
      ))}
      {/* Entrance */}
      <rect x="145" y="190" width="50" height="60" rx="4" fill="#78909c" />
      <rect x="155" y="200" width="15" height="25" rx="2" fill="#546e7a" />
      <rect x="172" y="200" width="15" height="25" rx="2" fill="#546e7a" />
      {/* Windows row 1 */}
      {[95, 175, 215, 255].map((x, i) => (
        <rect key={i} x={x} y="145" width="24" height="28" rx="3" fill="#e3f2fd" stroke="#90a4ae" strokeWidth="1.5" />
      ))}
      {/* Windows row 2 */}
      {[95, 175, 215, 255].map((x, i) => (
        <rect key={i} x={x} y="185" width="24" height="28" rx="3" fill="#e3f2fd" stroke="#90a4ae" strokeWidth="1.5" />
      ))}
      {/* Roof / pediment */}
      <polygon points="60,100 170,50 280,100" fill="#80cbc4" />
      <polygon points="75,100 170,58 265,100" fill="#4db6ac" />
      {/* Flag */}
      <line x1="170" y1="50" x2="170" y2="20" stroke="#546e7a" strokeWidth="2.5" />
      <polygon points="170,20 195,30 170,40" fill="#ef5350" />
      {/* Trees */}
      <rect x="40" y="195" width="12" height="55" rx="3" fill="#795548" />
      <circle cx="46" cy="185" r="28" fill="#66bb6a" />
      <circle cx="46" cy="172" r="20" fill="#4caf50" />
      <rect x="285" y="195" width="12" height="55" rx="3" fill="#795548" />
      <circle cx="291" cy="185" r="28" fill="#66bb6a" />
      <circle cx="291" cy="172" r="20" fill="#4caf50" />
      {/* Pathway */}
      <path d="M145 250 L100 270 M195 250 L240 270" stroke="#90a4ae" strokeWidth="3" strokeLinecap="round" />
      {/* Stars / sparkles */}
      {[[50,70],[290,65],[170,30],[310,120],[30,145]].map(([x,y],i)=>(
        <g key={i}>
          <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="#80cbc4" strokeWidth="1.5"/>
          <line x1={x-6} y1={y} x2={x+6} y2={y} stroke="#80cbc4" strokeWidth="1.5"/>
        </g>
      ))}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "booker" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Countdown timer for resend
  useEffect(() => {
    if (step !== "otp") return;
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step]);

  // ── Register ──
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) return setError("Name, email and password are required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await registerUser(form);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ──
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Verify OTP ──
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) return setOtpError("Enter all 6 digits.");
    setOtpError("");
    setOtpLoading(true);
    try {
      await verifyOTP({ email: form.email, otp: code });
      const loginRes = await import("../services/authService").then((m) =>
        m.loginUser({ email: form.email, password: form.password })
      );
      login(loginRes.data.token);
      navigate(form.role === "venueOwner" ? "/owner/dashboard" : "/booker/dashboard");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await resendOTP({ email: form.email });
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      otpRefs.current[0]?.focus();
      timerRef.current = setInterval(() => {
        setResendTimer((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
      }, 1000);
    } catch {}
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(135deg, #e0f2f1 0%, #e8f5e9 40%, #e3f2fd 100%)" }}>

      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      {/* Floating shapes */}
      {SHAPES.map((s, i) => <FloatingShape key={i} {...s} />)}

      {/* Navbar — identical to Login page */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-sm shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full border-2 border-teal-600 flex items-center justify-center bg-white">
            <span style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-teal-700 font-bold text-xs">BYE</span>
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="font-semibold text-zinc-800 text-sm">BookYourEvent</span>
        </Link>
        <div className="flex items-center gap-6">
          {["Home", "About", "Services", "Help & Contact"].map((item) => (
            <Link key={item} to="/" className="hidden md:block text-sm text-zinc-600 hover:text-teal-700 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {item}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl flex items-center gap-8 lg:gap-16">

          {/* Left — illustration + tagline */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="hidden lg:flex flex-col items-center flex-1">
            <VenueIllustration />
            <div className="mt-6 text-center">
              <h2 className="text-3xl font-bold text-zinc-700 leading-snug"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Your Perfect Venue<br />
                <em className="text-teal-600">Awaits You</em> 🎊
              </h2>
              <p className="text-zinc-500 text-sm mt-3 max-w-xs"
                style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Join thousands of event planners discovering perfect venues across Bangalore.
              </p>
              <div className="flex items-center gap-6 mt-5 justify-center">
                {[["500+", "Venues"], ["98%", "Happy"], ["2K+", "Events"]].map(([val, label]) => (
                  <div key={label} className="text-center">
                    <p className="font-bold text-zinc-700 text-lg" style={{ fontFamily: "'DM Sans', sans-serif" }}>{val}</p>
                    <p className="text-xs text-zinc-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — form card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="w-full max-w-md mx-auto">

            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-teal-900/10 px-8 py-9">

              {/* Logo */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full border-2 border-teal-600 flex items-center justify-center bg-white shadow-md">
                  <span style={{ fontFamily: "'Playfair Display', serif" }}
                    className="text-teal-700 font-bold text-sm">BYE</span>
                </div>
              </div>

              <AnimatePresence mode="wait">

                {/* ── Registration Form ── */}
                {step === "form" && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <h1 className="text-center text-3xl font-bold text-zinc-800 mb-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      Register
                    </h1>
                    <p className="text-center text-xs tracking-widest text-zinc-400 uppercase mb-7"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      EASY. BOOK. ENJOY.
                    </p>

                    {error && (
                      <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-4 text-sm text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">
                        {error}
                      </motion.p>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                      {/* Full Name */}
                      <div className="relative">
                        <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                          placeholder="Full Name"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                          className="w-full bg-transparent border-b border-zinc-300 focus:border-teal-600
                            outline-none py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400
                            transition-colors pr-8" />
                        <span className="absolute right-0 bottom-2.5 text-zinc-400 text-sm">✦</span>
                      </div>

                      {/* Email */}
                      <div className="relative">
                        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                          placeholder="Email"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                          className="w-full bg-transparent border-b border-zinc-300 focus:border-teal-600
                            outline-none py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400
                            transition-colors pr-8" />
                        <span className="absolute right-0 bottom-2.5 text-zinc-400 text-sm">@</span>
                      </div>

                      {/* Password */}
                      <PasswordInput value={form.password} onChange={(v) => set("password", v)} />

                      {/* Phone */}
                      <div className="relative">
                        <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                          placeholder="Phone (Optional)"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                          className="w-full bg-transparent border-b border-zinc-300 focus:border-teal-600
                            outline-none py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400
                            transition-colors pr-8" />
                        <span className="absolute right-0 bottom-2.5 text-zinc-400 text-sm">📱</span>
                      </div>

                      {/* Role */}
                      <div className="relative">
                        <select value={form.role} onChange={(e) => set("role", e.target.value)}
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                          className="w-full bg-transparent border-b border-zinc-300 focus:border-teal-600
                            outline-none py-2.5 text-sm text-zinc-700 transition-colors appearance-none pr-8">
                          <option value="booker">Booker — I want to book venues</option>
                          <option value="venueOwner">Venue Owner — I want to list venues</option>
                        </select>
                        <span className="absolute right-0 bottom-2.5 text-zinc-400 pointer-events-none">▾</span>
                      </div>

                      <button type="submit" disabled={loading}
                        style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00695c, #00897b)" }}
                        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm
                          hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2
                          shadow-md shadow-teal-900/20">
                        {loading ? "Creating account…" : "Register →"}
                      </button>
                    </form>

                    <p className="text-center text-sm text-zinc-500 mt-6"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Already have an account?{" "}
                      <Link to="/login" className="text-teal-700 font-semibold hover:underline">Login</Link>
                    </p>
                  </motion.div>
                )}

                {/* ── OTP Verification ── */}
                {step === "otp" && (
                  <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}>
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00695c" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-zinc-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Verify Email
                      </h2>
                      <p className="text-sm text-zinc-500 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        We sent a 6-digit code to<br />
                        <span className="font-semibold text-teal-700">{form.email}</span>
                      </p>
                    </div>

                    {otpError && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-4 text-sm text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">
                        {otpError}
                      </motion.p>
                    )}

                    {/* OTP boxes */}
                    <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input key={i} ref={(el) => (otpRefs.current[i] = el)}
                          type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                          className={`w-11 h-13 text-center text-xl font-bold border-b-2 bg-transparent
                            outline-none transition-all py-2
                            ${digit
                              ? "border-teal-600 text-teal-700"
                              : "border-zinc-300 text-zinc-800"}
                            focus:border-teal-600`} />
                      ))}
                    </div>

                    <button onClick={handleVerifyOtp} disabled={otpLoading || otp.join("").length < 6}
                      style={{ fontFamily: "'DM Sans', sans-serif", background: "linear-gradient(135deg, #00695c, #00897b)" }}
                      className="w-full py-3.5 rounded-xl text-white font-semibold text-sm
                        hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50
                        shadow-md shadow-teal-900/20">
                      {otpLoading ? "Verifying…" : "Verify & Create Account"}
                    </button>

                    <div className="text-center mt-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {resendTimer > 0 ? (
                        <p className="text-xs text-zinc-400">Resend code in {resendTimer}s</p>
                      ) : (
                        <button onClick={handleResend} className="text-sm text-teal-700 font-semibold hover:underline">
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Language switcher — bottom right (same as Login) */}
      <div className="fixed bottom-4 right-4 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm
        border border-zinc-200 rounded-full px-3 py-1.5 shadow-sm">
        <span className="text-xs text-zinc-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>Language</span>
        <select className="text-xs text-zinc-700 bg-transparent outline-none font-medium"
          style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <option>English</option>
          <option>हिन्दी</option>
          <option>తెలుగు</option>
          <option>தமிழ்</option>
          <option>ಕನ್ನಡ</option>
        </select>
      </div>
    </div>
  );
}

// ─── Password input with show/hide ────────────────────────────────────────────
function PasswordInput({ value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Password (min 6 characters)"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="w-full bg-transparent border-b border-zinc-300 focus:border-teal-600
          outline-none py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 transition-colors pr-8" />
      <button type="button" onClick={() => setShow((p) => !p)}
        className="absolute right-0 bottom-2.5 text-zinc-400 hover:text-teal-600 transition-colors text-sm">
        {show ? "🙈" : "🔒"}
      </button>
    </div>
  );
}
