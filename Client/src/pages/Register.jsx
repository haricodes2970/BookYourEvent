import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, verifyOTP } from '../services/authService';

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

const Register = () => {
    const [step, setStep] = useState(1); // 1 = form, 2 = otp
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'booker' });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await registerUser(formData);
            setStep(2);
            setSuccess(`OTP sent to ${formData.email}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOTP(formData.email, otp);
            setSuccess('Email verified! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen relative overflow-hidden flex flex-col">
            <Background />
            <Navbar />
            <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-24">
                <div className="w-full" style={{ maxWidth: '420px' }}>
                    <div className="rounded-2xl p-8 shadow-2xl"
                        style={{ background: 'rgba(255,252,245,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(200,185,160,0.4)' }}>

                        <div className="flex justify-center mb-4">
                            <img src="/logo.png" alt="BYE Logo" className="h-20 w-20 rounded-full object-cover shadow-md"
                                onError={(e)=>{e.target.style.display='none'}}/>
                        </div>

                        {/* Step 1 — Registration Form */}
                        {step === 1 && (
                            <>
                                <h2 className="text-3xl font-bold text-slate-800 text-center mb-1">Create Account</h2>
                                <p className="text-center text-slate-500 text-sm italic mb-5">EASY. BOOK. ENJOY.</p>

                                {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name"
                                            className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-2 focus:outline-none focus:border-slate-600 transition text-sm" required/>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone"
                                            className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-2 focus:outline-none focus:border-slate-600 transition text-sm" required/>
                                    </div>
                                    <div className="relative">
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email"
                                            className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-2 pr-8 focus:outline-none focus:border-slate-600 transition text-sm" required/>
                                        <span className="absolute right-2 top-2 text-slate-400 text-sm">✉</span>
                                    </div>
                                    <select name="role" value={formData.role} onChange={handleChange}
                                        className="w-full border-b-2 border-slate-300 bg-transparent text-slate-600 py-2 focus:outline-none focus:border-slate-600 transition text-sm">
                                        <option value="booker">I want to Book a Venue</option>
                                        <option value="venueOwner">I want to List my Venue</option>
                                    </select>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password"
                                            className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-2 focus:outline-none focus:border-slate-600 transition text-sm" required/>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm"
                                            className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-2 focus:outline-none focus:border-slate-600 transition text-sm" required/>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full py-3 rounded-lg font-semibold text-white transition mt-1"
                                        style={{ background: loading ? '#7a9aaa' : '#1e4d5c' }}>
                                        {loading ? 'Sending OTP...' : 'Create Account'}
                                    </button>
                                </form>

                                <p className="text-center text-slate-500 text-sm mt-4">
                                    Already have an account?{' '}
                                    <Link to="/login" className="font-bold text-slate-700 hover:text-slate-900 transition">Login</Link>
                                </p>
                            </>
                        )}

                        {/* Step 2 — OTP Verification */}
                        {step === 2 && (
                            <>
                                <h2 className="text-2xl font-bold text-slate-800 text-center mb-1">Verify Email</h2>
                                <p className="text-center text-slate-500 text-sm mb-2">OTP sent to</p>
                                <p className="text-center font-semibold text-slate-700 text-sm mb-5">{formData.email}</p>

                                {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
                                {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm text-center">{success}</div>}

                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e)=>setOtp(e.target.value)}
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        className="w-full border-b-2 border-slate-300 bg-transparent text-slate-700 placeholder-slate-400 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-slate-600 transition"
                                        required
                                    />
                                    <button type="submit" disabled={loading}
                                        className="w-full py-3 rounded-lg font-semibold text-white transition"
                                        style={{ background: loading ? '#7a9aaa' : '#1e4d5c' }}>
                                        {loading ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                </form>

                                <button onClick={()=>{ setStep(1); setError(''); setSuccess(''); }}
                                    className="w-full text-center text-slate-400 text-sm mt-4 hover:text-slate-600 transition">
                                    ← Back to Register
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;