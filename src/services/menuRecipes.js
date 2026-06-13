import { api } from './api';

export const menuRecipeService = {
  list: async (params = {}) => {
    return api.get('/recipes/menu', params);
  },

  getById: async (id) => {
    return api.get(`/recipes/menu/${id}`);
  },

  create: async (data) => {
    return api.post('/recipes/menu', data);
  },

  update: async (id, data) => {
    return api.put(`/recipes/menu/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/recipes/menu/${id}`);
  },

  addIngredient: async (recipeId, data) => {
    return api.post(`/recipes/menu/${recipeId}/ingredients`, data);
  },

  removeIngredient: async (recipeId, ingredientId) => {
    return api.delete(`/recipes/menu/${recipeId}/ingredients/${ingredientId}`);
  },

  recalculate: async (recipeId) => {
    return api.post(`/recipes/menu/${recipeId}/recalculate`);
  },

  getCosting: async (recipeId) => {
    return api.get(`/recipes/menu/${recipeId}/costing`);
  },
};
