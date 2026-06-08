import { api } from './api';

export const rawMaterialService = {
  getAll: async (params = {}) => {
    return api.get('/raw-materials', params);
  },

  getById: async (uuid) => {
    return api.get(`/raw-materials/${uuid}`);
  },

  create: async (data) => {
    return api.post('/raw-materials', data);
  },

  update: async (uuid, data) => {
    return api.put(`/raw-materials/${uuid}`, data);
  },

  delete: async (uuid) => {
    return api.delete(`/raw-materials/${uuid}`);
  },

  adjustStock: async (uuid, data) => {
    return api.post(`/raw-materials/${uuid}/stock-adjust`, data);
  },

  getPurchases: async (uuid, params = {}) => {
    return api.get(`/raw-materials/${uuid}/purchases`, params);
  },

  addPurchase: async (uuid, data) => {
    return api.post(`/raw-materials/${uuid}/purchases`, data);
  },
};
