import { create } from 'zustand';
import { AuthState } from '@/types';
import { api } from '@/services/api';

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkAuth: () => any;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const user = await api.auth.login(email, password);
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },

  signUp: async (email, password) => {
    const user = await api.auth.signUp(email, password);
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },

  logout: async () => {
    await api.auth.logout();
    set({ user: null, isAuthenticated: false });
  },

  resetPassword: async (email) => {
    await api.auth.resetPassword(email);
  },

  checkAuth: () => {
    return api.auth.onAuthStateChange((user) => {
      if (user) {
        set({ user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    });
  },
}));
