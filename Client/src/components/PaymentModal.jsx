import { useMemo, useState } from 'react';
import { createOrder, verifyPayment } from '../services/paymentService';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const fmtINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export default function PaymentModal({ isOpen, bookingData, onClose, onSuccess }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const bookingId = bookingData?.bookingId || bookingData?._id;
  const payableAmount = useMemo(
    () => bookingData?.totalPrice ?? bookingData?.bidAmount ?? bookingData?.amount ?? 0,
    [bookingData],
  );

  if (!isOpen) {
    return null;
  }

  const close = () => {
    if (!loading) {
      setError('');
      onClose?.();
    }
  };

  const startPayment = async () => {
    setError('');
    if (!bookingId) {
      setError('Booking id is missing for payment.');
      return;
    }

    setLoading(true);
    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Unable to load Razorpay checkout.');
      }

      const order = await createOrder(bookingId);
      if (!order?.orderId || !order?.key) {
        throw new Error('Payment order was not created.');
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.orderId,
        name: 'BookYourEvent',
        description: bookingData?.venueName || 'Venue booking',
        handler: async (response) => {
          try {
            await verifyPayment({
              bookingId: order.bookingId || bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSuccess?.();
            close();
          } catch (verifyErr) {
            const message =
              verifyErr?.response?.data?.message || verifyErr?.message || 'Payment verification failed.';
            setError(message);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: '#1e4d5c' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (failure) => {
        const message = failure?.error?.description || 'Payment failed. Please try again.';
        setError(message);
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Unable to start payment.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={close}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontSize: 20, color: '#1e293b' }}>Complete Payment</h3>
        <p style={{ marginTop: 8, fontSize: 14, color: '#64748b' }}>
          {bookingData?.venueName || 'Selected venue'}
        </p>

        <div
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Payable amount</p>
          <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700, color: '#0f172a' }}>
            {fmtINR(payableAmount)}
          </p>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              borderRadius: 10,
              padding: '10px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={startPayment}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: '#1e4d5c',
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
