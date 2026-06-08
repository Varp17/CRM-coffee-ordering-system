import { api } from './api';

export const brewRecipeService = {
  getAll: async (params = {}) => {
    return api.get('/brew-recipes', params);
  },

  getById: async (id) => {
    return api.get(`/brew-recipes/${id}`);
  },

  create: async (data) => {
    return api.post('/brew-recipes', data);
  },

  update: async (id, data) => {
    return api.patch(`/brew-recipes/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/brew-recipes/${id}`);
  },

  getCosting: async (id) => {
    return api.get(`/brew-recipes/${id}/costing`);
  },
};
