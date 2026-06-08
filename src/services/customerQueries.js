import { api } from './api';
export const customerQueriesService = {
  getAll: (params = {}) => api.get('/customer-queries', params),
  getById: (uuid) => api.get(`/customer-queries/${uuid}`),
  create: (data) => api.post('/customer-queries', data),
  update: (uuid, data) => api.put(`/customer-queries/${uuid}`, data),
  delete: (uuid) => api.delete(`/customer-queries/${uuid}`),
};
