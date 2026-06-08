import { create } from 'zustand';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notifications';
import { unwrapObject } from '../utils/apiResponse';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      const unwrapped = unwrapObject(res);
      const list = unwrapped?.notifications || [];
      const count = list.filter(n => !n.is_read).length;
      set({ notifications: list, unreadCount: count });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getUnreadCount();
      const countData = unwrapObject(res);
      const count = countData?.unread_count ?? 0;
      set({ unreadCount: count });
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  },

  addNotificationToState: (notification) => {
    const list = get().notifications;
    
    // Ensure we don't add duplicates
    if (list.some(n => String(n.id) === String(notification.id))) {
      return;
    }

    set({
      notifications: [notification, ...list],
      unreadCount: get().unreadCount + (notification.is_read ? 0 : 1)
    });

    const title = notification.title;
    const message = notification.message;
    const type = notification.type;

    // Trigger visual toast notification
    if (type === 'success' || type === 'order_completed') {
      toast.success(`${title}: ${message}`, { id: notification.id });
    } else if (type === 'error' || type === 'low_stock') {
      toast.error(`${title}: ${message}`, { id: notification.id });
    } else {
      toast(`${title}: ${message}`, { icon: '🔔', id: notification.id });
    }

    // Play audio alert
    try {
      const audio = new Audio('/assets/chime.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  },

  // Fallback for manual or client-only toast alerts
  addNotification: (title, message, type = 'info') => {
    const newNotif = {
      id: `local-${Date.now()}`,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    };
    get().addNotificationToState(newNotif);
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read: ' + err.message);
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => {
        const target = state.notifications.find(n => n.id === id);
        const unreadDiff = target && !target.is_read ? 1 : 0;
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - unreadDiff)
        };
      });
    } catch (err) {
      toast.error('Failed to mark as read: ' + err.message);
    }
  },

  clearAll: async () => {
    try {
      await notificationService.clearAll();
      set({ notifications: [], unreadCount: 0 });
      toast.success('Cleared all notifications');
    } catch (err) {
      toast.error('Failed to clear notifications: ' + err.message);
    }
  },

  getUnreadCount: () => {
    return get().unreadCount;
  },
}));
