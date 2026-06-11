import { api } from './client';

export interface FriendInfo {
  friendshipId: string;
  friendSince: string;
  id: string;
  username: string;
  profile: { displayName: string | null; avatarUrl: string | null; bio: string | null; themeColor: string | null } | null;
  mediaCount: number;
  unreadCount: number;
  latestMessage?: {
    content: string;
    createdAt: string;
    isMine: boolean;
    read: boolean;
  };
}

export interface UserSearchResult {
  id: string;
  username: string;
  profile: { displayName: string | null; avatarUrl: string | null; bio: string | null } | null;
  mediaCount: number;
  relationshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'blocked';
  requestId: string | null;
  friendshipId: string | null;
}

export interface PendingRequests {
  received: Array<{
    id: string;
    senderId: string;
    createdAt: string;
    sender: { id: string; username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
  }>;
  sent: Array<{
    id: string;
    receiverId: string;
    createdAt: string;
    receiver: { id: string; username: string; profile: { displayName: string | null; avatarUrl: string | null } | null };
  }>;
}

export const fetchFriends = () => api<{ friends: FriendInfo[] }>('/api/friends');
export const fetchRequests = () => api<PendingRequests>('/api/friends/requests');
export const searchUsers = (q: string) => api<{ users: UserSearchResult[] }>('/api/friends/search', { query: { q } });
export const sendFriendRequest = (userId: string) => api('/api/friends/request/' + userId, { method: 'POST' });
export const acceptRequest = (requestId: string) => api('/api/friends/accept/' + requestId, { method: 'POST' });
export const declineRequest = (requestId: string) => api('/api/friends/decline/' + requestId, { method: 'POST' });
export const cancelRequest = (requestId: string) => api('/api/friends/cancel/' + requestId, { method: 'DELETE' });
export const removeFriend = (friendshipId: string) => api('/api/friends/' + friendshipId, { method: 'DELETE' });
export const blockUser = (userId: string) => api('/api/friends/block/' + userId, { method: 'POST' });
