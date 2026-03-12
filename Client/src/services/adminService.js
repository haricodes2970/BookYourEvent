import api from "../utils/axiosInstance";

export const getAdminStats       = ()         => api.get("/payments/admin-stats").then((r) => r.data);
export const getAllUsers         = ()         => api.get("/auth/users").then((r) => r.data);
export const deleteUser          = (id)       => api.delete(`/auth/users/${id}`).then((r) => r.data);
export const updateUserRole      = (id, role) => api.patch(`/auth/users/${id}/role`, { role }).then((r) => r.data);
export const getAllVenuesAdmin   = ()         => api.get("/venues/admin/all").then((r) => r.data);
export const approveVenue        = (id)       => api.patch(`/venues/${id}/approve`).then((r) => r.data);
export const adminDeleteVenue    = (id)       => api.delete(`/venues/${id}/admin`).then((r) => r.data);
export const getAllBookingsAdmin = ()         => api.get("/bookings/admin/all").then((r) => r.data);
