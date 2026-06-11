import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VaultPage } from './pages/VaultPage';
import { FeedPage } from './pages/FeedPage';
import { FriendsPage } from './pages/FriendsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { motion } from 'framer-motion';
import { Clapperboard } from 'lucide-react';

/** Shows a loading spinner while checking auth state */
function AuthLoader({ children }: { children: React.ReactNode }) {
  const { isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-void">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Clapperboard className="w-10 h-10 text-ink-2" strokeWidth={1.5} />
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

/** Redirects to login if not authenticated */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/** Redirects to vault if already authenticated */
function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename="/kino">
      <AuthLoader>
        <Routes>
          {/* Guest routes */}
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <RegisterPage />
              </GuestOnly>
            }
          />

          {/* Authenticated routes inside AppShell */}
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<VaultPage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="u/:username" element={<PublicProfilePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthLoader>
    </BrowserRouter>
  );
}

export default App;
