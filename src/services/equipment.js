import { api } from './api';

export const equipmentService = {
  getAll: (params = {}) => api.get('/equipment', params),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.patch(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  getMaintenance: (id, params = {}) => api.get(`/equipment/${id}/maintenance`, params),
  addMaintenance: (id, data) => api.post(`/equipment/${id}/maintenance`, data),
  getCalibrationDue: () => api.get('/equipment/calibration-due'),
  getUpcomingMaintenance: (params) => api.get('/equipment/upcoming-maintenance', params),
};
