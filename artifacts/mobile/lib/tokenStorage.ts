import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'kino.accessToken';
const REFRESH_KEY = 'kino.refreshToken';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

async function setStoredValue(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
    return;
  }

  if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
}

async function getStoredValue(key: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function loadStoredTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    getStoredValue(ACCESS_KEY),
    getStoredValue(REFRESH_KEY),
  ]);

  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken;

  return { accessToken, refreshToken };
}

export async function persistTokens(tokens: {
  accessToken: string | null;
  refreshToken: string | null;
}) {
  memoryAccessToken = tokens.accessToken;
  memoryRefreshToken = tokens.refreshToken;

  await Promise.all([
    setStoredValue(ACCESS_KEY, tokens.accessToken),
    setStoredValue(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens() {
  await persistTokens({ accessToken: null, refreshToken: null });
}

export function getAccessToken() {
  return memoryAccessToken;
}

export function getRefreshToken() {
  return memoryRefreshToken;
}

export function setMemoryAccessToken(token: string | null) {
  memoryAccessToken = token;
}
