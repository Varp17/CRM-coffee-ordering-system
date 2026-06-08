import { api } from './api';
export const gstService = {
  getConfig: (params = {}) => api.get('/gst/config', params),
  upsertConfig: (data) => api.post('/gst/config', data),
  getInvoices: (params = {}) => api.get('/gst/invoices', params),
  getInvoice: (id) => api.get(`/gst/invoices/${id}`),
  generateInvoice: (orderId) => api.post(`/gst/invoices/generate/${orderId}`),
  cancelInvoice: (id) => api.post(`/gst/invoices/${id}/cancel`),
  getReturns: (params) => api.get('/gst/returns', params),
};
