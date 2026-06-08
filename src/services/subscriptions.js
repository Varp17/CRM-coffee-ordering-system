import { api } from './api';
export const subscriptionsService = {
  getPlans: (params = {}) => api.get('/subscriptions/plans', params),
  createPlan: (data) => api.post('/subscriptions/plans', data),
  updatePlan: (id, data) => api.patch(`/subscriptions/plans/${id}`, data),
  getSubscriptions: (params = {}) => api.get('/subscriptions', params),
  getSubscription: (id) => api.get(`/subscriptions/${id}`),
  createSubscription: (data) => api.post('/subscriptions', data),
  updateSubscriptionStatus: (id, data) => api.patch(`/subscriptions/${id}/status`, data),
  getSubscriptionOrders: (id) => api.get(`/subscriptions/${id}/orders`),
  processDue: () => api.post('/subscriptions/process-due'),
};
