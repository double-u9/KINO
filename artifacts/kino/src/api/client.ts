/**
 * API client with automatic token refresh and error handling.
 */

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshAccessToken(): Promise<string> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    accessToken = null;
    throw new Error('Session expired');
  }

  const data = await res.json();
  accessToken = data.accessToken;
  return data.accessToken;
}

async function getValidToken(): Promise<string | null> {
  if (accessToken) return accessToken;

  // If already refreshing, wait in queue
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  try {
    isRefreshing = true;
    const token = await refreshAccessToken();
    refreshQueue.forEach((cb) => cb(token));
    refreshQueue = [];
    return token;
  } catch {
    refreshQueue = [];
    return null;
  } finally {
    isRefreshing = false;
  }
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError,
  ) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}

interface RequestOptions {
  method?: string;
  body?: any;
  query?: Record<string, string | undefined>;
  auth?: boolean;
  isFormData?: boolean;
}

export async function api<T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;

  // Build URL with query params
  let url = path;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, value);
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  
  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await getValidToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.isFormData ? body : (body ? JSON.stringify(body) : undefined),
    credentials: 'include',
  });

  if (!res.ok) {
    // If 401, try refreshing token once
    if (res.status === 401 && auth) {
      try {
        const newToken = await refreshAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;

        const retry = await fetch(url, {
          method,
          headers,
          body: options.isFormData ? body : (body ? JSON.stringify(body) : undefined),
          credentials: 'include',
        });

        if (retry.ok) {
          return retry.json();
        }

        const retryData = await retry.json().catch(() => ({ error: { message: 'Request failed', code: 'UNKNOWN' } }));
        throw new ApiRequestError(retry.status, retryData.error);
      } catch (err) {
        if (err instanceof ApiRequestError) throw err;
        // Refresh failed — clear token, user needs to login
        accessToken = null;
        throw new ApiRequestError(401, {
          message: 'Session expired. Please login again.',
          code: 'SESSION_EXPIRED',
        });
      }
    }

    const data = await res.json().catch(() => ({ error: { message: 'Request failed', code: 'UNKNOWN' } }));
    throw new ApiRequestError(res.status, data.error);
  }

  return res.json();
}
