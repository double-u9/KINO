import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Rss, Film, Star, CheckCircle, UserPlus, Loader2, Plus } from 'lucide-react';
import { fetchFeed, type ActivityItem } from '../api/feed';

const ACTIVITY_CONFIG: Record<string, { icon: any; verb: string; color: string }> = {
  added_media: { icon: Plus, verb: 'added', color: 'text-emerald-400' },
  rated: { icon: Star, verb: 'rated', color: 'text-imdb' },
  favorited: { icon: Star, verb: 'favorited', color: 'text-imdb' },
  completed_season: { icon: CheckCircle, verb: 'completed a season of', color: 'text-blue-400' },
  joined: { icon: UserPlus, verb: 'joined Kino', color: 'text-ink-2' },
  friended: { icon: UserPlus, verb: 'became friends with', color: 'text-pink-400' },
};

export function FeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (cursor?: string) => {
    try {
      const res = await fetchFeed(cursor);
      if (cursor) {
        setActivities(prev => [...prev, ...res.activities]);
      } else {
        setActivities(res.activities);
      }
      setHasMore(res.hasMore);
      setNextCursor(res.nextCursor);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await load(nextCursor);
    setLoadingMore(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="text-lg font-black tracking-[0.14em] text-ink uppercase mb-6">
        Activity Feed
      </h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-edge-hi mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Rss className="w-7 h-7 text-ink-2" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Your feed is empty</h2>
          <p className="text-sm text-ink-3 max-w-xs">
            Add shows to your vault or connect with friends to see activity here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((item, i) => {
            const config = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.added_media;
            const Icon = config.icon;
            const payload = item.payload || {};

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex gap-3 p-3.5 rounded-2xl border border-edge hover:border-edge-hi transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Link to={`/u/${item.user.username}`} className="hover:opacity-80 transition-opacity">
                    {item.user.profile?.avatarUrl ? (
                      <img src={item.user.profile.avatarUrl} alt="" className="w-9 h-9 rounded-full border border-edge object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-ink uppercase border border-edge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {item.user.username[0]}
                      </div>
                    )}
                  </Link>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink leading-snug">
                        <Link to={`/u/${item.user.username}`} className="font-bold hover:underline underline-offset-2">
                          {item.user.profile?.displayName || item.user.username}
                        </Link>
                        {' '}
                        <span className="text-ink-2">{config.verb}</span>
                        {' '}
                        {payload.title && <span className="font-semibold">{payload.title}</span>}
                        {payload.friendUsername && <span className="font-semibold">@{payload.friendUsername}</span>}
                        {payload.rating != null && (
                          <span className="text-imdb font-bold ml-1">★ {payload.rating}</span>
                        )}
                        {payload.seasonNumber && (
                          <span className="text-ink-2"> S{payload.seasonNumber}</span>
                        )}
                      </p>
                      <span className="text-[10px] text-ink-3 mt-0.5 block">{formatTime(item.createdAt)}</span>
                    </div>

                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${config.color}`} strokeWidth={2} />
                  </div>
                </div>

                {/* Poster thumbnail */}
                {payload.coverImageUrl && (
                  <div className="flex-shrink-0 w-10 h-14 rounded-lg border border-edge overflow-hidden">
                    <img src={payload.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs font-bold text-ink-2 hover:text-ink px-4 py-2 rounded-xl border border-edge hover:border-edge-hi transition-colors disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
