import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

export const getAllUsers = async () => {
    const response = await axios.get(`${API}/auth/users`, {
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

export const getAllVenuesAdmin = async () => {
    const response = await axios.get(`${API}/venues/admin/all`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};