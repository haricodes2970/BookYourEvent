import api from "../utils/axiosInstance";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const openChat = async ({ otherUserId, bookingId }) => {
    const response = await api.post(`${API}/chats/open`, { otherUserId, bookingId });
    return response.data;
};

export const openChatByUsername = async (username) => {
    const response = await api.post(`${API}/chats/open`, { username });
    return response.data;
};

export const getMyChats = async () => {
    const response = await api.get(`${API}/chats`);
    return response.data;
};

export const getChatMessages = async (chatId) => {
    const response = await api.get(`${API}/chats/${chatId}/messages`);
    return response.data;
};

export const sendChatMessage = async (chatId, text) => {
    const response = await api.post(`${API}/chats/${chatId}/messages`, { text });
    return response.data;
};

export const markChatRead = async (chatId) => {
    const response = await api.patch(`${API}/chats/${chatId}/read`, {});
    return response.data;
};

export const searchUsersForChat = async (query) => {
    const response = await api.get(`${API}/chats/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
};