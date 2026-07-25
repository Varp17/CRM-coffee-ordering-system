import { api } from './api';

export const customerService = {
  getAll: async (params = {}) => {
    return api.get('/customers', params);
  },

  getById: async (id) => {
    return api.get(`/customers/${id}`);
  },

  update: async (id, data) => {
    return api.patch(`/customers/${id}`, data);
  },

  addNote: async (id, note) => {
    return api.post(`/customers/${id}/notes`, note);
  },
};
