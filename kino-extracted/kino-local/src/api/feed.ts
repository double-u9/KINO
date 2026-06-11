import { api } from './client';

export interface ActivityItem {
  id: string;
  userId: string;
  type: string;
  payload: any;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
  };
}

export interface FeedResponse {
  activities: ActivityItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  payload: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

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

export const fetchProfile = () =>
  api<{ profile: any }>('/api/profile');

export const fetchPublicProfile = (username: string) =>
  api<{ profile: any }>(`/api/profile/user/${username}`, { auth: true });

export const updateProfile = (data: any) =>
  api('/api/profile', { method: 'PUT', body: data });
