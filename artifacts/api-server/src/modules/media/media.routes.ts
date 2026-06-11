import { Router } from 'express';
import { mediaController } from './media.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  createMediaSchema,
  updateMediaSchema,
  createSeasonSchema,
  updateSeasonSchema,
} from './media.schema.js';

const router = Router();

// All media routes require auth
router.use(requireAuth);

router.get(
  '/',
  (req, res, next) => { mediaController.list(req, res).catch(next); },
);

router.get(
  '/:id',
  (req, res, next) => { mediaController.getById(req, res).catch(next); },
);

router.post(
  '/',
  validate(createMediaSchema, 'body'),
  (req, res, next) => { mediaController.create(req, res).catch(next); },
);

router.put(
  '/:id',
  validate(updateMediaSchema, 'body'),
  (req, res, next) => { mediaController.update(req, res).catch(next); },
);

router.delete(
  '/:id',
  (req, res, next) => { mediaController.delete(req, res).catch(next); },
);

// Seasons
router.post(
  '/:id/seasons',
  validate(createSeasonSchema, 'body'),
  (req, res, next) => { mediaController.addSeason(req, res).catch(next); },
);

router.put(
  '/:id/seasons/:seasonId',
  validate(updateSeasonSchema, 'body'),
  (req, res, next) => { mediaController.updateSeason(req, res).catch(next); },
);

router.delete(
  '/:id/seasons/:seasonId',
  (req, res, next) => { mediaController.deleteSeason(req, res).catch(next); },
);

export { router as mediaRoutes };
