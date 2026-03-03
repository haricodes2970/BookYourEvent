import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Background = () => (
    <>
        <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(180deg, #c8e6f0 0%, #ddeef5 25%, #eef5f0 50%, #f5efe6 75%, #f0e8d5 100%)' }} />
        <svg className="absolute top-16 left-1/4 opacity-40 z-0" width="100" height="50" viewBox="0 0 120 60">
            <path d="M10 30 Q20 20 30 30 Q20 25 10 30Z" fill="#5a7a8a" opacity="0.6"/>
            <path d="M35 20 Q45 10 55 20 Q45 15 35 20Z" fill="#5a7a8a" opacity="0.5"/>
            <path d="M60 35 Q70 25 80 35 Q70 30 60 35Z" fill="#5a7a8a" opacity="0.4"/>
        </svg>
        <svg className="absolute top-12 right-1/4 opacity-40 z-0" width="100" height="50" viewBox="0 0 120 60">
            <path d="M90 25 Q100 15 110 25 Q100 20 90 25Z" fill="#5a7a8a" opacity="0.6"/>
            <path d="M65 35 Q75 25 85 35 Q75 30 65 35Z" fill="#5a7a8a" opacity="0.5"/>
        </svg>
        <svg className="absolute bottom-24 left-0 right-0 w-full opacity-20 z-0" viewBox="0 0 1440 200" preserveAspectRatio="none">
            <path d="M0 200 L200 80 L400 140 L600 60 L800 120 L1000 50 L1200 110 L1440 70 L1440 200Z" fill="#7a9aaa"/>
        </svg>
        <div className="absolute bottom-0 left-0 right-0 z-0 opacity-70">
            <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="w-full">
                <path d="M0 140 Q100 90 200 115 Q300 75 400 108 Q500 82 600 115 Q700 90 800 108 Q900 75 1000 100 Q1100 82 1200 108 Q1300 90 1440 100 L1440 140Z" fill="#8fae88" opacity="0.4"/>
                <path d="M0 140 Q120 108 240 124 Q360 100 480 120 Q600 105 720 122 Q840 108 960 120 Q1080 108 1200 122 Q1320 110 1440 120 L1440 140Z" fill="#6a9468" opacity="0.5"/>
                {[60,150,280,380,500,620,750,860,980,1100,1220,1350].map((x,i) => (
                    <g key={i}>
                        <line x1={x} y1="140" x2={x} y2={105+(i%3)*8} stroke="#6a8a65" strokeWidth="2" opacity="0.7"/>
                        <ellipse cx={x} cy={100+(i%3)*8} rx="7" ry="10" fill={['#c9a96e','#b8b0d8','#d4a5a5','#a8c5a0'][i%4]} opacity="0.8"/>
                    </g>
                ))}
            </svg>
        </div>
    </>
);

const Navbar = () => (
    <nav className="relative z-10 flex justify-between items-center px-8 py-4">
        <img src="/logo.png" alt="BookYourEvent" className="h-14 w-14 rounded-full object-cover shadow-md" onError={(e)=>{e.target.style.display='none'}}/>
        <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">Home</a>
            <a href="#" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">About</a>
            <a href="#" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">Services</a>
            <a href="#" className="text-slate-600 hover:text-slate-800 font-medium transition text-sm">Contact</a>
            <Link to="/login" className="border-2 border-slate-700 text-slate-700 px-6 py-2 rounded text-sm font-semibold hover:bg-slate-700 hover:text-white transition">Login</Link>
        </div>
    </nav>
);

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginUser(formData);
            login(data.user, data.token);
            if (data.user.role === 'booker') navigate('/booker/dashboard');
            else if (data.user.role === 'venueOwner') navigate('/owner/dashboard');
            else if (data.user.role === 'admin') navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API}/auth/google`;
    };

    return (
        <div className="h-screen relative overflow-hidden flex flex-col">
            <Background />
            <Navbar />
            <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-24">
                <div className="w-full" style={{ maxWidth: '420px' }}>
                    <div className="rounded-2xl p-8 shadow-2xl" style={{ background: 'rgba(255,252,245,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(200,185,160,0.4)' }}>

                        <div className="flex justify-center mb-4">
                            <img src="/logo.png" alt="BYE Logo" className="h-20 w-20 rounded-full object-cover shadow-md" onError={(e)=>{e.target.style.display='none'}}/>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 text-center mb-1">Login</h2>
                        <p className="text-center text-slate-500 text-sm italic mb-6">EASY. BOOK. ENJOY.</p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm text-center">{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="relative">
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email"
                                    className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-2 pr-8 focus:outline-none focus:border-slate-600 transition text-sm" required/>
                                <span className="absolute right-2 top-2 text-slate-400 text-sm">✉</span>
                            </div>

                            <div className="relative">
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password"
                                    className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-2 pr-8 focus:outline-none focus:border-slate-600 transition text-sm" required/>
                                <span className="absolute right-2 top-2 text-slate-400 text-sm">🔒</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} className="accent-slate-600"/>
                                    <span className="text-slate-500 text-xs">Remember me</span>
                                </label>
                                <a href="#" className="text-slate-500 text-xs hover:text-slate-700 transition">Forgot Password?</a>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold text-white transition"
                                style={{ background: loading ? '#7a9aaa' : '#1e4d5c' }}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-slate-200"/>
                            <span className="text-slate-400 text-xs">or</span>
                            <div className="flex-1 h-px bg-slate-200"/>
                        </div>

                        {/* Google Login Button */}
                        <button onClick={handleGoogleLogin}
                            className="w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                            style={{ background: 'white', color: '#444' }}>
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-3-11.4-7.3l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
                                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
                            </svg>
                            Continue with Google
                        </button>

                        <p className="text-center text-slate-500 text-sm mt-5">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-slate-700 hover:text-slate-900 transition">Register</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;