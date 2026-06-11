import { api, setAccessToken } from './client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<LoginResponse> {
  const res = await api<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: data,
    auth: false,
  });
  setAccessToken(res.accessToken);
  return res;
}

export async function loginUser(data: {
  login: string;
  password: string;
}): Promise<LoginResponse> {
  const res = await api<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: data,
    auth: false,
  });
  setAccessToken(res.accessToken);
  return res;
}

export async function logoutUser(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

export async function resetLocalUser(data: {
  login: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return await api<{ message: string }>('/api/auth/reset-local', {
    method: 'POST',
    body: data,
    auth: false,
  });
}

export async function refreshToken(): Promise<string> {
  const res = await api<{ accessToken: string }>('/api/auth/refresh', {
    method: 'POST',
    auth: false,
  });
  setAccessToken(res.accessToken);
  return res.accessToken;
}

export async function getMe() {
  return api<{ user: any }>('/api/auth/me');
}
