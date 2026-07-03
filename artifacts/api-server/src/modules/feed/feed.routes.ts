import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { feedService } from './feed.service.js';

const router: import('express').Router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await feedService.getFriendFeed(
      req.user!.userId,
      req.query.cursor as string | undefined,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/user/:userId', async (req, res, next) => {
  try {
    const result = await feedService.getUserActivity(
      req.params.userId,
      req.query.cursor as string | undefined,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) { next(err); }
});

export { router as feedRoutes };
