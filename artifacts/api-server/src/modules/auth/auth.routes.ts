import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { rateLimiter } from '../../middleware/rate-limiter.js';
import { registerSchema, loginSchema, resetLocalSchema } from './auth.schema.js';

const router: import('express').Router = Router();

// Rate limit auth endpoints: 10 attempts per 15 minutes
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'auth',
});

router.post(
  '/register',
  authLimiter,
  validate(registerSchema, 'body'),
  (req, res, next) => { authController.register(req, res).catch(next); },
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  (req, res, next) => { authController.login(req, res).catch(next); },
);

router.post(
  '/reset-local',
  authLimiter,
  validate(resetLocalSchema, 'body'),
  (req, res, next) => { authController.resetLocal(req, res).catch(next); },
);

router.post(
  '/refresh',
  (req, res, next) => { authController.refresh(req, res).catch(next); },
);

router.post(
  '/logout',
  (req, res, next) => { authController.logout(req, res).catch(next); },
);

router.get(
  '/me',
  requireAuth,
  (req, res, next) => { authController.me(req, res).catch(next); },
);

export { router as authRoutes };
