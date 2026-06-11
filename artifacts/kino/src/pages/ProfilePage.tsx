import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film, Users, Calendar, Star, Edit2, Save, X, Loader2, Palette,
  Camera, ImagePlus, Trash2,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { fetchProfile, updateProfile } from '../api/feed';
import { removeAvatar, removeBanner } from '../api/upload';
import { useToastStore } from '../store/useToastStore';
import { BannerRenderer } from '../components/profile/BannerRenderer';
import { AvatarUploadModal } from '../components/profile/AvatarUploadModal';
import { BannerUploadModal } from '../components/profile/BannerUploadModal';

const THEME_COLORS = [
  '#F5C518', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6',
  '#E67E22', '#1ABC9C', '#E91E63', '#00BCD4', '#FF5722',
  '#8B5CF6', '#06B6D4', '#F43F5E', '#A3E635',
];

export function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    themeColor: '#F5C518',
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetchProfile();
      setProfile(res.profile);
      setEditForm({
        displayName: res.profile.profile?.displayName || '',
        bio: res.profile.profile?.bio || '',
        themeColor: res.profile.profile?.themeColor || '#F5C518',
      });
    } catch { /* ignore */ }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(editForm);
      await loadProfile();
      setIsEditing(false);
      useToastStore.getState().addToast('Profile updated', 'success');
    } catch (err: any) {
      useToastStore.getState().addToast(err?.error?.message || 'Failed to update', 'error');
    }
    setIsSaving(false);
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar();
      await loadProfile();
      useToastStore.getState().addToast('Avatar removed', 'info');
    } catch { /* ignore */ }
  };

  const handleRemoveBanner = async () => {
    try {
      await removeBanner();
      await loadProfile();
      useToastStore.getState().addToast('Banner removed', 'info');
    } catch { /* ignore */ }
  };

  // Live preview: use editForm values when editing, otherwise use saved profile
  const tc = isEditing ? editForm.themeColor : (profile?.profile?.themeColor || '#F5C518');
  const displayName = isEditing ? (editForm.displayName || user?.username) : (profile?.profile?.displayName || user?.username);
  const bio = isEditing ? editForm.bio : (profile?.profile?.bio || '');
  const avatarUrl = profile?.profile?.avatarUrl;
  const bannerUrl = profile?.profile?.bannerUrl;
  const bannerType = profile?.profile?.bannerType || 'static';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ═══════════ PROFILE CARD ═══════════ */}
      <div className="relative rounded-3xl overflow-hidden border border-edge mb-8" style={{ boxShadow: `0 0 80px ${tc}08, 0 24px 80px rgba(0,0,0,0.4)` }}>

        {/* ── Banner ── */}
        <div className="relative group">
          <BannerRenderer
            bannerUrl={bannerUrl}
            bannerType={bannerType}
            themeColor={tc}
            className="h-48 sm:h-64"
          />

          {/* Banner actions overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBannerModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold text-ink border border-white/20 hover:border-white/40 transition-colors"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
            >
              <ImagePlus className="w-3.5 h-3.5" />
              {bannerUrl ? 'Change Banner' : 'Add Banner'}
            </motion.button>
            {bannerUrl && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRemoveBanner}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </motion.button>
            )}
          </div>

          {/* Edit Profile button */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-white/15 text-ink hover:border-white/30 transition-all z-10"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
            >
              <Edit2 className="w-3 h-3" />
              Edit Profile
            </button>
          )}
        </div>

        {/* ── Profile Info (Glass Card) ── */}
        <div
          className="relative px-6 pb-6 -mt-16"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(10,10,10,0.98) 40px)',
          }}
        >
          {/* Glass card container */}
          <div
            className="relative rounded-2xl p-5 sm:p-6 border border-edge"
            style={{
              background: 'rgba(16,16,16,0.85)',
              backdropFilter: 'blur(24px)',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
            }}
          >
            <div className="flex items-end gap-4 sm:gap-5 -mt-14 sm:-mt-16 mb-4">
              {/* ── Avatar ── */}
              <div className="relative group/avatar flex-shrink-0">
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

                {/* Avatar container */}
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
                      alt={user?.username || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-ink uppercase select-none">
                      {user?.username?.[0] ?? '?'}
                    </span>
                  )}

                  {/* Hover overlay */}
                  <div
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 cursor-pointer rounded-full"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                  >
                    <Camera className="w-6 h-6 text-white" strokeWidth={1.8} />
                  </div>
                </div>

                {/* Remove avatar button */}
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border border-edge opacity-0 group-hover/avatar:opacity-100 transition-opacity z-10"
                    style={{ background: 'rgba(20,20,20,0.95)' }}
                    title="Remove avatar"
                  >
                    <X className="w-3 h-3 text-ink-3 hover:text-red-400" />
                  </button>
                )}
              </div>

              {/* ── Name & Username ── */}
              <div className="flex-1 min-w-0 pb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="Display name"
                    className="text-xl sm:text-2xl font-extrabold text-ink bg-transparent border-b border-edge focus:border-edge-hi outline-none w-full pb-1 placeholder:text-ink-3"
                  />
                ) : (
                  <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight leading-tight truncate">
                    {displayName}
                  </h1>
                )}
                <p className="text-sm text-ink-3 font-medium mt-0.5">@{user?.username}</p>
              </div>
            </div>

            {/* ── Bio ── */}
            <div className="mt-1">
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Write something about yourself..."
                  maxLength={500}
                  rows={3}
                  className="w-full text-sm text-ink-2 bg-transparent border border-edge rounded-xl p-3 outline-none focus:border-edge-hi resize-none leading-relaxed placeholder:text-ink-3"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                />
              ) : bio ? (
                <p className="text-sm text-ink-2 leading-relaxed">{bio}</p>
              ) : (
                <p className="text-sm text-ink-3 italic">No bio yet</p>
              )}
            </div>

            {/* ── Theme Color Picker (edit mode) ── */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 pt-4 border-t border-edge">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3 mb-3 flex items-center gap-1.5">
                      <Palette className="w-3 h-3" /> Accent Color
                    </label>
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      {THEME_COLORS.map(c => (
                        <motion.button
                          key={c}
                          onClick={() => setEditForm(f => ({ ...f, themeColor: c }))}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className="relative w-8 h-8 rounded-full transition-all"
                          style={{
                            background: c,
                            boxShadow: editForm.themeColor === c
                              ? `0 0 0 2px rgba(10,10,10,1), 0 0 0 4px ${c}, 0 0 16px ${c}44`
                              : `0 2px 8px ${c}33`,
                          }}
                        >
                          {editForm.themeColor === c && (
                            <motion.div
                              layoutId="color-check"
                              className="absolute inset-0 flex items-center justify-center"
                              transition={{ type: 'spring', damping: 20 }}
                            >
                              <div className="w-2 h-2 rounded-full bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Accent line ── */}
            <motion.div
              className="h-[2px] rounded-full mt-5"
              style={{ background: `linear-gradient(90deg, transparent, ${tc}55, ${tc}88, ${tc}55, transparent)` }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* ── Meta row ── */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px] text-ink-3 font-medium">
                <Calendar className="w-3 h-3" />
                Joined {new Date(profile?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* ── Save / Cancel (edit mode) ── */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex gap-2 mt-5"
                >
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                    style={{
                      background: tc,
                      color: '#000',
                      boxShadow: `0 4px 20px ${tc}33`,
                    }}
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </motion.button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form to saved values
                      setEditForm({
                        displayName: profile?.profile?.displayName || '',
                        bio: profile?.profile?.bio || '',
                        themeColor: profile?.profile?.themeColor || '#F5C518',
                      });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-ink-2 border border-edge hover:border-edge-hi transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Discard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ═══════════ STATS GRID ═══════════ */}
      <FavoritesAndStats
        mediaCount={profile?.mediaCount ?? 0}
        friendCount={profile?.friendCount ?? 0}
        themeColor={tc}
      />

      {/* ═══════════ UPLOAD MODALS ═══════════ */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onUploaded={() => { loadProfile(); }}
        currentAvatar={avatarUrl}
        themeColor={tc}
      />
      <BannerUploadModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onUploaded={() => { loadProfile(); }}
        currentBanner={bannerUrl}
        themeColor={tc}
      />
    </motion.div>
  );
}

// ── Stats + Favorites Section ──
function FavoritesAndStats({ mediaCount, friendCount, themeColor }: { mediaCount: number; friendCount: number; themeColor: string }) {
  const media = useAppStore(s => s.media);
  const favorites = media.filter(m => m.isFavorite);

  const showCount = media.filter(m => m.type !== 'music').length;
  const musicCount = media.filter(m => m.type === 'music').length;

  const stats = [
    { label: 'Shows', value: showCount, icon: Film, color: themeColor },
    { label: 'Music', value: musicCount, icon: Star, color: '#E84393' },
    { label: 'Friends', value: friendCount, icon: Users, color: '#3498DB' },
    { label: 'Favorites', value: favorites.length, icon: Star, color: '#F5C518' },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -2, boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 20px ${stat.color}11` }}
            className="rounded-2xl border border-edge p-5 text-center transition-colors hover:border-edge-hi cursor-default"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: `${stat.color}15`, boxShadow: `0 0 20px ${stat.color}11` }}
            >
              <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} strokeWidth={1.8} />
            </div>
            <div className="text-2xl font-extrabold text-ink tracking-tight">{stat.value}</div>
            <div className="text-[9px] font-bold text-ink-3 uppercase tracking-[0.2em] mt-1.5">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Favorites Showcase */}
      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-[#F5C518]" fill="#F5C518" strokeWidth={0} />
            <h2 className="text-[10px] font-black tracking-[0.2em] text-ink uppercase">
              Favorites
            </h2>
            <span className="text-[10px] font-semibold text-ink-3 ml-auto">
              {favorites.length} {favorites.length === 1 ? 'title' : 'titles'}
            </span>
          </div>

          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}
          >
            {favorites.map((item, i) => {
              const cover = item.coverImageBase64 || item.coverImageUrl;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}
                  className="relative rounded-xl overflow-hidden border border-edge cursor-default group"
                  style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.04)' }}
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-6 h-6 text-ink-3 opacity-30" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Star badge */}
                  <div className="absolute top-2 right-2">
                    <Star className="w-3.5 h-3.5 text-[#F5C518]" fill="#F5C518" strokeWidth={0} />
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                      {item.title}
                    </p>
                    {item.rating && item.type !== 'music' && (
                      <p className="text-[9px] text-ink-3 mt-0.5 font-semibold">
                        {item.type === 'anime' ? 'MAL' : 'IMDb'} {item.rating}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </>
  );
}
