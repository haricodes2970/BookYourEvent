import api from "../utils/axiosInstance";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const getVenueReviews = async (venueId) => {
    const response = await api.get(`${API}/reviews/${venueId}`);
    return response.data;
};

export const addReview = async (reviewData) => {
    const response = await api.post(`${API}/reviews`, reviewData);
    return response.data;
};

export const deleteReview = async (id) => {
    const response = await api.delete(`${API}/reviews/${id}`);
    return response.data;
};