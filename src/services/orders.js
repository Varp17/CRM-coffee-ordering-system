import { api } from './api';

export const orderService = {
  getAll: async (params = {}) => {
    return api.get('/orders', params);
  },

  getById: async (id) => {
    return api.get(`/orders/${id}`);
  },

  getMyOrders: async (params = {}) => {
    return api.get('/orders/me', params);
  },

  create: async (orderData) => {
    return api.post('/orders', orderData);
  },

  updateStatus: async (id, status) => {
    return api.patch(`/orders/${id}/status`, { status });
  },

  cancel: async (id, reason) => {
    return api.post(`/orders/${id}/cancel`, { reason });
  },

  cancelWithRefund: async (id) => {
    return api.post(`/orders/${id}/cancel`, { reason: 'Customer requested refund' });
  },

  refund: async (id) => {
    return orderService.cancelWithRefund(id);
  },

  initiatePayment: async (id, data) => {
    return api.post(`/orders/${id}/payment/initiate`, data);
  },
};
