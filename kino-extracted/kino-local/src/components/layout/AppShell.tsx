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

export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

      {/* Global Notifications */}
      <GlobalNotificationHandler />

      {/* ── Sidebar — Desktop ── */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30 border-r border-edge overflow-hidden"
        style={{
          background: 'rgba(8,8,8,0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo + Collapse toggle */}
        <div className="flex items-center gap-2.5 px-3 pt-5 pb-6">
          {/* 3-line toggle */}
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
                <div className="text-[13px] font-black tracking-[0.18em] text-ink leading-none">
                  KINO
                </div>
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
                  <div className="text-xs font-bold text-ink truncate">
                    {user?.username ?? 'User'}
                  </div>
                  <div className="text-[10px] text-ink-3 truncate">
                    {user?.email ?? ''}
                  </div>
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

      {/* ── Mobile Header + Drawer ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 py-2.5 border-b border-edge"
        style={{
          background: 'rgba(8,8,8,0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-edge text-ink-2 hover:text-ink transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Menu className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-ink" strokeWidth={2} />
          <span className="text-[12px] font-black tracking-[0.16em] text-ink uppercase">KINO</span>
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[60]"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[70] w-[260px] flex flex-col border-r border-edge"
              style={{
                background: 'rgba(10,10,10,0.98)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-5 pb-6">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-edge-hi"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <Clapperboard className="w-4 h-4 text-ink" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-[13px] font-black tracking-[0.18em] text-ink leading-none">KINO</div>
                    <div className="text-[8px] font-semibold tracking-[0.28em] text-ink-3 uppercase mt-0.5">The Private Vault</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-3 hover:text-ink transition-colors border border-edge"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'text-ink bg-white/[0.08]'
                          : 'text-ink-2 hover:text-ink hover:bg-white/[0.04]'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* User footer */}
              <div className="px-3 pb-5 pt-3 border-t border-edge mt-auto">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-edge text-[11px] font-bold text-ink uppercase"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {user?.username?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-ink truncate">{user?.username ?? 'User'}</div>
                    <div className="text-[10px] text-ink-3 truncate">{user?.email ?? ''}</div>
                  </div>
                  <button onClick={handleLogout} className="text-ink-3 hover:text-danger transition-colors" title="Sign out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        animate={{ marginLeft: `${sidebarWidth}px` }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 hidden md:block px-3 sm:px-6 pt-6 pb-8"
      >
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </motion.main>

      {/* Mobile main content */}
      <main className="flex-1 md:hidden px-3 sm:px-6 pt-16 pb-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
