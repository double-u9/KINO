import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  persistTokens,
  setMemoryAccessToken,
} from '@/lib/tokenStorage';
import { buildApiUrl } from '@/lib/utils';
import type {
  ActivityItem,
  AuthUser,
  ChatMessage,
  FeedResponse,
  FriendInfo,
  LoginResponse,
  MediaItem,
  NotificationsResponse,
  PendingRequests,
  PrivacySettings,
  PublicProfile,
  Season,
  UserSearchResult,
} from '@/lib/types';

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
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
  body?: unknown;
  query?: Record<string, unknown>;
  auth?: boolean;
  isFormData?: boolean;
  retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function parseErrorResponse(res: Response): Promise<ApiError> {
  const data = await res.json().catch(() => null);
  return (
    data?.error || {
      message: res.statusText || 'Request failed',
      code: 'REQUEST_FAILED',
    }
  );
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const res = await fetch(buildApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Refresh-Token': refreshToken,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearTokens();
      return null;
    }

    const tokens = (await res.json()) as {
      accessToken: string;
      refreshToken?: string;
    };

    await persistTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || refreshToken,
    });

    return tokens.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    auth = true,
    isFormData = false,
    retry = true,
  } = options;

  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAccessToken() || (await refreshAccessToken());
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildApiUrl(path, query), {
    method,
    headers,
    body: isFormData ? (body as BodyInit) : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const token = await refreshAccessToken();
    if (token) {
      setMemoryAccessToken(token);
      return api<T>(path, { ...options, retry: false });
    }

    throw new ApiRequestError(401, {
      message: 'Session expired. Please sign in again.',
      code: 'SESSION_EXPIRED',
    });
  }

  if (!res.ok) {
    throw new ApiRequestError(res.status, await parseErrorResponse(res));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function uploadFile<T>(
  path: string,
  file: { uri: string; name: string; type: string },
): Promise<T> {
  const form = new FormData();
  form.append('file', file as unknown as Blob);
  return api<T>(path, {
    method: 'POST',
    body: form,
    isFormData: true,
  });
}

export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
}) {
  const res = await api<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: data,
    auth: false,
  });
  await persistTokens({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  });
  return res;
}

export async function loginUser(data: { login: string; password: string }) {
  const res = await api<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: data,
    auth: false,
  });
  await persistTokens({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  });
  return res;
}

export async function logoutUser() {
  const refreshToken = getRefreshToken();
  try {
    await api('/api/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    });
  } finally {
    await clearTokens();
  }
}

export async function resetLocalUser(data: {
  login: string;
  newPassword: string;
}) {
  return api<{ message: string }>('/api/auth/reset-local', {
    method: 'POST',
    body: data,
    auth: false,
  });
}

export async function refreshSession() {
  const token = await refreshAccessToken();
  if (!token) return null;
  return api<{ user: AuthUser }>('/api/auth/me');
}

export const fetchMedia = (filters?: {
  type?: string;
  search?: string;
  sort?: string;
}) => api<{ media: MediaItem[] }>('/api/media', { query: filters });

export const createMedia = (data: Partial<MediaItem> & {
  title: string;
  type: string;
}) => api<{ media: MediaItem }>('/api/media', { method: 'POST', body: data });

export const updateMedia = (id: string, data: Partial<MediaItem>) =>
  api<{ media: MediaItem }>(`/api/media/${id}`, { method: 'PUT', body: data });

export const deleteMedia = (id: string) =>
  api(`/api/media/${id}`, { method: 'DELETE' });

export const addSeason = (mediaId: string, data: Omit<Season, 'id'>) =>
  api<{ season: Season }>(`/api/media/${mediaId}/seasons`, {
    method: 'POST',
    body: data,
  });

export const updateSeason = (
  mediaId: string,
  seasonId: string,
  data: Partial<Season>,
) =>
  api<{ season: Season }>(`/api/media/${mediaId}/seasons/${seasonId}`, {
    method: 'PUT',
    body: data,
  });

export const fetchFeed = (cursor?: string) =>
  api<FeedResponse>('/api/feed', { query: { cursor } });

export const fetchNotifications = (cursor?: string) =>
  api<NotificationsResponse>('/api/notifications', { query: { cursor } });

export const fetchUnreadCount = () =>
  api<{ count: number }>('/api/notifications/unread-count');

export const markNotificationRead = (id: string) =>
  api(`/api/notifications/${id}/read`, { method: 'PUT' });

export const markAllRead = () =>
  api('/api/notifications/read-all', { method: 'PUT' });

export const fetchOwnProfile = () =>
  api<{ profile: AuthUser & { privacy?: PrivacySettings | null } }>('/api/profile');

export const updateProfile = (data: Record<string, unknown>) =>
  api('/api/profile', { method: 'PUT', body: data });

export const updatePrivacy = (data: PrivacySettings) =>
  api('/api/profile/privacy', { method: 'PUT', body: data });

export const fetchPublicProfile = (username: string) =>
  api<{ profile: PublicProfile }>(`/api/profile/user/${username}`);

export const fetchUserMedia = (username: string) =>
  api<{ media: MediaItem[] }>(`/api/profile/user/${username}/media`);

export const fetchFriends = () =>
  api<{ friends: FriendInfo[] }>('/api/friends');

export const fetchRequests = () =>
  api<PendingRequests>('/api/friends/requests');

export const searchUsers = (q: string) =>
  api<{ users: UserSearchResult[] }>('/api/friends/search', { query: { q } });

export const sendFriendRequest = (userId: string) =>
  api(`/api/friends/request/${userId}`, { method: 'POST' });

export const acceptRequest = (requestId: string) =>
  api(`/api/friends/accept/${requestId}`, { method: 'POST' });

export const declineRequest = (requestId: string) =>
  api(`/api/friends/decline/${requestId}`, { method: 'POST' });

export const cancelRequest = (requestId: string) =>
  api(`/api/friends/cancel/${requestId}`, { method: 'DELETE' });

export const removeFriend = (friendshipId: string) =>
  api(`/api/friends/${friendshipId}`, { method: 'DELETE' });

export const fetchChatHistory = (friendId: string) =>
  api<ChatMessage[]>(`/api/chat/${friendId}`);

export const sendMessage = (friendId: string, content: string) =>
  api<ChatMessage>(`/api/chat/${friendId}`, {
    method: 'POST',
    body: { content },
  });

export const uploadAvatar = (file: { uri: string; name: string; type: string }) =>
  uploadFile<{ avatarUrl: string }>('/api/upload/avatar', file);

export const removeAvatar = () =>
  api('/api/upload/avatar', { method: 'DELETE' });

export const uploadBanner = (file: { uri: string; name: string; type: string }) =>
  uploadFile<{ bannerUrl: string; bannerType: string }>('/api/upload/banner', file);

export const removeBanner = () =>
  api('/api/upload/banner', { method: 'DELETE' });

export const uploadChatImage = (file: {
  uri: string;
  name: string;
  type: string;
}) => uploadFile<{ imageUrl: string }>('/api/upload/chat-image', file);

export function normalizeActivity(item: ActivityItem): ActivityItem {
  let payload = item.payload || {};

  if (typeof item.payload === 'string') {
    try {
      payload = JSON.parse(item.payload || '{}');
    } catch {
      payload = {};
    }
  }

  return {
    ...item,
    payload,
  };
}
