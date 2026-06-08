import { api } from './api';

export const staffService = {
  getRecords: (params = {}) => api.get('/staff/records', params),
  createRecord: (data) => api.post('/staff/records', data),
  updateRecord: (id, data) => api.patch(`/staff/records/${id}`, data),
  getShifts: (params = {}) => api.get('/staff/shifts', params),
  createShift: (data) => api.post('/staff/shifts', data),
  updateShiftStatus: (id, data) => api.patch(`/staff/shifts/${id}/status`, data),
  getShiftsByDate: (params) => api.get('/staff/shifts/by-date', params),
  clockIn: (data) => api.post('/staff/time-clock/in', data),
  clockOut: (params) => api.post('/staff/time-clock/out', params),
  getTimeLogs: (params = {}) => api.get('/staff/time-logs', params),
  getStaffSummary: (params) => api.get('/staff/summary', params),
  getLaborCost: (params) => api.get('/staff/labor-cost', params),
};
