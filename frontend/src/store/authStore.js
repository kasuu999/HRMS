import { create } from 'zustand';
import { authAPI } from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  loadUser: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await authAPI.me();
      if (res.data && res.data.success) {
        set({ user: res.data.data, isAuthenticated: true });
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      }
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password, tenantSlug) => {
    set({ isLoading: true });
    try {
      const res = await authAPI.login({ email, password, tenantSlug });
      if (res.data && res.data.success) {
        const { accessToken, refreshToken, user } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, isAuthenticated: true });
        return res.data;
      } else {
        throw new Error(res.data?.message || 'Login failed');
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },

  hasRole: (...roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  }
}));

export default useAuthStore;
