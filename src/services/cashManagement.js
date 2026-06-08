import { api } from './api';
export const cashService = {
  getSessions: (params = {}) => api.get('/cash/cash-sessions', params),
  openSession: (data) => api.post('/cash/cash-sessions/open', data),
  closeSession: (id, data) => api.post(`/cash/cash-sessions/${id}/close`, data),
  getSession: (id) => api.get(`/cash/cash-sessions/${id}`),
  getTransactions: (id) => api.get(`/cash/cash-sessions/${id}/transactions`),
  createTransaction: (data) => api.post('/cash/cash-transactions', data),
  getDailySummary: (params) => api.get('/cash/cash-summary/daily', params),
};
