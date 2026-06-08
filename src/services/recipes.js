import { api } from './api';

export const recipeService = {
  getAll: async () => {
    return api.get('/ingredients');
  },

  getIngredientGroups: async () => {
    return api.get('/ingredient-groups');
  },

  getIngredientMappings: async (productId) => {
    return api.get(`/products/${productId}/ingredients`);
  },

  bulkSetMappings: async (productId, ingredients) => {
    return api.post(`/products/${productId}/ingredients/bulk`, { ingredients });
  },

  createIngredient: async (data) => {
    return api.post('/ingredients', data);
  },

  updateIngredient: async (id, data) => {
    return api.patch(`/ingredients/${id}`, data);
  },

  deleteIngredient: async (id) => {
    return api.delete(`/ingredients/${id}`);
  },

  getAvailability: async (productId, currentSelections = []) => {
    return api.post('/recipes/availability', { productId, currentSelections });
  },

  validateCompatibility: async (productId, selectedIngredients, context = {}) => {
    return api.post('/recipes/validate', { productId, selectedIngredients, context });
  },

  getCompatibilityRules: async (productId) => {
    return api.get(`/recipes/rules/${productId}`);
  },

  createCompatibilityRule: async (productId, ruleData) => {
    return api.post(`/recipes/rules/${productId}`, ruleData);
  },

  updateCompatibilityRule: async (ruleId, ruleData) => {
    return api.put(`/recipes/rules/${ruleId}`, ruleData);
  },

  deleteCompatibilityRule: async (ruleId) => {
    return api.delete(`/recipes/rules/${ruleId}`);
  },

  getRawMaterialMappings: async (ingredientId) => {
    return api.get(`/ingredients/${ingredientId}/raw-materials`);
  },

  setRawMaterialMappings: async (ingredientId, mappings) => {
    return api.put(`/ingredients/${ingredientId}/raw-materials`, { mappings });
  },
};
