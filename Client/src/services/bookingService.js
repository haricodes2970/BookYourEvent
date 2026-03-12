import api from "../utils/axiosInstance";

export const createBooking      = (data)       => api.post("/bookings", data);
export const getMyBookings      = ()           => api.get("/bookings/my-bookings");
export const getOwnerBookings   = ()           => api.get("/bookings/owner");
export const updateBookingStatus= (id, status) => api.patch(`/bookings/${id}/status`, { status });
export const raiseBid           = (id, amount) => api.patch(`/bookings/${id}/raise-bid`, { newBidAmount: amount });
export const cancelBooking      = (id)         => api.delete(`/bookings/${id}`);
