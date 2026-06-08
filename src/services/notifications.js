import { api } from './api';

export const notificationService = {
  // ── Templates (Marketing/WhatsApp) ──
  getTemplates: async () => {
    return api.get('/notifications/templates');
  },

  createTemplate: async (data) => {
    return api.post('/notifications/templates', data);
  },

  updateTemplate: async (id, data) => {
    return api.patch(`/notifications/templates/${id}`, data);
  },

  deleteTemplate: async (id) => {
    return api.delete(`/notifications/templates/${id}`);
  },

  // ── Active Notifications ──
  getNotifications: async (query = {}) => {
    return api.get('/notifications', { params: query });
  },

  getUnreadCount: async () => {
    return api.get('/notifications/unread-count');
  },

  markAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (ids) => {
    return api.patch('/notifications/mark-read', { ids });
  },

  clearAll: async () => {
    return api.delete('/notifications');
  },

  triggerTestNotification: async (type, data = {}) => {
    return api.post('/notifications/test-trigger', { type, ...data });
  },
};
