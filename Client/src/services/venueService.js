import axios from 'axios';

const API = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

export const getAllVenues = async () => {
    const response = await axios.get(`${API}/venues/all`, {
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

export const createVenue = async (venueData) => {
    const response = await axios.post(`${API}/venues/create`, venueData, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const deleteVenue = async (id) => {
    const response = await axios.delete(`${API}/venues/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};