import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

export const getVenueReviews = async (venueId) => {
    const response = await axios.get(`${API}/reviews/${venueId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const addReview = async (reviewData) => {
    const response = await axios.post(`${API}/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const deleteReview = async (id) => {
    const response = await axios.delete(`${API}/reviews/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};