export type MediaType = 'movie' | 'series' | 'anime' | 'music';

export interface Season {
  id: string;
  seasonNumber: number;
  completed: boolean;
  rating?: number | null;
  notes?: string | null;
  completionDate?: string | null;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  isFavorite?: boolean;
  coverImageBase64?: string | null;
  coverImageUrl?: string | null;
  rating?: number | null;
  imdbId?: string | null;
  notes?: string | null;
  totalSeasonsKnown?: number | null;
  seasons: Season[];
  createdAt: number | string;
  updatedAt: number | string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  emailVerified?: boolean;
  profile?: ProfileRecord | null;
  privacy?: PrivacySettings | null;
  settings?: Record<string, unknown> | null;
  friendCount?: number;
  mediaCount?: number;
  createdAt?: string;
}

export interface ProfileRecord {
  displayName?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bannerType?: string | null;
  bio?: string | null;
  favoriteGenres?: string | null;
  themeColor?: string | null;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private' | string;
  showWatchHistory: boolean;
  showFavorites: boolean;
  showActivity: boolean;
  allowFriendRequests: boolean;
}

export interface ActivityItem {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profile: Pick<ProfileRecord, 'displayName' | 'avatarUrl'> | null;
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

export interface FriendInfo {
  friendshipId: string;
  friendSince: string;
  id: string;
  username: string;
  profile: ProfileRecord | null;
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
  profile: Pick<ProfileRecord, 'displayName' | 'avatarUrl' | 'bio'> | null;
  mediaCount: number;
  relationshipStatus:
    | 'none'
    | 'friends'
    | 'pending_sent'
    | 'pending_received'
    | 'blocked';
  requestId: string | null;
  friendshipId: string | null;
}

export interface PendingRequests {
  received: Array<{
    id: string;
    senderId: string;
    createdAt: string;
    sender: {
      id: string;
      username: string;
      profile: Pick<ProfileRecord, 'displayName' | 'avatarUrl'> | null;
    };
  }>;
  sent: Array<{
    id: string;
    receiverId: string;
    createdAt: string;
    receiver: {
      id: string;
      username: string;
      profile: Pick<ProfileRecord, 'displayName' | 'avatarUrl'> | null;
    };
  }>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  createdAt: string | number;
  profile?: ProfileRecord | null;
  mediaCount: number;
  friendCount: number;
  isFriend: boolean;
  isSelf: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export function getCoverImage(item: MediaItem): string | null {
  return item.coverImageUrl || item.coverImageBase64 || null;
}
