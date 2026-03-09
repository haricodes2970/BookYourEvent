import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const registerUser = async (formData) => {
    const response = await axios.post(`${API}/auth/register`, formData);
    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await axios.post(`${API}/auth/verify-otp`, { email, otp });
    return response.data;
};

export const loginUser = async (formData) => {
    const response = await axios.post(`${API}/auth/login`, formData);
    return response.data;
};

export const getMe = async () => {
    const response = await axios.get(`${API}/auth/me`, authHeaders());
    return response.data;
};

export const savePaymentDetails = async (details) => {
    const response = await axios.patch(`${API}/auth/payment-details`, details, authHeaders());
    return response.data;
};
