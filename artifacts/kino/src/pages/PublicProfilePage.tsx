import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clapperboard, Star, Lock, Film, ArrowLeft, Loader2, Play, Search, Users, Calendar } from 'lucide-react';
import { fetchPublicProfile, fetchUserMedia, type PublicProfile } from '../api/profile';
import type { MediaItem, MediaType } from '../types';
import { getCoverImage } from '../types';
import { Dropdown } from '../components/Dropdown';
import { BannerRenderer } from '../components/profile/BannerRenderer';

const FILTER_LABELS: Record<'all' | MediaType | 'favorites', string> = {
  all: 'All',
  favorites: 'Favorites',
  movie: 'Movies',
  series: 'Series',
  anime: 'Anime',
  music: 'Music',
};

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | MediaType | 'favorites'>('all');
  const [sort, setSort] = useState<'recent' | 'rating' | 'alpha'>('recent');

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchPublicProfile(username),
      fetchUserMedia(username).catch(() => []), // Ignore media fetch errors (e.g. 403)
    ])
      .then(([p, m]) => {
        setProfile(p);
        setMedia(m);
      })
      .catch((err) => {
        if (err?.error?.message) {
          setError(err.error.message);
        } else {
          setError('Failed to load profile.');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  const filteredMedia = useMemo(() => {
    let result = [...media];
    if (filter === 'favorites') result = result.filter(m => m.isFavorite);
    else if (filter !== 'all') result = result.filter((m) => m.type === filter);
    if (search) result = result.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'rating') result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === 'alpha') result.sort((a, b) => a.title.localeCompare(b.title));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [media, search, filter, sort]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-ink-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Lock className="w-12 h-12 text-ink-3 mx-auto mb-6" />
        <h2 className="text-xl font-bold text-ink mb-2">{error}</h2>
        <Link to="/friends" className="text-sm font-semibold text-ink-2 hover:text-ink underline underline-offset-4 mt-6 inline-block">
          Go back to friends
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const tc = profile.profile?.themeColor || '#F5C518';
  const bannerUrl = profile.profile?.bannerUrl;
  const avatarUrl = profile.profile?.avatarUrl;
  const displayName = profile.profile?.displayName || profile.username;
  const bio = profile.profile?.bio;
  const bannerType = (profile as any).profile?.bannerType || 'static';

  const favoriteMedia = media.filter(m => m.isFavorite);
  const hasFavorites = favoriteMedia.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto pb-24"
    >
      <div className="mb-4 flex">
        <Link
          to="/friends"
          className="flex items-center justify-center w-10 h-10 text-ink-3 hover:text-ink transition-colors rounded-xl hover:bg-white/5 border border-edge bg-void/50 backdrop-blur-md"
          title="Back to Friends"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* ═══════════ PROFILE CARD ═══════════ */}
      <div className="relative rounded-3xl overflow-hidden border border-edge mb-8" style={{ boxShadow: `0 0 80px ${tc}08, 0 24px 80px rgba(0,0,0,0.4)` }}>
        {/* ── Banner ── */}
        <div className="relative">
          <BannerRenderer
            bannerUrl={bannerUrl}
            bannerType={bannerType}
            themeColor={tc}
            className="h-48 sm:h-64"
          />
        </div>

        {/* ── Profile Info (Glass Card) ── */}
        <div
          className="relative px-6 pb-6 -mt-16"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(10,10,10,0.98) 40px)',
          }}
        >
          <div
            className="relative rounded-2xl p-5 sm:p-6 border border-edge"
            style={{
              background: 'rgba(16,16,16,0.85)',
              backdropFilter: 'blur(24px)',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
            }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-5 -mt-14 sm:-mt-16 mb-4">
              {/* ── Avatar ── */}
              <div className="relative flex-shrink-0">
                {/* Ambient glow ring */}
                <motion.div
                  className="absolute -inset-1.5 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, ${tc}66, ${tc}22, ${tc}66)`,
                    filter: 'blur(6px)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />

                <div
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-[3px] overflow-hidden flex items-center justify-center"
                  style={{
                    borderColor: tc,
                    boxShadow: `0 0 30px ${tc}33, 0 0 60px ${tc}15, 0 8px 24px rgba(0,0,0,0.5)`,
                    background: avatarUrl ? '#000' : `linear-gradient(135deg, ${tc}44, rgba(255,255,255,0.08))`,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-ink uppercase select-none">
                      {profile.username[0]}
                    </span>
                  )}
                </div>

                {profile.isFriend && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-400 text-black text-[10px] font-bold px-2 py-1 rounded-lg border-2 border-void shadow-lg z-10">
                    Friend
                  </div>
                )}
              </div>

              {/* ── Name & Username ── */}
              <div className="flex-1 min-w-0 pb-1 text-center sm:text-left mt-3 sm:mt-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight leading-tight truncate">
                  {displayName}
                </h1>
                <p className="text-sm text-ink-3 font-medium mt-0.5">@{profile.username}</p>
              </div>

              <div className="flex items-center gap-4 text-center mt-4 sm:mt-0 pb-1">
                <div>
                  <div className="text-2xl font-black text-ink">{media.filter(m => m.type !== 'music').length}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-ink-3">Shows</div>
                </div>
                <div className="w-px h-8 bg-edge"></div>
                <div>
                  <div className="text-2xl font-black text-ink">{media.filter(m => m.type === 'music').length}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-ink-3">Music</div>
                </div>
                <div className="w-px h-8 bg-edge"></div>
                <div>
                  <div className="text-2xl font-black text-ink">{profile.friendCount}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-ink-3">Friends</div>
                </div>
              </div>
            </div>

            {/* ── Bio ── */}
            <div className="mt-4 sm:mt-1 text-center sm:text-left">
              {bio ? (
                <p className="text-sm text-ink-2 leading-relaxed max-w-2xl">{bio}</p>
              ) : (
                <p className="text-sm text-ink-3 italic">No bio yet</p>
              )}
            </div>

            {/* ── Accent line ── */}
            <motion.div
              className="h-[2px] rounded-full mt-5"
              style={{ background: `linear-gradient(90deg, transparent, ${tc}55, ${tc}88, ${tc}55, transparent)` }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* ── Meta row ── */}
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px] text-ink-3 font-medium">
                <Calendar className="w-3 h-3" />
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-24 border border-edge rounded-3xl" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <Film className="w-12 h-12 text-ink-3 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-ink mb-2">Vault is empty</h3>
          <p className="text-sm text-ink-3">This user hasn't added any shows yet.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* All Shows Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Clapperboard className="w-5 h-5 text-ink-2" />
              <h2 className="text-[10px] font-black tracking-[0.2em] text-ink uppercase">VAULT</h2>
            </div>

            {/* Controls */}
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

            <AnimatePresence mode="popLayout">
              {filteredMedia.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-24 text-center border border-edge rounded-3xl"
                  style={{ background: 'rgba(255,255,255,0.015)' }}
                >
                  <Search className="w-8 h-8 text-ink-3 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-ink-2">No matches found</p>
                </motion.div>
              ) : (
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  <AnimatePresence>
                    {filteredMedia.map(item => (
                      <PublicMediaCard key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      )}
    </motion.div>
  );
}

function PublicMediaCard({ item }: { item: MediaItem }) {
  const coverUrl = getCoverImage(item);
  const seasonCount = item.seasons.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative flex flex-col cursor-default"
    >
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl border border-edge mb-3 shadow-sm bg-edge-hi/30">
        {coverUrl ? (
          <img src={coverUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <Film className="w-8 h-8 text-ink-3 mb-2 opacity-50" />
            <span className="text-xs font-semibold text-ink-3 opacity-70 line-clamp-3">{item.title}</span>
          </div>
        )}

        {/* Rating Badge */}
        {item.rating != null && (
          <div className="absolute top-2 left-2 bg-void/80 backdrop-blur border border-edge px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 text-imdb fill-imdb" />
            <span className="text-[10px] font-black text-ink">{item.rating}</span>
          </div>
        )}

        {/* Favorite Badge */}
        {item.isFavorite && (
          <div className="absolute top-2 right-2 bg-imdb text-void px-2 py-1 rounded-lg shadow-lg">
            <Star className="w-3 h-3 fill-void" />
          </div>
        )}

        {/* Hover glow */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-ink truncate group-hover:text-ink-hi transition-colors">{item.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-ink-3 border border-edge px-1.5 py-0.5 rounded-md">
            {item.type}
          </span>
          {seasonCount > 0 && (
            <span className="text-[10px] font-semibold text-ink-2">
              {seasonCount} {seasonCount === 1 ? 'Season' : 'Seasons'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
