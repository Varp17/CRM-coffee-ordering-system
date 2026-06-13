import { api } from './api';

export const brewRecipeService = {
  getAll: async (params = {}) => {
    return api.get('/recipes/brew', params);
  },

  getById: async (id) => {
    return api.get(`/recipes/brew/${id}`);
  },

  create: async (data) => {
    return api.post('/recipes/brew', data);
  },

  update: async (id, data) => {
    return api.patch(`/recipes/brew/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/recipes/brew/${id}`);
  },

  getCosting: async (id) => {
    return api.get(`/recipes/brew/${id}/costing`);
  },

  list: async (params = {}) => {
    return api.get('/recipes/brew', params);
  },
};
