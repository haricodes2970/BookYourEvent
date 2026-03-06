import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/* ══════════════════════════════════════
   DARK MODE (local)
══════════════════════════════════════ */
const useDark = () => {
    const [dark, setDark] = useState(false);
    return { dark, toggle: () => setDark(d => !d) };
};

/* ══════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════ */
const ThemeToggle = ({ dark, toggle }) => (
    <motion.button onClick={toggle} whileTap={{ scale: 0.95 }}
        style={{
            width: 64, height: 32, borderRadius: 999, padding: 3,
            display: 'flex', alignItems: 'center', cursor: 'pointer',
            border: 'none', flexShrink: 0,
            background: dark ? '#1e4d5c' : '#e2f0f5',
            boxShadow: dark ? '0 0 12px rgba(30,77,92,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'background 0.35s ease',
        }}
    >
        <motion.div layout
            animate={{ x: dark ? 32 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                width: 26, height: 26, borderRadius: '50%',
                background: dark ? '#c8e6f0' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
        >{dark ? '🌙' : '☀️'}</motion.div>
    </motion.button>
);

/* ══════════════════════════════════════
   ANIMATED BIRD
══════════════════════════════════════ */
const Bird = ({ x, y, scale = 1, delay = 0, color = '#5a7a8a', opacity = 0.55 }) => (
    <motion.g
        animate={{ y: [0, -12, -5, -14, 0], x: [0, 6, 12, 20, 28] }}
        transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
        <g transform={`translate(${x},${y}) scale(${scale})`}>
            <motion.path
                d="M0 0 Q8 -7 16 0 Q8 -3 0 0Z"
                fill={color} opacity={opacity}
                animate={{ d: ["M0 0 Q8 -7 16 0 Q8 -3 0 0Z","M0 0 Q8 -4 16 0 Q8 -1 0 0Z","M0 0 Q8 -7 16 0 Q8 -3 0 0Z"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay }}
            />
        </g>
    </motion.g>
);

/* ══════════════════════════════════════
   ANIMATED BACKGROUND
══════════════════════════════════════ */
const AnimatedBackground = ({ dark }) => (
    <>
        <motion.div className="absolute inset-0 z-0"
            animate={{
                background: dark
                    ? 'linear-gradient(160deg,#0d2a33 0%,#0f3040 30%,#0a2420 60%,#111820 100%)'
                    : 'linear-gradient(160deg,#c8e6f0 0%,#d9eff5 30%,#eef5f0 60%,#f5efe6 85%,#f0e8d5 100%)',
            }}
            transition={{ duration: 0.7 }}
        />

        {/* Birds */}
        <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ overflow: 'visible' }}>
            <Bird x={100} y={70}  scale={1}    delay={0}   color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.5:0.55}/>
            <Bird x={138} y={52}  scale={0.85} delay={0.3} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.4:0.45}/>
            <Bird x={168} y={67}  scale={0.7}  delay={0.6} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.35:0.4}/>
            <Bird x={195} y={48}  scale={0.55} delay={0.9} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.28:0.33}/>
            <Bird x={680} y={45}  scale={0.9}  delay={1.2} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.45:0.5}/>
            <Bird x={712} y={30}  scale={0.75} delay={1.5} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.35:0.4}/>
            <Bird x={738} y={48}  scale={0.6}  delay={1.8} color={dark?'#5a9aaa':'#4a7a8a'} opacity={dark?0.3:0.35}/>
            <Bird x={400} y={100} scale={0.5}  delay={2.4} color={dark?'#7aaabb':'#6a8a9a'} opacity={dark?0.22:0.27}/>
            <Bird x={440} y={88}  scale={0.42} delay={2.8} color={dark?'#7aaabb':'#6a8a9a'} opacity={dark?0.18:0.22}/>
        </svg>

        {/* Mountain */}
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
                                : ['#c9a96e','#b8b0d8','#d4a5a5','#a8c5a0'][i%4]}
                            opacity="0.8"/>
                    </g>
                ))}
            </svg>
        </div>

        {/* Floating leaves */}
        {[
            { x:'7%',  y:'18%', size:30, rot:-20, dur:6,   delay:0,   color:'#6FB3A8' },
            { x:'88%', y:'14%', size:24, rot:30,  dur:7.5, delay:1.5, color:'#5aa89c' },
            { x:'4%',  y:'58%', size:20, rot:-45, dur:8,   delay:3,   color:'#7aaabb' },
            { x:'92%', y:'62%', size:26, rot:15,  dur:5.5, delay:0.8, color:'#4d9e93' },
            { x:'14%', y:'78%', size:16, rot:60,  dur:9,   delay:2.2, color:'#6FB3A8' },
            { x:'80%', y:'40%', size:18, rot:-30, dur:7,   delay:3.5, color:'#5aa89c' },
        ].map((l, i) => (
            <motion.div key={i} className="absolute z-0 pointer-events-none"
                style={{ left:l.x, top:l.y }}
                animate={{ y:[0,-18,-7,0], rotate:[l.rot, l.rot+8, l.rot-5, l.rot] }}
                transition={{ duration:l.dur, repeat:Infinity, ease:'easeInOut', delay:l.delay }}
            >
                <svg width={l.size} height={l.size} viewBox="0 0 60 80" fill="none">
                    <path d="M30 2 C10 10 2 30 5 55 C8 72 20 78 30 78 C40 78 52 72 55 55 C58 30 50 10 30 2Z"
                        fill={dark ? '#2a6a5a' : l.color} fillOpacity={dark ? 0.4 : 0.45}/>
                    <path d="M30 5 Q32 35 28 75"
                        stroke={dark ? '#3a7a6a' : l.color}
                        strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
            </motion.div>
        ))}
    </>
);

/* ══════════════════════════════════════
   LEFT ILLUSTRATION PANEL
══════════════════════════════════════ */
const IllustrationPanel = ({ dark, role }) => {
    const scenes = {
        booker: {
            emoji: '🎉',
            title: 'Find Your Perfect Venue',
            desc: 'Browse, compare, and instantly book from 500+ curated venues across Bangalore.',
            color: '#1e4d5c',
            accent: '#2a7a6a',
        },
        venueOwner: {
            emoji: '🏛️',
            title: 'List & Grow Your Venue',
            desc: 'Reach thousands of event planners. Manage bookings effortlessly from your dashboard.',
            color: '#3a5a2a',
            accent: '#5a8a3a',
        },
    };
    const s = scenes[role] || scenes.booker;

    return (
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="hidden lg:flex flex-col items-center justify-center flex-1 px-10 py-10 relative"
        >
            {/* Glow */}
            <div style={{
                position:'absolute', width:320, height:320, borderRadius:'50%',
                background: dark
                    ? 'radial-gradient(circle,rgba(30,77,92,0.4) 0%,transparent 70%)'
                    : 'radial-gradient(circle,rgba(111,179,168,0.28) 0%,transparent 70%)',
                top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            }}/>

            {/* Venue illustration */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position:'relative', zIndex:1, marginBottom:28 }}
            >
                <svg width="260" height="190" viewBox="0 0 260 190" fill="none">
                    {/* Building body */}
                    <rect x="50" y="75" width="160" height="95" rx="6"
                        fill={dark?'#1a4a5a':'#d4eaf5'} stroke={dark?'#2a6a7a':'#b0cfe0'} strokeWidth="1.5"/>
                    {/* Columns */}
                    {[70,100,130,160,190].map((cx,i)=>(
                        <rect key={i} x={cx} y="83" width="9" height="87" rx="3"
                            fill={dark?'#2a5a6a':'#c0daf0'} opacity="0.8"/>
                    ))}
                    {/* Roof */}
                    <path d="M40 75 L130 25 L220 75Z"
                        fill={dark?'#1e4d5c':'#b8d8ec'} stroke={dark?'#2a6a7a':'#90b8d0'} strokeWidth="1.5"/>
                    {/* Door */}
                    <rect x="112" y="135" width="36" height="35" rx="3"
                        fill={dark?'#0d2a33':'#8ab8d0'} opacity="0.9"/>
                    <circle cx="144" cy="155" r="2.5" fill={dark?'#6FB3A8':'#5a8a9a'} opacity="0.8"/>
                    {/* Windows */}
                    {[[72,93],[177,93],[72,120],[177,120]].map(([wx,wy],i)=>(
                        <rect key={i} x={wx} y={wy} width="22" height="20" rx="3"
                            fill={dark?'rgba(111,179,168,0.3)':'rgba(255,255,255,0.7)'}
                            stroke={dark?'#2a6a7a':'#90b8d0'} strokeWidth="1"/>
                    ))}
                    {/* Flag */}
                    <line x1="130" y1="25" x2="130" y2="6"
                        stroke={dark?'#5a9aaa':'#5a7a8a'} strokeWidth="1.5"/>
                    <path d="M130 6 L150 13 L130 20Z"
                        fill={dark?'#6FB3A8':'#7ab8c8'} opacity="0.9"/>
                    {/* Confetti stars */}
                    {[[30,46],[230,50],[25,125],[238,115],[130,8]].map(([sx,sy],i)=>(
                        <motion.circle key={i} cx={sx} cy={sy} r="3"
                            fill={['#F59E0B','#6FB3A8','#a78bfa','#f472b6','#34d399'][i]}
                            opacity="0.85"
                            animate={{ scale:[1,1.7,1], opacity:[0.6,1,0.6] }}
                            transition={{ duration:1.4+i*0.3, repeat:Infinity, delay:i*0.4 }}
                        />
                    ))}
                    {/* Ground */}
                    <ellipse cx="130" cy="172" rx="82" ry="7"
                        fill={dark?'#1a3a2a':'#a8c8a0'} opacity="0.4"/>
                    {/* Trees */}
                    {[[22,152],[218,148]].map(([tx,ty],i)=>(
                        <g key={i}>
                            <rect x={tx+5} y={ty+18} width="7" height="20" rx="2"
                                fill={dark?'#2a4a32':'#8a6a40'} opacity="0.8"/>
                            <circle cx={tx+8} cy={ty+13} r={13}
                                fill={dark?'#1a5a3a':'#6a9a58'} opacity="0.85"/>
                        </g>
                    ))}
                </svg>
            </motion.div>

            {/* Text content — changes based on selected role */}
            <AnimatePresence mode="wait">
                <motion.div key={role}
                    initial={{ opacity:0, y:16 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, y:-16 }}
                    transition={{ duration:0.4 }}
                    style={{ textAlign:'center', position:'relative', zIndex:1 }}
                >
                    <div style={{ fontSize:36, marginBottom:10 }}>{s.emoji}</div>
                    <h2 style={{
                        fontFamily:"'Playfair Display', serif",
                        fontSize:'1.65rem', fontWeight:900, lineHeight:1.2, marginBottom:10,
                        color: dark ? '#c8e6f0' : s.color,
                    }}>
                        {s.title}
                    </h2>
                    <p style={{ fontSize:13, color:dark?'#7aaabb':'#5a7a8a', lineHeight:1.65, maxWidth:250 }}>
                        {s.desc}
                    </p>

                    {/* Mini stat pills */}
                    <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'center' }}>
                        {[{ n:'500+', l:'Venues' },{ n:'98%', l:'Happy' },{ n:'2K+', l:'Events' }].map((st,i)=>(
                            <div key={i} style={{
                                padding:'6px 14px', borderRadius:50,
                                background: dark?'rgba(30,77,92,0.4)':'rgba(255,255,255,0.6)',
                                border:`1px solid ${dark?'rgba(111,179,168,0.3)':'rgba(200,185,160,0.4)'}`,
                                backdropFilter:'blur(8px)', textAlign:'center',
                            }}>
                                <p style={{ fontSize:14, fontWeight:800, color:dark?'#6FB3A8':s.color,
                                    fontFamily:"'Playfair Display', serif" }}>{st.n}</p>
                                <p style={{ fontSize:10, color:dark?'#7aaabb':'#7a8a8a', marginTop:1 }}>{st.l}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

/* ══════════════════════════════════════
   FOCUS INPUT
══════════════════════════════════════ */
const FocusInput = ({ dark, type='text', name, value, onChange, placeholder, icon, required, autoComplete }) => {
    const [focused, setFocused] = useState(false);
    const [showPw, setShowPw]   = useState(false);
    const isPw = type === 'password';
    return (
        <div style={{ position:'relative' }}>
            <input
                type={isPw && showPw ? 'text' : type}
                name={name} value={value} onChange={onChange}
                placeholder={placeholder} required={required}
                autoComplete={autoComplete}
                onFocus={()=>setFocused(true)}
                onBlur={()=>setFocused(false)}
                style={{
                    width:'100%', background:'transparent',
                    borderBottom:`2px solid ${focused
                        ? '#1e4d5c'
                        : dark?'rgba(111,179,168,0.3)':'rgba(100,120,140,0.28)'}`,
                    color: dark?'#e0f0f5':'#334155',
                    padding:'10px 36px 10px 4px',
                    fontSize:14, outline:'none',
                    transition:'border-color 0.25s ease, box-shadow 0.25s ease',
                    boxShadow: focused ? '0 4px 10px rgba(30,77,92,0.14)' : 'none',
                    fontFamily:'inherit', caretColor:'#1e4d5c',
                }}
            />
            <style>{`input::placeholder { color:${dark?'rgba(160,190,200,0.55)':'rgba(100,120,140,0.5)'}; }`}</style>
            <span onClick={isPw ? ()=>setShowPw(v=>!v) : undefined}
                style={{
                    position:'absolute', right:4, top:'50%', transform:'translateY(-50%)',
                    fontSize:15, cursor:isPw?'pointer':'default',
                    color:dark?'rgba(111,179,168,0.65)':'rgba(90,120,140,0.55)',
                    userSelect:'none',
                }}>
                {isPw ? (showPw ? '👁' : '🔒') : icon}
            </span>
        </div>
    );
};

/* ══════════════════════════════════════
   ROLE SELECTOR
══════════════════════════════════════ */
const RoleSelector = ({ dark, value, onChange }) => {
    const roles = [
        { id:'booker',     label:'Event Booker',  icon:'🎉', desc:'I want to book venues' },
        { id:'venueOwner', label:'Venue Owner',   icon:'🏛️', desc:'I want to list my venue' },
    ];
    return (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {roles.map(r => {
                const active = value === r.id;
                return (
                    <motion.button key={r.id} type="button"
                        onClick={() => onChange(r.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            padding:'12px 8px', borderRadius:12, border:'2px solid',
                            borderColor: active
                                ? '#1e4d5c'
                                : dark?'rgba(111,179,168,0.2)':'rgba(200,185,160,0.4)',
                            background: active
                                ? dark?'rgba(30,77,92,0.4)':'rgba(30,77,92,0.08)'
                                : dark?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.5)',
                            cursor:'pointer', textAlign:'center', transition:'all 0.2s ease',
                            boxShadow: active ? '0 4px 14px rgba(30,77,92,0.2)' : 'none',
                        }}
                    >
                        <div style={{ fontSize:22, marginBottom:4 }}>{r.icon}</div>
                        <div style={{ fontSize:12, fontWeight:700,
                            color: active ? '#1e4d5c' : dark?'#9abbc8':'#4a6a7a' }}>{r.label}</div>
                        <div style={{ fontSize:10, marginTop:2,
                            color: dark?'rgba(154,187,200,0.7)':'rgba(74,106,122,0.65)' }}>{r.desc}</div>
                    </motion.button>
                );
            })}
        </div>
    );
};

/* ══════════════════════════════════════
   PROGRESS STEPS
══════════════════════════════════════ */
const StepIndicator = ({ dark, current, total }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:20 }}>
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <motion.div
                    animate={{
                        width:  i === current ? 24 : 8,
                        background: i < current
                            ? '#1e4d5c'
                            : i === current
                                ? '#1e4d5c'
                                : dark?'rgba(111,179,168,0.2)':'rgba(200,185,160,0.4)',
                    }}
                    style={{ height:8, borderRadius:4 }}
                    transition={{ duration:0.35 }}
                />
            </div>
        ))}
    </div>
);

/* ══════════════════════════════════════
   PASSWORD STRENGTH
══════════════════════════════════════ */
const PasswordStrength = ({ password, dark }) => {
    if (!password) return null;
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score  = checks.filter(Boolean).length;
    const labels = ['Weak','Fair','Good','Strong'];
    const colors = ['#ef4444','#f59e0b','#6FB3A8','#22c55e'];

    return (
        <div style={{ marginTop:6 }}>
            <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                {[0,1,2,3].map(i => (
                    <motion.div key={i}
                        initial={{ scaleX:0 }} animate={{ scaleX:1 }}
                        style={{
                            flex:1, height:3, borderRadius:3,
                            background: i < score ? colors[score-1] : dark?'rgba(111,179,168,0.15)':'rgba(200,185,160,0.3)',
                            transformOrigin:'left',
                            transition:'background 0.3s ease',
                        }}
                    />
                ))}
            </div>
            <p style={{ fontSize:11, color: score > 0 ? colors[score-1] : dark?'#7aaabb':'#94a3b8' }}>
                {score > 0 ? `${labels[score-1]} password` : ''}
            </p>
        </div>
    );
};

/* ══════════════════════════════════════
   REGISTER PAGE
══════════════════════════════════════ */
const Register = () => {
    const { dark, toggle } = useDark();
    const navigate = useNavigate();

    const [step, setStep]   = useState(0); // 0 = role, 1 = details, 2 = password
    const [role, setRole]   = useState('booker');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        fullName: '', email: '', phone: '',
        password: '', confirmPassword: '',
        venueName: '', venueCity: '',
        agreeTerms: false,
    });

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    /* ── STEP VALIDATION ── */
    const validateStep = () => {
        setError('');
        if (step === 0) return true;
        if (step === 1) {
            if (!form.fullName.trim()) return setError('Full name is required'), false;
            if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
                return setError('Valid email is required'), false;
            if (!form.phone.trim() || form.phone.length < 10)
                return setError('Valid phone number is required'), false;
            if (role === 'venueOwner' && !form.venueName.trim())
                return setError('Venue name is required'), false;
            return true;
        }
        if (step === 2) {
            if (form.password.length < 8)
                return setError('Password must be at least 8 characters'), false;
            if (form.password !== form.confirmPassword)
                return setError('Passwords do not match'), false;
            if (!form.agreeTerms)
                return setError('Please accept the Terms & Conditions'), false;
            return true;
        }
        return true;
    };

    const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
    const prevStep = () => { setError(''); setStep(s => s - 1); };

    /* ── SUBMIT ── */
    const handleSubmit = async e => {
        e.preventDefault();
        if (!validateStep()) return;
        setLoading(true);
        try {
            const payload = {
                name: form.fullName, email: form.email,
                phone: form.phone, password: form.password, role,
                ...(role === 'venueOwner' && {
                    venueName: form.venueName,
                    venueCity: form.venueCity,
                }),
            };
            const res = await fetch(`${API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2200);
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = () => {
        window.location.href = `${API}/auth/google`;
    };

    /* ── THEME TOKENS ── */
    const T = {
        card:    dark?'rgba(13,42,51,0.9)':'rgba(255,252,245,0.9)',
        border:  dark?'rgba(111,179,168,0.2)':'rgba(200,185,160,0.4)',
        title:   dark?'#d0ecf5':'#1e293b',
        sub:     dark?'#7aaabb':'#64748b',
        divider: dark?'rgba(111,179,168,0.2)':'#e2e8f0',
        link:    dark?'#6FB3A8':'#1e4d5c',
        google:  dark?'rgba(30,50,60,0.7)':'white',
        googleBorder: dark?'rgba(111,179,168,0.3)':'#e2e8f0',
        googleText:   dark?'#c8e6f0':'#374151',
    };

    const TOTAL_STEPS = 3;

    return (
        <div style={{ height:'100vh', overflow:'hidden', position:'relative',
            display:'flex', flexDirection:'column', fontFamily:"'DM Sans', sans-serif" }}>
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
                    background: dark?'rgba(13,42,51,0.75)':'rgba(255,255,255,0.75)',
                    backdropFilter:'blur(16px)', borderRadius:18,
                    padding:'8px 20px',
                    border:`1px solid ${dark?'rgba(111,179,168,0.2)':'rgba(203,231,227,0.5)'}`,
                    boxShadow:'0 2px 16px rgba(0,0,0,0.08)',
                }}>
                    <motion.div whileHover={{ scale:1.06 }}
                        style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <img src="/logo.png" alt="BYE" className="h-10 w-10 rounded-full object-cover shadow-md"
                            onError={e=>{
                                e.target.style.display='none';
                                e.target.nextSibling.style.display='flex';
                            }}/>
                        <div style={{
                            display:'none', width:38, height:38, borderRadius:'50%',
                            background:'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                            alignItems:'center', justifyContent:'center',
                            color:'white', fontSize:10, fontWeight:800,
                        }}>BYE</div>
                        <span style={{ fontFamily:"'Playfair Display', serif", fontWeight:700, fontSize:15,
                            color:dark?'#c8e6f0':'#1e4d5c' }}>BookYourEvent</span>
                    </motion.div>

                    <div className="hidden md:flex items-center gap-6">
                    {[{label:'Home',to:'/'},{label:'About',to:'/about'},
                    {label:'Services',to:'/#services'},{label:'Help & Contact',to:'/help'}].map((item,i) => (
                    <motion.div key={item.label}
                    initial={{ opacity:0, y:-8 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay:0.1*i+0.2 }}>
                    <Link to={item.to} style={{
                        textDecoration:'none', fontSize:13, fontWeight:500,
                        color:dark?'#9abbc8':'#4a6a7a', transition:'color 0.2s',
                        }}
                        onMouseEnter={e=>e.target.style.color=dark?'#c8e6f0':'#1e4d5c'}
                        onMouseLeave={e=>e.target.style.color=dark?'#9abbc8':'#4a6a7a'}
                        >{item.label}</Link>
                        </motion.div>
                        ))}
                        <ThemeToggle dark={dark} toggle={toggle} />
                    </div>
                </div>
            </motion.nav>

            {/* ── MAIN ── */}
            <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden">
                <div style={{
                    display:'flex', alignItems:'stretch', width:'100%',
                    maxWidth:960, margin:'0 auto', padding:'0 16px', gap:0,
                }}>
                    {/* LEFT */}
                    <IllustrationPanel dark={dark} role={role} />

                    {/* RIGHT – register card */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                        flex:'0 0 auto', width:'100%', maxWidth:440 }}>
                        <motion.div
                            initial={{ opacity:0, y:50, scale:0.96 }}
                            animate={{ opacity:1, y:0, scale:1 }}
                            transition={{ duration:0.75, ease:'easeOut', delay:0.15 }}
                            style={{
                                width:'100%', borderRadius:24, padding:'28px 32px',
                                background:T.card, backdropFilter:'blur(14px)',
                                border:`1px solid ${T.border}`,
                                boxShadow:dark
                                    ?'0 32px 64px rgba(0,0,0,0.5)'
                                    :'0 24px 56px rgba(30,77,92,0.14)',
                                maxHeight:'88vh', overflowY:'auto',
                            }}
                        >
                            {/* SUCCESS STATE */}
                            <AnimatePresence>
                                {success && (
                                    <motion.div
                                        initial={{ opacity:0, scale:0.8 }}
                                        animate={{ opacity:1, scale:1 }}
                                        style={{ textAlign:'center', padding:'20px 0' }}
                                    >
                                        <motion.div
                                            animate={{ scale:[1,1.2,1] }}
                                            transition={{ duration:0.6, repeat:2 }}
                                            style={{ fontSize:52, marginBottom:14 }}
                                        >🎉</motion.div>
                                        <h3 style={{ fontFamily:"'Playfair Display', serif",
                                            fontSize:'1.6rem', fontWeight:900, color:T.title, marginBottom:8 }}>
                                            Welcome aboard!
                                        </h3>
                                        <p style={{ color:T.sub, fontSize:13 }}>
                                            Account created. Redirecting to login...
                                        </p>
                                        <motion.div
                                            initial={{ width:0 }}
                                            animate={{ width:'100%' }}
                                            transition={{ duration:2.2 }}
                                            style={{ height:3, background:'#1e4d5c',
                                                borderRadius:3, marginTop:20 }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!success && (
                                <>
                                    {/* Logo */}
                                    <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                                        <motion.div whileHover={{ scale:1.08, rotate:5 }}>
                                            <img src="/logo.png" alt="BYE"
                                                className="h-14 w-14 rounded-full object-cover"
                                                style={{ boxShadow:'0 6px 20px rgba(30,77,92,0.25)' }}
                                                onError={e=>{
                                                    e.target.style.display='none';
                                                    e.target.nextSibling.style.display='flex';
                                                }}/>
                                            <div style={{
                                                display:'none', width:56, height:56, borderRadius:'50%',
                                                background:'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                                                alignItems:'center', justifyContent:'center',
                                                color:'white', fontSize:12, fontWeight:800,
                                                boxShadow:'0 6px 20px rgba(30,77,92,0.25)',
                                            }}>BYE</div>
                                        </motion.div>
                                    </div>

                                    <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'1.75rem',
                                        fontWeight:900, color:T.title, textAlign:'center', marginBottom:4 }}>
                                        Create Account
                                    </h2>
                                    <p style={{ textAlign:'center', color:T.sub, fontSize:12,
                                        fontStyle:'italic', letterSpacing:'1.5px', marginBottom:16 }}>
                                        EASY. BOOK. ENJOY.
                                    </p>

                                    {/* Step indicator */}
                                    <StepIndicator dark={dark} current={step} total={TOTAL_STEPS} />

                                    {/* Error */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity:0, y:-10 }}
                                                animate={{ opacity:1, y:0 }}
                                                exit={{ opacity:0 }}
                                                style={{
                                                    background:'rgba(239,68,68,0.1)',
                                                    border:'1px solid rgba(239,68,68,0.3)',
                                                    color:'#ef4444', padding:'10px 14px',
                                                    borderRadius:10, marginBottom:14,
                                                    fontSize:13, textAlign:'center',
                                                }}
                                            >{error}</motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={handleSubmit}>
                                        <AnimatePresence mode="wait">

                                            {/* ── STEP 0: ROLE ── */}
                                            {step === 0 && (
                                                <motion.div key="step0"
                                                    initial={{ opacity:0, x:40 }}
                                                    animate={{ opacity:1, x:0 }}
                                                    exit={{ opacity:0, x:-40 }}
                                                    transition={{ duration:0.35 }}
                                                    style={{ display:'flex', flexDirection:'column', gap:16 }}
                                                >
                                                    <p style={{ fontSize:13, color:T.sub, textAlign:'center', marginBottom:4 }}>
                                                        How will you use BookYourEvent?
                                                    </p>
                                                    <RoleSelector dark={dark} value={role} onChange={setRole} />

                                                    {/* Divider */}
                                                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                        <div style={{ flex:1, height:1, background:T.divider }}/>
                                                        <span style={{ fontSize:12, color:T.sub }}>or sign up with</span>
                                                        <div style={{ flex:1, height:1, background:T.divider }}/>
                                                    </div>

                                                    {/* Google */}
                                                    <motion.button type="button"
                                                        whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                                        onClick={handleGoogleRegister}
                                                        style={{
                                                            width:'100%', padding:'11px', borderRadius:12,
                                                            fontWeight:600, display:'flex', alignItems:'center',
                                                            justifyContent:'center', gap:10,
                                                            background:T.google, color:T.googleText,
                                                            border:`1.5px solid ${T.googleBorder}`,
                                                            cursor:'pointer', fontFamily:'inherit', fontSize:14,
                                                            boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
                                                        }}
                                                    >
                                                        <svg width="17" height="17" viewBox="0 0 48 48">
                                                            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                                                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                                                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-3-11.4-7.3l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
                                                            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                                                        </svg>
                                                        Continue with Google
                                                    </motion.button>
                                                </motion.div>
                                            )}

                                            {/* ── STEP 1: DETAILS ── */}
                                            {step === 1 && (
                                                <motion.div key="step1"
                                                    initial={{ opacity:0, x:40 }}
                                                    animate={{ opacity:1, x:0 }}
                                                    exit={{ opacity:0, x:-40 }}
                                                    transition={{ duration:0.35 }}
                                                    style={{ display:'flex', flexDirection:'column', gap:16 }}
                                                >
                                                    <FocusInput dark={dark} name="fullName" value={form.fullName}
                                                        onChange={handleChange} placeholder="Full Name" icon="👤" required/>
                                                    <FocusInput dark={dark} type="email" name="email" value={form.email}
                                                        onChange={handleChange} placeholder="Email Address" icon="✉" required/>
                                                    <FocusInput dark={dark} type="tel" name="phone" value={form.phone}
                                                        onChange={handleChange} placeholder="Phone Number" icon="📱" required/>
                                                    {role === 'venueOwner' && (
                                                        <>
                                                            <FocusInput dark={dark} name="venueName" value={form.venueName}
                                                                onChange={handleChange} placeholder="Venue Name" icon="🏛️" required/>
                                                            <FocusInput dark={dark} name="venueCity" value={form.venueCity}
                                                                onChange={handleChange} placeholder="City (e.g. Bangalore)" icon="📍"/>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* ── STEP 2: PASSWORD ── */}
                                            {step === 2 && (
                                                <motion.div key="step2"
                                                    initial={{ opacity:0, x:40 }}
                                                    animate={{ opacity:1, x:0 }}
                                                    exit={{ opacity:0, x:-40 }}
                                                    transition={{ duration:0.35 }}
                                                    style={{ display:'flex', flexDirection:'column', gap:16 }}
                                                >
                                                    <div>
                                                        <FocusInput dark={dark} type="password" name="password"
                                                            value={form.password} onChange={handleChange}
                                                            placeholder="Password" required/>
                                                        <PasswordStrength password={form.password} dark={dark} />
                                                    </div>
                                                    <FocusInput dark={dark} type="password" name="confirmPassword"
                                                        value={form.confirmPassword} onChange={handleChange}
                                                        placeholder="Confirm Password" required/>

                                                    {/* Terms */}
                                                    <label style={{ display:'flex', alignItems:'flex-start',
                                                        gap:8, cursor:'pointer', marginTop:4 }}>
                                                        <input type="checkbox" name="agreeTerms"
                                                            checked={form.agreeTerms} onChange={handleChange}
                                                            style={{ accentColor:'#1e4d5c', marginTop:2, flexShrink:0 }}/>
                                                        <span style={{ fontSize:12, color:T.sub, lineHeight:1.5 }}>
                                                            I agree to the{' '}
                                                            <span style={{ color:T.link, fontWeight:700, cursor:'pointer' }}>
                                                                Terms & Conditions
                                                            </span>{' '}and{' '}
                                                            <span style={{ color:T.link, fontWeight:700, cursor:'pointer' }}>
                                                                Privacy Policy
                                                            </span>
                                                        </span>
                                                    </label>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* ── NAV BUTTONS ── */}
                                        <div style={{ display:'flex', gap:10, marginTop:20 }}>
                                            {step > 0 && (
                                                <motion.button type="button" onClick={prevStep}
                                                    whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                                                    style={{
                                                        flex:1, padding:'12px', borderRadius:12, fontWeight:600,
                                                        fontSize:14, cursor:'pointer', fontFamily:'inherit',
                                                        background:'transparent',
                                                        border:`1.5px solid ${dark?'rgba(111,179,168,0.3)':'rgba(200,185,160,0.5)'}`,
                                                        color:T.sub, transition:'all 0.2s',
                                                    }}
                                                >← Back</motion.button>
                                            )}

                                            {step < TOTAL_STEPS - 1 ? (
                                                <motion.button type="button" onClick={nextStep}
                                                    whileHover={{ scale:1.03, boxShadow:'0 14px 36px rgba(30,77,92,0.3)' }}
                                                    whileTap={{ scale:0.97 }}
                                                    style={{
                                                        flex:2, padding:'12px', borderRadius:12, border:'none',
                                                        fontWeight:700, color:'white', fontSize:15, cursor:'pointer',
                                                        background:'linear-gradient(135deg,#1e4d5c 0%,#2a7a6a 100%)',
                                                        fontFamily:'inherit',
                                                        boxShadow:'0 6px 20px rgba(30,77,92,0.28)',
                                                    }}
                                                >
                                                    {step === 0 ? 'Continue →' : 'Next →'}
                                                </motion.button>
                                            ) : (
                                                <motion.button type="submit" disabled={loading}
                                                    whileHover={!loading?{ scale:1.03, boxShadow:'0 14px 36px rgba(30,77,92,0.35)' }:{}}
                                                    whileTap={!loading?{ scale:0.97 }:{}}
                                                    style={{
                                                        flex:2, padding:'12px', borderRadius:12, border:'none',
                                                        fontWeight:700, color:'white', fontSize:15,
                                                        cursor:loading?'not-allowed':'pointer',
                                                        background:loading?'#7a9aaa':'linear-gradient(135deg,#1e4d5c 0%,#2a7a6a 100%)',
                                                        fontFamily:'inherit',
                                                        boxShadow:loading?'none':'0 6px 20px rgba(30,77,92,0.28)',
                                                    }}
                                                >
                                                    {loading ? (
                                                        <span style={{ display:'flex', alignItems:'center',
                                                            justifyContent:'center', gap:8 }}>
                                                            <motion.span
                                                                animate={{ rotate:360 }}
                                                                transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                                                                style={{ display:'inline-block', width:14, height:14,
                                                                    border:'2px solid rgba(255,255,255,0.4)',
                                                                    borderTopColor:'white', borderRadius:'50%' }}
                                                            />
                                                            Creating account...
                                                        </span>
                                                    ) : '🎉 Create Account'}
                                                </motion.button>
                                            )}
                                        </div>
                                    </form>

                                    {/* Footer link */}
                                    <p style={{ textAlign:'center', color:T.sub, fontSize:13, marginTop:18 }}>
                                        Already have an account?{' '}
                                        <Link to="/login" style={{ color:T.link, fontWeight:700, textDecoration:'none' }}>
                                            Login
                                        </Link>
                                    </p>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
