import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { notificationsService } from './notifications.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const result = await notificationsService.list(
      req.user!.userId,
      req.query.cursor as string | undefined,
      Number(req.query.limit) || 20,
    );
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    const count = await notificationsService.unreadCount(req.user!.userId);
    res.json({ count });
  } catch (err) { next(err); }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    await notificationsService.markRead(req.user!.userId, req.params.id);
    res.json({ message: 'Marked as read.' });
  } catch (err) { next(err); }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await notificationsService.markAllRead(req.user!.userId);
    res.json({ message: 'All marked as read.' });
  } catch (err) { next(err); }
});

export { router as notificationsRoutes };
