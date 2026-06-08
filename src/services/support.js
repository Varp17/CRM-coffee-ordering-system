import { api } from './api';
export const supportService = {
  getTickets: (params = {}) => api.get('/support/tickets', params),
  getTicket: (id) => api.get(`/support/tickets/${id}`),
  createTicket: (data) => api.post('/support/tickets', data),
  updateTicketStatus: (id, data) => api.patch(`/support/tickets/${id}/status`, data),
  assignTicket: (id, data) => api.patch(`/support/tickets/${id}/assign`, data),
  getMessages: (id) => api.get(`/support/tickets/${id}/messages`),
  addMessage: (id, data) => api.post(`/support/tickets/${id}/messages`, data),
  getStats: () => api.get('/support/tickets/stats'),
};
