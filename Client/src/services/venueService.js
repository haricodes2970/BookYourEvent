import api from "../utils/axiosInstance";

export const getAllVenues      = (params)  => api.get("/venues", { params });
export const getVenueById     = (id)      => api.get(`/venues/${id}`);
export const getOwnerVenues   = ()        => api.get("/venues/owner/mine");
export const createVenue      = (fd)      => api.post("/venues", fd, { headers: { "Content-Type": "multipart/form-data" } });
export const updateVenue      = (id, d)   => api.patch(`/venues/${id}`, d);
export const toggleVenueActive= (id)      => api.patch(`/venues/${id}/toggle-active`);
export const deleteVenue      = (id)      => api.delete(`/venues/${id}`);
export const getVenueBookings = (id)      => api.get(`/venues/${id}/bookings`);
export const blockDates       = (id, d)   => api.post(`/venues/${id}/block-dates`, d);
export const unblockDate      = (id, d)   => api.delete(`/venues/${id}/block-dates`, { data: d });
