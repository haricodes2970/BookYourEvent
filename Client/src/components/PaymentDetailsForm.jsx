import { useState, useEffect } from 'react';
import { getMe, savePaymentDetails } from '../services/authService';

/* ══════════════════════════════════════
   PaymentDetailsForm
   Shows as a banner in OwnerDashboard
   if owner hasn't added payment details yet
══════════════════════════════════════ */
const PaymentDetailsForm = ({ dark = false, onSaved }) => {
    const [paymentType, setPaymentType] = useState('upi');
    const [upiId,       setUpiId]       = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNo,   setAccountNo]   = useState('');
    const [ifsc,        setIfsc]        = useState('');
    const [bankName,    setBankName]    = useState('');
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState('');
    const [success,     setSuccess]     = useState('');
    const [existing,    setExisting]    = useState(null);
    const [collapsed,   setCollapsed]   = useState(false);

    useEffect(() => {
        getMe().then(data => {
            const pd = data.user?.paymentDetails;
            if (pd?.paymentType) {
                setExisting(pd);
                setCollapsed(true); // already filled — collapse by default
                setPaymentType(pd.paymentType);
                setUpiId(pd.upiId || '');
                setAccountName(pd.accountName || '');
                setAccountNo(pd.accountNo || '');
                setIfsc(pd.ifsc || '');
                setBankName(pd.bankName || '');
            }
        }).catch(() => {});
    }, []);

    const G  = dark ? '#D4AF37' : '#C8A45B';
    const GL = dark ? 'rgba(212,175,55,0.1)' : 'rgba(200,164,91,0.08)';
    const GB = dark ? 'rgba(212,175,55,0.3)' : 'rgba(200,164,91,0.3)';
    const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
    const border = dark ? '#2a2a2a' : '#E6E2D9';
    const text   = dark ? '#F3F3F3' : '#1F1F1F';
    const sub    = dark ? '#9a9a9a' : '#6b7280';

    const inp = {
        width: '100%', background: 'transparent',
        borderBottom: `2px solid ${GB}`,
        color: text, padding: '8px 4px', fontSize: 14,
        outline: 'none', fontFamily: 'inherit', caretColor: G,
        border: 'none',
    };

    const handleSubmit = async () => {
        setLoading(true); setError(''); setSuccess('');
        try {
            const payload = paymentType === 'upi'
                ? { paymentType, upiId }
                : { paymentType, accountName, accountNo, ifsc, bankName };

            await savePaymentDetails(payload);
            setSuccess('✅ Payment details saved! You will receive payouts here.');
            setExisting(payload);
            setCollapsed(true);
            onSaved?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save details');
        } finally { setLoading(false); }
    };

    /* ── Already filled + collapsed ── */
    if (existing?.paymentType && collapsed) {
        return (
            <div style={{
                background: dark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.05)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 16, padding: '14px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22 }}>✅</span>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Payment details saved</p>
                        <p style={{ fontSize: 12, color: sub }}>
                            {existing.paymentType === 'upi'
                                ? `UPI: ${existing.upiId}`
                                : `Bank: ${existing.bankName} — ${existing.accountNo?.slice(-4).padStart(existing.accountNo?.length, '*')}`
                            }
                        </p>
                    </div>
                </div>
                <button onClick={() => setCollapsed(false)}
                    style={{ background: GL, border: `1px solid ${GB}`, color: G,
                        borderRadius: 50, padding: '5px 14px', fontSize: 12,
                        fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Edit
                </button>
            </div>
        );
    }

    return (
        <div style={{
            background: existing ? cardBg : dark ? 'rgba(234,179,8,0.06)' : 'rgba(234,179,8,0.05)',
            border: `1px solid ${existing ? border : 'rgba(234,179,8,0.3)'}`,
            borderRadius: 16, padding: '20px 24px', marginBottom: 20,
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>{existing ? '✏️' : '⚠️'}</span>
                <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: existing ? text : '#b45309' }}>
                        {existing ? 'Update Payment Details' : 'Add Your Payment Details'}
                    </p>
                    <p style={{ fontSize: 12, color: sub }}>
                        {existing
                            ? 'Your payout will be sent here after each confirmed booking'
                            : 'Required to receive your earnings from bookings — add before your first booking gets confirmed'
                        }
                    </p>
                </div>
            </div>

            {/* Toggle UPI / Bank */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['upi', 'bank'].map(type => (
                    <button key={type} onClick={() => setPaymentType(type)}
                        style={{
                            padding: '7px 20px', borderRadius: 50, fontSize: 12,
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                            background: paymentType === type
                                ? 'linear-gradient(135deg,#C8A45B,#E3C67A)' : GL,
                            border: `1.5px solid ${paymentType === type ? 'transparent' : GB}`,
                            color: paymentType === type ? 'white' : G,
                            transition: 'all 0.2s',
                        }}>
                        {type === 'upi' ? '📱 UPI ID' : '🏦 Bank Account'}
                    </button>
                ))}
            </div>

            {/* UPI Form */}
            {paymentType === 'upi' && (
                <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: G, marginBottom: 6, letterSpacing: '1px', textTransform: 'uppercase' }}>UPI ID</p>
                    <input
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@upi or yourname@paytm"
                        style={inp}
                    />
                    <p style={{ fontSize: 11, color: sub, marginTop: 4 }}>
                        e.g. 9876543210@ybl · name@paytm · name@okaxis
                    </p>
                </div>
            )}

            {/* Bank Form */}
            {paymentType === 'bank' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    {[
                        { label: 'Account Holder Name', val: accountName, set: setAccountName, placeholder: 'Full name as per bank' },
                        { label: 'Account Number',      val: accountNo,   set: setAccountNo,   placeholder: '000000000000' },
                        { label: 'IFSC Code',           val: ifsc,        set: setIfsc,        placeholder: 'SBIN0001234' },
                        { label: 'Bank Name',           val: bankName,    set: setBankName,    placeholder: 'SBI / HDFC / ICICI...' },
                    ].map((field, i) => (
                        <div key={i}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: G, marginBottom: 6, letterSpacing: '1px', textTransform: 'uppercase' }}>
                                {field.label}
                            </p>
                            <input
                                value={field.val}
                                onChange={e => field.set(e.target.value)}
                                placeholder={field.placeholder}
                                style={inp}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Alerts */}
            {error   && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 10 }}>{error}</p>}
            {success && <p style={{ fontSize: 12, color: '#16a34a', marginBottom: 10 }}>{success}</p>}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSubmit} disabled={loading}
                    style={{
                        padding: '10px 28px', borderRadius: 50, border: 'none',
                        background: loading ? '#9a8a6a' : 'linear-gradient(135deg,#C8A45B,#E3C67A)',
                        color: 'white', fontWeight: 700, fontSize: 13,
                        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                        boxShadow: loading ? 'none' : '0 6px 18px rgba(200,164,91,0.3)',
                    }}>
                    {loading ? 'Saving...' : existing ? 'Update Details' : 'Save Payment Details'}
                </button>
                {existing && (
                    <button onClick={() => setCollapsed(true)}
                        style={{ padding: '10px 20px', borderRadius: 50, background: 'transparent',
                            border: `1.5px solid ${border}`, color: sub, fontWeight: 600,
                            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Cancel
                    </button>
                )}
            </div>

            <p style={{ fontSize: 11, color: sub, marginTop: 12 }}>
                🔒 Your details are stored securely and only used for payout transfers by the platform admin.
            </p>
        </div>
    );
};

export default PaymentDetailsForm;
