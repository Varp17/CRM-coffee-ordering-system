import { api } from './api';
export const b2bService = {
  getAccounts: (params = {}) => api.get('/b2b/accounts', params),
  getAccount: (id) => api.get(`/b2b/accounts/${id}`),
  createAccount: (data) => api.post('/b2b/accounts', data),
  updateAccount: (id, data) => api.patch(`/b2b/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/b2b/accounts/${id}`),
  getUsers: (id) => api.get(`/b2b/accounts/${id}/users`),
  addUser: (id, data) => api.post(`/b2b/accounts/${id}/users`, data),
  getPricing: (id) => api.get(`/b2b/accounts/${id}/pricing`),
  setPricing: (id, data) => api.post(`/b2b/accounts/${id}/pricing`, data),
  getOrders: (id, params) => api.get(`/b2b/accounts/${id}/orders`, params),
  createOrder: (id, data) => api.post(`/b2b/accounts/${id}/orders`, data),
};
