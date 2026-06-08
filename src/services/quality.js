import { api } from './api';

export const qualityService = {
  getLots: (params = {}) => api.get('/quality/lots', params),
  createLot: (data) => api.post('/quality/lots', data),
  updateLotStatus: (id, data) => api.patch(`/quality/lots/${id}/status`, data),
  getHolds: (params = {}) => api.get('/quality/holds', params),
  placeHold: (data) => api.post('/quality/holds', data),
  releaseHold: (id, data) => api.post(`/quality/holds/${id}/release`, data),
  rejectHold: (id, data) => api.post(`/quality/holds/${id}/reject`, data),
  getRecipeVersions: (id) => api.get(`/quality/recipe-versions/${id}`),
  createRecipeVersion: (id, data) => api.post(`/quality/recipe-versions/${id}`, data),
  getYieldAlerts: (params = {}) => api.get('/quality/yield-alerts', params),
  checkYield: (id) => api.post(`/quality/yield-alerts/check/${id}`),
};
