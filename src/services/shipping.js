import { api } from './api';

export const shippingService = {
  getCarriers: (params = {}) => api.get('/shipping/shipping-carriers', params),
  createCarrier: (data) => api.post('/shipping/shipping-carriers', data),
  updateCarrier: (id, data) => api.patch(`/shipping/shipping-carriers/${id}`, data),
  getShipments: (params = {}) => api.get('/shipping/shipments', params),
  createShipment: (data) => api.post('/shipping/shipments', data),
  getShipment: (id) => api.get(`/shipping/shipments/${id}`),
  updateShipmentStatus: (id, data) => api.patch(`/shipping/shipments/${id}/status`, data),
  addTrackingEvent: (id, data) => api.post(`/shipping/shipments/${id}/tracking`, data),
};
