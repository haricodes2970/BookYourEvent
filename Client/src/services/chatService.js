import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const openChat = async ({ otherUserId, bookingId }) => {
    const response = await axios.post(`${API}/chats/open`, { otherUserId, bookingId }, authHeaders());
    return response.data;
};

export const openChatByUsername = async (username) => {
    const response = await axios.post(`${API}/chats/open`, { username }, authHeaders());
    return response.data;
};

export const getMyChats = async () => {
    const response = await axios.get(`${API}/chats`, authHeaders());
    return response.data;
};

export const getChatMessages = async (chatId) => {
    const response = await axios.get(`${API}/chats/${chatId}/messages`, authHeaders());
    return response.data;
};

export const sendChatMessage = async (chatId, text) => {
    const response = await axios.post(`${API}/chats/${chatId}/messages`, { text }, authHeaders());
    return response.data;
};

export const markChatRead = async (chatId) => {
    const response = await axios.patch(`${API}/chats/${chatId}/read`, {}, authHeaders());
    return response.data;
};

export const searchUsersForChat = async (query) => {
    const response = await axios.get(`${API}/chats/users/search?q=${encodeURIComponent(query)}`, authHeaders());
    return response.data;
};
