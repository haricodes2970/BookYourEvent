import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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