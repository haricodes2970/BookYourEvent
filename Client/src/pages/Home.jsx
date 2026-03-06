import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/* ─── COUNTER HOOK ─── */
const useCountUp = (target, duration = 2000, active = false) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!active || target === 0) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setCount(Math.floor(eased * target));
            if (p < 1) requestAnimationFrame(step);
            else setCount(target);
        };
        requestAnimationFrame(step);
    }, [active, target, duration]);
    return count;
};

/* ─── STAT ITEM ─── */
const StatItem = ({ number, suffix = '', label, active, delay = 0 }) => {
    const count = useCountUp(number, 2000, active);
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className="text-center"
        >
            <p style={{
                fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 900,
                fontFamily: "'Playfair Display', serif",
                background: 'linear-gradient(135deg,#1e4d5c 0%,#5aa89c 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
                {count.toLocaleString()}{suffix}
            </p>
            <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">{label}</p>
        </motion.div>
    );
};

/* ─── LEAF SVG ─── */
const Leaf = ({ size = 44, opacity = 0.5, color = '#6FB3A8', rotate = 0 }) => (
    <svg width={size} height={size} viewBox="0 0 60 80" fill="none"
        style={{ transform: `rotate(${rotate}deg)` }}>
        <path d="M30 2 C10 10 2 30 5 55 C8 72 20 78 30 78 C40 78 52 72 55 55 C58 30 50 10 30 2Z"
            fill={color} fillOpacity={opacity} />
        <path d="M30 5 Q32 35 28 75"
            stroke={color} strokeOpacity={opacity + 0.15} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M30 20 Q20 30 8 35"
            stroke={color} strokeOpacity={opacity * 0.7} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M30 35 Q40 42 52 44"
            stroke={color} strokeOpacity={opacity * 0.7} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M30 50 Q22 55 14 60"
            stroke={color} strokeOpacity={opacity * 0.6} strokeWidth="0.7" strokeLinecap="round" />
    </svg>
);

/* ─── FLOATING VENUE CARD ─── */
const FloatingVenueCard = ({ venue, posStyle, floatDelay = 0 }) => {
    if (!venue) return null;
    return (
        <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 5 + floatDelay, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
            style={{
                position: 'absolute', background: 'white', borderRadius: 16,
                overflow: 'hidden', width: 152, pointerEvents: 'none',
                boxShadow: '0 14px 40px rgba(30,77,92,0.22)', ...posStyle,
            }}
        >
            <img
                src={venue.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300&h=200&fit=crop'}
                alt={venue.name}
                style={{ width: '100%', height: 88, objectFit: 'cover', display: 'block' }}
            />
            <div style={{ padding: '8px 10px 10px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#2D4A47', marginBottom: 4,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {venue.name}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#F59E0B' }}>★★★★★</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1e4d5c' }}>
                        ₹{venue.pricePerHour?.toLocaleString('en-IN')}/hr
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

/* ─── SCROLL REVEAL ─── */
const Reveal = ({ children, delay = 0, y = 44, ...props }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.2 });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay, ease: 'easeOut' }}
            {...props}
        >{children}</motion.div>
    );
};

/* ══════════════════════════════════════════════════════
   HOME
══════════════════════════════════════════════════════ */
const Home = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ venueCount: 0, bookingCount: 0, satisfactionRate: 0 });
    const [randomVenues, setRandomVenues] = useState([null, null]);

    const statsRef    = useRef(null);
    const statsInView = useInView(statsRef, { once: true, amount: 0.4 });
    const servicesRef    = useRef(null);
    const servicesInView = useInView(servicesRef, { once: true, amount: 0.15 });
    const howRef         = useRef(null);
    const howInView      = useInView(howRef, { once: true, amount: 0.15 });

    /* ── FETCH LIVE STATS ── */
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API}/stats`);
                const data = await res.json();
                setStats({
                    venueCount: data.venueCount || 0,
                    bookingCount: data.bookingCount || 0,
                    satisfactionRate: data.satisfactionRate || 0,
                });
                if (data.randomVenues?.length >= 2) {
                    setRandomVenues(data.randomVenues);
                } else if (data.randomVenues?.length === 1) {
                    setRandomVenues([data.randomVenues[0], null]);
                }
            } catch (err) {
                console.error('Stats fetch failed:', err);
            }
        };
        fetchStats();
    }, []);

    const LEAVES = [
        { cls:'top-[12%] left-[6%]',    size:54, opacity:0.45, color:'#6FB3A8', rotate:-20, dur:6,   delay:0   },
        { cls:'top-[16%] right-[9%]',   size:40, opacity:0.35, color:'#5aa89c', rotate:30,  dur:7.5, delay:1.5 },
        { cls:'bottom-[22%] left-[10%]',size:32, opacity:0.30, color:'#7aaabb', rotate:-45, dur:8,   delay:3   },
        { cls:'bottom-[30%] right-[5%]',size:48, opacity:0.38, color:'#4d9e93', rotate:15,  dur:5.5, delay:0.8 },
        { cls:'top-[52%] left-[2%]',    size:24, opacity:0.28, color:'#6FB3A8', rotate:60,  dur:9,   delay:2.2 },
        { cls:'top-[7%] right-[28%]',   size:19, opacity:0.22, color:'#5aa89c', rotate:-10, dur:7,   delay:4   },
        { cls:'bottom-[8%] right-[20%]',size:28, opacity:0.26, color:'#4d9e93', rotate:80,  dur:6.5, delay:1   },
    ];

    const DOTS = [
        { top:'30%',    left:'20%',  size:10, color:'#1e4d5c' },
        { top:'60%',    right:'24%', size:7,  color:'#6FB3A8' },
        { top:'19%',    left:'42%',  size:5,  color:'#7aaabb' },
        { bottom:'20%', left:'34%',  size:8,  color:'#1e4d5c' },
    ];

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col"
            style={{ fontFamily:"'DM Sans', sans-serif" }}>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
                @keyframes gradientShift {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .hero-bg {
                    background: linear-gradient(120deg,#c8e6f0,#d7ecef,#e8f6f8,#eef5f0,#f0ece0);
                    background-size: 300% 300%;
                    animation: gradientShift 12s ease infinite;
                }
                .btn-p { transition: transform .22s ease, box-shadow .22s ease; }
                .btn-p:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 14px 36px rgba(30,77,92,.32); }
                .btn-s { transition: transform .22s ease, box-shadow .22s ease, background .22s ease; }
                .btn-s:hover { transform: translateY(-3px) scale(1.04); background: rgba(255,255,255,.96) !important; box-shadow: 0 10px 28px rgba(0,0,0,.1); }
                .nav-link { position:relative; transition:color .2s; }
                .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:#1e4d5c; border-radius:2px; transition:width .25s ease; }
                .nav-link:hover { color:#1e4d5c !important; }
                .nav-link:hover::after { width:100%; }
                .svc-card { transition: transform .3s ease, box-shadow .3s ease; }
                .svc-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 24px 48px rgba(30,77,92,.14) !important; }
                .how-card { transition: transform .3s ease, box-shadow .3s ease; }
                .how-card:hover { transform: translateY(-7px); box-shadow: 0 18px 38px rgba(30,77,92,.12) !important; }
                ::-webkit-scrollbar { width:5px; }
                ::-webkit-scrollbar-track { background:#eef5f0; }
                ::-webkit-scrollbar-thumb { background:#7aaabb; border-radius:10px; }
            `}</style>

            {/* ── GRADIENT BG ── */}
            <div className="hero-bg absolute inset-0 z-0" />

            {/* ── FLOATING LEAVES ── */}
            {LEAVES.map((l, i) => (
                <motion.div key={i}
                    className={`absolute z-0 pointer-events-none ${l.cls}`}
                    animate={{ y:[0,-20,-8,0], rotate:[l.rotate, l.rotate+8, l.rotate-4, l.rotate] }}
                    transition={{ duration:l.dur, repeat:Infinity, ease:'easeInOut', delay:l.delay }}
                >
                    <Leaf size={l.size} opacity={l.opacity} color={l.color} rotate={l.rotate} />
                </motion.div>
            ))}

            {/* ── PULSING DOTS ── */}
            {DOTS.map((d, i) => (
                <motion.div key={i}
                    className="absolute z-0 pointer-events-none rounded-full"
                    style={{ ...d, width:d.size, height:d.size, background:d.color }}
                    animate={{ scale:[1,1.8,1], opacity:[0.3,0.7,0.3] }}
                    transition={{ duration:2.5+i*0.4, repeat:Infinity, delay:i*0.6 }}
                />
            ))}

            {/* ── MOUNTAIN ── */}
            <svg className="absolute bottom-36 left-0 right-0 w-full opacity-10 z-0 pointer-events-none"
                viewBox="0 0 1440 220" preserveAspectRatio="none">
                <path d="M0 220 L180 90 L360 150 L540 70 L720 130 L900 55 L1080 115 L1260 75 L1440 100 L1440 220Z"
                    fill="#4a7a8a"/>
            </svg>

            {/* ── WILDFLOWERS ── */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z"
                        fill="#a8c5d4" opacity="0.3"/>
                    <path d="M0 180 Q220 130 440 155 Q660 120 880 148 Q1100 125 1320 142 L1440 138 L1440 180Z"
                        fill="#88b5c8" opacity="0.25"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={125+(i%5)*8}
                                stroke="#7aaabb" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={117+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)}
                                fill={['#b8d8ec','#c8dff0','#d4c8e0','#c0d8e8','#d8e8c0','#e8d4b8'][i%6]}
                                opacity="0.75"/>
                            {i%4===0 &&
                                <ellipse cx={x+9} cy={112+(i%4)*9} rx="4" ry="7"
                                    fill="#d0b8dc" opacity="0.5"/>}
                        </g>
                    ))}
                </svg>
            </div>

            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 text-xs italic z-10 tracking-widest pointer-events-none">
                EASY. BOOK. ENJOY.
            </p>

            {/* ══════════════════════════════════════
                NAVBAR
            ══════════════════════════════════════ */}
            <motion.nav
                initial={{ y:-30, opacity:0 }}
                animate={{ y:0, opacity:1 }}
                transition={{ duration:0.7, ease:'easeOut' }}
                className="relative z-20 px-8 py-4"
            >
                <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    background:'rgba(255,255,255,0.78)', backdropFilter:'blur(16px)',
                    borderRadius:20, padding:'10px 24px',
                    boxShadow:'0 2px 16px rgba(30,77,92,0.08)',
                    border:'1px solid rgba(203,231,227,0.55)',
                }}>
                    <motion.div whileHover={{ scale:1.06 }}
                        style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <img src="/logo.png" alt="BYE"
                            className="h-12 w-12 rounded-full object-cover shadow-md"
                            onError={e=>{
                                e.target.style.display='none';
                                e.target.nextSibling.style.display='flex';
                            }}/>
                        <div style={{
                            display:'none', width:44, height:44, borderRadius:'50%',
                            background:'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                            alignItems:'center', justifyContent:'center',
                            color:'white', fontSize:11, fontWeight:800,
                            boxShadow:'0 4px 14px rgba(30,77,92,0.3)',
                        }}>BYE</div>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-8">
                        {[
                            { label: 'Home',            action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                            { label: 'About',           action: () => navigate('/about') },
                            { label: 'Help & Support',  action: () => navigate('/help') },
                            { label: 'Services',        action: () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) },
                        ].map((item, i) => (
                            <motion.button key={item.label}
                                onClick={item.action}
                                className="nav-link text-slate-600 font-medium text-sm"
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontFamily: 'inherit', padding: 0,
                                }}
                                initial={{ opacity:0, y:-8 }}
                                animate={{ opacity:1, y:0 }}
                                transition={{ delay:0.1*i+0.35 }}
                            >{item.label}</motion.button>
                        ))}

                        <motion.button
                            whileHover={{ scale:1.06, backgroundColor:'#1e4d5c', color:'white' }}
                            whileTap={{ scale:0.97 }}
                            onClick={() => navigate('/login')}
                            style={{
                                padding:'8px 22px', borderRadius:50,
                                border:'1.5px solid #1e4d5c', background:'transparent',
                                color:'#1e4d5c', fontWeight:700, fontSize:14,
                                cursor:'pointer', fontFamily:'inherit',
                                transition:'background .2s, color .2s',
                            }}
                        >Login</motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* ══════════════════════════════════════
                HERO
            ══════════════════════════════════════ */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 pb-48 pt-8">

                {/* Floating venue cards — real random venues */}
                <div className="hidden lg:block">
                    <FloatingVenueCard
                        venue={randomVenues[0]}
                        posStyle={{ left:'4%', top:'38%' }}
                        floatDelay={0}
                    />
                    <FloatingVenueCard
                        venue={randomVenues[1]}
                        posStyle={{ right:'4%', top:'30%' }}
                        floatDelay={1.4}
                    />
                </div>

                {/* Badge */}
                <motion.div
                    initial={{ opacity:0, scale:0.8, y:10 }}
                    animate={{ opacity:1, scale:1, y:0 }}
                    transition={{ duration:0.6 }}
                    className="mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
                    style={{
                        background:'rgba(255,255,255,0.65)', border:'1px solid rgba(200,185,160,0.4)',
                        color:'#4a7a6a', backdropFilter:'blur(8px)',
                    }}
                >🌿 Bangalore's Premier Venue Platform</motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity:0, y:50 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.85, ease:'easeOut', delay:0.1 }}
                    style={{
                        fontFamily:"'Playfair Display', serif",
                        fontSize:'clamp(2.4rem,6vw,4.2rem)',
                        fontWeight:900, lineHeight:1.12,
                        color:'#2d4a57', marginBottom:16,
                    }}
                >
                    The Moment Where<br/>
                    <span style={{ color:'#1e4d5c', fontStyle:'italic' }}>Memory Begins 🌿</span>
                </motion.h1>

                {/* Sub */}
                <motion.p
                    initial={{ opacity:0, y:30 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.75, delay:0.28 }}
                    className="text-slate-500 text-lg mb-8 max-w-xl leading-relaxed"
                >
                    From intimate gatherings to grand celebrations — discover, book, and manage venues with ease.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity:0, y:24 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.7, delay:0.45 }}
                    className="flex gap-4 mb-16 flex-wrap justify-center"
                >
                    <button className="btn-p" onClick={() => navigate('/register')}
                        style={{
                            padding:'14px 34px', borderRadius:50, border:'none',
                            fontWeight:700, color:'white', fontSize:15, cursor:'pointer',
                            background:'#1e4d5c', fontFamily:'inherit',
                            boxShadow:'0 6px 20px rgba(30,77,92,0.3)',
                        }}>Browse Venues →</button>
                    <button className="btn-s" onClick={() => navigate('/register')}
                        style={{
                            padding:'14px 34px', borderRadius:50, fontWeight:700,
                            fontSize:15, cursor:'pointer', fontFamily:'inherit',
                            background:'rgba(255,255,255,0.72)',
                            border:'1.5px solid rgba(200,185,160,0.5)', color:'#4a5a6a',
                        }}>List Your Venue</button>
                </motion.div>

                {/* Live Stats */}
                <div ref={statsRef} className="flex gap-12 flex-wrap justify-center">
                    <StatItem number={stats.venueCount}       suffix="+"  label="Venues Listed"   active={statsInView} delay={0}    />
                    <StatItem number={stats.bookingCount}     suffix="+"  label="Events Booked"   active={statsInView} delay={0.15} />
                    <StatItem number={stats.satisfactionRate} suffix="%"  label="Satisfaction Rate" active={statsInView} delay={0.3}  />
                </div>
            </div>

            {/* ══════════════════════════════════════
                SERVICES
            ══════════════════════════════════════ */}
            <div id="services" className="relative z-10 px-8 py-16">
                <Reveal>
                    <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(1.6rem,4vw,2.2rem)',
                        fontWeight:800, color:'#2d4a57', textAlign:'center', marginBottom:40 }}>
                        Our Services
                    </h2>
                </Reveal>
                <div ref={servicesRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {[
                        { emoji:'🔍', title:'Discover Venues',
                          desc:'Browse hundreds of verified venues across Bangalore. Filter by type, capacity, price, and amenities.' },
                        { emoji:'📅', title:'Instant Booking',
                          desc:'Book your venue in minutes. Real-time availability, transparent pricing, no hidden charges.' },
                        { emoji:'🏛️', title:'List Your Venue',
                          desc:"Own a venue? List it for free and reach thousands of event planners looking for the perfect space." },
                    ].map((s, i) => (
                        <motion.div key={i}
                            className="svc-card rounded-2xl p-6 text-center"
                            initial={{ opacity:0, y:48 }}
                            animate={servicesInView ? { opacity:1, y:0 } : {}}
                            transition={{ duration:0.55, delay:i*0.12, ease:'easeOut' }}
                            onClick={() => navigate('/register')}
                            style={{
                                background:'rgba(255,255,255,0.78)',
                                border:'1px solid rgba(200,185,160,0.3)',
                                backdropFilter:'blur(8px)', cursor:'pointer',
                                boxShadow:'0 4px 20px rgba(30,77,92,0.06)',
                            }}
                        >
                            <div style={{ fontSize:40, marginBottom:16 }}>{s.emoji}</div>
                            <h3 className="text-slate-700 font-bold text-lg mb-2">{s.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════ */}
            <div ref={howRef} className="relative z-10 px-8 py-16 text-center"
                style={{ background:'rgba(255,255,255,0.35)', backdropFilter:'blur(8px)' }}>
                <Reveal>
                    <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(1.6rem,4vw,2.2rem)',
                        fontWeight:800, color:'#2d4a57', marginBottom:40 }}>
                        How It Works
                    </h2>
                </Reveal>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
                    {[
                        { step:'01', title:'Create Account', desc:'Sign up as a booker or venue owner in seconds.' },
                        { step:'02', title:'Find Your Venue', desc:'Browse and filter venues that match your needs.' },
                        { step:'03', title:'Book & Enjoy',    desc:'Send a booking request and celebrate!'         },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <motion.div
                                className="how-card rounded-2xl p-6 w-52 text-center"
                                initial={{ opacity:0, y:40 }}
                                animate={howInView ? { opacity:1, y:0 } : {}}
                                transition={{ duration:0.55, delay:i*0.14, ease:'easeOut' }}
                                onClick={() => navigate('/register')}
                                style={{
                                    background:'rgba(255,255,255,0.78)',
                                    border:'1px solid rgba(200,185,160,0.3)',
                                    cursor:'pointer',
                                    boxShadow:'0 4px 20px rgba(30,77,92,0.06)',
                                }}
                            >
                                <p style={{ fontSize:32, fontWeight:900, marginBottom:8, color:'#1e4d5c',
                                    fontFamily:"'Playfair Display', serif" }}>{item.step}</p>
                                <p className="text-slate-700 font-bold text-sm mb-1">{item.title}</p>
                                <p className="text-slate-400 text-xs">{item.desc}</p>
                            </motion.div>
                            {i < 2 && <span className="text-slate-300 text-2xl hidden md:block">→</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════
                CONTACT
            ══════════════════════════════════════ */}
            <div id="contact" className="relative z-10 px-8 py-16 text-center">
                <Reveal>
                    <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(1.6rem,4vw,2.2rem)',
                        fontWeight:800, color:'#2d4a57', marginBottom:8 }}>
                        Get In Touch
                    </h2>
                    <p className="text-slate-400 text-sm mb-8">Have questions? We'd love to hear from you.</p>
                    <div className="flex justify-center gap-6 flex-wrap">
                        {[
                            { icon:'📧', label:'bookyourevnt@gmail.com', href:'mailto:bookyourevnt@gmail.com' },
                            { icon:'📍', label:'Bangalore, Karnataka',   href:'#' },
                        ].map((c, i) => (
                            <motion.a key={i} href={c.href}
                                whileHover={{ y:-4, boxShadow:'0 12px 28px rgba(30,77,92,0.13)' }}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl"
                                style={{
                                    background:'rgba(255,255,255,0.68)',
                                    border:'1px solid rgba(200,185,160,0.3)',
                                    textDecoration:'none', backdropFilter:'blur(6px)',
                                }}
                            >
                                <span>{c.icon}</span>
                                <span className="text-slate-500 text-sm">{c.label}</span>
                            </motion.a>
                        ))}
                    </div>
                </Reveal>
            </div>

            {/* ══════════════════════════════════════
                FOOTER
            ══════════════════════════════════════ */}
            <div className="relative z-10 px-8 py-6 flex justify-between items-center pb-16 flex-wrap gap-4"
                style={{ borderTop:'1px solid rgba(200,185,160,0.3)' }}>
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="BYE" className="h-10 w-10 rounded-full object-cover"
                        onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
                    <div style={{
                        display:'none', width:36, height:36, borderRadius:'50%',
                        background:'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                        alignItems:'center', justifyContent:'center',
                        color:'white', fontSize:10, fontWeight:800,
                    }}>BYE</div>
                    <div>
                        <p className="text-slate-600 font-bold text-sm">BookYourEvent</p>
                        <p className="text-slate-400 text-xs">© 2026 All rights reserved</p>
                    </div>
                </div>
                <div className="flex gap-6 flex-wrap">
                    {[
                        { label:'Login',        action: () => navigate('/login') },
                        { label:'Register',     action: () => navigate('/register') },
                        { label:'Services',     action: () => document.getElementById('services')?.scrollIntoView({ behavior:'smooth' }) },
                        { label:'Contact',      action: () => document.getElementById('contact')?.scrollIntoView({ behavior:'smooth' }) },
                    ].map(item => (
                        <motion.button key={item.label} onClick={item.action}
                            whileHover={{ color:'#1e4d5c', y:-1 }}
                            className="text-slate-400 text-sm"
                            style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}
                        >{item.label}</motion.button>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Home;
