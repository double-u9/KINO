import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Eye, EyeOff, Lock, LogOut, Loader2, Save, Users, Rss, Star, Globe } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { fetchProfile } from '../api/feed';
import { api } from '../api/client';
import { useToastStore } from '../store/useToastStore';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showWatchHistory: true,
    showFavorites: true,
    showActivity: true,
    allowFriendRequests: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetchProfile();
      if (res.profile.privacy) {
        setPrivacy(res.profile.privacy);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  };

  const savePrivacy = async () => {
    setIsSaving(true);
    try {
      await api('/api/profile/privacy', { method: 'PUT', body: privacy });
      useToastStore.getState().addToast('Privacy settings saved', 'success');
    } catch (err: any) {
      useToastStore.getState().addToast(err?.error?.message || 'Failed to save', 'error');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-ink-3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-lg"
    >
      <h1 className="text-lg font-black tracking-[0.14em] text-ink uppercase mb-8">
        Settings
      </h1>

      {/* Account Section */}
      <SettingsSection title="Account" icon={Settings}>
        <div className="space-y-3">
          <InfoRow label="Username" value={`@${user?.username}`} />
          <InfoRow label="Email" value={user?.email || ''} />
        </div>
      </SettingsSection>

      {/* Privacy Section */}
      <SettingsSection title="Privacy" icon={Shield}>
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3 mb-2 block">
              Profile Visibility
            </label>
            <div className="flex gap-2">
              {[
                { value: 'public', label: 'Public', icon: Globe },
                { value: 'friends', label: 'Friends', icon: Users },
                { value: 'private', label: 'Private', icon: Lock },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPrivacy(p => ({ ...p, profileVisibility: opt.value }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    privacy.profileVisibility === opt.value
                      ? 'border-edge-hi text-ink bg-white/[0.08]'
                      : 'border-edge text-ink-3 hover:text-ink-2 hover:border-edge-hi'
                  }`}
                  style={{ background: privacy.profileVisibility === opt.value ? undefined : 'rgba(255,255,255,0.02)' }}
                >
                  <opt.icon className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Show watch history"
            sublabel="Others can see what you're watching"
            icon={Eye}
            value={privacy.showWatchHistory}
            onChange={v => setPrivacy(p => ({ ...p, showWatchHistory: v }))}
          />
          <ToggleRow
            label="Show favorites"
            sublabel="Others can see your starred items"
            icon={Star}
            value={privacy.showFavorites}
            onChange={v => setPrivacy(p => ({ ...p, showFavorites: v }))}
          />
          <ToggleRow
            label="Show activity"
            sublabel="Your actions appear in friend feeds"
            icon={Rss}
            value={privacy.showActivity}
            onChange={v => setPrivacy(p => ({ ...p, showActivity: v }))}
          />
          <ToggleRow
            label="Allow friend requests"
            sublabel="Anyone can send you a friend request"
            icon={Users}
            value={privacy.allowFriendRequests}
            onChange={v => setPrivacy(p => ({ ...p, allowFriendRequests: v }))}
          />

          <motion.button
            onClick={savePrivacy}
            disabled={isSaving}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
            style={{
              background: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
            }}
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Privacy Settings
          </motion.button>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t border-edge">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-bold text-danger hover:text-danger/80 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </motion.div>
  );
}

// ── Sub-components ──

function SettingsSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-ink-2" strokeWidth={2} />
        <h2 className="text-xs font-black tracking-[0.16em] text-ink uppercase">{title}</h2>
      </div>
      <div
        className="rounded-2xl border border-edge p-4"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-ink-3">{label}</span>
      <span className="text-xs font-bold text-ink">{value}</span>
    </div>
  );
}

function ToggleRow({ label, sublabel, icon: Icon, value, onChange }: {
  label: string; sublabel: string; icon: any; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <Icon className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={1.8} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-ink">{label}</div>
        <div className="text-[10px] text-ink-3">{sublabel}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
          value ? 'bg-emerald-500/80' : 'bg-white/10'
        }`}
        style={{ width: 40, height: 22 }}
      >
        <motion.div
          className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm"
          style={{ width: 18, height: 18 }}
          animate={{ left: value ? 19 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
