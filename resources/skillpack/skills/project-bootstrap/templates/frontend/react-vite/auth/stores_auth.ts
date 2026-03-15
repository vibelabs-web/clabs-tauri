/**
 * Authentication store using Zustand.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest, RegisterRequest } from '../types/auth';
import authService from '../services/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: authService.getToken(),
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          set({ token: response.access_token });
          await get().fetchUser();
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Login failed';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(data);
          // Auto-login after registration
          await get().login({ email: data.email, password: data.password });
        } catch (error: any) {
          const message = error.response?.data?.detail || 'Registration failed';
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          set({ user: null, token: null, isLoading: false });
        }
      },

      fetchUser: async () => {
        const token = get().token || authService.getToken();
        if (!token) {
          set({ user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({ user });
        } catch (error) {
          set({ user: null, token: null });
          authService.removeToken();
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

export default useAuthStore;
