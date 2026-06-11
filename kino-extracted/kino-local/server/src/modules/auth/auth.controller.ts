import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    res.cookie('refreshToken', result.tokens.refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    res.cookie('refreshToken', result.tokens.refreshToken, COOKIE_OPTIONS);

    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  }

  async resetLocal(req: Request, res: Response): Promise<void> {
    await authService.resetLocal(req.body);
    res.json({ message: 'Password reset successful.' });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.status(401).json({
        error: { message: 'No refresh token provided.', code: 'NO_REFRESH_TOKEN' },
      });
      return;
    }

    const tokens = await authService.refresh(token);

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

    res.json({ accessToken: tokens.accessToken });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refreshToken;

    if (token) {
      await authService.logout(token);
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.json({ message: 'Logged out.' });
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  }
}

export const authController = new AuthController();
