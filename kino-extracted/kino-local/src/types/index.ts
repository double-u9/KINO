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
  coverImageBase64?: string | null; // kept for backward compat with existing UI
  coverImageUrl?: string | null;    // new server field
  rating?: number | null;
  imdbId?: string | null;
  notes?: string | null;
  totalSeasonsKnown?: number | null;
  seasons: Season[];
  createdAt: number | string;
  updatedAt: number | string;
}

// Cover image helper — returns whatever image source is available
export function getCoverImage(item: MediaItem): string | null {
  return item.coverImageUrl || item.coverImageBase64 || null;
}
