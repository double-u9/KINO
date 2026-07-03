import type { MediaType } from '@/lib/types';

export interface MetadataSearchResult {
  id: string;
  source: 'omdb' | 'jikan' | 'itunes' | 'manual';
  title: string;
  type: MediaType;
  year: string | null;
  posterUrl: string | null;
  rating: number | null;
  notes: string;
  imdbId: string | null;
}

export interface MetadataResult {
  title: string;
  coverImageUrl: string | null;
  notes: string;
  rating: number | null;
  imdbId: string | null;
}

function cleanText(value: unknown) {
  return typeof value === 'string' && value !== 'N/A' ? value : '';
}

function cleanRating(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value === 'N/A') return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function cleanPoster(value: unknown) {
  return typeof value === 'string' && value !== 'N/A' ? value : null;
}

function mediaSearchType(type: MediaType) {
  return type === 'series' ? 'series' : 'movie';
}

function animeTitle(item: any, fallback: string) {
  return cleanText(item.title_english) || cleanText(item.title) || fallback;
}

function animePoster(item: any) {
  return (
    item.images?.webp?.large_image_url ||
    item.images?.webp?.image_url ||
    item.images?.jpg?.large_image_url ||
    item.images?.jpg?.image_url ||
    null
  );
}

export async function searchMetadata(
  title: string,
  type: MediaType,
): Promise<MetadataSearchResult[]> {
  const query = title.trim();
  if (!query) return [];

  try {
    if (type === 'movie' || type === 'series') {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=trilogy&s=${encodeURIComponent(query)}&type=${mediaSearchType(type)}&page=1`,
      );
      const data = await res.json();
      const items = Array.isArray(data.Search) ? data.Search : [];

      return items.slice(0, 8).map((item: any) => ({
        id: item.imdbID || `${item.Title}-${item.Year}`,
        source: 'omdb',
        title: cleanText(item.Title) || query,
        type,
        year: cleanText(item.Year) || null,
        posterUrl: cleanPoster(item.Poster),
        rating: null,
        notes: '',
        imdbId: cleanText(item.imdbID) || null,
      }));
    }

    if (type === 'music') {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`,
      );
      const data = await res.json();
      const items = Array.isArray(data.results) ? data.results : [];

      return items.map((item: any) => ({
        id: String(item.trackId),
        source: 'itunes',
        title: item.trackName,
        type,
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : null,
        posterUrl: item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '600x600bb')
          : null,
        rating: null,
        notes: item.artistName + (item.collectionName ? ` - ${item.collectionName}` : ''),
        imdbId: item.previewUrl || null,
      }));
    }

    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8`,
    );
    const data = await res.json();
    const items = Array.isArray(data.data) ? data.data : [];

    return items.map((item: any) => ({
      id: String(item.mal_id || animeTitle(item, query)),
      source: 'jikan',
      title: animeTitle(item, query),
      type,
      year: String(item.year || item.aired?.prop?.from?.year || '').trim() || null,
      posterUrl: animePoster(item),
      rating: cleanRating(item.score),
      notes: cleanText(item.synopsis),
      imdbId: null,
    }));
  } catch {
    return [];
  }
}

export async function fetchMetadataFromSearchResult(
  result: MetadataSearchResult,
): Promise<MetadataResult> {
  if (result.source === 'manual') {
    return {
      title: result.title,
      coverImageUrl: null,
      notes: '',
      rating: null,
      imdbId: null,
    };
  }

  try {
    if (result.source === 'omdb' && result.imdbId) {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=trilogy&i=${encodeURIComponent(result.imdbId)}&plot=full`,
      );
      const data = await res.json();
      if (data.Response === 'True') {
        return {
          title: cleanText(data.Title) || result.title,
          coverImageUrl: cleanPoster(data.Poster) || result.posterUrl,
          notes: cleanText(data.Plot) || result.notes,
          rating: cleanRating(data.imdbRating) ?? result.rating,
          imdbId: cleanText(data.imdbID) || result.imdbId,
        };
      }
    }

    if (result.source === 'jikan') {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${result.id}`);
      const data = await res.json();
      const item = data.data;
      if (item) {
        return {
          title: animeTitle(item, result.title),
          coverImageUrl: animePoster(item) || result.posterUrl,
          notes: cleanText(item.synopsis) || result.notes,
          rating: cleanRating(item.score) ?? result.rating,
          imdbId: null,
        };
      }
    }
  } catch {
    // Fall through to the selected search result.
  }

  return {
    title: result.title,
    coverImageUrl: result.posterUrl,
    notes: result.notes,
    rating: result.rating,
    imdbId: result.imdbId,
  };
}
