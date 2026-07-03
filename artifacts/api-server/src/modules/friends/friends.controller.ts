import type { Request, Response } from 'express';
import { friendsService } from './friends.service.js';

export class FriendsController {
  async listFriends(req: Request, res: Response): Promise<void> {
    const friends = await friendsService.listFriends(req.user!.userId);
    res.json({ friends });
  }

  async listRequests(req: Request, res: Response): Promise<void> {
    const requests = await friendsService.listPendingRequests(req.user!.userId);
    res.json(requests);
  }

  async sendRequest(req: Request, res: Response): Promise<void> {
    const request = await friendsService.sendRequest(req.user!.userId, (req.params as any).userId);
    res.status(201).json({ request });
  }

  async acceptRequest(req: Request, res: Response): Promise<void> {
    const friendship = await friendsService.acceptRequest(req.user!.userId, (req.params as any).requestId);
    res.json({ friendship });
  }

  async declineRequest(req: Request, res: Response): Promise<void> {
    await friendsService.declineRequest(req.user!.userId, (req.params as any).requestId);
    res.json({ message: 'Request declined.' });
  }

  async cancelRequest(req: Request, res: Response): Promise<void> {
    await friendsService.cancelRequest(req.user!.userId, (req.params as any).requestId);
    res.json({ message: 'Request cancelled.' });
  }

  async removeFriend(req: Request, res: Response): Promise<void> {
    await friendsService.removeFriend(req.user!.userId, (req.params as any).friendshipId);
    res.json({ message: 'Friend removed.' });
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    await friendsService.blockUser(req.user!.userId, (req.params as any).userId);
    res.json({ message: 'User blocked.' });
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    await friendsService.unblockUser(req.user!.userId, (req.params as any).userId);
    res.json({ message: 'User unblocked.' });
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    const query = ((req.query as any).q as string) || '';
    const users = await friendsService.searchUsers(query, req.user!.userId);
    res.json({ users });
  }
}

export const friendsController = new FriendsController();
