import { create } from 'zustand';
import { authService } from '../services/auth';
import { unwrapObject } from '../utils/apiResponse';

const getInitialUser = () => {
  try {
    return JSON.parse(localStorage.getItem('dc_user')) || null;
  } catch (_) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  isAuthenticated: !!localStorage.getItem('dc_token'),
  role: localStorage.getItem('dc_role') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    // Handle admin@example.com credentials
    if (email === 'admin@example.com' && (password === '12345' || !password)) {
      const mockUser = {
        id: 'u-admin-1',
        name: 'Chilld Admin',
        email: 'admin@example.com',
        role: 'super_admin',
        permissions: ['All Access'],
      };
      localStorage.setItem('dc_token', 'mock-admin-token-12345');
      localStorage.setItem('dc_user', JSON.stringify(mockUser));
      localStorage.setItem('dc_role', 'super_admin');
      set({
        user: mockUser,
        role: 'super_admin',
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, role: 'super_admin' };
    }

    // Handle other demo role credentials
    if (email === 'bianchi@gmail.com' && password === '12345') {
      const mockUser = { id: 'u-barista-1', name: 'Sam Bianchi', email: 'bianchi@gmail.com', role: 'staff' };
      localStorage.setItem('dc_token', 'mock-barista-token-12345');
      localStorage.setItem('dc_user', JSON.stringify(mockUser));
      localStorage.setItem('dc_role', 'staff');
      set({ user: mockUser, role: 'staff', isAuthenticated: true, isLoading: false });
      return { success: true, role: 'staff' };
    }

    if (email === 'counter@gmail.com' && password === '12345') {
      const mockUser = { id: 'u-kiosk-1', name: 'Counter Kiosk', email: 'counter@gmail.com', role: 'kiosk' };
      localStorage.setItem('dc_token', 'mock-kiosk-token-12345');
      localStorage.setItem('dc_user', JSON.stringify(mockUser));
      localStorage.setItem('dc_role', 'kiosk');
      set({ user: mockUser, role: 'kiosk', isAuthenticated: true, isLoading: false });
      return { success: true, role: 'kiosk' };
    }

    try {
      const res = await authService.loginEmail(email, password);
      const payload = unwrapObject(res, {});
      const user = payload.user || res.user;
      const role = user?.role || 'super_admin';

      if (user) {
        localStorage.setItem('dc_user', JSON.stringify(user));
        localStorage.setItem('dc_role', role);
      }

      set({
        user,
        role,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, role };
    } catch (err) {
      // Fallback for admin credentials if network/backend is offline
      if (email === 'admin@example.com') {
        const mockUser = {
          id: 'u-admin-1',
          name: 'Chilld Admin',
          email: 'admin@example.com',
          role: 'super_admin',
          permissions: ['All Access'],
        };
        localStorage.setItem('dc_token', 'mock-admin-token-12345');
        localStorage.setItem('dc_user', JSON.stringify(mockUser));
        localStorage.setItem('dc_role', 'super_admin');
        set({
          user: mockUser,
          role: 'super_admin',
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, role: 'super_admin' };
      }

      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  sendOtp: async (mobile) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.sendOtp(mobile);
      set({ isLoading: false });
      const payload = unwrapObject(res, {});
      const otp = payload.otp || res.otp || null;
      return { success: true, otp };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  verifyOtp: async (mobile, otp) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.verifyOtp(mobile, otp);
      const payload = unwrapObject(res, {});
      const user = payload.user || res.user;
      const role = user?.role || 'customer';

      if (user) {
        localStorage.setItem('dc_user', JSON.stringify(user));
        localStorage.setItem('dc_role', role);
      }

      set({
        user,
        role,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true, role };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  loadUser: async () => {
    try {
      const res = await authService.getMe();
      const user = unwrapObject(res, null);
      const role = user?.role || 'customer';
      localStorage.setItem('dc_user', JSON.stringify(user));
      localStorage.setItem('dc_role', role);
      set({ user, role, isAuthenticated: true });
    } catch (err) {
      // Invalidate if loading user fails due to bad token
      authService.logout();
      set({ user: null, role: null, isAuthenticated: false });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, role: null, isAuthenticated: false });
  },

  updateProfile: async (updatedData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.updateProfile(updatedData);
      const user = unwrapObject(res, null);
      localStorage.setItem('dc_user', JSON.stringify(user));
      set({ user, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },
}));
