import api from "../utils/axiosInstance";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create Razorpay order + booking
export const createPaymentOrder = (bookingData) =>
    api.post(`${API}/payments/create-order`, bookingData);

// Verify payment after Razorpay success
export const verifyPayment = (paymentData) =>
    api.post(`${API}/payments/verify`, paymentData);

// Get own payment history
export const getMyPayments = () =>
    api.get(`${API}/payments/my-payments`);

// Admin revenue stats
export const getAdminRevenue = () =>
    api.get(`${API}/payments/admin-stats`);