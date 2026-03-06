import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');

export const createBooking = async (bookingData) => {
    const response = await axios.post(`${API}/bookings/create`, bookingData, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const getMyBookings = async () => {
    const response = await axios.get(`${API}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const getVenueBookings = async (venueId) => {
    const response = await axios.get(`${API}/bookings/venue/${venueId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

export const updateBookingStatus = async (bookingId, status) => {
    const response = await axios.patch(`${API}/bookings/${bookingId}/status`, { status }, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};