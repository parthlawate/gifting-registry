import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Items API
export const itemsAPI = {
  // Upload new item with photos
  upload: async (formData) => {
    const response = await api.post('/items/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all items
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/items?${params}`);
    return response.data;
  },

  // Get single item
  getById: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  // Update item
  update: async (id, data) => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  },

  // Delete item
  delete: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  // Conversational search
  search: async (query) => {
    const response = await api.post('/items/search', { query });
    return response.data;
  },

  // Record gift
  recordGift: async (id, giftData) => {
    const response = await api.post(`/items/${id}/gift`, giftData);
    return response.data;
  },
};

export default api;
