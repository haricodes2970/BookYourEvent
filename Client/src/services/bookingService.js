import api from "../utils/axiosInstance";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const createBooking = (data) =>
    api.post(`${API}/bookings/create`, data).then(r => r.data);

export const getVenueBookings = (id) =>
    api.get(`${API}/bookings/venue/${id}`).then(r => r.data);

export const getOwnerBookings = (venueId) =>
    api
        .get(`${API}/bookings/owner${venueId ? `?venueId=${venueId}` : ""}`)
        .then(r => r.data);

export const getMyBookings = () =>
    api.get(`${API}/bookings/my-bookings`).then(r => r.data);

export const updateBookingStatus = (id, status) =>
    api.patch(`${API}/bookings/${id}/status`, { status }).then(r => r.data);

export const raiseBid = (id, data) =>
    api.patch(`${API}/bookings/${id}/raise-bid`, data).then(r => r.data);