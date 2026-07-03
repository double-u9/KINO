import type { Request, Response } from 'express';
import { mediaService } from './media.service.js';

export class MediaController {
  async list(req: Request, res: Response): Promise<void> {
    const items = await mediaService.list(req.user!.userId, {
      type: (req.query as any).type as string | undefined,
      search: (req.query as any).search as string | undefined,
      sort: (req.query as any).sort as string | undefined,
    });
    res.json({ media: items });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const item = await mediaService.getById(req.user!.userId, (req.params as any).id);
    res.json({ media: item });
  }

  async create(req: Request, res: Response): Promise<void> {
    const item = await mediaService.create(req.user!.userId, req.body);
    res.status(201).json({ media: item });
  }

  async update(req: Request, res: Response): Promise<void> {
    const item = await mediaService.update(req.user!.userId, (req.params as any).id, req.body);
    res.json({ media: item });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await mediaService.delete(req.user!.userId, (req.params as any).id);
    res.json({ message: 'Media deleted.' });
  }

  async addSeason(req: Request, res: Response): Promise<void> {
    const season = await mediaService.addSeason(req.user!.userId, (req.params as any).id, req.body);
    res.status(201).json({ season });
  }

  async updateSeason(req: Request, res: Response): Promise<void> {
    const season = await mediaService.updateSeason(
      req.user!.userId,
      (req.params as any).id,
      (req.params as any).seasonId,
      req.body,
    );
    res.json({ season });
  }

  async deleteSeason(req: Request, res: Response): Promise<void> {
    await mediaService.deleteSeason(req.user!.userId, (req.params as any).id, (req.params as any).seasonId);
    res.json({ message: 'Season deleted.' });
  }
}

export const mediaController = new MediaController();
