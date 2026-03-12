import api from "../utils/axiosInstance";

export const getAllVenues = (params) => api.get("/venues", { params }).then((r) => r.data);
export const getVenueById = (id) => api.get(`/venues/${id}`).then((r) => r.data);
export const getOwnerVenues = () => api.get("/venues/owner/mine").then((r) => r.data);
export const createVenue = (fd) =>
  api.post("/venues", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const updateVenue = (id, data) => api.patch(`/venues/${id}`, data).then((r) => r.data);
export const toggleVenueActive = (id) => api.patch(`/venues/${id}/toggle-active`).then((r) => r.data);
export const deleteVenue = (id) => api.delete(`/venues/${id}`).then((r) => r.data);
export const getVenueBookings = (id) => api.get(`/bookings/venue/${id}`).then((r) => r.data);
export const blockDates = (id, data) => api.patch(`/venues/${id}/block-dates`, data).then((r) => r.data);
export const unblockDate = (id, data) => api.patch(`/venues/${id}/unblock-date`, data).then((r) => r.data);
