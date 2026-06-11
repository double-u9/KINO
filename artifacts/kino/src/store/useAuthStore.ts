import { create } from 'zustand';
import { api, setAccessToken } from '../api/client';
import type { AuthUser } from '../api/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (login: string, password: string) => Promise<boolean>;
  resetLocal: (login: string, newPassword: string) => Promise<boolean>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

let checkAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts true to check session on mount
  error: null,

  login: async (login, password) => {
    set({ error: null, isLoading: true });
    try {
      const res = await api<{ user: AuthUser; accessToken: string }>('/api/auth/login', {
        method: 'POST',
        body: { login, password },
        auth: false,
      });
      setAccessToken(res.accessToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      set({
        error: err?.error?.message ?? 'Login failed.',
        isLoading: false,
      });
      return false;
    }
  },

  resetLocal: async (login, newPassword) => {
    set({ error: null, isLoading: true });
    try {
      await api('/api/auth/reset-local', {
        method: 'POST',
        body: { login, newPassword },
        auth: false,
      });
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({
        error: err?.error?.message ?? 'Password reset failed.',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (email, username, password) => {
    set({ error: null, isLoading: true });
    try {
      const res = await api<{ user: AuthUser; accessToken: string }>('/api/auth/register', {
        method: 'POST',
        body: { email, username, password },
        auth: false,
      });
      setAccessToken(res.accessToken);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err: any) {
      set({
        error: err?.error?.message ?? 'Registration failed.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    if (checkAuthPromise) {
      return checkAuthPromise;
    }

    checkAuthPromise = (async () => {
      set({ isLoading: true });
      try {
        // Try to refresh the token using the httpOnly cookie
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        const { accessToken } = await refreshRes.json();
        setAccessToken(accessToken);

        // Now get user data
        const meRes = await api<{ user: AuthUser }>('/api/auth/me');
        set({ user: meRes.user, isAuthenticated: true, isLoading: false });
      } catch {
        setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      } finally {
        checkAuthPromise = null;
      }
    })();

    return checkAuthPromise;
  },

  clearError: () => set({ error: null }),
}));
