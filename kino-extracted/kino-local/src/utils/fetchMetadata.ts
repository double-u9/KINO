import type { MediaType } from '../types';

export interface MetadataResult {
  title: string;
  coverImageBase64: string | null;
  notes: string;
  rating: number | null;
  imdbId: string | null;
}

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

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch image base64:', error);
    return null;
  }
}

function cleanText(value: unknown): string {
  return typeof value === 'string' && value !== 'N/A' ? value : '';
}

function cleanRating(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || value === 'N/A') return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function cleanPoster(value: unknown): string | null {
  return typeof value === 'string' && value !== 'N/A' ? value : null;
}

function mediaSearchType(type: MediaType) {
  return type === 'series' ? 'series' : 'movie';
}

function animeYear(item: any): string | null {
  return String(item.year || item.aired?.prop?.from?.year || '').trim() || null;
}

function animeTitle(item: any, fallback: string): string {
  return cleanText(item.title_english) || cleanText(item.title) || fallback;
}

function animePoster(item: any): string | null {
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
        source: 'omdb' as const,
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
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`);
      const data = await res.json();
      const items = Array.isArray(data.results) ? data.results : [];

      return items.map((item: any) => ({
        id: String(item.trackId),
        source: 'itunes' as const,
        title: item.trackName,
        type,
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : null,
        posterUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null,
        rating: null,
        notes: item.artistName + (item.collectionName ? ` • ${item.collectionName}` : ''),
        imdbId: item.previewUrl || null, // Storing previewUrl in imdbId for convenience
      }));
    }

    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8`,
    );
    const data = await res.json();
    const items = Array.isArray(data.data) ? data.data : [];

    return items.map((item: any) => ({
      id: String(item.mal_id || animeTitle(item, query)),
      source: 'jikan' as const,
      title: animeTitle(item, query),
      type,
      year: animeYear(item),
      posterUrl: animePoster(item),
      rating: cleanRating(item.score),
      notes: cleanText(item.synopsis),
      imdbId: null,
    }));
  } catch (error) {
    console.error('Metadata search failed:', error);
    return [];
  }
}

export async function fetchMetadataFromSearchResult(
  result: MetadataSearchResult,
): Promise<MetadataResult> {
  if (result.source === 'manual') {
    return fetchMetadata(result.title, result.type);
  }

  try {
    if (result.source === 'omdb' && result.imdbId) {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=trilogy&i=${encodeURIComponent(result.imdbId)}&plot=full`,
      );
      const data = await res.json();

      if (data.Response === 'True') {
        const posterUrl = cleanPoster(data.Poster) || result.posterUrl;
        return {
          title: cleanText(data.Title) || result.title,
          coverImageBase64: posterUrl ? await urlToBase64(posterUrl) : null,
          notes: cleanText(data.Plot) || result.notes,
          rating: cleanRating(data.imdbRating) ?? result.rating,
          imdbId: cleanText(data.imdbID) || result.imdbId,
        };
      }
    }

    if (result.source === 'jikan') {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${encodeURIComponent(result.id)}`);
      const data = await res.json();
      const item = data.data;

      if (item) {
        const posterUrl = animePoster(item) || result.posterUrl;
        return {
          title: animeTitle(item, result.title),
          coverImageBase64: posterUrl ? await urlToBase64(posterUrl) : null,
          notes: cleanText(item.synopsis) || result.notes,
          rating: cleanRating(item.score) ?? result.rating,
          imdbId: null,
        };
      }
    }

    if (result.source === 'itunes') {
      return {
        title: result.title,
        coverImageBase64: result.posterUrl ? await urlToBase64(result.posterUrl) : null,
        notes: result.notes,
        rating: null,
        imdbId: result.imdbId, // Contains previewUrl
      };
    }
  } catch (error) {
    console.error('Selected metadata fetch failed:', error);
  }

  return {
    title: result.title,
    coverImageBase64: result.posterUrl ? await urlToBase64(result.posterUrl) : null,
    notes: result.notes,
    rating: result.rating,
    imdbId: result.imdbId,
  };
}

export async function fetchMetadata(title: string, type: MediaType): Promise<MetadataResult> {
  let finalTitle = title;
  let coverUrl: string | null = null;
  let notes = '';
  let rating: number | null = null;
  let imdbId: string | null = null;

  try {
    if (type === 'movie' || type === 'series') {
      const res = await fetch(`https://www.omdbapi.com/?apikey=trilogy&t=${encodeURIComponent(title)}&type=${type}`);
      const data = await res.json();

      if (data.Response === 'True') {
        finalTitle = data.Title || title;
        if (data.Poster && data.Poster !== 'N/A') coverUrl = data.Poster;
        notes = data.Plot !== 'N/A' ? data.Plot : '';

        if (data.imdbRating && data.imdbRating !== 'N/A') {
          rating = parseFloat(data.imdbRating);
        }
        if (data.imdbID && data.imdbID !== 'N/A') {
          imdbId = data.imdbID;
        }
      }
    } else if (type === 'anime') {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        const item = data.data[0];
        finalTitle = item.title_english || item.title || title;
        coverUrl = item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url;
        notes = item.synopsis || '';
        if (item.score) {
          rating = parseFloat(item.score);
        }
      }
    } else if (type === 'music') {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&entity=song&limit=1`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        finalTitle = item.trackName;
        coverUrl = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null;
        const releaseYear = item.releaseDate ? item.releaseDate.substring(0, 4) : '';
        notes = item.artistName + (item.collectionName ? ` • ${item.collectionName}` : '') + (releaseYear ? ` • ${releaseYear}` : '');
        imdbId = item.previewUrl || null;
      }
    }

    let coverBase64 = null;
    if (coverUrl) {
      coverBase64 = await urlToBase64(coverUrl);
    }

    return {
      title: finalTitle,
      coverImageBase64: coverBase64,
      notes,
      rating,
      imdbId
    };
  } catch (error) {
    console.error('Metadata fetch failed:', error);
    return { title, coverImageBase64: null, notes: '', rating: null, imdbId: null };
  }
}
