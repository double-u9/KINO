import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { optionalAuth } from '../../middleware/auth.js';

const router: import('express').Router = Router();

// Own profile (requires auth)
router.get('/', requireAuth, (req, res, next) => { profileController.getOwnProfile(req, res).catch(next); });
router.put('/', requireAuth, (req, res, next) => { profileController.updateProfile(req, res).catch(next); });
router.put('/privacy', requireAuth, (req, res, next) => { profileController.updatePrivacy(req, res).catch(next); });

// Public profiles (optional auth for friend checks)
router.get('/user/:username', optionalAuth, (req, res, next) => { profileController.getPublicProfile(req, res).catch(next); });
router.get('/user/:username/media', optionalAuth, (req, res, next) => { profileController.getUserMedia(req, res).catch(next); });

export { router as profileRoutes };
