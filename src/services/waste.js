import { api } from './api';
export const wasteService = {
  getAll: (params = {}) => api.get('/waste-logs', params),
  getById: (id) => api.get(`/waste-logs/${id}`),
  create: (data) => api.post('/waste-logs', data),
  update: (id, data) => api.patch(`/waste-logs/${id}`, data),
  delete: (id) => api.delete(`/waste-logs/${id}`),
  getSummary: (params = {}) => api.get('/waste-logs/summary', params),
};
