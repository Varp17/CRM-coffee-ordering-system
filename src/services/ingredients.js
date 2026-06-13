import { api } from './api';

export const ingredientService = {
  getAll: (params = {}) => api.get('/ingredients', params),
  getById: (id) => api.get(`/ingredients/${id}`),
  create: (data) => api.post('/ingredients', data),
  update: (id, data) => api.patch(`/ingredients/${id}`, data),
  delete: (id) => api.delete(`/ingredients/${id}`),
  getRawMaterialMappings: (id) => api.get(`/ingredients/${id}/raw-materials`),
  setRawMaterialMappings: (id, mappings) => api.put(`/ingredients/${id}/raw-materials`, { mappings }),
  getIngredientGroups: () => api.get('/ingredient-groups'),
  getIngredientMappings: (productId) => api.get(`/products/${productId}/ingredients`),
  bulkSetMappings: (productId, ingredients) => api.post(`/products/${productId}/ingredients/bulk`, { ingredients }),
  validateCompatibility: (productId, selectedIngredients, context) =>
    api.post('/recipes/validate', { productId, selectedIngredients, context }),
  getAvailability: (productId, currentSelections) =>
    api.post('/recipes/availability', { productId, currentSelections }),
};
