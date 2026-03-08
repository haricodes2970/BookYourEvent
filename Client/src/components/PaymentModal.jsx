import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PaymentModal = ({ isOpen, onClose, bookingData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const commission = bookingData?.totalPrice >= 10000 ? 8 : 5;
    const platformFee = Math.round((bookingData?.totalPrice || 0) * commission / 100);
    const ownerAmount = (bookingData?.totalPrice || 0) - platformFee;

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    const handlePayment = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');

            // Step 1 — create order on backend
            const { data } = await axios.post(
                `${API}/payments/create-order`,
                bookingData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Step 2 — open Razorpay checkout
            const options = {
                key:         data.key,
                amount:      data.amount,
                currency:    data.currency,
                order_id:    data.orderId,
                name:        'BookYourEvent',
                description: `Booking for ${bookingData.venueName || 'venue'}`,
                theme:       { color: '#1e4d5c' },
                handler: async (response) => {
                    // Step 3 — verify payment on backend
                    try {
                        const verifyRes = await axios.post(
                            `${API}/payments/verify`,
                            {
                                razorpay_order_id:   response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature:  response.razorpay_signature,
                                bookingId:           data.bookingId,
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        onSuccess(verifyRes.data.booking);
                    } catch {
                        setError('Payment verification failed. Contact support.');
                    }
                },
                modal: {
                    ondismiss: () => setLoading(false),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate payment');
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px',
                }}>
                <motion.div
                    initial={{ scale: 0.9, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 30, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'white', borderRadius: 24,
                        padding: '36px 32px', maxWidth: 440, width: '100%',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                    }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 22, fontWeight: 900, color: '#1e293b', marginBottom: 6,
                        }}>Complete Payment</h2>
                        <p style={{ fontSize: 13, color: '#64748b' }}>
                            Secure payment powered by Razorpay
                        </p>
                    </div>

                    {/* Breakdown */}
                    <div style={{
                        background: '#f8fafc', borderRadius: 16,
                        padding: '20px', marginBottom: 24,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>Booking Amount</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                ₹{bookingData?.totalPrice?.toLocaleString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>
                                Platform Fee ({commission}%)
                            </span>
                            <span style={{ fontSize: 13, color: '#ef4444' }}>
                                ₹{platformFee.toLocaleString()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>Venue Owner Gets</span>
                            <span style={{ fontSize: 13, color: '#16a34a' }}>
                                ₹{ownerAmount.toLocaleString()}
                            </span>
                        </div>
                        <div style={{
                            height: 1, background: '#e2e8f0',
                            margin: '12px 0',
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                                You Pay
                            </span>
                            <span style={{
                                fontSize: 18, fontWeight: 900,
                                background: 'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                ₹{bookingData?.totalPrice?.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                            fontSize: 13, color: '#dc2626',
                        }}>{error}</div>
                    )}

                    {/* Buttons */}
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handlePayment}
                        disabled={loading}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 50, border: 'none',
                            background: loading
                                ? '#94a3b8'
                                : 'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                            color: 'white', fontWeight: 700, fontSize: 15,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginBottom: 10, fontFamily: 'inherit',
                        }}>
                        {loading ? 'Processing...' : `Pay ₹${bookingData?.totalPrice?.toLocaleString()}`}
                    </motion.button>

                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', padding: '12px', borderRadius: 50,
                            border: '1.5px solid #e2e8f0', background: 'transparent',
                            color: '#64748b', fontWeight: 600, fontSize: 14,
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>Cancel</button>

                    {/* Trust badges */}
                    <p style={{
                        textAlign: 'center', fontSize: 11,
                        color: '#94a3b8', marginTop: 16,
                    }}>
                        🔒 256-bit SSL encrypted · Powered by Razorpay
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PaymentModal;
