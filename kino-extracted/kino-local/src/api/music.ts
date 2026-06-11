export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  previewUrl: string | null;
  releaseYear: string;
}

export async function searchMusic(query: string): Promise<MusicSearchResult[]> {
  if (!query.trim()) return [];
  
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`);
    if (!res.ok) throw new Error('Failed to fetch from iTunes');
    
    const data = await res.json();
    
    return data.results.map((item: any) => ({
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      // Upgrade the 100x100 artwork to 600x600 for high quality
      coverUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
      previewUrl: item.previewUrl || null,
      releaseYear: item.releaseDate ? item.releaseDate.substring(0, 4) : ''
    }));
  } catch (error) {
    console.error('iTunes Search Error:', error);
    return [];
  }
}
