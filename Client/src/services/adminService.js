import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

export const getAllUsers = async () => {
    const response = await axios.get(`${API}/auth/users`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await axios.delete(`${API}/auth/users/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await axios.patch(`${API}/auth/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const approveVenue = async (venueId) => {
    const response = await axios.patch(`${API}/venues/${venueId}/approve`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const adminDeleteVenue = async (venueId) => {
    const response = await axios.delete(`${API}/venues/${venueId}/admin`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const getAllVenuesAdmin = async () => {
    const response = await axios.get(`${API}/venues/admin/all`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const getAllBookingsAdmin = async () => {
    const response = await axios.get(`${API}/bookings/all`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};