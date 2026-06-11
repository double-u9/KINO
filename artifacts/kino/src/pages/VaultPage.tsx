import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MediaGrid } from '../components/MediaGrid';
import { ToastContainer } from '../components/ToastContainer';
import { Plus, Loader2, X, Film, ChevronDown } from 'lucide-react';
import type { MediaType } from '../types';
import {
  fetchMetadataFromSearchResult,
  searchMetadata,
  type MetadataSearchResult,
} from '../utils/fetchMetadata';
import { useToastStore } from '../store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_OPTS: { value: MediaType; label: string; emoji: string }[] = [
  { value: 'movie', label: 'Movie', emoji: '🎬' },
  { value: 'series', label: 'Series', emoji: '📺' },
  { value: 'anime', label: 'Anime', emoji: '⛩️' },
  { value: 'music', label: 'Music', emoji: '🎵' },
];

export function VaultPage() {
  const { isLoaded, loadMedia, addMedia } = useAppStore();
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddType, setQuickAddType] = useState<MediaType>('movie');
  const [isFetching, setIsFetching] = useState(false);
  const [isAddingResult, setIsAddingResult] = useState(false);
  const [searchRequest, setSearchRequest] = useState<{ query: string; type: MediaType } | null>(null);
  const [searchResults, setSearchResults] = useState<MetadataSearchResult[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);

  React.useEffect(() => { loadMedia(); }, [loadMedia]);

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
  const selectedType = TYPE_OPTS.find(o => o.value === quickAddType)!;

  if (!isLoaded) return null;

  return (
    <>
      {/* Quick-Add Bar */}
      <div className="mb-5">
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          {/* Type selector button */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setTypeOpen(!typeOpen)}
              className="flex items-center gap-1.5 h-[42px] px-3 rounded-xl border border-edge hover:border-edge-hi transition-colors text-sm font-semibold text-ink-2 hover:text-ink"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <span className="text-base leading-none">{selectedType.emoji}</span>
              <span className="hidden sm:inline text-xs">{selectedType.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${typeOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {typeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1.5 w-36 rounded-2xl border border-edge overflow-hidden z-50 shadow-2xl"
                  style={{ background: 'rgba(14,14,14,0.98)', backdropFilter: 'blur(20px)' }}
                >
                  {TYPE_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setQuickAddType(opt.value); setTypeOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        quickAddType === opt.value
                          ? 'text-ink bg-white/[0.07]'
                          : 'text-ink-2 hover:text-ink hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-base">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div
            className="flex flex-1 items-center rounded-xl border border-edge focus-within:border-edge-hi transition-colors duration-200 overflow-hidden h-[42px]"
            style={{ background: 'rgba(255,255,255,0.035)' }}
          >
            <input
              type="text"
              placeholder={`Search ${selectedType.label.toLowerCase()}...`}
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-ink text-sm px-3.5 py-2.5 outline-none placeholder:text-ink-3"
            />
          </div>

          {/* Add button */}
          <motion.button
            type="submit"
            disabled={isBusy || !quickAddTitle.trim()}
            whileHover={{ scale: isBusy ? 1 : 1.03 }}
            whileTap={{ scale: isBusy ? 1 : 0.96 }}
            className="flex items-center justify-center gap-1.5 h-[42px] px-4 rounded-xl font-bold text-xs flex-shrink-0 disabled:opacity-50 transition-opacity"
            style={{
              background: '#FFFFFF',
              color: '#000000',
              minWidth: '64px',
              boxShadow: '0 4px 18px rgba(255,255,255,0.1), 0 1px 0 rgba(255,255,255,0.8) inset',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isBusy ? (
                <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </motion.span>
              ) : (
                <motion.span key="plus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  <span>Add</span>
                </motion.span>
              )}
            </AnimatePresence>
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4 sm:py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(18px)' }}
        onClick={onClose}
        aria-label="Close"
      />

      <motion.section
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full sm:max-w-2xl overflow-hidden sm:rounded-3xl rounded-t-3xl border border-edge"
        style={{
          background: 'rgba(12,12,12,0.99)',
          boxShadow: '0 -20px 80px rgba(0,0,0,0.8), 0 40px 120px rgba(0,0,0,0.9)',
          maxHeight: '85vh',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-edge-hi" />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-sm font-black tracking-[0.14em] text-ink uppercase">Choose a Match</h2>
            <p className="text-xs text-ink-3 mt-0.5 truncate">{request.query}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isAdding}
            className="w-8 h-8 rounded-xl border border-edge text-ink-2 hover:text-ink hover:border-edge-hi transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 sm:p-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
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
                      className="group flex min-w-0 gap-3 rounded-2xl border border-edge p-2.5 text-left transition-all duration-200 hover:border-edge-hi hover:bg-white/[0.05] active:bg-white/[0.08] disabled:opacity-50"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="w-12 h-[68px] sm:w-14 sm:h-20 flex-shrink-0 overflow-hidden rounded-xl border border-edge bg-white/[0.03]">
                        {result.posterUrl ? (
                          <img src={result.posterUrl} alt={result.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="rounded-md border border-edge px-1.5 py-0.5 text-[8px] font-black tracking-[0.14em] uppercase text-ink-3">
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
                          <p className="line-clamp-2 mt-1 text-xs leading-snug text-ink-3">{result.notes}</p>
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
                className="w-full rounded-2xl border border-dashed border-edge px-4 py-3 text-sm font-bold text-ink-2 hover:text-ink hover:border-edge-hi active:bg-white/5 transition-colors disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                {isAdding ? 'Adding...' : `Add "${request.query}" manually`}
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
