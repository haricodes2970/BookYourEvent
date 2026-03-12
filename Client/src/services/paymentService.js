import api from "../utils/axiosInstance";

export const createOrder        = (bookingId)  => api.post("/payments/create-order", { bookingId }).then(r => r.data);
export const verifyPayment      = (data)       => api.post("/payments/verify", data).then(r => r.data);
export const getMyPayments      = ()           => api.get("/payments/my-payments");
export const getOwnerPayments   = ()           => api.get("/payments/owner-payments");
