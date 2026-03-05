import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

export const getAllVenues = async () => {
    const response = await axios.get(`${API}/venues`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const getVenueById = async (id) => {
    const response = await axios.get(`${API}/venues/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const createVenueWithImages = async (formData) => {
    const response = await axios.post(`${API}/venues`, formData, {
        headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteVenue = async (id) => {
    const response = await axios.delete(`${API}/venues/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const blockDates = async (venueId, dates) => {
    const response = await axios.patch(`${API}/venues/${venueId}/block-dates`, { dates }, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const unblockDate = async (venueId, date) => {
    const response = await axios.patch(`${API}/venues/${venueId}/unblock-date`, { date }, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};