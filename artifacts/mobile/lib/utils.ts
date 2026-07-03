import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function normalizeApiBaseUrl(value?: string | null) {
  if (!value || value === '$EXPO_PUBLIC_API_URL') return '';
  return value.replace(/\/+$/, '');
}

export function getConfiguredApiBaseUrl() {
  const envUrl = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  if (envUrl) return envUrl;

  const extraUrl = normalizeApiBaseUrl(
    Constants.expoConfig?.extra?.apiUrl as string | undefined,
  );
  if (extraUrl) return extraUrl;

  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    const withProtocol = /^https?:\/\//i.test(domain)
      ? domain
      : `https://${domain}`;
    return normalizeApiBaseUrl(withProtocol);
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  if (Platform.OS === 'web') return '';
  return 'http://localhost:3001';
}

export const API_BASE_URL = getConfiguredApiBaseUrl();

export function buildApiUrl(path: string, query?: Record<string, unknown>) {
  const base = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
  const url = new URL(base, API_BASE_URL || 'http://localhost');

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  if (!API_BASE_URL && !/^https?:\/\//i.test(path)) {
    return `${url.pathname}${url.search}`;
  }

  return url.toString();
}

export function resolveAssetUrl(value?: string | null) {
  if (!value) return null;
  if (/^(data:|https?:\/\/|file:\/\/)/i.test(value)) return value;
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`;
  return value;
}

export function formatRelativeTime(iso?: string | number | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

export function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function initials(name?: string | null) {
  return (name?.trim()?.[0] || '?').toUpperCase();
}
