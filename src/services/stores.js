import { api } from './api';

export const storeService = {
  getAll: async (params = {}) => api.get('/stores', params),
  getById: async (id) => api.get(`/stores/${id}`),
  create: async (data) => api.post('/stores', data),
  update: async (id, data) => api.patch(`/stores/${id}`, data),
  delete: async (id) => api.delete(`/stores/${id}`),
};
