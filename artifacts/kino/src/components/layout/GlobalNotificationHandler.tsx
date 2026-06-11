import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, UserPlus, UserCheck, MessageCircle, X } from 'lucide-react';
import { fetchNotifications, type NotificationItem } from '../../api/feed';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS: Record<string, any> = {
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  new_message: MessageCircle,
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'friend_request': return 'text-imdb';
    case 'friend_accepted': return 'text-emerald-500';
    case 'new_message': return 'text-blue-500';
    default: return 'text-ink-2';
  }
};

const getIconBg = (type: string) => {
  switch (type) {
    case 'friend_request': return 'bg-imdb/20';
    case 'friend_accepted': return 'bg-emerald-500/20';
    case 'new_message': return 'bg-blue-500/20';
    default: return 'bg-white/10';
  }
};

export function GlobalNotificationHandler() {
  const [popups, setPopups] = useState<NotificationItem[]>([]);
  const shownIds = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkNotifications = async () => {
      try {
        const res = await fetchNotifications();
        if (!mounted) return;

        const unread = res.notifications.filter(n => !n.read);
        
        unread.forEach(notification => {
          if (!shownIds.current.has(notification.id)) {
            shownIds.current.add(notification.id);
            
            // Add to active popups
            setPopups(prev => [...prev, notification]);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
              setPopups(prev => prev.filter(p => p.id !== notification.id));
            }, 5000);
          }
        });
      } catch (err) {
        // ignore polling errors
      }
    };

    // Initial check
    checkNotifications();

    // Poll every 5 seconds
    const interval = setInterval(checkNotifications, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPopups(prev => prev.filter(p => p.id !== id));
  };

  const handlePopupClick = (notification: NotificationItem) => {
    setPopups(prev => prev.filter(p => p.id !== notification.id));
    
    // Navigate based on type
    if (notification.type === 'new_message' && notification.payload) {
      try {
        const payload = JSON.parse(notification.payload);
        if (payload.senderId) navigate(`/friends?chat=${payload.senderId}`);
        else navigate('/friends');
      } catch {
        navigate('/friends');
      }
    } else if (notification.type === 'friend_request') {
      navigate('/friends?tab=requests');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-[360px] pointer-events-none px-4">
      <AnimatePresence>
        {popups.map(n => {
          const Icon = TYPE_ICONS[n.type] || Bell;
          
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => handlePopupClick(n)}
              className="w-full bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl pointer-events-auto cursor-pointer relative group flex items-start gap-3"
            >
              <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 ${getIconBg(n.type)}`}>
                <Icon className={`w-5 h-5 ${getIconColor(n.type)}`} strokeWidth={2} />
              </div>
              
              <div className="flex-1 min-w-0 py-0.5 pr-6">
                <h4 className="text-sm font-bold text-ink truncate">{n.title}</h4>
                {n.body && (
                  <p className="text-[13px] text-ink-3 mt-0.5 line-clamp-1 leading-snug">{n.body}</p>
                )}
              </div>

              <button 
                onClick={(e) => dismiss(n.id, e)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/0 hover:bg-white/10 text-ink-4 hover:text-ink-2 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
