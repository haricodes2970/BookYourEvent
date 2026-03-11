import api from '../utils/axiosInstance';

export const getAllVenues = async () => {
    const response = await api.get('/venues');
    return response.data;
};

export const getOwnerVenues = async () => {
    const response = await api.get('/venues/owner/mine');
    return response.data;
};

export const getVenueById = async (id) => {
    const response = await api.get(`/venues/${id}`);
    return response.data;
};

export const createVenueWithImages = async (formData) => {
    const response = await api.post('/venues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteVenue = async (id) => {
    const response = await api.delete(`/venues/${id}`);
    return response.data;
};

export const updateVenue = async (id, payload) => {
    const response = await api.patch(`/venues/${id}`, payload);
    return response.data;
};

export const toggleVenueActive = async (id, isActive) => {
    const response = await api.patch(
        `/venues/${id}/toggle-active`,
        typeof isActive === 'boolean' ? { isActive } : {}
    );
    return response.data;
};

export const blockDates = async (venueId, dates) => {
    const response = await api.patch(`/venues/${venueId}/block-dates`, { dates });
    return response.data;
};

export const unblockDate = async (venueId, date) => {
    const response = await api.patch(`/venues/${venueId}/unblock-date`, { date });
    return response.data;
};