import { Router } from 'express';
import { friendsController } from './friends.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res, next) => { friendsController.listFriends(req, res).catch(next); });
router.get('/requests', (req, res, next) => { friendsController.listRequests(req, res).catch(next); });
router.get('/search', (req, res, next) => { friendsController.searchUsers(req, res).catch(next); });

router.post('/request/:userId', (req, res, next) => { friendsController.sendRequest(req, res).catch(next); });
router.post('/accept/:requestId', (req, res, next) => { friendsController.acceptRequest(req, res).catch(next); });
router.post('/decline/:requestId', (req, res, next) => { friendsController.declineRequest(req, res).catch(next); });
router.delete('/cancel/:requestId', (req, res, next) => { friendsController.cancelRequest(req, res).catch(next); });
router.delete('/:friendshipId', (req, res, next) => { friendsController.removeFriend(req, res).catch(next); });

router.post('/block/:userId', (req, res, next) => { friendsController.blockUser(req, res).catch(next); });
router.delete('/block/:userId', (req, res, next) => { friendsController.unblockUser(req, res).catch(next); });

export { router as friendsRoutes };
