import { api } from './api';

export const menuRecipeService = {
  list: async (params = {}) => {
    return api.get('/menu-recipes', params);
  },

  getById: async (id) => {
    return api.get(`/menu-recipes/${id}`);
  },

  create: async (data) => {
    return api.post('/menu-recipes', data);
  },

  update: async (id, data) => {
    return api.put(`/menu-recipes/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/menu-recipes/${id}`);
  },

  addIngredient: async (recipeId, data) => {
    return api.post(`/menu-recipes/${recipeId}/ingredients`, data);
  },

  removeIngredient: async (recipeId, ingredientId) => {
    return api.delete(`/menu-recipes/${recipeId}/ingredients/${ingredientId}`);
  },

  recalculate: async (recipeId) => {
    return api.post(`/menu-recipes/${recipeId}/recalculate`);
  },

  getCosting: async (recipeId) => {
    return api.get(`/menu-recipes/${recipeId}/costing`);
  },
};
