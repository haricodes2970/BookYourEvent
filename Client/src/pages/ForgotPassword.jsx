import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=email, 2=otp+newpass
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API}/auth/forgot-password`, { email });
            setStep(2);
            setSuccess('OTP sent to your email!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword)
            return setError('Passwords do not match');
        if (newPassword.length < 6)
            return setError('Password must be at least 6 characters');
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API}/auth/reset-password`, { email, otp, newPassword });
            setSuccess('Password reset successful!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{
            background: 'linear-gradient(180deg, #b8dff0 0%, #cce8f4 20%, #dff0f8 45%, #eef7fb 70%, #f5fafd 100%)'
        }}>
            {/* Birds */}
            <svg className="absolute top-20 left-16 opacity-25 z-0 pointer-events-none" width="180" height="80" viewBox="0 0 180 80">
                <path d="M10 40 Q24 26 38 40 Q24 33 10 40Z" fill="#4a8aaa"/>
                <path d="M48 25 Q62 12 76 25 Q62 18 48 25Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.7"/>
            </svg>
            <svg className="absolute top-14 right-24 opacity-25 z-0 pointer-events-none" width="160" height="70" viewBox="0 0 160 70">
                <path d="M120 30 Q134 17 148 30 Q134 23 120 30Z" fill="#4a8aaa"/>
                <path d="M85 42 Q99 29 113 42 Q99 35 85 42Z" fill="#4a8aaa" opacity="0.8"/>
                <path d="M130 52 Q144 39 158 52 Q144 45 130 52Z" fill="#4a8aaa" opacity="0.6"/>
            </svg>

            {/* Wildflowers */}
            <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
                <svg viewBox="0 0 1440 180" preserveAspectRatio="none" className="w-full">
                    <path d="M0 180 Q180 110 360 145 Q540 100 720 138 Q900 105 1080 135 Q1260 108 1440 128 L1440 180Z" fill="#a8d4e8" opacity="0.25"/>
                    {[30,90,160,240,320,400,490,570,650,730,820,900,990,1070,1150,1230,1310,1390].map((x,i)=>(
                        <g key={i}>
                            <line x1={x} y1="180" x2={x-((i%3)-1)*4} y2={130+(i%5)*8} stroke="#7aaabb" strokeWidth="1.5" opacity="0.5"/>
                            <ellipse cx={x-((i%3)-1)*4} cy={122+(i%5)*8} rx={5+(i%3)} ry={9+(i%3)}
                                fill={['#b8d8ec','#c8dff0','#d4c8e0','#c0d8e8','#d8e8c0','#e8d4b8'][i%6]} opacity="0.7"/>
                        </g>
                    ))}
                </svg>
            </div>

            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 text-xs italic z-10 tracking-widest pointer-events-none">
                EASY. BOOK. ENJOY.
            </p>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl p-8 shadow-xl"
                style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)' }}>

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src="/logo.png" alt="BYE" className="h-16 w-16 rounded-full object-cover shadow-md cursor-pointer"
                        onClick={() => navigate('/')}
                        onError={(e)=>{e.target.style.display='none'}}/>
                </div>

                <h2 className="text-2xl font-bold text-slate-700 text-center mb-1">
                    {step === 1 ? 'Forgot Password' : 'Reset Password'}
                </h2>
                <p className="text-slate-400 text-sm text-center italic mb-6">EASY. BOOK. ENJOY.</p>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(74,138,170,0.2)', color: '#4a8aaa', border: '2px solid #4a8aaa' }}>1</div>
                    <div className="w-8 h-0.5" style={{ background: step === 2 ? '#4a8aaa' : 'rgba(150,200,220,0.3)' }}/>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={step === 2
                            ? { background: 'rgba(74,138,170,0.2)', color: '#4a8aaa', border: '2px solid #4a8aaa' }
                            : { background: 'rgba(150,200,220,0.1)', color: '#94a3b8', border: '2px solid rgba(150,200,220,0.3)' }}>2</div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-500 px-4 py-2 rounded-xl mb-4 text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-xl mb-4 text-sm">{success}</div>}

                {/* Step 1 — Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-5">
                        <div>
                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Email Address</label>
                            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm" required/>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white transition"
                            style={{ background: loading ? '#7a9aaa' : '#1e4d5c' }}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                        <p className="text-center text-sm text-slate-500">
                            Remember your password?{' '}
                            <button type="button" onClick={()=>navigate('/login')} className="font-bold text-slate-700 hover:underline">
                                Login
                            </button>
                        </p>
                    </form>
                )}

                {/* Step 2 — OTP + New Password */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">OTP Code</label>
                            <input type="text" value={otp} onChange={(e)=>setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP" maxLength={6}
                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm text-center tracking-widest text-lg" required/>
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">New Password</label>
                            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm" required/>
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}
                                placeholder="Repeat new password"
                                className="w-full border-b-2 border-slate-200 bg-transparent text-slate-700 placeholder-slate-300 py-2 focus:outline-none focus:border-blue-400 transition text-sm" required/>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3 rounded-xl font-semibold text-white transition"
                            style={{ background: loading ? '#7a9aaa' : '#1e4d5c' }}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button type="button" onClick={()=>setStep(1)}
                            className="w-full text-sm text-slate-400 hover:text-slate-600 transition">
                            ← Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;