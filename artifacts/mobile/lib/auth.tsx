import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  resetLocalUser,
} from '@/lib/api';
import { clearTokens, loadStoredTokens } from '@/lib/tokenStorage';
import type { AuthUser } from '@/lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<boolean>;
  resetPassword: (login: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const res = await refreshSession();
    setUser(res?.user ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(true);
      try {
        const tokens = await loadStoredTokens();
        if (!tokens.refreshToken) {
          if (active) setUser(null);
          return;
        }

        const res = await refreshSession();
        if (active) setUser(res?.user ?? null);
      } catch {
        await clearTokens();
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginUser({ login: loginValue, password });
      setUser(res.user);
      return true;
    } catch (err: any) {
      setError(err?.error?.message || 'Login failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await registerUser({ email, username, password });
        setUser(res.user);
        return true;
      } catch (err: any) {
        setError(err?.error?.message || 'Registration failed.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const resetPassword = useCallback(
    async (loginValue: string, newPassword: string) => {
      setError(null);
      setIsLoading(true);
      try {
        await resetLocalUser({ login: loginValue, newPassword });
        return true;
      } catch (err: any) {
        setError(err?.error?.message || 'Password reset failed.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      login,
      register,
      resetPassword,
      logout,
      refreshUser,
      clearError: () => setError(null),
    }),
    [error, isLoading, login, logout, refreshUser, register, resetPassword, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
