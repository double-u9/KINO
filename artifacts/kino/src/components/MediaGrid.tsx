import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Plus, Check, Search, Film, Clapperboard, Star, Loader2, Share2, Users } from 'lucide-react';
import { MediaDetailModal } from './MediaDetailModal';
import { Dropdown } from './Dropdown';
import * as friendsApi from '../api/friends';
import * as chatApi from '../api/chat';
import { useToastStore } from '../store/useToastStore';
import type { MediaItem, MediaType } from '../types';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
} from 'framer-motion';

const FILTER_LABELS: Record<'all' | MediaType | 'favorites', string> = {
  all: 'All',
  favorites: 'Favorites',
  movie: 'Movies',
  series: 'Series',
  anime: 'Anime',
  music: 'Music',
};

export function MediaGrid() {
  const media = useAppStore((s) => s.media);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | MediaType | 'favorites'>('all');
  const [sort, setSort] = useState<'recent' | 'rating' | 'alpha'>('recent');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const filteredMedia = useMemo(() => {
    let result = [...media];
    if (filter === 'favorites') result = result.filter(m => m.isFavorite);
    else if (filter !== 'all') result = result.filter((m) => m.type === filter);
    if (search) result = result.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'rating') result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === 'alpha') result.sort((a, b) => a.title.localeCompare(b.title));
    else result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
  }, [media, search, filter, sort]);

  const syncedSelected = selectedItem
    ? media.find((m) => m.id === selectedItem.id) ?? null
    : null;

  return (
    <div className="w-full">
      {/* Controls */}
      {media.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8"
        >
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vault..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-ink placeholder:text-ink-3 outline-none border border-edge focus:border-edge-hi transition-colors duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>

          {/* Filter pills + sort row */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div
              className="flex items-center gap-1 p-1 rounded-xl border border-edge flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {(['all', 'favorites', 'movie', 'series', 'anime', 'music'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 whitespace-nowrap ${filter === f
                    ? 'bg-ink text-void shadow-sm'
                    : 'text-ink-3 hover:text-ink hover:bg-white/5'
                    }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>

            <Dropdown
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { value: 'recent', label: 'Recent' },
                { value: 'rating', label: 'Top Rated' },
                { value: 'alpha', label: 'A to Z' },
              ]}
            />

            <span className="ml-auto text-[10px] font-semibold text-ink-3 hidden sm:block whitespace-nowrap flex-shrink-0">
              {filteredMedia.length} {filteredMedia.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </motion.div>
      )}

      {/* States */}
      {media.length === 0 ? (
        <EmptyVault />
      ) : filteredMedia.length === 0 ? (
        <NoResults />
      ) : (
        <motion.div
          layout
          className="grid gap-3 sm:gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}
        >
          <AnimatePresence mode="popLayout">
            {filteredMedia.map((item, index) => (
              <MediaCard
                key={item.id}
                item={item}
                index={index}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {syncedSelected && (
          <MediaDetailModal
            item={syncedSelected}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyVault() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-44 text-center"
    >
      <motion.div
        className="relative mb-8"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center border border-edge-hi"
          style={{
            background: 'rgba(255,255,255,0.05)',
            boxShadow: '0 0 48px rgba(255,255,255,0.06)',
          }}
        >
          <Clapperboard className="w-10 h-10 text-ink-2" strokeWidth={1.5} />
        </div>
      </motion.div>
      <h2 className="text-2xl font-bold text-ink mb-3 tracking-tight">The Vault is Empty</h2>
      <p className="text-sm text-ink-2 max-w-xs leading-relaxed">
        Start building your private collection — search for any movie, series, or anime above.
      </p>
    </motion.div>
  );
}

function NoResults() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      <Search className="w-10 h-10 text-ink-3 mb-4" strokeWidth={1.5} />
      <h3 className="text-lg font-semibold text-ink mb-1.5">Nothing found</h3>
      <p className="text-sm text-ink-2">Try different search terms or filters.</p>
    </motion.div>
  );
}

function MediaCard({
  item,
  index,
  onClick,
}: {
  item: MediaItem;
  index: number;
  onClick: () => void;
}) {
  const addSeason = useAppStore((s) => s.addSeason);
  const updateSeason = useAppStore((s) => s.updateSeason);
  const updateMedia = useAppStore((s) => s.updateMedia);

  const [isAddingSeason, setIsAddingSeason] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const isActionPending = React.useRef(false);

  const toggleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    updateMedia(item.id, { isFavorite: !item.isFavorite });
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSharing) {
      setIsSharing(true);
      if (friendsList.length === 0) {
        setIsLoadingFriends(true);
        try {
          const res = await friendsApi.fetchFriends();
          setFriendsList(res.friends);
        } catch {
          useToastStore.getState().addToast('Failed to load friends', 'error');
        }
        setIsLoadingFriends(false);
      }
    } else {
      setIsSharing(false);
    }
  };

  const shareWithFriend = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const payload = JSON.stringify({
        type: 'suggestion',
        mediaId: item.id,
        title: item.title,
        coverImageBase64: item.coverImageBase64,
        rating: item.rating,
        mediaType: item.type
      });
      await chatApi.sendMessage(friendId, payload);
      useToastStore.getState().addToast('Suggestion sent!', 'success');
      setIsSharing(false);
    } catch {
      useToastStore.getState().addToast('Failed to send suggestion', 'error');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.045, 0.45),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ perspective: 900 }}
      className="flex flex-col"
    >
      <motion.div
        className="group relative flex flex-col"
      >
        {/* Poster */}
        <motion.div
          onClick={onClick}
          whileHover={{ y: -4, boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.14)' }}
          transition={{ duration: 0.3 }}
          className="relative w-full overflow-hidden rounded-2xl border border-edge cursor-pointer"
          style={{
            aspectRatio: '2/3',
            background: 'rgba(255,255,255,0.04)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
          }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}
          />

          {/* Cover */}
          {item.coverImageBase64 ? (
            <img
              src={item.coverImageBase64}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-3">
              <Film className="w-8 h-8 mb-2 opacity-40" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold tracking-widest uppercase opacity-40">
                No Poster
              </span>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
            <div
              className="px-2 py-1 rounded-lg text-[9px] font-black tracking-[0.18em] uppercase text-ink border border-edge"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            >
              {item.type}
            </div>
            {item.type !== 'music' && (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border border-edge text-ink"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
              >
                <span className="text-[8px] font-black opacity-50 uppercase">
                  {item.type === 'anime' ? 'MAL' : 'IMDb'}
                </span>
                <span>{item.rating ?? '—'}</span>
              </div>
            )}
          </div>



          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow-lg group-hover:-translate-y-0.5 transition-transform duration-300">
              {item.title}
            </h3>
          </div>

          {/* Favorite Button — inside poster to guarantee hit testing */}
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={item.isFavorite ? `Remove ${item.title} from favorites` : `Favorite ${item.title}`}
            title={item.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
            className={`absolute ${item.type === 'music' ? 'top-3' : 'top-12'} right-3 z-40 w-8 h-8 rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-90`}
            style={{
              background: item.isFavorite ? 'rgba(245,197,24,0.3)' : 'rgba(0,0,0,0.6)',
              borderColor: item.isFavorite ? 'rgba(245,197,24,0.8)' : 'rgba(255,255,255,0.15)',
              color: item.isFavorite ? '#F5C518' : 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
              boxShadow: item.isFavorite ? '0 0 15px rgba(245,197,24,0.3)' : 'none',
            }}
          >
            <Star
              className="w-4 h-4"
              fill={item.isFavorite ? 'currentColor' : 'none'}
              strokeWidth={2.2}
            />
          </button>

          {/* Share Button — inside poster */}
          <button
            type="button"
            onClick={handleShareClick}
            aria-label={`Share ${item.title}`}
            title="Share suggestion"
            className={`absolute ${item.type === 'music' ? 'top-12' : 'top-[88px]'} right-3 z-40 w-8 h-8 rounded-xl border transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-90 ${isSharing
              ? 'bg-blue-600/90 text-white border-blue-500 shadow-lg shadow-blue-500/20'
              : 'bg-black/40 backdrop-blur-md border-white/10 text-white/70 hover:text-white hover:bg-black/60'
              }`}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Share Dropdown Modal (Outside poster to avoid overflow hidden) */}
        <AnimatePresence>
          {isSharing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-[130px] right-3 w-48 z-40 rounded-2xl border border-edge-hi shadow-2xl overflow-hidden flex flex-col"
              style={{ background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(24px)', transform: 'translateZ(20px)' }}
            >
              <div className="px-3 py-2 border-b border-edge flex items-center gap-2">
                <Users className="w-3 h-3 text-ink-3" />
                <span className="text-[10px] font-bold tracking-wider text-ink-3 uppercase">Send to...</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-1 scrollbar-hide">
                {isLoadingFriends ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-ink-3" />
                  </div>
                ) : friendsList.length === 0 ? (
                  <div className="py-4 text-center text-xs text-ink-3 italic">
                    No friends found
                  </div>
                ) : (
                  friendsList.map(friend => (
                    <button
                      key={friend.friendshipId}
                      onClick={(e) => shareWithFriend(friend.id, e)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-edge flex-shrink-0">
                        {friend.profile?.avatarUrl ? (
                          <img src={friend.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-ink bg-white/5">
                            {friend.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-ink truncate">{friend.profile?.displayName || friend.username}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {item.type === 'music' && (
          <div className="mt-3 px-1 flex flex-col gap-2">
            <p className="text-sm font-bold text-ink truncate drop-shadow-md" title={item.notes || ''}>
              {item.notes || 'Unknown Artist'}
            </p>
          </div>
        )}

        {item.type !== 'movie' && item.type !== 'music' && (
          <div className="mt-3 px-0.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black tracking-[0.2em] uppercase text-ink-3">
                Seasons
              </span>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isAddingSeason) return;
                  setIsAddingSeason(true);
                  try {
                    await addSeason(item.id, {
                      seasonNumber: item.seasons.length + 1,
                      completed: false,
                    });
                  } finally {
                    setIsAddingSeason(false);
                  }
                }}
                disabled={isAddingSeason}
                className={`flex items-center gap-1 transition-colors duration-200 ${isAddingSeason ? 'text-ink-3 opacity-50 cursor-not-allowed' : 'text-ink-3 hover:text-ink'}`}
              >
                {isAddingSeason ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                <span className="text-[10px] font-semibold">
                  {isAddingSeason ? 'Adding...' : 'Add'}
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.seasons.length === 0 && (
                <span className="text-[10px] text-ink-3 italic">No seasons tracked</span>
              )}
              <AnimatePresence>
                {item.seasons.map((season) => (
                  <motion.button
                    key={season.id}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSeason(item.id, season.id, { completed: !season.completed });
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all duration-200"
                    style={{
                      background: season.completed ? '#EFEFEF' : 'rgba(255,255,255,0.05)',
                      borderColor: season.completed
                        ? 'rgba(255,255,255,0.4)'
                        : 'rgba(255,255,255,0.08)',
                      color: season.completed ? '#000000' : 'rgba(239,239,239,0.4)',
                      boxShadow: season.completed
                        ? '0 2px 12px rgba(255,255,255,0.15)'
                        : 'none',
                    }}
                    title={`Season ${season.seasonNumber}`}
                  >
                    {season.completed ? (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    ) : (
                      season.seasonNumber
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
