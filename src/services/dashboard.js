import { api } from './api';
export const dashboardService = {
  getDailyOps: (params) => api.get('/dashboard/daily-ops', params),
  getMenuEngineering: (params) => api.get('/dashboard/menu-engineering', params),
  getDemandForecast: (params) => api.get('/dashboard/demand-forecast', params),
};
