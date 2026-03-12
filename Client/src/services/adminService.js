import api from "../utils/axiosInstance";

export const getAdminStats      = ()           => api.get("/admin/stats");
export const getAllUsers         = ()           => api.get("/admin/users");
export const updateUserRole     = (id, role)   => api.patch(`/admin/users/${id}/role`, { role });
export const getAllVenuesAdmin   = ()           => api.get("/admin/venues");
export const approveVenue       = (id)         => api.patch(`/admin/venues/${id}/approve`);
export const rejectVenue        = (id)         => api.patch(`/admin/venues/${id}/reject`);
export const getAllBookingsAdmin = ()           => api.get("/admin/bookings");
