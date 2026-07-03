import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { chatController } from './chat.controller.js';

const router: import('express').Router = Router();

router.use(requireAuth);

router.get('/:friendId', (req, res, next) => { chatController.getChatHistory(req, res).catch(next); });
router.post('/:friendId', (req, res, next) => { chatController.sendMessage(req, res).catch(next); });

export const chatRoutes = router;
