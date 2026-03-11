import api from "../utils/axiosInstance";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const getAllUsers = async () => {
    const response = await api.get(`${API}/auth/users`);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`${API}/auth/users/${id}`);
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await api.patch(`${API}/auth/users/${id}/role`, { role });
    return response.data;
};

export const approveVenue = async (venueId) => {
    const response = await api.patch(`${API}/venues/${venueId}/approve`, {});
    return response.data;
};

export const adminDeleteVenue = async (venueId) => {
    const response = await api.delete(`${API}/venues/${venueId}/admin`);
    return response.data;
};

export const getAllVenuesAdmin = async () => {
    const response = await api.get(`${API}/venues/admin/all`);
    return response.data;
};

export const getAllBookingsAdmin = async () => {
    const response = await api.get(`${API}/bookings/admin/all`);
    return response.data;
};