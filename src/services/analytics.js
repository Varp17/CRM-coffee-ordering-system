import { api } from './api';

export const analyticsService = {
  getDashboard: async (params = {}) => {
    return api.get('/analytics/dashboard', params);
  },

  getHourlyOrders: async (params = {}) => {
    return api.get('/analytics/hourly', params);
  },

  getMonthlyRevenue: async () => {
    return api.get('/analytics/monthly');
  },

  // Reports endpoints
  getSummary: async (params = {}) => {
    return api.get('/reports/summary', params);
  },

  getTopProducts: async (params = {}) => {
    return api.get('/reports/top-products', params);
  },

  getTopCustomers: async (params = {}) => {
    return api.get('/reports/top-customers', params);
  },

  getChannelBreakdown: async (params = {}) => {
    return api.get('/reports/channel-breakdown', params);
  },

  getPrepTimes: async (params = {}) => {
    return api.get('/analytics/prep-times', params);
  },
};
