import { api } from './api';
export const inventoryOpsService = {
  getStoreTransfers: (params = {}) => api.get('/reorder/store-transfers', params),
  createStoreTransfer: (data) => api.post('/reorder/store-transfers', data),
  updateTransferStatus: (id, data) => api.patch(`/reorder/store-transfers/${id}/status`, data),
  getPackagingTypes: (params = {}) => api.get('/reorder/packaging-types', params),
  createPackagingType: (data) => api.post('/reorder/packaging-types', data),
  updatePackagingType: (id, data) => api.patch(`/reorder/packaging-types/${id}`, data),
  getPackagingInventory: (params = {}) => api.get('/reorder/packaging-inventory', params),
  adjustPackagingStock: (data) => api.post('/reorder/packaging-inventory/adjust', data),
  getReorderRules: (params = {}) => api.get('/reorder/reorder-rules', params),
  createReorderRule: (data) => api.post('/reorder/reorder-rules', data),
  checkReorder: () => api.post('/reorder/reorder/check'),
};
