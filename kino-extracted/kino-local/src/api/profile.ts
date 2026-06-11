import { api } from './client';
import type { MediaItem } from '../types';

export interface PublicProfile {
  id: string;
  username: string;
  createdAt: string | number;
  profile?: {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    favoriteGenres?: string | null;
    themeColor?: string | null;
  } | null;
  mediaCount: number;
  friendCount: number;
  isFriend: boolean;
  isSelf: boolean;
}

export async function fetchPublicProfile(username: string): Promise<PublicProfile> {
  const res = await api<{ profile: PublicProfile }>(`/api/profile/user/${username}`);
  return res.profile;
}

export async function fetchUserMedia(username: string): Promise<MediaItem[]> {
  const res = await api<{ media: MediaItem[] }>(`/api/profile/user/${username}/media`);
  return res.media;
}
