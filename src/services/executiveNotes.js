import { api } from './api';
export const executiveNotesService = {
  getAll: (params = {}) => api.get('/executive-notes', params),
  getById: (uuid) => api.get(`/executive-notes/${uuid}`),
  create: (data) => api.post('/executive-notes', data),
  update: (uuid, data) => api.patch(`/executive-notes/${uuid}`, data),
  delete: (uuid) => api.delete(`/executive-notes/${uuid}`),
};
