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
    try {
      const res = await authService.loginEmail(email, password);
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

  sendOtp: async (mobile) => {
    set({ isLoading: true, error: null });
    try {
      await authService.sendOtp(mobile);
      set({ isLoading: false });
      return { success: true };
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
