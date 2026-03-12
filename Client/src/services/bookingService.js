import api from "../utils/axiosInstance";

export const createBooking = (data) => api.post("/bookings/create", data).then((r) => r.data);
export const getMyBookings = () => api.get("/bookings/my-bookings").then((r) => r.data);
export const getOwnerBookings = () => api.get("/bookings/owner").then((r) => r.data);
export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data);
export const raiseBid = (id, amountOrPayload) => {
  const payload =
    amountOrPayload && typeof amountOrPayload === "object"
      ? amountOrPayload
      : { newBidAmount: Number(amountOrPayload) };
  return api.patch(`/bookings/${id}/raise-bid`, payload).then((r) => r.data);
};
export const cancelBooking = (id) => api.delete(`/bookings/${id}`).then((r) => r.data);
