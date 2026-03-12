import api from "../utils/axiosInstance";

export const registerUser     = (data)               => api.post("/auth/register", data).then((r) => r.data);
export const loginUser        = (data)               => api.post("/auth/login", data).then((r) => r.data);
export const verifyOTP        = (data)               => api.post("/auth/verify-otp", data).then((r) => r.data);
export const resendOTP        = ({ email })          => api.post("/auth/forgot-password", { email }).then((r) => r.data);
export const forgotPassword   = (email)              => api.post("/auth/forgot-password", { email }).then((r) => r.data);
// BUG-14 FIX: was (token, password) — backend expects { email, otp, newPassword }
export const resetPassword    = (email, otp, newPassword) => api.post("/auth/reset-password", { email, otp, newPassword }).then((r) => r.data);
export const updateProfile    = (data)               => api.patch("/auth/update-profile", data).then((r) => r.data);
export const switchRole       = (role)               => api.patch("/auth/switch-role", { role }).then((r) => r.data);
export const googleAuthLogin  = (code)               => api.post("/auth/google", { code }).then((r) => r.data);
