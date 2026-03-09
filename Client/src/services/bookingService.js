import API from './api';

export const createBooking     = (data) => API.post('/bookings/create', data).then(r => r.data);
export const getVenueBookings  = (id)   => API.get(`/bookings/venue/${id}`).then(r => r.data);
export const getMyBookings     = ()     => API.get('/bookings/my-bookings').then(r => r.data);
export const updateBookingStatus = (id, status) => API.patch(`/bookings/${id}/status`, { status }).then(r => r.data);
export const raiseBid          = (id, data) => API.patch(`/bookings/${id}/raise-bid`, data).then(r => r.data);
