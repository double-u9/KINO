import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { mediaRoutes } from './modules/media/media.routes.js';
import { friendsRoutes } from './modules/friends/friends.routes.js';
import { profileRoutes } from './modules/profile/profile.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { feedRoutes } from './modules/feed/feed.routes.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';

const app = express();

// ── Global Middleware ──
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// ── Request logging (dev) ──
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
app.listen(env.PORT, () => {
  console.log(`\n  🎬 Kino API running on http://localhost:${env.PORT}`);
  console.log(`  📦 Environment: ${env.NODE_ENV}\n`);
});

export default app;
