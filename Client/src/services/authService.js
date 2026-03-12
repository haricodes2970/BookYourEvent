import api from "../utils/axiosInstance";

export const registerUser     = (data)               => api.post("/auth/register", data);
export const loginUser        = (data)               => api.post("/auth/login", data);
export const verifyOTP        = (data)               => api.post("/auth/verify-otp", data);
export const forgotPassword   = (email)              => api.post("/auth/forgot-password", { email });
// BUG-14 FIX: was (token, password) — backend expects { email, otp, newPassword }
export const resetPassword    = (email, otp, newPassword) => api.post("/auth/reset-password", { email, otp, newPassword });
export const updateProfile    = (data)               => api.patch("/auth/update-profile", data);
export const switchRole       = (role)               => api.patch("/auth/switch-role", { role });
export const googleAuthLogin  = (code)               => api.post("/auth/google", { code });
