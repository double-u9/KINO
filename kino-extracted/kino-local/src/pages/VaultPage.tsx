import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MediaGrid } from '../components/MediaGrid';
import { ToastContainer } from '../components/ToastContainer';
import { Plus, Loader2, X, Film } from 'lucide-react';
import type { MediaType } from '../types';
import {
  fetchMetadataFromSearchResult,
  searchMetadata,
  type MetadataSearchResult,
} from '../utils/fetchMetadata';
import { useToastStore } from '../store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Dropdown } from '../components/Dropdown';

export function VaultPage() {
  const { isLoaded, loadMedia, addMedia } = useAppStore();
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddType, setQuickAddType] = useState<MediaType>('movie');
  const [isFetching, setIsFetching] = useState(false);
  const [isAddingResult, setIsAddingResult] = useState(false);
  const [searchRequest, setSearchRequest] = useState<{
    query: string;
    type: MediaType;
  } | null>(null);
  const [searchResults, setSearchResults] = useState<MetadataSearchResult[]>([]);

  React.useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim() || isFetching || isAddingResult) return;

    const searchTitle = quickAddTitle.trim();
    setIsFetching(true);
    setSearchRequest({ query: searchTitle, type: quickAddType });
    setSearchResults([]);
    useToastStore.getState().addToast(`Searching for "${searchTitle}"...`, 'info');

    const results = await searchMetadata(searchTitle, quickAddType);
    setSearchResults(results);
    setIsFetching(false);
  };

  const closeSearchResults = () => {
    if (isAddingResult) return;
    setSearchRequest(null);
    setSearchResults([]);
  };

  const handleChooseResult = async (result: MetadataSearchResult) => {
    if (isAddingResult) return;

    setIsAddingResult(true);
    const metadata = await fetchMetadataFromSearchResult(result);

    await addMedia({
      title: metadata.title,
      type: result.type,
      rating: metadata.rating,
      imdbId: metadata.imdbId,
      notes: metadata.notes,
      coverImageBase64: metadata.coverImageBase64,
    });

    setQuickAddTitle('');
    setSearchRequest(null);
    setSearchResults([]);
    setIsAddingResult(false);
  };

  const isBusy = isFetching || isAddingResult;

  if (!isLoaded) {
    return null; // AppShell handles the loading state
  }

  return (
    <>
      {/* Quick Add Bar */}
      <div className="mb-6">
        <form
          onSubmit={handleQuickAdd}
          className="flex items-center gap-2 sm:gap-2.5"
        >
          <Dropdown
            value={quickAddType}
            onChange={(v) => setQuickAddType(v as MediaType)}
            options={[
              { value: 'movie', label: 'Movie' },
              { value: 'series', label: 'Series' },
              { value: 'anime', label: 'Anime' },
              { value: 'music', label: 'Music' },
            ]}
          />
          <div
            className="flex flex-1 items-center rounded-xl border border-edge focus-within:border-edge-hi transition-colors duration-300 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <input
              type="text"
              placeholder="Search and add..."
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-ink text-sm px-3 py-2.5 outline-none placeholder:text-ink-3"
            />
          </div>

          <motion.button
            type="submit"
            disabled={isBusy}
            whileHover={{ scale: isBusy ? 1 : 1.03 }}
            whileTap={{ scale: isBusy ? 1 : 0.96 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs flex-shrink-0 disabled:opacity-50 transition-opacity"
            style={{
              background: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 4px 20px rgba(255,255,255,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isBusy ? (
                <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </motion.span>
              ) : (
                <motion.span key="plus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
            <span>{isBusy ? 'Searching...' : 'Add'}</span>
          </motion.button>
        </form>
      </div>

      <MediaGrid />

      <AnimatePresence>
        {searchRequest && (
          <SearchResultChooser
            request={searchRequest}
            results={searchResults}
            isLoading={isFetching}
            isAdding={isAddingResult}
            onClose={closeSearchResults}
            onSelect={handleChooseResult}
          />
        )}
      </AnimatePresence>

      <ToastContainer />
    </>
  );
}

// ── Search Result Chooser Modal (same as before) ──

function SearchResultChooser({
  request,
  results,
  isLoading,
  isAdding,
  onClose,
  onSelect,
}: {
  request: { query: string; type: MediaType };
  results: MetadataSearchResult[];
  isLoading: boolean;
  isAdding: boolean;
  onClose: () => void;
  onSelect: (result: MetadataSearchResult) => void;
}) {
  const manualResult: MetadataSearchResult = {
    id: `manual-${request.type}-${request.query}`,
    source: 'manual',
    title: request.query,
    type: request.type,
    year: null,
    posterUrl: null,
    rating: null,
    notes: '',
    imdbId: null,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-24 pb-6 sm:px-4 sm:pt-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(18px)' }}
        onClick={onClose}
        aria-label="Close search results"
      />

      <motion.section
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-3xl max-h-[calc(100vh-8rem)] overflow-hidden rounded-3xl border border-edge"
        style={{
          background: 'rgba(14,14,14,0.98)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08) inset',
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black tracking-[0.16em] text-ink uppercase">
              Choose a Match
            </h2>
            <p className="truncate text-xs text-ink-3 mt-1">{request.query}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isAdding}
            className="w-9 h-9 rounded-xl border border-edge text-ink-2 hover:text-ink hover:border-edge-hi transition-colors flex items-center justify-center disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-ink-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
          ) : (
            <div className="space-y-3">
              {results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-ink-3">
                  <Film className="w-8 h-8 mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-ink-2">No matches found</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {results.map((result) => (
                    <button
                      key={`${result.source}-${result.id}`}
                      type="button"
                      onClick={() => onSelect(result)}
                      disabled={isAdding}
                      className="group flex min-w-0 gap-3 rounded-2xl border border-edge p-2.5 text-left transition-all duration-200 hover:border-edge-hi hover:bg-white/[0.055] disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.025)' }}
                    >
                      <div className="w-14 h-20 flex-shrink-0 overflow-hidden rounded-xl border border-edge bg-white/[0.035]">
                        {result.posterUrl ? (
                          <img src={result.posterUrl} alt={result.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-3">
                            <Film className="w-5 h-5" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="rounded-md border border-edge px-1.5 py-0.5 text-[8px] font-black tracking-[0.16em] uppercase text-ink-3">
                            {result.type}
                          </span>
                          {result.year && (
                            <span className="text-[10px] font-semibold text-ink-3">{result.year}</span>
                          )}
                          {result.rating && (
                            <span className="ml-auto text-[10px] font-bold text-ink-2">
                              {result.type === 'anime' ? 'MAL' : 'IMDb'} {result.rating}
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-white">
                          {result.title}
                        </h3>
                        {result.notes && (
                          <p className="line-clamp-2 mt-1.5 text-xs leading-snug text-ink-3">
                            {result.notes}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelect(manualResult)}
                disabled={isAdding}
                className="w-full rounded-2xl border border-dashed border-edge px-4 py-3 text-sm font-bold text-ink-2 hover:text-ink hover:border-edge-hi transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                {isAdding ? 'Adding...' : `Add "${request.query}"`}
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
