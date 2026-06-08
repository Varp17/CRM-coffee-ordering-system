import { api } from './api';
export const poService = {
  getAll: (params = {}) => api.get('/purchase-orders', params),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  receive: (id, data) => api.post(`/purchase-orders/${id}/receive`, data),
  getGRNs: (id) => api.get(`/purchase-orders/${id}/grns`),
};
