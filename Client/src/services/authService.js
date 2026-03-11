import api from '../utils/axiosInstance';

export const registerUser = async (formData) => {
    const response = await api.post('/auth/register', formData);
    return response.data;
};

export const verifyOTP = async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
};

export const loginUser = async (formData) => {
    const response = await api.post('/auth/login', formData);
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const savePaymentDetails = async (details) => {
    const response = await api.patch('/auth/payment-details', details);
    return response.data;
};