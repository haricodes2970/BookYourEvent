import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const createBooking = (data) =>
    axios.post(`${API}/bookings/create`, data, authHeaders()).then(r => r.data);

export const getVenueBookings = (id) =>
    axios.get(`${API}/bookings/venue/${id}`, authHeaders()).then(r => r.data);

export const getOwnerBookings = (venueId) =>
    axios
        .get(`${API}/bookings/owner${venueId ? `?venueId=${venueId}` : ''}`, authHeaders())
        .then(r => r.data);

export const getMyBookings = () =>
    axios.get(`${API}/bookings/my-bookings`, authHeaders()).then(r => r.data);

export const updateBookingStatus = (id, status) =>
    axios.patch(`${API}/bookings/${id}/status`, { status }, authHeaders()).then(r => r.data);

export const raiseBid = (id, data) =>
    axios.patch(`${API}/bookings/${id}/raise-bid`, data, authHeaders()).then(r => r.data);
