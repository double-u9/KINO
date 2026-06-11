import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Clapperboard,
  Film,
  Users,
  Bell,
  Settings,
  LogOut,
  User,
  Rss,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalNotificationHandler } from './GlobalNotificationHandler';

const NAV_ITEMS = [
  { to: '/', icon: Film, label: 'Vault' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

// Items shown in the bottom bar (mobile)
const BOTTOM_NAV = [
  { to: '/', icon: Film, label: 'Vault' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Me' },
];

export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 64 : 220;

  return (
    <div className="min-h-screen bg-void flex">
      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.022]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
        aria-hidden="true"
      />

      <GlobalNotificationHandler />

      {/* ── Sidebar — Desktop only ── */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30 border-r border-edge overflow-hidden"
        style={{
          background: 'rgba(8,8,8,0.97)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo + Collapse toggle */}
        <div className="flex items-center gap-2.5 px-3 pt-5 pb-6">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-edge hover:border-edge-hi text-ink-2 hover:text-ink transition-all flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-4 h-4" strokeWidth={2} />
          </button>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <div className="text-[13px] font-black tracking-[0.18em] text-ink leading-none">KINO</div>
                <div className="text-[8px] font-semibold tracking-[0.28em] text-ink-3 uppercase mt-0.5 whitespace-nowrap">
                  The Private Vault
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'text-ink bg-white/[0.08]'
                    : 'text-ink-2 hover:text-ink hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2'}`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto w-1 h-1 rounded-full bg-ink"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 pb-4 pt-3 border-t border-edge mt-auto">
          <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border border-edge text-[11px] font-bold text-ink uppercase flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              title={collapsed ? user?.username ?? 'User' : undefined}
            >
              {user?.username?.[0] ?? '?'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-ink truncate">{user?.username ?? 'User'}</div>
                  <div className="text-[10px] text-ink-3 truncate">{user?.email ?? ''}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-ink-3 hover:text-danger transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── Mobile Top Header ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-edge"
        style={{
          background: 'rgba(6,6,6,0.96)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-edge-hi"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <Clapperboard className="w-3.5 h-3.5 text-ink" strokeWidth={2} />
          </div>
          <span className="text-[13px] font-black tracking-[0.16em] text-ink uppercase">KINO</span>
        </div>

        {/* Settings / overflow menu */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-edge text-ink-2 active:bg-white/5 transition-colors"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <Settings className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* ── Mobile Settings Overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[60]"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed top-14 right-3 z-[70] w-52 rounded-2xl border border-edge overflow-hidden"
              style={{
                background: 'rgba(14,14,14,0.98)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              }}
            >
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-ink-2 hover:text-ink hover:bg-white/[0.04] transition-colors border-b border-edge"
              >
                <Settings className="w-4 h-4" strokeWidth={1.8} />
                Settings
              </NavLink>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-danger hover:bg-white/[0.04] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Main Content ── */}
      <motion.main
        animate={{ marginLeft: `${sidebarWidth}px` }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 hidden md:block px-6 pt-7 pb-10"
      >
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </motion.main>

      {/* ── Mobile Main Content ── */}
      <main className="flex-1 md:hidden px-4 pt-[60px] pb-[76px]">
        <div className="max-w-2xl mx-auto py-5">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-edge"
        style={{
          background: 'rgba(6,6,6,0.97)',
          backdropFilter: 'blur(24px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-h-[56px] transition-colors active:bg-white/5 overflow-hidden"
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={isActive ? { y: -1 } : { y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon
                    className={`w-[22px] h-[22px] transition-colors duration-200 ${
                      isActive ? 'text-ink' : 'text-ink-3'
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.7}
                  />
                </motion.div>
                <span
                  className={`text-[9px] font-bold tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-ink' : 'text-ink-3'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 w-8 h-[2px] rounded-full bg-ink"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
