import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col" style={{
            background: 'linear-gradient(180deg, #c8e6f0 0%, #ddeef5 25%, #eef5f0 50%, #f5efe6 75%, #f0e8d5 100%)'
        }}>
            {/* Birds Left */}
            <svg className="absolute top-24 left-12 opacity-35 z-0 pointer-events-none" width="200" height="90" viewBox="0 0 200 90">
                <path d="M10 45 Q26 28 42 45 Q26 36 10 45Z" fill="#4a7a8a"/>
                <path d="M52 26 Q68 10 84 26 Q68 18 52 26Z" fill="#4a7a8a" opacity="0.8"/>
                <path d="M95 48 Q111 31 127 48 Q111 39 95 48Z" fill="#4a7a8a" opacity="0.7"/>
                <path d="M20 64 Q36 47 52 64 Q36 55 20 64Z" fill="#4a7a8a" opacity="0.5"/>
                <path d="M68 68 Q84 51 100 68 Q84 59 68 68Z" fill="#4a7a8a" opacity="0.4"/>
            </svg>

            {/* Birds Right */}
            <svg className="absolute top-16 right-12 opacity-35 z-0 pointer-events-none" width="180" height="80" viewBox="0 0 180 80">
                <path d="M140 35 Q156 19 172 35 Q156 27 140 35Z" fill="#4a7a8a"/>
                <path d="M105 48 Q121 32 137 48 Q121 40 105 48Z" fill="#4a7a8a" opacity="0.8"/>
                <path d="M148 58 Q164 42 180 58 Q164 50 148 58Z" fill="#4a7a8a" opacity="0.6"/>
                <path d="M80 34 Q96 18 112 34 Q96 26 80 34Z" fill="#4a7a8a" opacity="0.5"/>
            </svg>

            {/* Extra birds center-far */}
            <svg className="absolute top-48 left-1/3 opacity-15 z-0 pointer-events-none" width="140" height="60" viewBox="0 0 140 60">
                <path d="M10 30 Q22 18 34 30 Q22 24 10 30Z" fill="#6a9ab8"/>
                <path d="M44 18 Q56 6 68 18 Q56 12 44 18Z" fill="#6a9ab8" opacity="0.8"/>
                <path d="M78 34 Q90 22 102 34 Q90 28 78 34Z" fill="#6a9ab8" opacity="0.6"/>
            </svg>

            {/* Mountain silhouette */}
            <svg className="absolute bottom-36 left-0 right-0 w-full opacity-15 z-0 pointer-events-none" viewBox="0 0 1440 220" preserveAspectRatio="none">
                <path d="M0 220 L180 90 L360 150 L540 70 L720 130 L900 55 L1080 115 L1260 75 L1440 100 L1440 220Z" fill="#7a9aaa"/>
            </svg>

            {/* Wildflowers Bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#a8c5d4" opacity="0.3"/>
                    <path d="M0 180 Q220 130 440 155 Q660 120 880 148 Q1100 125 1320 142 L1440 138 L1440 180Z" fill="#88b5c8" opacity="0.25"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={125+(i%5)*8} stroke="#7aaabb" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={117+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)}
                                fill={['#b8d8ec','#c8dff0','#d4c8e0','#c0d8e8','#d8e8c0','#e8d4b8'][i%6]} opacity="0.75"/>
                            {i%4===0 && <ellipse cx={x+9} cy={112+(i%4)*9} rx="4" ry="7" fill="#d0b8dc" opacity="0.5"/>}
                        </g>
                    ))}
                </svg>
            </div>

            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 text-xs italic z-10 tracking-widest pointer-events-none">
                EASY. BOOK. ENJOY.
            </p>

            {/* ── NAVBAR ── */}
            <nav className="relative z-10 flex justify-between items-center px-8 py-4">
                <img src="/logo.png" alt="BookYourEvent" className="h-14 w-14 rounded-full object-cover shadow-md"
                    onError={(e)=>{e.target.style.display='none'}}/>
                <div className="hidden md:flex items-center gap-8">
                    <a href="#" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">Home</a>
                    <a href="#about" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">About</a>
                    <a href="#services" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">Services</a>
                    <a href="#contact" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">Contact</a>
                    <button onClick={()=>navigate('/login')}
                        className="border-2 border-slate-700 text-slate-700 px-6 py-2 rounded text-sm font-semibold hover:bg-slate-700 hover:text-white transition">
                        Login
                    </button>
                </div>
            </nav>

            {/* ── HERO SECTION ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8 pb-48 pt-8">

                {/* Badge */}
                <div className="mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
                    style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(200,185,160,0.4)', color: '#7a8a6a' }}>
                    🌿 Bangalore's Premier Venue Platform
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl font-bold text-slate-700 mb-4 leading-tight">
                    The Moment Where <br/>
                    <span style={{ color: '#1e4d5c' }}>Memory Begins🌿...</span>
                </h1>

                {/* Subheadline */}
                <p className="text-slate-500 text-lg mb-8 max-w-xl leading-relaxed">
                    From intimate gatherings to grand celebrations — discover, book, and manage venues with ease.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4 mb-16">
                    <button onClick={()=>navigate('/register')}
                        className="px-8 py-3.5 rounded-xl font-semibold text-white shadow-lg transition hover:shadow-xl hover:-translate-y-0.5"
                        style={{ background: '#1e4d5c' }}>
                        Browse Venues →
                    </button>
                    <button onClick={()=>navigate('/register')}
                        className="px-8 py-3.5 rounded-xl font-semibold transition hover:shadow-md"
                        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(200,185,160,0.5)', color: '#4a5a6a' }}>
                        List Your Venue
                    </button>
                </div>

                {/* Stats Row */}
                <div className="flex gap-12">
                    {[
                        { number: '500+', label: 'Venues Listed' },
                        { number: '2000+', label: 'Events Booked' },
                        { number: '98%', label: 'Happy Customers' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <p className="text-2xl font-bold text-slate-700">{stat.number}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── ABOUT SECTION ── */}
            <div id="about" className="relative z-10 px-8 py-16 text-center"
                style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)' }}>
                <h2 className="text-3xl font-bold text-slate-700 mb-3">About BookYourEvent</h2>
                <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
                    BookYourEvent is Bangalore's most trusted venue booking platform. We connect event planners with venue owners — making the entire process seamless, transparent, and stress-free. Whether you're planning a wedding, corporate event, or birthday party, we've got the perfect space for you.
                </p>
            </div>

            {/* ── SERVICES SECTION ── */}
            <div id="services" className="relative z-10 px-8 py-16">
                <h2 className="text-3xl font-bold text-slate-700 text-center mb-10">Our Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {[
                        { emoji: '🔍', title: 'Discover Venues', desc: 'Browse hundreds of verified venues across Bangalore. Filter by type, capacity, price, and amenities.' },
                        { emoji: '📅', title: 'Instant Booking', desc: 'Book your venue in minutes. Real-time availability, transparent pricing, no hidden charges.' },
                        { emoji: '🏛️', title: 'List Your Venue', desc: 'Own a venue? List it for free and reach thousands of event planners looking for the perfect space.' },
                    ].map((s, i) => (
                        <div key={i} className="rounded-2xl p-6 text-center transition hover:shadow-lg hover:-translate-y-0.5"
                            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(200,185,160,0.3)', backdropFilter: 'blur(8px)' }}>
                            <div className="text-4xl mb-4">{s.emoji}</div>
                            <h3 className="text-slate-700 font-bold text-lg mb-2">{s.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── HOW IT WORKS ── */}
            <div className="relative z-10 px-8 py-16 text-center"
                style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)' }}>
                <h2 className="text-3xl font-bold text-slate-700 mb-10">How It Works</h2>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
                    {[
                        { step: '01', title: 'Create Account', desc: 'Sign up as a booker or venue owner in seconds.' },
                        { step: '02', title: 'Find Your Venue', desc: 'Browse and filter venues that match your needs.' },
                        { step: '03', title: 'Book & Enjoy', desc: 'Send a booking request and celebrate!' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="rounded-2xl p-6 w-52 text-center"
                                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(200,185,160,0.3)' }}>
                                <p className="text-3xl font-bold mb-2" style={{ color: '#1e4d5c' }}>{item.step}</p>
                                <p className="text-slate-700 font-bold text-sm mb-1">{item.title}</p>
                                <p className="text-slate-400 text-xs">{item.desc}</p>
                            </div>
                            {i < 2 && <span className="text-slate-300 text-2xl hidden md:block">→</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CONTACT SECTION ── */}
            <div id="contact" className="relative z-10 px-8 py-16 text-center">
                <h2 className="text-3xl font-bold text-slate-700 mb-3">Get In Touch</h2>
                <p className="text-slate-400 text-sm mb-6">Have questions? We'd love to hear from you.</p>
                <div className="flex justify-center gap-6 flex-wrap">
                    {[
                        { icon: '📧', label: 'hello@bookyourevent.in' },
                        { icon: '📞', label: '+91 98765 43210' },
                        { icon: '📍', label: 'Bangalore, Karnataka' },
                    ].map((c, i) => (
                        <div key={i} className="flex items-center gap-2 px-5 py-3 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(200,185,160,0.3)' }}>
                            <span>{c.icon}</span>
                            <span className="text-slate-500 text-sm">{c.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="relative z-10 px-8 py-6 flex justify-between items-center pb-16"
                style={{ borderTop: '1px solid rgba(200,185,160,0.3)' }}>
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="BYE" className="h-10 w-10 rounded-full object-cover"
                        onError={(e)=>{e.target.style.display='none'}}/>
                    <div>
                        <p className="text-slate-600 font-bold text-sm">BookYourEvent</p>
                        <p className="text-slate-400 text-xs">© 2026 All rights reserved</p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <button onClick={()=>navigate('/login')} className="text-slate-400 hover:text-slate-600 text-sm transition">Login</button>
                    <button onClick={()=>navigate('/register')} className="text-slate-400 hover:text-slate-600 text-sm transition">Register</button>
                    <a href="#about" className="text-slate-400 hover:text-slate-600 text-sm transition">About</a>
                    <a href="#contact" className="text-slate-400 hover:text-slate-600 text-sm transition">Contact</a>
                </div>
            </div>
        </div>
    );
};

export default Home;