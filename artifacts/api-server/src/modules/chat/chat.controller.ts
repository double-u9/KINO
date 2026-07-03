import { Request, Response } from 'express';
import { chatService } from './chat.service.js';

export class ChatController {
  async getChatHistory(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { friendId } = (req.params as any) as any;

    const messages = await chatService.getChatHistory(userId, friendId);
    res.json(messages);
  }

  async sendMessage(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { friendId } = (req.params as any) as any;
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: { message: 'Message content is required' } });
    }

    const message = await chatService.sendMessage(userId, friendId, content);
    res.status(201).json(message);
  }
}

export const chatController = new ChatController();
