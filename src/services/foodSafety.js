import { api } from './api';

export const foodSafetyService = {
  getLicenses: (params = {}) => api.get('/food-safety/licenses', params),
  createLicense: (data) => api.post('/food-safety/licenses', data),
  updateLicense: (id, data) => api.patch(`/food-safety/licenses/${id}`, data),
  deleteLicense: (id) => api.delete(`/food-safety/licenses/${id}`),
  getExpiringLicenses: (params) => api.get('/food-safety/licenses/expiring', params),
  getAllergens: (productId) => api.get(`/food-safety/allergens/${productId}`),
  setAllergens: (productId, data) => api.put(`/food-safety/allergens/${productId}`, data),
  getNutrition: (productId) => api.get(`/food-safety/nutrition/${productId}`),
  setNutrition: (productId, data) => api.put(`/food-safety/nutrition/${productId}`, data),
};
