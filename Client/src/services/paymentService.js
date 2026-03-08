import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Create Razorpay order + booking
export const createPaymentOrder = (bookingData) =>
    axios.post(`${API}/payments/create-order`, bookingData, { headers: getHeaders() });

// Verify payment after Razorpay success
export const verifyPayment = (paymentData) =>
    axios.post(`${API}/payments/verify`, paymentData, { headers: getHeaders() });

// Get own payment history
export const getMyPayments = () =>
    axios.get(`${API}/payments/my-payments`, { headers: getHeaders() });

// Admin revenue stats
export const getAdminRevenue = () =>
    axios.get(`${API}/payments/admin-stats`, { headers: getHeaders() });
