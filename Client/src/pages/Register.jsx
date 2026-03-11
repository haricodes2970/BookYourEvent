import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, verifyOTP } from '../services/authService';
import { useAuth } from '../context/AuthContext';

/**
 * FIX: Account is only usable after OTP is verified.
 * Flow:
 *  1. User fills form → hits Register → backend creates user with isVerified: false
 *  2. OTP modal appears → user MUST enter correct OTP
 *  3. Only after verifyOTP succeeds → login() is called and user is redirected
 *  4. Closing the modal WITHOUT verifying = account exists but user stays on /register
 *     and must re-enter email to re-trigger OTP (or login will reject unverified users)
 */

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'booker' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Step 1: Register ──────────────────────────────────────────────────
  const handleRegister = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      await registerUser(form);
      setStep('otp'); // Show OTP modal — DO NOT login yet
    } catch (e) {
      setError(e?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    setOtpError('');
    if (!otp || otp.length < 4) {
      setOtpError('Enter the OTP sent to your email.'); return;
    }
    setLoading(true);
    try {
      const data = await verifyOTP(form.email, otp);
      // Only NOW do we log the user in
      login(data.user, data.token);
      navigate(data.user.role === 'venueOwner' ? '/owner/dashboard' : '/booker/dashboard');
    } catch (e) {
      setOtpError(e?.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Styles (matches your existing inline-style pattern) ───────────────
  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', background: '#f8fafc',
    fontSize: 14, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', color: '#0f172a',
  };
  const btnStyle = {
    width: '100%', padding: '13px', borderRadius: 12,
    background: loading ? '#94a3b8' : '#16a34a',
    border: 'none', color: 'white', fontWeight: 700,
    fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f6fa', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>

        {/* ── STEP 1: Register form ────────────────────────────────── */}
        {step === 'form' && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Create Account</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Join BookYourEvent today</p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>Password</label>
                <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>Phone (optional)</label>
                <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>I am a</label>
                <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="booker">Booker — I want to book venues</option>
                  <option value="venueOwner">Venue Owner — I want to list venues</option>
                </select>
              </div>

              <button onClick={handleRegister} disabled={loading} style={btnStyle}>
                {loading ? 'Registering...' : 'Register →'}
              </button>
            </div>

            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 20 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
            </p>
          </>
        )}

        {/* ── STEP 2: OTP Verification ─────────────────────────────── */}
        {step === 'otp' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Verify your email</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                We sent a 6-digit OTP to <strong>{form.email}</strong>.<br />
                Enter it below to activate your account.
              </p>
            </div>

            {otpError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
                {otpError}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 8 }}>OTP Code</label>
              <input
                style={{ ...inputStyle, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: '8px' }}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="------"
                maxLength={6}
                autoFocus
              />
            </div>

            <button onClick={handleVerifyOTP} disabled={loading} style={btnStyle}>
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>

            {/* NOTE: No close/skip button — user MUST verify to proceed */}
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 16 }}>
              Didn't receive it?{' '}
              <button
                onClick={async () => {
                  try {
                    await registerUser({ ...form, resendOtp: true });
                    setOtpError('');
                  } catch { setOtpError('Could not resend OTP'); }
                }}
                style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0 }}>
                Resend OTP
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
