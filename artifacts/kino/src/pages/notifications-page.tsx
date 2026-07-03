import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, UserCheck, Loader2, CheckCheck, MessageCircle } from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllRead, type NotificationItem } from '../api/feed';
import { useToastStore } from '../store/useToastStore';

const TYPE_ICONS: Record<string, any> = {
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  new_message: MessageCircle,
};

const getIconColor = (type: string, read: boolean) => {
  if (read) return 'text-ink-3';
  switch (type) {
    case 'friend_request': return 'text-imdb';
    case 'friend_accepted': return 'text-emerald-500';
    case 'new_message': return 'text-blue-500';
    default: return 'text-ink-2';
  }
};

const getIconBg = (type: string, read: boolean) => {
  if (read) return 'bg-white/5';
  switch (type) {
    case 'friend_request': return 'bg-imdb/10';
    case 'friend_accepted': return 'bg-emerald-500/10';
    case 'new_message': return 'bg-blue-500/10';
    default: return 'bg-white/10';
  }
};

const getCardBg = (type: string, read: boolean) => {
  if (read) return 'rgba(255,255,255,0.01)';
  switch (type) {
    case 'friend_request': return 'rgba(245,197,24,0.03)';
    case 'friend_accepted': return 'rgba(16,185,129,0.03)';
    case 'new_message': return 'rgba(59,130,246,0.03)';
    default: return 'rgba(255,255,255,0.03)';
  }
};

const getDotColor = (type: string) => {
  switch (type) {
    case 'friend_request': return '#F5C518';
    case 'friend_accepted': return '#10B981';
    case 'new_message': return '#3B82F6';
    default: return '#FFFFFF';
  }
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async (cursor?: string) => {
    try {
      const res = await fetchNotifications(cursor);
      if (cursor) {
        setNotifications(prev => [...prev, ...res.notifications]);
      } else {
        setNotifications(res.notifications);
      }
      setHasMore(res.hasMore);
      setNextCursor(res.nextCursor);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications([]);
    useToastStore.getState().addToast('All notifications cleared', 'success');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-black tracking-[0.14em] text-ink uppercase">
          Alerts
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-[10px] font-bold text-ink-2 hover:text-ink flex items-center gap-1 px-3 py-1.5 rounded-xl border border-edge hover:border-edge-hi transition-colors bg-white/5 backdrop-blur-md hover:bg-white/10"
          >
            <CheckCheck className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center border border-edge-hi mb-6 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Bell className="w-8 h-8 text-ink-3" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">All clear</h2>
          <p className="text-sm text-ink-3 max-w-xs">
            You have no new alerts right now.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => {
                  if (!n.read) handleMarkRead(n.id);
                  
                  if (n.type === 'new_message' && n.payload) {
                    try {
                      const payload = JSON.parse(n.payload);
                      if (payload.senderId) navigate(`/friends?chat=${payload.senderId}`);
                    } catch {}
                  } else if (n.type === 'friend_request') {
                    navigate('/friends?tab=requests');
                  }
                }}
                className={`flex items-start gap-4 p-4 rounded-[24px] border transition-all cursor-pointer relative overflow-hidden backdrop-blur-xl ${
                  n.read
                    ? 'border-white/[0.03] hover:border-white/10'
                    : 'border-white/10 shadow-xl shadow-black/20 hover:border-white/20 hover:translate-y-[-1px]'
                }`}
                style={{ background: getCardBg(n.type, n.read) }}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${getIconBg(n.type, n.read)}`}>
                  <Icon className={`w-5 h-5 ${getIconColor(n.type, n.read)}`} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold truncate tracking-wide ${n.read ? 'text-ink-2' : 'text-ink'}`}>{n.title}</h3>
                  </div>
                  {n.body && (
                    <p className={`text-sm mt-1 line-clamp-2 leading-relaxed ${n.read ? 'text-ink-4' : 'text-ink-2'}`}>{n.body}</p>
                  )}
                  <span className="text-[11px] font-medium text-ink-4 mt-2 block">{formatTime(n.createdAt)}</span>
                </div>
                
                {!n.read && (
                  <motion.div 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-5 right-5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: getDotColor(n.type), boxShadow: `0 0 12px 1px ${getDotColor(n.type)}` }}
                  />
                )}
              </motion.div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => nextCursor && load(nextCursor)}
                className="text-xs font-bold text-ink-2 hover:text-ink px-6 py-2.5 rounded-xl border border-edge hover:border-edge-hi transition-all bg-white/5 backdrop-blur-md hover:bg-white/10"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
