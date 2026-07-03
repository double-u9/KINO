import type { Request, Response } from 'express';
import { profileService } from './profile.service.js';

export class ProfileController {
  async getOwnProfile(req: Request, res: Response): Promise<void> {
    const profile = await profileService.getOwnProfile(req.user!.userId);
    res.json({ profile });
  }

  async getPublicProfile(req: Request, res: Response): Promise<void> {
    const profile = await profileService.getPublicProfile(
      (req.params as any).username,
      req.user?.userId,
    );
    res.json({ profile });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const updated = await profileService.updateProfile(req.user!.userId, req.body);
    res.json({ profile: updated });
  }

  async updatePrivacy(req: Request, res: Response): Promise<void> {
    const updated = await profileService.updatePrivacy(req.user!.userId, req.body);
    res.json({ privacy: updated });
  }

  async getUserMedia(req: Request, res: Response): Promise<void> {
    const media = await profileService.getUserMedia(
      (req.params as any).username,
      req.user?.userId,
    );
    res.json({ media });
  }
}

export const profileController = new ProfileController();
