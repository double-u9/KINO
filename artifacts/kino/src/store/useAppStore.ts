import { create } from 'zustand';
import type { MediaItem, Season } from '../types';
import * as mediaApi from '../api/media';
import { useToastStore } from './useToastStore';

interface AppState {
  media: MediaItem[];
  isLoaded: boolean;
  loadMedia: () => Promise<void>;
  addMedia: (item: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt' | 'seasons'>) => Promise<void>;
  updateMedia: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  addSeason: (mediaId: string, season: Omit<Season, 'id'>) => Promise<void>;
  updateSeason: (mediaId: string, seasonId: string, updates: Partial<Season>) => Promise<void>;
  deleteSeason: (mediaId: string, seasonId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  media: [],
  isLoaded: false,
  
  loadMedia: async () => {
    try {
      const data = await mediaApi.fetchMedia();
      // Map coverImageUrl → coverImageBase64 for UI compatibility
      const mapped = data.map(item => ({
        ...item,
        coverImageBase64: item.coverImageUrl || item.coverImageBase64 || null,
      }));
      set({ media: mapped, isLoaded: true });
    } catch (err) {
      console.error('Failed to load media:', err);
      set({ media: [], isLoaded: true });
    }
  },

  addMedia: async (item) => {
    try {
      const newItem = await mediaApi.createMedia({
        title: item.title,
        type: item.type,
        coverImageUrl: item.coverImageBase64 || item.coverImageUrl || null,
        rating: item.rating ?? null,
        imdbId: item.imdbId ?? null,
        notes: item.notes ?? null,
        isFavorite: item.isFavorite ?? false,
      });

      // Map coverImageUrl back to coverImageBase64 for UI compatibility
      const mapped = {
        ...newItem,
        coverImageBase64: newItem.coverImageUrl || newItem.coverImageBase64,
      };

      set({ media: [mapped, ...get().media] });
      useToastStore.getState().addToast(`Added "${item.title}" to vault`, 'success');
    } catch (err: any) {
      useToastStore.getState().addToast(
        err?.error?.message || 'Failed to add media',
        'error',
      );
    }
  },

  updateMedia: async (id, updates) => {
    try {
      // Map coverImageBase64 → coverImageUrl for the API
      const apiUpdates: any = { ...updates };
      if (updates.coverImageBase64) {
        apiUpdates.coverImageUrl = updates.coverImageBase64;
        delete apiUpdates.coverImageBase64;
      }
      // Remove fields the API doesn't accept
      delete apiUpdates.id;
      delete apiUpdates.createdAt;
      delete apiUpdates.updatedAt;
      delete apiUpdates.seasons;

      const updated = await mediaApi.updateMedia(id, apiUpdates);
      const mapped = {
        ...updated,
        coverImageBase64: updated.coverImageUrl || updated.coverImageBase64,
      };

      set({
        media: get().media.map(m => m.id === id ? mapped : m),
      });
    } catch (err: any) {
      useToastStore.getState().addToast(
        err?.error?.message || 'Failed to update',
        'error',
      );
    }
  },

  deleteMedia: async (id) => {
    const mediaItem = get().media.find(m => m.id === id);
    try {
      await mediaApi.deleteMedia(id);
      set({ media: get().media.filter(m => m.id !== id) });
      if (mediaItem) {
        useToastStore.getState().addToast(`Deleted "${mediaItem.title}"`, 'info');
      }
    } catch (err: any) {
      useToastStore.getState().addToast(
        err?.error?.message || 'Failed to delete',
        'error',
      );
    }
  },

  addSeason: async (mediaId, season) => {
    try {
      const newSeason = await mediaApi.addSeason(mediaId, season);
      set({
        media: get().media.map(m => {
          if (m.id === mediaId) {
            return {
              ...m,
              seasons: [...m.seasons, newSeason].sort((a, b) => a.seasonNumber - b.seasonNumber),
            };
          }
          return m;
        }),
      });
    } catch (err: any) {
      useToastStore.getState().addToast(
        err?.error?.message || 'Failed to add season',
        'error',
      );
    }
  },

  updateSeason: async (mediaId, seasonId, updates) => {
    try {
      const updated = await mediaApi.updateSeason(mediaId, seasonId, updates);
      set({
        media: get().media.map(m => {
          if (m.id === mediaId) {
            return {
              ...m,
              seasons: m.seasons.map(s => s.id === seasonId ? updated : s),
            };
          }
          return m;
        }),
      });
    } catch (err: any) {
      useToastStore.getState().addToast(
        err?.error?.message || 'Failed to update season',
        'error',
      );
    }
  },

  deleteSeason: async (mediaId, seasonId) => {
    try {
      await mediaApi.deleteSeason(mediaId, seasonId);
      set({
        media: get().media.map(m => {
          if (m.id === mediaId) {
            return {
              ...m,
              seasons: m.seasons.filter(s => s.id !== seasonId),
            };
          }
          return m;
        }),
      });
    } catch (err: any) {
      useToastStore.getState().addToast(
        err?.error?.message || 'Failed to delete season',
        'error',
      );
    }
  },
}));
