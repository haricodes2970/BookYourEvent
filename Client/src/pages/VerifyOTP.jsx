import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');

    // If no email in URL, redirect to register
    useEffect(() => {
        if (!email) navigate('/register');
    }, [email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid OTP');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg,#c8e6f0 0%,#d9eff5 30%,#eef5f0 60%,#f5efe6 100%)',
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <div style={{
                background: 'rgba(255,252,245,0.9)', backdropFilter: 'blur(14px)',
                borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420,
                border: '1px solid rgba(200,185,160,0.4)',
                boxShadow: '0 24px 56px rgba(30,77,92,0.14)',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>📧</div>
                <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.75rem', fontWeight: 900,
                    color: '#1e293b', marginBottom: 8,
                }}>Verify Your Email</h2>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                    We sent a 6-digit OTP to <strong>{email}</strong>
                </p>

                {success ? (
                    <div>
                        <div style={{ fontSize: 48 }}>🎉</div>
                        <p style={{ color: '#1e4d5c', fontWeight: 700, marginTop: 12 }}>
                            Email verified! Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#ef4444', padding: '10px 14px',
                                borderRadius: 10, marginBottom: 16, fontSize: 13,
                            }}>{error}</div>
                        )}

                        <input
                            type="text"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            required
                            style={{
                                width: '100%', padding: '14px',
                                borderRadius: 12, border: '2px solid rgba(100,120,140,0.28)',
                                fontSize: 22, textAlign: 'center', letterSpacing: 10,
                                fontFamily: 'inherit', outline: 'none',
                                marginBottom: 16, boxSizing: 'border-box',
                            }}
                        />

                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '13px', borderRadius: 12,
                            border: 'none', fontWeight: 700, color: 'white',
                            fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                            background: loading ? '#7a9aaa' : 'linear-gradient(135deg,#1e4d5c 0%,#2a7a6a 100%)',
                            fontFamily: 'inherit',
                        }}>
                            {loading ? 'Verifying...' : 'Verify OTP ✓'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VerifyOTP;