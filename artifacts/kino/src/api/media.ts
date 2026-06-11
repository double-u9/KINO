import { api } from './client';
import type { MediaItem, Season } from '../types';

interface MediaResponse {
  media: MediaItem;
}

interface MediaListResponse {
  media: MediaItem[];
}

export async function fetchMedia(filters?: {
  type?: string;
  search?: string;
  sort?: string;
}): Promise<MediaItem[]> {
  const res = await api<MediaListResponse>('/api/media', {
    query: filters as Record<string, string | undefined>,
  });
  return res.media;
}

export async function createMedia(data: {
  title: string;
  type: string;
  coverImageUrl?: string | null;
  rating?: number | null;
  imdbId?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
}): Promise<MediaItem> {
  const res = await api<MediaResponse>('/api/media', {
    method: 'POST',
    body: data,
  });
  return res.media;
}

export async function updateMedia(
  id: string,
  data: Partial<MediaItem>,
): Promise<MediaItem> {
  const res = await api<MediaResponse>(`/api/media/${id}`, {
    method: 'PUT',
    body: data,
  });
  return res.media;
}

export async function deleteMedia(id: string): Promise<void> {
  await api(`/api/media/${id}`, { method: 'DELETE' });
}

export async function addSeason(
  mediaId: string,
  data: Omit<Season, 'id'>,
): Promise<Season> {
  const res = await api<{ season: Season }>(`/api/media/${mediaId}/seasons`, {
    method: 'POST',
    body: data,
  });
  return res.season;
}

export async function updateSeason(
  mediaId: string,
  seasonId: string,
  data: Partial<Season>,
): Promise<Season> {
  const res = await api<{ season: Season }>(
    `/api/media/${mediaId}/seasons/${seasonId}`,
    { method: 'PUT', body: data },
  );
  return res.season;
}

export async function deleteSeason(
  mediaId: string,
  seasonId: string,
): Promise<void> {
  await api(`/api/media/${mediaId}/seasons/${seasonId}`, { method: 'DELETE' });
}
