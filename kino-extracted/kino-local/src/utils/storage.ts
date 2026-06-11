import localforage from 'localforage';
import type { MediaItem } from '../types';

localforage.config({
  name: 'KinoDB',
  storeName: 'media_store',
  description: 'Stores private media collections locally'
});

export const storage = {
  async getMedia(): Promise<MediaItem[]> {
    const data = await localforage.getItem<MediaItem[]>('media_collection');
    return data || [];
  },
  async saveMedia(media: MediaItem[]): Promise<void> {
    await localforage.setItem('media_collection', media);
  }
};
