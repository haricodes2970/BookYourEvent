import api from "../utils/axiosInstance";

export const getChats           = ()           => api.get("/chats");
export const createChat         = (venueOwnerId, venueId) => api.post("/chats", { venueOwnerId, venueId });
export const getChatMessages    = (chatId)     => api.get(`/chats/${chatId}/messages`);
export const sendMessage        = (chatId, text) => api.post(`/chats/${chatId}/messages`, { text });
export const markRead           = (chatId)     => api.patch(`/chats/${chatId}/read`);
export const deleteChat         = (chatId)     => api.delete(`/chats/${chatId}`);
export const getOrCreateChat    = (ownerId, venueId) => api.post("/chats/get-or-create", { ownerId, venueId });
