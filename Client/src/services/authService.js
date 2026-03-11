import api from '../utils/axiosInstance';

export const registerUser = async (formData) => {
  const response = await api.post('/auth/register', formData);
  return response.data;
};

export const verifyOTP = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const resendOTP = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
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

export const switchRole = async (role) => {
  const response = await api.patch('/auth/switch-role', { role });
  return response.data;
};

export const updateProfile = async (updates) => {
  const response = await api.patch('/auth/update-profile', updates);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
};