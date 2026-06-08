import { api } from './api';

export const productService = {
  getMenu: async (params = {}) => {
    return api.get('/products', { ...params, channel: 'kiosk', is_active: true });
  },

  getAll: async (params = {}) => {
    return api.get('/products', params);
  },

  getById: async (id) => {
    return api.get(`/products/${id}`);
  },

  getCategories: async () => {
    return api.get('/categories');
  },

  create: async (data) => {
    return api.post('/products', data);
  },

  update: async (id, data) => {
    return api.patch(`/products/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/products/${id}`);
  },
};
