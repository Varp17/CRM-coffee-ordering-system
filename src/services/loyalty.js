import { api } from './api';
export const loyaltyService = {
  getTiers: (params = {}) => api.get('/loyalty/tiers', params),
  createTier: (data) => api.post('/loyalty/tiers', data),
  updateTier: (id, data) => api.patch(`/loyalty/tiers/${id}`, data),
  getCustomers: (params = {}) => api.get('/loyalty/customers', params),
  getCustomer: (id) => api.get(`/loyalty/customers/${id}`),
  getLeaderboard: (params = {}) => api.get('/loyalty/leaderboard', params),
  getLedger: (id, params) => api.get(`/loyalty/points/${id}/ledger`, params),
  earnPoints: (data) => api.post('/loyalty/points/earn', data),
  getRewards: (params = {}) => api.get('/loyalty/rewards', params),
  createReward: (data) => api.post('/loyalty/rewards', data),
  redeemReward: (data) => api.post('/loyalty/redeem', data),
};
