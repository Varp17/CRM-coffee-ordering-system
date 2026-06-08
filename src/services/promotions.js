import { api } from './api';
export const promotionsService = {
  getAll: (params = {}) => api.get('/promotions', params),
  getById: (id) => api.get(`/promotions/${id}`),
  create: (data) => api.post('/promotions', data),
  update: (id, data) => api.patch(`/promotions/${id}`, data),
  delete: (id) => api.delete(`/promotions/${id}`),
  getCodes: (id) => api.get(`/promotions/${id}/codes`),
  createCode: (id, data) => api.post(`/promotions/${id}/codes`, data),
  validateCode: (data) => api.post('/promotions/validate', data),
};
