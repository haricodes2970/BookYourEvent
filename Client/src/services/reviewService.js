import api from "../utils/axiosInstance";

export const getVenueReviews    = (venueId)    => api.get(`/reviews/${venueId}`);
export const createReview       = (data)       => api.post("/reviews", data);
export const deleteReview       = (id)         => api.delete(`/reviews/${id}`);
