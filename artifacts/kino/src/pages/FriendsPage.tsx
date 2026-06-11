import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Search, UserPlus, UserCheck, UserX, Clock,
  Loader2, X, Film, MessageCircle,
} from 'lucide-react';
import * as friendsApi from '../api/friends';
import type { FriendInfo, UserSearchResult, PendingRequests } from '../api/friends';
import { useToastStore } from '../store/useToastStore';
import { ChatDrawer } from '../components/chat/ChatDrawer';

export function FriendsPage() {
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [requests, setRequests] = useState<PendingRequests>({ received: [], sent: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<FriendInfo | null>(null);
  const toast = useToastStore.getState();
  const location = useLocation();
  const navigate = useNavigate();

  const loadFriends = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [f, r] = await Promise.all([
        friendsApi.fetchFriends(),
        friendsApi.fetchRequests(),
      ]);
      setFriends(f.friends);
      setRequests(r);
    } catch { /* ignore */ }
    if (!silent) setIsLoading(false);
  }, []);

  useEffect(() => { 
    loadFriends(); 
    
    // Poll for new messages/requests
    const interval = setInterval(() => loadFriends(true), 5000);
    return () => clearInterval(interval);
  }, [loadFriends]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'requests' || tabParam === 'friends' || tabParam === 'search') {
      setTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chat');
    if (chatId && friends.length > 0) {
      const friend = friends.find(f => f.id === chatId);
      if (friend) {
        setActiveChat(friend);
        // Remove the query param to prevent reopening on reload
        navigate('/friends', { replace: true });
      }
    }
  }, [location.search, friends, navigate]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const res = await friendsApi.searchUsers(searchQuery.trim());
      setSearchResults(res.users);
    } catch { /* ignore */ }
    setIsSearching(false);
  };

  useEffect(() => {
    if (tab === 'search' && searchQuery.trim().length >= 2) {
      const t = setTimeout(handleSearch, 400);
      return () => clearTimeout(t);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, tab]);

  const withAction = async (id: string, fn: () => Promise<any>, msg: string) => {
    setActionLoading(id);
    try {
      await fn();
      toast.addToast(msg, 'success');
      await loadFriends();
    } catch (err: any) {
      toast.addToast(err?.error?.message || 'Action failed', 'error');
    }
    setActionLoading(null);
  };

  const handleOpenChat = (f: FriendInfo) => {
    setActiveChat(f);
    // Optimistically mark as read in UI
    setFriends(prev => prev.map(friend => {
      if (friend.friendshipId === f.friendshipId) {
        return {
          ...friend,
          unreadCount: 0,
          latestMessage: friend.latestMessage 
            ? { ...friend.latestMessage, read: true }
            : undefined
        };
      }
      return friend;
    }));
  };

  const pendingCount = requests.received.length;

  const TABS = [
    { key: 'friends' as const, label: 'Friends', count: friends.length },
    { key: 'requests' as const, label: 'Requests', count: pendingCount },
    { key: 'search' as const, label: 'Find People', count: 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="text-lg font-black tracking-[0.14em] text-ink uppercase mb-6">
        Friends
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl border border-edge mb-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              tab === t.key
                ? 'text-ink bg-white/[0.09]'
                : 'text-ink-3 hover:text-ink-2 hover:bg-white/[0.03]'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                t.key === 'requests' && tab !== 'requests'
                  ? 'bg-imdb/20 text-imdb'
                  : 'bg-white/10 text-ink-2'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar (in search tab) */}
      {tab === 'search' && (
        <div className="mb-6">
          <div
            className="flex items-center rounded-xl border border-edge focus-within:border-edge-hi transition-colors overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Search className="w-4 h-4 text-ink-3 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              autoFocus
              className="flex-1 bg-transparent text-ink text-sm px-3 py-3 outline-none placeholder:text-ink-3"
            />
            {isSearching && <Loader2 className="w-4 h-4 animate-spin text-ink-3 mr-3" />}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading && tab !== 'search' ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {tab === 'friends' && (
            <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {friends.length === 0 ? (
                <EmptyState icon={Users} title="No friends yet" subtitle="Search for people to connect with" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {friends.map(f => (
                    <FriendCard
                      key={f.friendshipId}
                      friend={f}
                      isLoading={actionLoading === f.friendshipId}
                      onRemove={() => withAction(f.friendshipId, () => friendsApi.removeFriend(f.friendshipId), `Removed ${f.username}`)}
                      onChat={() => handleOpenChat(f)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'requests' && (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {requests.received.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-ink-3 uppercase mb-3">Received</h3>
                  <div className="space-y-2">
                    {requests.received.map(r => (
                      <RequestCard
                        key={r.id}
                        username={r.sender.username}
                        displayName={r.sender.profile?.displayName}
                        avatarUrl={r.sender.profile?.avatarUrl}
                        date={r.createdAt}
                        isLoading={actionLoading === r.id}
                        onAccept={() => withAction(r.id, () => friendsApi.acceptRequest(r.id), `You and ${r.sender.username} are now friends!`)}
                        onDecline={() => withAction(r.id, () => friendsApi.declineRequest(r.id), 'Request declined')}
                      />
                    ))}
                  </div>
                </div>
              )}
              {requests.sent.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-ink-3 uppercase mb-3">Sent</h3>
                  <div className="space-y-2">
                    {requests.sent.map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-edge" style={{ background: 'rgba(255,255,255,0.025)' }}>
                        <Link to={`/u/${r.receiver.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                          <Avatar name={r.receiver.username} url={r.receiver.profile?.avatarUrl} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-ink truncate">{r.receiver.profile?.displayName || r.receiver.username}</div>
                            <div className="text-[10px] text-ink-3 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</div>
                          </div>
                        </Link>
                        <button
                          onClick={() => withAction(r.id, () => friendsApi.cancelRequest(r.id), 'Request cancelled')}
                          disabled={actionLoading === r.id}
                          className="text-xs font-semibold text-ink-3 hover:text-danger px-2 py-1 rounded-lg border border-edge hover:border-danger/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {requests.received.length === 0 && requests.sent.length === 0 && (
                <EmptyState icon={UserCheck} title="No pending requests" subtitle="You're all caught up" />
              )}
            </motion.div>
          )}

          {tab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {searchQuery.trim().length < 2 ? (
                <EmptyState icon={Search} title="Search for users" subtitle="Type at least 2 characters" />
              ) : searchResults.length === 0 && !isSearching ? (
                <EmptyState icon={UserX} title="No users found" subtitle={`No results for "${searchQuery}"`} />
              ) : (
                <div className="space-y-2">
                  {searchResults.map(u => (
                    <SearchResultCard
                      key={u.id}
                      user={u}
                      isLoading={actionLoading === u.id}
                      onAdd={() => withAction(u.id, () => friendsApi.sendFriendRequest(u.id), `Friend request sent to ${u.username}`)}
                      onAccept={() => u.requestId && withAction(u.id, () => friendsApi.acceptRequest(u.requestId!), `You and ${u.username} are now friends!`)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {activeChat && (
        <ChatDrawer
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          friendId={activeChat.id}
          friendName={activeChat.profile?.displayName || activeChat.username}
          friendUsername={activeChat.username}
          friendAvatar={activeChat.profile?.avatarUrl ?? undefined}
        />
      )}
    </motion.div>
  );
}

// ── Sub-components ──

function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs';
  return url ? (
    <img src={url} alt={name} className={`${sz} rounded-full object-cover border border-edge`} />
  ) : (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-ink uppercase border border-edge`} style={{ background: 'rgba(255,255,255,0.06)' }}>
      {name[0]}
    </div>
  );
}

function FriendCard({ friend, isLoading, onRemove, onChat }: { friend: FriendInfo; isLoading: boolean; onRemove: () => void; onChat: () => void }) {
  const [showRemove, setShowRemove] = useState(false);
  const navigate = useNavigate();

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/u/${friend.username}`);
  };

  const getStatusText = () => {
    if (!friend.latestMessage) return `@${friend.username}`;
    
    const timeAgoMs = new Date().getTime() - new Date(friend.latestMessage.createdAt).getTime();
    const daysAgo = Math.floor(timeAgoMs / (1000 * 60 * 60 * 24));
    const weeksAgo = Math.floor(daysAgo / 7);
    
    let timeStr = '';
    if (daysAgo === 0) timeStr = 'Today';
    else if (weeksAgo > 0) timeStr = `${weeksAgo}w`;
    else timeStr = `${daysAgo}d`;
    
    if (friend.latestMessage.isMine) {
      if (friend.latestMessage.read) return `Seen · ${timeStr}`;
      return `Sent · ${timeStr}`;
    }
    
    // Suggestion, Image, or text?
    let contentSnippet = friend.latestMessage.content;
    try {
      const parsed = JSON.parse(contentSnippet);
      if (parsed.type === 'suggestion') {
        if (parsed.mediaType === 'music') {
          contentSnippet = `Sent a track by ${friend.username}`;
        } else {
          contentSnippet = `Sent a reel by ${friend.username}`;
        }
      }
      else if (parsed.type === 'image') contentSnippet = `Sent an image`;
    } catch {}

    return `${contentSnippet} · ${timeStr}`;
  };

  return (
    <div
      onClick={onChat}
      className="group relative flex items-center gap-3 p-3.5 rounded-2xl border border-edge transition-all hover:bg-white/5 cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <div onClick={handleAvatarClick} className="flex-shrink-0 z-10 hover:opacity-80 transition-opacity">
        <Avatar name={friend.username} url={friend.profile?.avatarUrl} />
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <div className={`text-sm truncate ${friend.unreadCount > 0 ? 'font-black text-ink' : 'font-bold text-ink'}`}>
          {friend.profile?.displayName || friend.username}
        </div>
        <div className={`text-[11px] truncate flex items-center gap-2 ${friend.unreadCount > 0 ? 'font-bold text-ink-2' : 'text-ink-3'}`}>
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-2">
        {friend.unreadCount > 0 && (
          <div className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.6)]">
            <span className="text-[9px] font-black text-white">
              {friend.unreadCount > 99 ? '+99' : friend.unreadCount}
            </span>
          </div>
        )}
        {showRemove ? (
          <div className="flex items-center gap-1 z-10" onClick={e => e.stopPropagation()}>
            <button onClick={onRemove} disabled={isLoading} className="text-[10px] font-bold text-danger px-2 py-1 rounded-lg border border-danger/30 hover:bg-danger/10 transition-colors">
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Remove'}
            </button>
            <button onClick={() => setShowRemove(false)} className="text-ink-3 hover:text-ink p-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRemove(true)} className="text-ink-3 hover:text-danger transition-all p-1.5 hover:bg-danger/10 rounded-lg">
              <UserX className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-edge-hi mb-5" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <Icon className="w-6 h-6 text-ink-3" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-bold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-3">{subtitle}</p>
    </div>
  );
}

function RequestCard({ username, displayName, avatarUrl, date, isLoading, onAccept, onDecline }: {
  username: string; displayName?: string | null; avatarUrl?: string | null;
  date: string; isLoading: boolean; onAccept: () => void; onDecline: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-imdb/20" style={{ background: 'rgba(245,197,24,0.03)' }}>
      <Link to={`/u/${username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <Avatar name={username} url={avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-ink truncate">{displayName || username}</div>
          <div className="text-[10px] text-ink-3">@{username}</div>
        </div>
      </Link>
      <div className="flex items-center gap-1.5">
        <button onClick={onAccept} disabled={isLoading} className="text-[10px] font-bold text-black bg-white px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Accept'}
        </button>
        <button onClick={onDecline} disabled={isLoading} className="text-[10px] font-bold text-ink-3 px-2 py-1.5 rounded-lg border border-edge hover:border-edge-hi transition-colors disabled:opacity-50">
          Decline
        </button>
      </div>
    </div>
  );
}

function SearchResultCard({ user, isLoading, onAdd, onAccept }: {
  user: UserSearchResult; isLoading: boolean; onAdd: () => void; onAccept: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-edge" style={{ background: 'rgba(255,255,255,0.025)' }}>
      <Link to={`/u/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
        <Avatar name={user.username} url={user.profile?.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-ink truncate">{user.profile?.displayName || user.username}</div>
          <div className="text-[10px] text-ink-3 flex items-center gap-2">
            <span>@{user.username}</span>
            <span className="flex items-center gap-1"><Film className="w-3 h-3" /> {user.mediaCount}</span>
          </div>
        </div>
      </Link>
      {user.relationshipStatus === 'none' && (
        <button onClick={onAdd} disabled={isLoading} className="text-[10px] font-bold text-black bg-white px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-1">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserPlus className="w-3 h-3" /> Add</>}
        </button>
      )}
      {user.relationshipStatus === 'friends' && (
        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Friends</span>
      )}
      {user.relationshipStatus === 'pending_sent' && (
        <span className="text-[10px] font-bold text-ink-3 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
      )}
      {user.relationshipStatus === 'pending_received' && (
        <button onClick={onAccept} disabled={isLoading} className="text-[10px] font-bold text-black bg-imdb px-3 py-1.5 rounded-lg hover:bg-imdb/90 transition-colors disabled:opacity-50">
          Accept
        </button>
      )}
    </div>
  );
}

