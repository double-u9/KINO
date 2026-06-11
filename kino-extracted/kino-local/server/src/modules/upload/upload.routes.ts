import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
import { uploadService } from './upload.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max (banner), service enforces per-type
});

const router = Router();
router.use(requireAuth);

// ── Avatar ──
router.post('/avatar', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: { message: 'No file provided.' } });
      return;
    }
    const avatarUrl = await uploadService.uploadAvatar(req.user!.userId, req.file);
    res.json({ avatarUrl });
  } catch (err) { next(err); }
});

router.delete('/avatar', async (req, res, next) => {
  try {
    await uploadService.removeAvatar(req.user!.userId);
    res.json({ message: 'Avatar removed.' });
  } catch (err) { next(err); }
});

// ── Banner ──
router.post('/banner', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: { message: 'No file provided.' } });
      return;
    }
    const result = await uploadService.uploadBanner(req.user!.userId, req.file);
    res.json(result);
  } catch (err) { next(err); }
});

router.delete('/banner', async (req, res, next) => {
  try {
    await uploadService.removeBanner(req.user!.userId);
    res.json({ message: 'Banner removed.' });
  } catch (error) {
    next(error);
  }
});

router.post('/chat-image', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = await uploadService.uploadChatImage(req.user!.userId, req.file);
    res.json({ imageUrl });
  } catch (error) {
    next(error);
  }
});

export { router as uploadRoutes };
