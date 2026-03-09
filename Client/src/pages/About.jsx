import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/* ══════════════════════════════════════
   DARK MODE
══════════════════════════════════════ */
const useDark = () => {
    const [dark, setDark] = useState(false);
    return { dark, toggle: () => setDark(d => !d) };
};

const ThemeToggle = ({ dark, toggle }) => (
    <motion.button onClick={toggle} whileTap={{ scale: 0.95 }}
        style={{
            width: 64, height: 32, borderRadius: 999, padding: 3,
            display: 'flex', alignItems: 'center', cursor: 'pointer',
            border: 'none', flexShrink: 0,
            background: dark ? '#1e4d5c' : '#e2f0f5',
            boxShadow: dark ? '0 0 12px rgba(30,77,92,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'background 0.35s ease',
        }}>
        <motion.div layout animate={{ x: dark ? 32 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                width: 26, height: 26, borderRadius: '50%',
                background: dark ? '#c8e6f0' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}>{dark ? '🌙' : '☀️'}</motion.div>
    </motion.button>
);

/* ══════════════════════════════════════
   LEAF SVG
══════════════════════════════════════ */
const Leaf = ({ size = 36, color = '#6FB3A8', opacity = 0.45 }) => (
    <svg width={size} height={size} viewBox="0 0 60 80" fill="none">
        <path d="M30 2 C10 10 2 30 5 55 C8 72 20 78 30 78 C40 78 52 72 55 55 C58 30 50 10 30 2Z"
            fill={color} fillOpacity={opacity} />
        <path d="M30 5 Q32 35 28 75" stroke={color} strokeOpacity={opacity + 0.15}
            strokeWidth="1.2" strokeLinecap="round" />
        <path d="M30 20 Q20 30 8 35" stroke={color} strokeOpacity={opacity * 0.7}
            strokeWidth="0.8" strokeLinecap="round" />
        <path d="M30 35 Q40 42 52 44" stroke={color} strokeOpacity={opacity * 0.7}
            strokeWidth="0.8" strokeLinecap="round" />
    </svg>
);

/* ══════════════════════════════════════
   ANIMATED BIRD
══════════════════════════════════════ */
const Bird = ({ x, y, scale = 1, delay = 0, color = '#4a7a8a', opacity = 0.5 }) => (
    <motion.g
        animate={{ y: [0, -12, -5, -14, 0], x: [0, 5, 11, 18, 26] }}
        transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}>
        <g transform={`translate(${x},${y}) scale(${scale})`}>
            <motion.path
                d="M0 0 Q8 -7 16 0 Q8 -3 0 0Z"
                fill={color} opacity={opacity}
                animate={{ d: ["M0 0 Q8 -7 16 0 Q8 -3 0 0Z", "M0 0 Q8 -4 16 0 Q8 -1 0 0Z", "M0 0 Q8 -7 16 0 Q8 -3 0 0Z"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay }}
            />
        </g>
    </motion.g>
);

/* ══════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════ */
const Reveal = ({ children, delay = 0, y = 40, x = 0 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.15 });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y, x }}
            animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
            transition={{ duration: 0.65, delay, ease: 'easeOut' }}>
            {children}
        </motion.div>
    );
};

/* ══════════════════════════════════════
   COUNTER HOOK
══════════════════════════════════════ */
const useCountUp = (target, active) => {
    const [count, setCount] = useState(0);
    const ran = useRef(false);
    if (active && !ran.current && target > 0) {
        ran.current = true;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 2000, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setCount(Math.floor(eased * target));
            if (p < 1) requestAnimationFrame(step);
            else setCount(target);
        };
        requestAnimationFrame(step);
    }
    return count;
};

/* ══════════════════════════════════════
   STAT CARD
══════════════════════════════════════ */
const StatCard = ({ value, suffix, label, emoji, dark, active, delay }) => {
    const count = useCountUp(value, active);
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            whileHover={{ y: -8, boxShadow: '0 24px 48px rgba(30,77,92,0.18)' }}
            style={{
                flex: 1, minWidth: 160,
                background: dark ? 'rgba(20,55,68,0.7)' : 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(14px)',
                border: `1px solid ${dark ? 'rgba(111,179,168,0.2)' : 'rgba(203,231,227,0.6)'}`,
                borderRadius: 20, padding: '28px 20px', textAlign: 'center',
                boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(30,77,92,0.08)',
                transition: 'box-shadow 0.3s ease',
            }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
            <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 900,
                background: 'linear-gradient(135deg,#1e4d5c 0%,#5aa89c 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1,
            }}>
                {count.toLocaleString()}{suffix}
            </p>
            <p style={{ fontSize: 13, color: dark ? '#7aaabb' : '#64748b', marginTop: 6, fontWeight: 500 }}>
                {label}
            </p>
        </motion.div>
    );
};

/* ══════════════════════════════════════
   SERVICE CARD
══════════════════════════════════════ */
const ServiceCard = ({ emoji, title, desc, dark, delay, inView }) => (
    <motion.div
        initial={{ opacity: 0, y: 44 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, delay, ease: 'easeOut' }}
        whileHover={{ y: -10, boxShadow: '0 28px 52px rgba(30,77,92,0.16)' }}
        style={{
            flex: 1, minWidth: 220,
            background: dark ? 'rgba(20,55,68,0.65)' : 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${dark ? 'rgba(111,179,168,0.18)' : 'rgba(200,185,160,0.35)'}`,
            borderRadius: 20, padding: '28px 22px', textAlign: 'center',
            boxShadow: dark ? '0 6px 24px rgba(0,0,0,0.25)' : '0 6px 24px rgba(30,77,92,0.07)',
            cursor: 'default', transition: 'box-shadow 0.3s ease',
        }}>
        <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: dark ? 'rgba(30,77,92,0.5)' : 'rgba(30,77,92,0.08)',
            fontSize: 26,
        }}>{emoji}</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800,
            color: dark ? '#c8e6f0' : '#1e293b', marginBottom: 10 }}>{title}</h3>
        <p style={{ fontSize: 13.5, color: dark ? '#7aaabb' : '#64748b', lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
);

/* ══════════════════════════════════════
   TEAM CARD
══════════════════════════════════════ */
const TeamCard = ({ name, role, bio, emoji, gradient, dark, delay, inView }) => (
    <motion.div
        initial={{ opacity: 0, y: 44 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, delay, ease: 'easeOut' }}
        whileHover={{ y: -8, boxShadow: '0 24px 48px rgba(30,77,92,0.16)' }}
        style={{
            flex: 1, minWidth: 240,
            background: dark ? 'rgba(20,55,68,0.65)' : 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${dark ? 'rgba(111,179,168,0.18)' : 'rgba(200,185,160,0.35)'}`,
            borderRadius: 20, padding: '28px 22px', textAlign: 'center',
            boxShadow: dark ? '0 6px 24px rgba(0,0,0,0.25)' : '0 6px 24px rgba(30,77,92,0.07)',
            transition: 'box-shadow 0.3s ease',
        }}>
        <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
            background: gradient, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28,
            boxShadow: '0 6px 20px rgba(30,77,92,0.2)',
        }}>{emoji}</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800,
            color: dark ? '#c8e6f0' : '#1e293b', marginBottom: 4 }}>{name}</h3>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
            color: '#1e4d5c', marginBottom: 10, opacity: 0.85 }}>{role}</p>
        <div style={{ width: 32, height: 3, background: gradient, borderRadius: 2, margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: dark ? '#7aaabb' : '#64748b', lineHeight: 1.65 }}>{bio}</p>
    </motion.div>
);

/* ══════════════════════════════════════
   VALUE CARD
══════════════════════════════════════ */
const ValueCard = ({ emoji, title, desc, dark, delay, inView }) => (
    <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.55, delay, ease: 'easeOut' }}
        whileHover={{ x: 6 }}
        style={{
            display: 'flex', gap: 16, alignItems: 'flex-start',
            padding: '18px 20px', borderRadius: 16,
            background: dark ? 'rgba(20,55,68,0.5)' : 'rgba(255,255,255,0.65)',
            border: `1px solid ${dark ? 'rgba(111,179,168,0.15)' : 'rgba(203,231,227,0.5)'}`,
            backdropFilter: 'blur(10px)',
            boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 16px rgba(30,77,92,0.06)',
            transition: 'box-shadow 0.3s ease',
        }}>
        <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: dark ? 'rgba(30,77,92,0.5)' : 'rgba(30,77,92,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>{emoji}</div>
        <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: dark ? '#c8e6f0' : '#1e293b', marginBottom: 4 }}>{title}</h4>
            <p style={{ fontSize: 13, color: dark ? '#7aaabb' : '#64748b', lineHeight: 1.6 }}>{desc}</p>
        </div>
    </motion.div>
);

/* ══════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════ */
const SectionLabel = ({ label, dark }) => (
    <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: dark ? 'rgba(30,77,92,0.35)' : 'rgba(30,77,92,0.08)',
        borderRadius: 50, padding: '5px 16px', marginBottom: 12,
    }}>
        <span style={{ fontSize: 12, color: dark ? '#6FB3A8' : '#1e4d5c',
            fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{label}</span>
    </div>
);

/* ══════════════════════════════════════
   ABOUT PAGE
══════════════════════════════════════ */
const About = () => {
    const { dark, toggle } = useDark();
    const navigate = useNavigate();

    const [stats, setStats] = useState({ venueCount: 0, bookingCount: 0, satisfactionRate: 0 });

    useEffect(() => {
        fetch(`${API}/stats`)
            .then(r => r.json())
            .then(data => setStats({
                venueCount:       data.venueCount       || 0,
                bookingCount:     data.bookingCount     || 0,
                satisfactionRate: data.satisfactionRate || 0,
            }))
            .catch(() => {});
    }, []);

    const statsRef    = useRef(null);
    const servicesRef = useRef(null);
    const teamRef     = useRef(null);
    const valuesRef   = useRef(null);

    const statsInView    = useInView(statsRef,    { once: true, amount: 0.3  });
    const servicesInView = useInView(servicesRef, { once: true, amount: 0.15 });
    const teamInView     = useInView(teamRef,     { once: true, amount: 0.15 });
    const valuesInView   = useInView(valuesRef,   { once: true, amount: 0.15 });

    const T = {
        bg:      dark ? '#0a1f28' : '#EAF6F8',
        title:   dark ? '#d0ecf5' : '#1e293b',
        sub:     dark ? '#7aaabb' : '#64748b',
        card:    dark ? 'rgba(20,55,68,0.7)'  : 'rgba(255,255,255,0.82)',
        border:  dark ? 'rgba(111,179,168,0.2)' : 'rgba(200,185,160,0.4)',
    };

    // ── REAL TEAM — 3 members ──
    const TEAM = [
        {
            name: 'Srihari Prasad S',
            role: 'Founder & CEO',
            bio: 'Visionary behind BookYourEvent. Built the full-stack architecture, backend APIs, authentication system, and led the entire technical development of the platform.',
            emoji: '🚀',
            gradient: 'linear-gradient(135deg,#1e4d5c,#2D8A84)',
        },
        {
            name: 'Varsha C',
            role: 'Finance & Management',
            bio: 'Manages the operational and financial strategy of BookYourEvent. Ensures the platform delivers real value to both venue owners and event planners.',
            emoji: '💼',
            gradient: 'linear-gradient(135deg,#6FB3A8,#1e4d5c)',
        },
        {
            name: 'Nisarga M',
            role: 'Marketing Head',
            bio: 'Drives the brand identity and outreach for BookYourEvent. Focuses on connecting the right audience with the right venues across Bangalore.',
            emoji: '📣',
            gradient: 'linear-gradient(135deg,#C8A45B,#1e4d5c)',
        },
    ];

    const VALUES = [
        { emoji: '✨', title: 'Transparency First',  desc: 'No hidden charges. No surprises. Every price, policy, and detail is upfront.' },
        { emoji: '🤝', title: 'Trust & Safety',       desc: 'Every venue is verified. Every booking is secured. Plan with complete peace of mind.' },
        { emoji: '⚡', title: 'Instant & Effortless', desc: 'From search to confirmation in minutes. We respect your time as much as your celebration.' },
        { emoji: '🌿', title: 'Community Rooted',     desc: 'Born in Bangalore, built for India — we understand local events, traditions, and scale.' },
        { emoji: '💡', title: 'Always Innovating',    desc: 'We continuously improve based on real feedback from bookers and venue owners alike.' },
        { emoji: '🎯', title: 'Event-First Thinking', desc: 'Every feature we build starts with one question: does this make events better?' },
    ];

    const SERVICES = [
        { emoji: '🔍', title: 'Discover Venues',  desc: 'Explore verified venues across Bangalore. Filter by type, capacity, price, and amenities to find your perfect match.' },
        { emoji: '📅', title: 'Instant Booking',  desc: 'Book in minutes with real-time availability. Transparent pricing with zero hidden charges or last-minute surprises.' },
        { emoji: '🏛️', title: 'List Your Venue', desc: 'Own a space? Reach thousands of event planners actively looking. Manage bookings from a powerful owner dashboard.' },
        { emoji: '📊', title: 'Smart Dashboard',  desc: 'Track bookings and analytics from a single clean interface — built for both owners and bookers.' },
    ];

    // ── REAL TIMELINE ──
    const TIMELINE = [
        { tag: 'Week 1',   event: 'Idea finalised — identified the real problem with venue booking in Bangalore' },
        { tag: 'Week 1',   event: 'Tech stack decided — MERN, JWT, Google OAuth, Cloudinary, Netlify + Render' },
        { tag: 'Week 1–2', event: 'Backend built — 25+ REST API endpoints, 4 MongoDB collections, role-based middleware' },
        { tag: 'Week 2',   event: 'Frontend built — 12+ pages, 3 premium UI themes, dark/light mode, PWA support' },
        { tag: 'Week 2',   event: 'Deployed live — Netlify (frontend) + Render (backend) + MongoDB Atlas (DB)' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
                @keyframes gradientShift {
                    0%   { background-position:0% 50%; }
                    50%  { background-position:100% 50%; }
                    100% { background-position:0% 50%; }
                }
                .hero-about-bg {
                    background: linear-gradient(120deg,#c8e6f0,#d7ecef,#e8f6f8,#eef5f0);
                    background-size: 300% 300%;
                    animation: gradientShift 14s ease infinite;
                }
                ::-webkit-scrollbar { width:5px; }
                ::-webkit-scrollbar-track { background:#eef5f0; }
                ::-webkit-scrollbar-thumb { background:#7aaabb; border-radius:10px; }
            `}</style>

            {/* ── NAVBAR ── */}
            <motion.nav
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 24px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: dark ? 'rgba(13,42,51,0.82)' : 'rgba(255,255,255,0.82)',
                    backdropFilter: 'blur(16px)', borderRadius: 18, padding: '10px 24px',
                    border: `1px solid ${dark ? 'rgba(111,179,168,0.2)' : 'rgba(203,231,227,0.55)'}`,
                    boxShadow: '0 2px 16px rgba(30,77,92,0.08)',
                }}>
                    <motion.div whileHover={{ scale: 1.06 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                        onClick={() => navigate('/')}>
                        <img src="/logo.png" alt="BYE"
                            className="h-10 w-10 rounded-full object-cover shadow-md"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <div style={{
                            display: 'none', width: 38, height: 38, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                            alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 10, fontWeight: 800,
                        }}>BYE</div>
                        <span style={{
                            fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15,
                            color: dark ? '#c8e6f0' : '#1e4d5c',
                        }}>BookYourEvent</span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-6">
                        {[
                            { label: 'Home',           to: '/'      },
                            { label: 'About',          to: '/about' },
                            { label: 'Help & Support', to: '/help'  },
                        ].map((item, i) => (
                            <motion.div key={item.label}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i + 0.2 }}>
                                <Link to={item.to} style={{
                                    textDecoration: 'none', fontSize: 13, fontWeight: 500,
                                    color: item.to === '/about' ? '#1e4d5c' : dark ? '#9abbc8' : '#4a6a7a',
                                    borderBottom: item.to === '/about' ? '2px solid #1e4d5c' : 'none',
                                    paddingBottom: 2,
                                }}>{item.label}</Link>
                            </motion.div>
                        ))}
                        <ThemeToggle dark={dark} toggle={toggle} />
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '7px 20px', borderRadius: 50,
                                border: '1.5px solid #1e4d5c', background: 'transparent',
                                color: dark ? '#6FB3A8' : '#1e4d5c', fontWeight: 700,
                                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                            }}>Login</motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* ── HERO ── */}
            <div className="hero-about-bg relative overflow-hidden"
                style={{ padding: '80px 24px 100px', textAlign: 'center' }}>

                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                    overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
                    <Bird x={80}  y={60}  scale={1}    delay={0}   color="#4a7a8a" opacity={0.5}/>
                    <Bird x={118} y={42}  scale={0.85} delay={0.3} color="#4a7a8a" opacity={0.4}/>
                    <Bird x={148} y={58}  scale={0.7}  delay={0.6} color="#4a7a8a" opacity={0.35}/>
                    <Bird x={700} y={40}  scale={0.9}  delay={1.2} color="#4a7a8a" opacity={0.48}/>
                    <Bird x={730} y={25}  scale={0.72} delay={1.6} color="#4a7a8a" opacity={0.38}/>
                    <Bird x={400} y={30}  scale={0.5}  delay={2.5} color="#6a8a9a" opacity={0.22}/>
                </svg>

                {[
                    { x: '4%',  y: '20%', size: 38, rot: -20, dur: 6,   delay: 0,   color: '#6FB3A8' },
                    { x: '90%', y: '10%', size: 28, rot: 30,  dur: 7.5, delay: 1.5, color: '#5aa89c' },
                    { x: '6%',  y: '65%', size: 22, rot: -45, dur: 8,   delay: 3,   color: '#7aaabb' },
                    { x: '93%', y: '58%', size: 32, rot: 15,  dur: 5.5, delay: 0.8, color: '#4d9e93' },
                ].map((l, i) => (
                    <motion.div key={i} style={{ position: 'absolute', left: l.x, top: l.y, zIndex: 0, pointerEvents: 'none' }}
                        animate={{ y: [0, -16, -6, 0], rotate: [l.rot, l.rot + 8, l.rot - 4, l.rot] }}
                        transition={{ duration: l.dur, repeat: Infinity, ease: 'easeInOut', delay: l.delay }}>
                        <Leaf size={l.size} color={l.color} opacity={0.45} />
                    </motion.div>
                ))}

                <div style={{ position: 'relative', zIndex: 2, maxWidth: 740, margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)',
                            borderRadius: 50, padding: '5px 18px', marginBottom: 20,
                            border: '1px solid rgba(200,185,160,0.4)',
                        }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.2px',
                            textTransform: 'uppercase', color: '#4a7a6a' }}>🌿 Our Story</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.85, ease: 'easeOut', delay: 0.1 }}
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(2.4rem,6vw,4rem)', fontWeight: 900,
                            lineHeight: 1.12, color: '#2d4a57', marginBottom: 18,
                        }}>
                        About <span style={{ color: '#1e4d5c', fontStyle: 'italic' }}>BookYourEvent</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, delay: 0.28 }}
                        style={{ fontSize: 18, color: '#4a7a8a', lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>
                        Connecting people with perfect venues — making event planning simple, transparent, and truly memorable.
                    </motion.p>
                </div>

                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <svg viewBox="0 0 1440 60" preserveAspectRatio="none"
                        style={{ width: '100%', height: 60, display: 'block' }}>
                        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
                            fill={dark ? '#0a1f28' : '#EAF6F8'} />
                    </svg>
                </div>
            </div>

            {/* ── OUR STORY ── */}
            <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 380px' }}>
                        <Reveal>
                            <SectionLabel label="Our Story" dark={dark} />
                            <h2 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 900,
                                color: T.title, marginBottom: 20, lineHeight: 1.2,
                            }}>Built in 2 Weeks</h2>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.85, marginBottom: 18 }}>
                                BookYourEvent was born out of a real frustration — finding and booking a venue in Bangalore was unnecessarily complicated. Calls went unanswered, listings were outdated, and pricing was never transparent.
                            </p>
                        </Reveal>
                        <Reveal delay={0.2}>
                            <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.85, marginBottom: 24 }}>
                                So we built the platform we wished existed. In just 2 weeks, a team of 3 students designed, developed, and deployed a full-stack production application — from database schema to live deployment — that makes venue booking simple, instant, and transparent.
                            </p>
                        </Reveal>
                        <Reveal delay={0.3}>
                            <motion.button
                                whileHover={{ scale: 1.04, boxShadow: '0 14px 36px rgba(30,77,92,0.3)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/register')}
                                style={{
                                    padding: '13px 30px', borderRadius: 50, border: 'none',
                                    background: 'linear-gradient(135deg,#1e4d5c,#2a7a6a)',
                                    color: 'white', fontWeight: 700, fontSize: 14,
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    boxShadow: '0 6px 20px rgba(30,77,92,0.28)',
                                }}>Start Exploring →</motion.button>
                        </Reveal>
                    </div>

                    {/* Right — real build timeline */}
                    <div style={{ flex: '1 1 320px' }}>
                        <Reveal delay={0.15} x={40} y={0}>
                            <div style={{
                                background: T.card, backdropFilter: 'blur(14px)',
                                border: `1px solid ${T.border}`, borderRadius: 24, padding: '32px 28px',
                                boxShadow: dark ? '0 16px 48px rgba(0,0,0,0.3)' : '0 16px 48px rgba(30,77,92,0.1)',
                            }}>
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ fontSize: 40, color: '#1e4d5c', lineHeight: 1, marginBottom: 8, opacity: 0.4 }}>"</div>
                                    <p style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: 17, fontStyle: 'italic', lineHeight: 1.7,
                                        color: T.title, fontWeight: 700,
                                    }}>
                                        From idea to live product in 14 days — built with passion, shipped with purpose.
                                    </p>
                                    <div style={{ width: 40, height: 3, background: 'linear-gradient(90deg,#1e4d5c,#6FB3A8)',
                                        borderRadius: 2, marginTop: 16 }} />
                                </div>

                                {TIMELINE.map((item, i) => (
                                    <motion.div key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 + 0.2 }}
                                        style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                                        <div style={{
                                            flexShrink: 0, minWidth: 62, height: 24, borderRadius: 50,
                                            background: 'linear-gradient(135deg,#1e4d5c,#2a7a6a)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 9, fontWeight: 800, color: 'white', padding: '0 8px',
                                        }}>{item.tag}</div>
                                        <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.55, paddingTop: 2 }}>{item.event}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ── LIVE STATS ── */}
            <section style={{
                background: dark ? 'rgba(13,42,51,0.5)' : 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(8px)',
                borderTop: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
                padding: '60px 24px',
            }}>
                <div ref={statsRef} style={{
                    maxWidth: 900, margin: '0 auto',
                    display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
                }}>
                    <StatCard value={stats.venueCount}       suffix="+" label="Venues Listed"    emoji="🏛️" dark={dark} active={statsInView} delay={0}    />
                    <StatCard value={stats.bookingCount}     suffix="+" label="Events Booked"    emoji="📅" dark={dark} active={statsInView} delay={0.15} />
                    <StatCard value={stats.satisfactionRate} suffix="%" label="Satisfaction Rate" emoji="😊" dark={dark} active={statsInView} delay={0.3}  />
                </div>
            </section>

            {/* ── SERVICES ── */}
            <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <SectionLabel label="What We Do" dark={dark} />
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 900,
                            color: T.title, marginTop: 4,
                        }}>Our Core Services</h2>
                        <p style={{ color: T.sub, fontSize: 15, marginTop: 10, maxWidth: 480, margin: '10px auto 0' }}>
                            Everything you need to discover, book, and manage venues — all in one place.
                        </p>
                    </div>
                </Reveal>
                <div ref={servicesRef} style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {SERVICES.map((s, i) => (
                        <ServiceCard key={i} {...s} dark={dark} delay={i * 0.12} inView={servicesInView} />
                    ))}
                </div>
            </section>

            {/* ── VALUES ── */}
            <section style={{
                background: dark ? 'rgba(13,42,51,0.5)' : 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(8px)',
                borderTop: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
                padding: '80px 24px',
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <SectionLabel label="Our Values" dark={dark} />
                            <h2 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 900,
                                color: T.title, marginTop: 4,
                            }}>What We Stand For</h2>
                        </div>
                    </Reveal>
                    <div ref={valuesRef} style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 16,
                    }}>
                        {VALUES.map((v, i) => (
                            <ValueCard key={i} {...v} dark={dark} delay={i * 0.08} inView={valuesInView} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TEAM ── */}
            <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <SectionLabel label="The Team" dark={dark} />
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 900,
                            color: T.title, marginTop: 4,
                        }}>The People Behind BYE</h2>
                        <p style={{ color: T.sub, fontSize: 15, marginTop: 10, maxWidth: 440, margin: '10px auto 0' }}>
                            3 students. 1 idea. 2 weeks. 1 live product.
                        </p>
                    </div>
                </Reveal>
                <div ref={teamRef} style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {TEAM.map((member, i) => (
                        <TeamCard key={i} {...member} dark={dark} delay={i * 0.12} inView={teamInView} />
                    ))}
                </div>
            </section>

            {/* ── MISSION BANNER ── */}
            <section style={{
                background: dark
                    ? 'linear-gradient(135deg,#0d2a33,#1e4d5c)'
                    : 'linear-gradient(135deg,#1e4d5c,#2a7a6a)',
                padding: '70px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                {[['-5%','20%',300],['95%','60%',200],['40%','-10%',160]].map(([l,t,size],i)=>(
                    <div key={i} style={{
                        position:'absolute', left:l, top:t, width:size, height:size,
                        borderRadius:'50%', background:'rgba(255,255,255,0.04)',
                        border:'1px solid rgba(255,255,255,0.08)', pointerEvents:'none',
                    }}/>
                ))}
                <Reveal>
                    <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
                        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>"</div>
                        <p style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 'clamp(1.3rem,3vw,1.9rem)', fontStyle: 'italic',
                            fontWeight: 800, color: 'white', lineHeight: 1.6, marginBottom: 20,
                        }}>
                            Empowering everyone to find and book their ideal venue — with ease, trust, and transparency.
                        </p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: '1.5px',
                            textTransform: 'uppercase', fontWeight: 600 }}>— Our Mission</p>
                    </div>
                </Reveal>
            </section>

            {/* ── CTA ── */}
            <section style={{ padding: '80px 24px', textAlign: 'center' }}>
                <Reveal>
                    <SectionLabel label="Get Started" dark={dark} />
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', fontWeight: 900,
                        color: T.title, marginBottom: 14, marginTop: 6,
                    }}>Ready to Create Your Next Memory?</h2>
                    <p style={{ color: T.sub, fontSize: 15, maxWidth: 420, margin: '0 auto 32px' }}>
                        Join event planners and venue owners on BookYourEvent.
                    </p>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button
                            whileHover={{ scale: 1.04, boxShadow: '0 14px 36px rgba(30,77,92,0.32)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/register')}
                            style={{
                                padding: '14px 36px', borderRadius: 50, border: 'none',
                                background: 'linear-gradient(135deg,#1e4d5c,#2a7a6a)',
                                color: 'white', fontWeight: 700, fontSize: 15,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 6px 20px rgba(30,77,92,0.28)',
                            }}>Browse Venues →</motion.button>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/register')}
                            style={{
                                padding: '14px 36px', borderRadius: 50,
                                border: `1.5px solid ${dark ? 'rgba(111,179,168,0.4)' : 'rgba(30,77,92,0.3)'}`,
                                background: dark ? 'rgba(30,77,92,0.2)' : 'rgba(255,255,255,0.7)',
                                color: dark ? '#6FB3A8' : '#1e4d5c', fontWeight: 700, fontSize: 15,
                                cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)',
                            }}>List Your Venue</motion.button>
                    </div>
                </Reveal>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{
                borderTop: `1px solid ${T.border}`,
                padding: '28px 32px 20px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: 16,
                background: dark ? 'rgba(10,31,40,0.8)' : 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
            }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    <img src="/logo.png" alt="BYE" className="h-9 w-9 rounded-full object-cover"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    <div style={{
                        display: 'none', width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 9, fontWeight: 800,
                    }}>BYE</div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.title }}>BookYourEvent</p>
                        <p style={{ fontSize: 11, color: T.sub }}>© 2026 All rights reserved</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Home',     action: () => navigate('/')         },
                        { label: 'Login',    action: () => navigate('/login')    },
                        { label: 'Register', action: () => navigate('/register') },
                    ].map(item => (
                        <motion.button key={item.label} onClick={item.action}
                            whileHover={{ color: '#1e4d5c', y: -1 }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: 'inherit', fontSize: 13, color: T.sub }}>
                            {item.label}
                        </motion.button>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default About;
