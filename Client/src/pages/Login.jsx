import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/* ══════════════════════════════════════
   DARK MODE CONTEXT (local to this file)
══════════════════════════════════════ */
const useDark = () => {
    const [dark, setDark] = useState(false);
    return { dark, toggle: () => setDark(d => !d) };
};

/* ══════════════════════════════════════
   THEME TOGGLE PILL
══════════════════════════════════════ */
const ThemeToggle = ({ dark, toggle }) => (
    <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.95 }}
        style={{
            width: 64, height: 32, borderRadius: 999, padding: 3,
            display: 'flex', alignItems: 'center', cursor: 'pointer',
            border: 'none', position: 'relative', flexShrink: 0,
            background: dark ? '#1e4d5c' : '#e2f0f5',
            boxShadow: dark ? '0 0 12px rgba(30,77,92,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'background 0.35s ease',
        }}
    >
        <motion.div
            layout
            animate={{ x: dark ? 32 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                width: 26, height: 26, borderRadius: '50%',
                background: dark ? '#c8e6f0' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
        >
            {dark ? '🌙' : '☀️'}
        </motion.div>
    </motion.button>
);

/* ══════════════════════════════════════
   ANIMATED BIRD
══════════════════════════════════════ */
const Bird = ({ x, y, scale = 1, delay = 0, color = '#5a7a8a', opacity = 0.55 }) => (
    <motion.g
        animate={{
            y: [0, -12, -5, -14, 0],
            x: [0, 6, 12, 20, 28],
        }}
        transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        style={{ originX: x, originY: y }}
    >
        <g transform={`translate(${x},${y}) scale(${scale})`}>
            {/* Body */}
            <motion.path
                d="M0 0 Q8 -7 16 0 Q8 -3 0 0Z"
                fill={color} opacity={opacity}
                animate={{ d: [
                    "M0 0 Q8 -7 16 0 Q8 -3 0 0Z",
                    "M0 0 Q8 -4 16 0 Q8 -1 0 0Z",
                    "M0 0 Q8 -7 16 0 Q8 -3 0 0Z",
                ]}}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay }}
            />
        </g>
    </motion.g>
);

/* ══════════════════════════════════════
   ANIMATED BACKGROUND (full SVG scene)
══════════════════════════════════════ */
const AnimatedBackground = ({ dark }) => {
    const lightBg = 'linear-gradient(160deg,#c8e6f0 0%,#d9eff5 30%,#eef5f0 60%,#f5efe6 85%,#f0e8d5 100%)';
    const darkBg  = 'linear-gradient(160deg,#0d2a33 0%,#0f3040 30%,#0a2420 60%,#111820 100%)';

    return (
        <>
            {/* Gradient BG */}
            <motion.div className="absolute inset-0 z-0"
                animate={{ background: dark ? darkBg : lightBg }}
                transition={{ duration: 0.7 }}
            />

            {/* BIRDS SVG layer */}
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ overflow: 'visible' }}>
                {/* Flock 1 – top left */}
                <Bird x={120} y={80}  scale={1}    delay={0}   color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.5:0.55}/>
                <Bird x={155} y={60}  scale={0.85} delay={0.3} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.4:0.45}/>
                <Bird x={185} y={75}  scale={0.7}  delay={0.6} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.35:0.4}/>
                <Bird x={210} y={55}  scale={0.6}  delay={0.9} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.3:0.35}/>

                {/* Flock 2 – top right area */}
                <Bird x={680} y={50}  scale={0.9}  delay={1.2} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.45:0.5}/>
                <Bird x={710} y={35}  scale={0.75} delay={1.5} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.35:0.4}/>
                <Bird x={735} y={52}  scale={0.6}  delay={1.8} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.3:0.35}/>

                {/* Stray birds mid */}
                <Bird x={420} y={110} scale={0.55} delay={2.2} color={dark?'#7aaabb':'#6a8a9a'} opacity={dark?0.25:0.3}/>
                <Bird x={460} y={95}  scale={0.45} delay={2.6} color={dark?'#7aaabb':'#6a8a9a'} opacity={dark?0.2:0.25}/>
            </svg>

            {/* Mountain silhouette */}
            <svg className="absolute bottom-32 left-0 right-0 w-full z-0 pointer-events-none"
                style={{ opacity: dark ? 0.25 : 0.12 }}
                viewBox="0 0 1440 220" preserveAspectRatio="none">
                <path d="M0 220 L180 90 L360 150 L540 70 L720 130 L900 55 L1080 115 L1260 75 L1440 100 L1440 220Z"
                    fill={dark ? '#2a6a7a' : '#7a9aaa'}/>
            </svg>

            {/* Wildflowers */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none"
                style={{ opacity: dark ? 0.5 : 0.75 }}>
                <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="w-full">
                    <path d="M0 140 Q100 90 200 115 Q300 75 400 108 Q500 82 600 115 Q700 90 800 108 Q900 75 1000 100 Q1100 82 1200 108 Q1300 90 1440 100 L1440 140Z"
                        fill={dark ? '#1a4a3a' : '#8fae88'} opacity="0.4"/>
                    <path d="M0 140 Q120 108 240 124 Q360 100 480 120 Q600 105 720 122 Q840 108 960 120 Q1080 108 1200 122 Q1320 110 1440 120 L1440 140Z"
                        fill={dark ? '#155040' : '#6a9468'} opacity="0.5"/>
                    {[60,150,280,380,500,620,750,860,980,1100,1220,1350].map((x, i) => (
                        <g key={i}>
                            <line x1={x} y1="140" x2={x} y2={105+(i%3)*8}
                                stroke={dark?'#2a6a55':'#6a8a65'} strokeWidth="2" opacity="0.7"/>
                            <ellipse cx={x} cy={100+(i%3)*8} rx="7" ry="10"
                                fill={dark
                                    ? ['#1a6a5a','#2a4a6a','#4a2a3a','#2a4a3a'][i%4]
                                    : ['#c9a96e','#b8b0d8','#d4a5a5','#a8c5a0'][i%4]
                                } opacity="0.8"/>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Floating leaves */}
            {[
                { x:'8%',  y:'20%', size:32, rot:-20, dur:6,   delay:0,   color:'#6FB3A8' },
                { x:'88%', y:'15%', size:26, rot:30,  dur:7.5, delay:1.5, color:'#5aa89c' },
                { x:'5%',  y:'55%', size:22, rot:-45, dur:8,   delay:3,   color:'#7aaabb' },
                { x:'92%', y:'60%', size:28, rot:15,  dur:5.5, delay:0.8, color:'#4d9e93' },
                { x:'15%', y:'75%', size:18, rot:60,  dur:9,   delay:2.2, color:'#6FB3A8' },
            ].map((l, i) => (
                <motion.div key={i} className="absolute z-0 pointer-events-none"
                    style={{ left:l.x, top:l.y }}
                    animate={{ y:[0,-18,-7,0], rotate:[l.rot, l.rot+8, l.rot-5, l.rot] }}
                    transition={{ duration:l.dur, repeat:Infinity, ease:'easeInOut', delay:l.delay }}
                >
                    <svg width={l.size} height={l.size} viewBox="0 0 60 80" fill="none">
                        <path d="M30 2 C10 10 2 30 5 55 C8 72 20 78 30 78 C40 78 52 72 55 55 C58 30 50 10 30 2Z"
                            fill={dark ? '#2a6a5a' : l.color}
                            fillOpacity={dark ? 0.4 : 0.45}/>
                        <path d="M30 5 Q32 35 28 75"
                            stroke={dark ? '#3a7a6a' : l.color}
                            strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                </motion.div>
            ))}
        </>
    );
};

/* ══════════════════════════════════════
   LEFT ILLUSTRATION PANEL
══════════════════════════════════════ */
const IllustrationPanel = ({ dark }) => (
    <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden lg:flex flex-col items-center justify-center flex-1 px-12 py-16 relative"
    >
        {/* Glowing orb behind illustration */}
        <div style={{
            position:'absolute', width:340, height:340,
            borderRadius:'50%',
            background: dark
                ? 'radial-gradient(circle, rgba(30,77,92,0.45) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(111,179,168,0.3) 0%, transparent 70%)',
            top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        }}/>

        {/* Venue illustration (SVG scene) */}
        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position:'relative', zIndex:1, marginBottom:32 }}
        >
            <svg width="280" height="200" viewBox="0 0 280 200" fill="none">
                {/* Building */}
                <rect x="60" y="80" width="160" height="100" rx="6"
                    fill={dark ? '#1a4a5a' : '#d4eaf5'} stroke={dark?'#2a6a7a':'#b0cfe0'} strokeWidth="1.5"/>
                {/* Columns */}
                {[80,110,140,170,200].map((cx,i)=>(
                    <rect key={i} x={cx} y="90" width="10" height="90" rx="3"
                        fill={dark?'#2a5a6a':'#c0daf0'} opacity="0.8"/>
                ))}
                {/* Roof */}
                <path d="M50 80 L140 30 L230 80Z"
                    fill={dark?'#1e4d5c':'#b8d8ec'} stroke={dark?'#2a6a7a':'#90b8d0'} strokeWidth="1.5"/>
                {/* Door */}
                <rect x="120" y="140" width="40" height="40" rx="3"
                    fill={dark?'#0d2a33':'#8ab8d0'} opacity="0.9"/>
                <circle cx="155" cy="162" r="3" fill={dark?'#6FB3A8':'#5a8a9a'} opacity="0.8"/>
                {/* Windows */}
                {[[85,100],[195,100],[85,128],[195,128]].map(([wx,wy],i)=>(
                    <rect key={i} x={wx} y={wy} width="24" height="22" rx="3"
                        fill={dark?'rgba(111,179,168,0.3)':'rgba(255,255,255,0.7)'}
                        stroke={dark?'#2a6a7a':'#90b8d0'} strokeWidth="1"/>
                ))}
                {/* Flag */}
                <line x1="140" y1="30" x2="140" y2="8" stroke={dark?'#5a9aaa':'#5a7a8a'} strokeWidth="1.5"/>
                <path d="M140 8 L162 15 L140 22Z" fill={dark?'#6FB3A8':'#7ab8c8'} opacity="0.9"/>
                {/* Stars / confetti */}
                {[[40,50],[240,55],[30,130],[250,120],[140,10]].map(([sx,sy],i)=>(
                    <motion.circle key={i} cx={sx} cy={sy} r="3"
                        fill={['#F59E0B','#6FB3A8','#a78bfa','#f472b6','#34d399'][i]}
                        opacity="0.8"
                        animate={{ scale:[1,1.6,1], opacity:[0.6,1,0.6] }}
                        transition={{ duration:1.5+i*0.3, repeat:Infinity, delay:i*0.4 }}
                    />
                ))}
                {/* Ground */}
                <ellipse cx="140" cy="182" rx="90" ry="8"
                    fill={dark?'#1a3a2a':'#a8c8a0'} opacity="0.4"/>
                {/* Trees */}
                {[[30,160],[250,155]].map(([tx,ty],i)=>(
                    <g key={i}>
                        <rect x={tx+6} y={ty+20} width="8" height="22" rx="2"
                            fill={dark?'#2a4a32':'#8a6a40'} opacity="0.8"/>
                        <circle cx={tx+10} cy={ty+15} r={14}
                            fill={dark?'#1a5a3a':'#6a9a58'} opacity="0.85"/>
                    </g>
                ))}
            </svg>
        </motion.div>

        {/* Text */}
        <motion.div
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.4, duration:0.7 }}
            style={{ textAlign:'center', position:'relative', zIndex:1 }}
        >
            <h2 style={{
                fontFamily:"'Playfair Display', serif",
                fontSize:'1.8rem', fontWeight:900, lineHeight:1.2, marginBottom:10,
                color: dark ? '#c8e6f0' : '#1e4d5c',
            }}>
                The Moment Where<br/>
                <span style={{ fontStyle:'italic', color: dark?'#6FB3A8':'#2a7a6a' }}>
                    Memory Begins 🌿
                </span>
            </h2>
            <p style={{ fontSize:13, color: dark?'#7aaabb':'#5a7a8a', lineHeight:1.6, maxWidth:260 }}>
                Join thousands of event planners discovering perfect venues across Bangalore.
            </p>

            {/* Mini stat pills */}
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'center' }}>
                {[{ n:'500+', l:'Venues' },{ n:'98%', l:'Happy' },{ n:'2K+', l:'Events' }].map((s,i)=>(
                    <div key={i} style={{
                        padding:'6px 14px', borderRadius:50,
                        background: dark ? 'rgba(30,77,92,0.4)' : 'rgba(255,255,255,0.6)',
                        border: `1px solid ${dark?'rgba(111,179,168,0.3)':'rgba(200,185,160,0.4)'}`,
                        backdropFilter:'blur(8px)', textAlign:'center',
                    }}>
                        <p style={{ fontSize:14, fontWeight:800, color: dark?'#6FB3A8':'#1e4d5c',
                            fontFamily:"'Playfair Display', serif" }}>{s.n}</p>
                        <p style={{ fontSize:10, color: dark?'#7aaabb':'#7a8a8a', marginTop:1 }}>{s.l}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    </motion.div>
);

/* ══════════════════════════════════════
   FOCUSED INPUT
══════════════════════════════════════ */
const FocusInput = ({ dark, type, name, value, onChange, placeholder, icon, required }) => {
    const [focused, setFocused] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const isPw = type === 'password';

    return (
        <div style={{ position:'relative' }}>
            <input
                type={isPw && showPw ? 'text' : type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                onFocus={()=>setFocused(true)}
                onBlur={()=>setFocused(false)}
                style={{
                    width:'100%', background:'transparent',
                    borderBottom:`2px solid ${focused
                        ? '#1e4d5c'
                        : dark ? 'rgba(111,179,168,0.35)' : 'rgba(100,120,140,0.3)'}`,
                    color: dark ? '#e0f0f5' : '#334155',
                    padding:'10px 36px 10px 4px',
                    fontSize:14, outline:'none',
                    transition:'border-color 0.25s ease, box-shadow 0.25s ease',
                    boxShadow: focused ? '0 4px 10px rgba(30,77,92,0.15)' : 'none',
                    fontFamily:'inherit',
                    caretColor: '#1e4d5c',
                }}
            />
            {/* placeholder colour via inline trick */}
            <style>{`input::placeholder { color: ${dark?'rgba(160,190,200,0.6)':'rgba(100,120,140,0.55)'}; }`}</style>

            {/* icon / toggle */}
            <span
                onClick={isPw ? ()=>setShowPw(v=>!v) : undefined}
                style={{
                    position:'absolute', right:4, top:'50%', transform:'translateY(-50%)',
                    fontSize:15, color: dark?'rgba(111,179,168,0.7)':'rgba(90,120,140,0.6)',
                    cursor: isPw ? 'pointer' : 'default', userSelect:'none',
                }}
            >
                {isPw ? (showPw ? '👁' : '🔒') : icon}
            </span>
        </div>
    );
};

/* ══════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════ */
const Login = () => {
    const { dark, toggle } = useDark();
    const [formData, setFormData] = useState({ identifier:'', password:'' });
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login } = useAuth();
    const navigate  = useNavigate();

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await loginUser(formData);
            login(data.user, data.token);
            if      (data.user.role === 'booker')     navigate('/booker/dashboard');
            else if (data.user.role === 'venueOwner') navigate('/owner/dashboard');
            else if (data.user.role === 'admin')      navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally { setLoading(false); }
    };

    const handleGoogleLogin = () => { window.location.href = `${API}/auth/google`; };

    /* theme tokens */
    const T = {
        card:    dark ? 'rgba(13,42,51,0.88)'  : 'rgba(255,252,245,0.88)',
        border:  dark ? 'rgba(111,179,168,0.2)' : 'rgba(200,185,160,0.4)',
        title:   dark ? '#d0ecf5'               : '#1e293b',
        sub:     dark ? '#7aaabb'               : '#64748b',
        divider: dark ? 'rgba(111,179,168,0.2)' : '#e2e8f0',
        google:  dark ? 'rgba(30,50,60,0.7)'    : 'white',
        googleBorder: dark ? 'rgba(111,179,168,0.3)' : '#e2e8f0',
        googleHover:  dark ? 'rgba(40,70,80,0.8)'    : '#f8fafc',
        googleText:   dark ? '#c8e6f0'               : '#374151',
        link:    dark ? '#6FB3A8' : '#1e4d5c',
        check:   dark ? '#6FB3A8' : '#1e4d5c',
    };

    return (
        <div style={{ height:'100vh', overflow:'hidden', position:'relative', display:'flex', flexDirection:'column', fontFamily:"'DM Sans', sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');`}</style>

            <AnimatedBackground dark={dark} />

            {/* ── NAVBAR ── */}
            <motion.nav
                initial={{ y:-30, opacity:0 }}
                animate={{ y:0, opacity:1 }}
                transition={{ duration:0.6 }}
                className="relative z-20 px-6 py-3 flex justify-between items-center"
            >
                <div style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
                    background: dark ? 'rgba(13,42,51,0.75)' : 'rgba(255,255,255,0.75)',
                    backdropFilter:'blur(16px)', borderRadius:18,
                    padding:'8px 20px',
                    border:`1px solid ${dark?'rgba(111,179,168,0.2)':'rgba(203,231,227,0.5)'}`,
                    boxShadow:'0 2px 16px rgba(0,0,0,0.08)',
                }}>
                    {/* Logo */}
                    <motion.div whileHover={{ scale:1.06 }} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <img src="/logo.png" alt="BYE" className="h-10 w-10 rounded-full object-cover shadow-md"
                            onError={e=>{ e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
                        <div style={{
                            display:'none', width:38, height:38, borderRadius:'50%',
                            background:'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                            alignItems:'center', justifyContent:'center',
                            color:'white', fontSize:10, fontWeight:800,
                        }}>BYE</div>
                        <span style={{ fontFamily:"'Playfair Display', serif", fontWeight:700, fontSize:15,
                            color: dark?'#c8e6f0':'#1e4d5c' }}>BookYourEvent</span>
                    </motion.div>

                    {/* Nav links */}
                    <div className="hidden md:flex items-center gap-6">
                        {[
                        { label:'Home',     to:'/' },
                        { label:'About',    to:'/about' },
                        { label:'Services', to:'/#services' },
                        { label:'Help & Contact',  to:'/help' },
                            ].map((item, i) => (
                        <motion.div key={item.label}
                        initial={{ opacity:0, y:-8 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay:0.1*i+0.2 }}
                        >
                        <Link
                            to={item.to}
                            className="text-slate-600 hover:text-slate-800 font-medium transition text-sm"
                        >
                        {item.label}
                        </Link>
                        </motion.div>
                        ))}
                        <ThemeToggle dark={dark} toggle={toggle} />
                    </div>
                </div>
            </motion.nav>

            {/* ── MAIN CONTENT ── */}
            <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden">
                {/* SPLIT LAYOUT WRAPPER */}
                <div style={{
                    display:'flex', alignItems:'stretch',
                    width:'100%', maxWidth:960,
                    margin:'0 auto', padding:'0 16px',
                    gap:0,
                }}>
                    {/* LEFT – illustration (desktop only) */}
                    <IllustrationPanel dark={dark} />

                    {/* RIGHT – login card */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                        flex:'0 0 auto', width:'100%', maxWidth:420 }}>
                        <motion.div
                            initial={{ opacity:0, y:50, scale:0.96 }}
                            animate={{ opacity:1, y:0, scale:1 }}
                            transition={{ duration:0.75, ease:'easeOut', delay:0.15 }}
                            style={{
                                width:'100%', borderRadius:24, padding:36,
                                background: T.card, backdropFilter:'blur(14px)',
                                border:`1px solid ${T.border}`,
                                boxShadow: dark
                                    ? '0 32px 64px rgba(0,0,0,0.5)'
                                    : '0 24px 56px rgba(30,77,92,0.14)',
                            }}
                        >
                            {/* Logo */}
                            <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
                                <motion.div whileHover={{ scale:1.08, rotate:5 }}>
                                    <img src="/logo.png" alt="BYE"
                                        className="h-16 w-16 rounded-full object-cover"
                                        style={{ boxShadow:'0 6px 20px rgba(30,77,92,0.25)' }}
                                        onError={e=>{
                                            e.target.style.display='none';
                                            e.target.nextSibling.style.display='flex';
                                        }}/>
                                    <div style={{
                                        display:'none', width:64, height:64, borderRadius:'50%',
                                        background:'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                                        alignItems:'center', justifyContent:'center',
                                        color:'white', fontSize:13, fontWeight:800,
                                        boxShadow:'0 6px 20px rgba(30,77,92,0.25)',
                                    }}>BYE</div>
                                </motion.div>
                            </div>

                            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.9rem',
                                fontWeight:900, color:T.title, textAlign:'center', marginBottom:4 }}>
                                Login
                            </h2>
                            <p style={{ textAlign:'center', color:T.sub, fontSize:12,
                                fontStyle:'italic', letterSpacing:'1.5px', marginBottom:24 }}>
                                EASY. BOOK. ENJOY.
                            </p>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity:0, y:-10, scale:0.95 }}
                                        animate={{ opacity:1, y:0, scale:1 }}
                                        exit={{ opacity:0, scale:0.95 }}
                                        style={{
                                            background:'rgba(239,68,68,0.1)',
                                            border:'1px solid rgba(239,68,68,0.3)',
                                            color:'#ef4444', padding:'10px 14px',
                                            borderRadius:10, marginBottom:16,
                                            fontSize:13, textAlign:'center',
                                        }}
                                    >{error}</motion.div>
                                )}
                            </AnimatePresence>

                            {/* Form */}
                            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                                <FocusInput dark={dark} type="text" name="identifier"
                                    value={formData.identifier} onChange={handleChange}
                                    placeholder="Email or Username" icon="@" required />

                                <FocusInput dark={dark} type="password" name="password"
                                    value={formData.password} onChange={handleChange}
                                    placeholder="Password" required />

                                {/* Remember + Forgot */}
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                                        <input type="checkbox" checked={rememberMe}
                                            onChange={e=>setRememberMe(e.target.checked)}
                                            style={{ accentColor: T.check }}/>
                                        <span style={{ fontSize:12, color:T.sub }}>Remember me</span>
                                    </label>
                                    <button type="button" onClick={()=>navigate('/forgot-password')}
                                        style={{ fontSize:12, color:T.link, background:'none',
                                            border:'none', cursor:'pointer', fontFamily:'inherit',
                                            transition:'opacity 0.2s' }}
                                        onMouseEnter={e=>e.target.style.opacity='0.7'}
                                        onMouseLeave={e=>e.target.style.opacity='1'}
                                    >Forgot Password?</button>
                                </div>

                                {/* Submit */}
                                <motion.button
                                    type="submit" disabled={loading}
                                    whileHover={!loading ? { scale:1.03, boxShadow:'0 14px 36px rgba(30,77,92,0.35)' } : {}}
                                    whileTap={!loading ? { scale:0.98 } : {}}
                                    style={{
                                        width:'100%', padding:'13px', borderRadius:12, border:'none',
                                        fontWeight:700, color:'white', fontSize:15, cursor: loading?'not-allowed':'pointer',
                                        background: loading ? '#7a9aaa' : 'linear-gradient(135deg,#1e4d5c 0%,#2a7a6a 100%)',
                                        fontFamily:'inherit',
                                        boxShadow: loading ? 'none' : '0 6px 20px rgba(30,77,92,0.3)',
                                        transition:'background 0.3s ease',
                                    }}
                                >
                                    {loading ? (
                                        <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                                            <motion.span
                                                animate={{ rotate:360 }}
                                                transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                                                style={{ display:'inline-block', width:14, height:14,
                                                    border:'2px solid rgba(255,255,255,0.4)',
                                                    borderTopColor:'white', borderRadius:'50%' }}
                                            />
                                            Logging in...
                                        </span>
                                    ) : 'Login'}
                                </motion.button>
                            </form>

                            {/* Divider */}
                            <div style={{ display:'flex', alignItems:'center', gap:10, margin:'20px 0' }}>
                                <div style={{ flex:1, height:1, background:T.divider }}/>
                                <span style={{ fontSize:12, color:T.sub }}>or</span>
                                <div style={{ flex:1, height:1, background:T.divider }}/>
                            </div>

                            {/* Google */}
                            <motion.button
                                whileHover={{ scale:1.02, borderColor: dark?'rgba(111,179,168,0.6)':'#94a3b8' }}
                                whileTap={{ scale:0.98 }}
                                onClick={handleGoogleLogin}
                                style={{
                                    width:'100%', padding:'12px', borderRadius:12, fontWeight:600,
                                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                                    background: T.google, color: T.googleText,
                                    border:`1.5px solid ${T.googleBorder}`,
                                    cursor:'pointer', fontFamily:'inherit', fontSize:14,
                                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
                                    transition:'border-color 0.2s, background 0.2s',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 48 48">
                                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-3-11.4-7.3l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
                                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                                </svg>
                                Continue with Google
                            </motion.button>

                            {/* Footer links */}
                            <p style={{ textAlign:'center', color:T.sub, fontSize:13, marginTop:20 }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color:T.link, fontWeight:700, textDecoration:'none' }}>Register</Link>
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

