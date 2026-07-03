import { prisma } from '../../config/database.js';
import { hashPassword, comparePassword } from '../../lib/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseExpiry,
  type TokenPayload,
} from '../../lib/jwt.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error-handler.js';
import type { RegisterInput, LoginInput, ResetLocalInput } from './auth.schema.js';
import { v4 as uuidv4 } from 'uuid';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    username: string;
  };
  tokens: AuthTokens;
}

export class AuthService {
  async register(input: RegisterInput, meta?: { userAgent?: string; ip?: string }): Promise<AuthResult> {
    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existing) {
      if (existing.email === input.email) {
        throw new AppError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
      }
      throw new AppError(409, 'This username is already taken.', 'USERNAME_TAKEN');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        // Create default profile, settings, and privacy
        profile: {
          create: {
            displayName: input.username,
          },
        },
        settings: {
          create: {},
        },
        privacy: {
          create: {},
        },
      },
    });

    // Create activity
    await prisma.activityFeed.create({
      data: {
        userId: user.id,
        type: 'joined',
        payload: JSON.stringify({ username: user.username }),
      },
    });

    const tokens = await this.createSession(
      { userId: user.id, username: user.username },
      meta,
    );

    return {
      user: { id: user.id, email: user.email, username: user.username },
      tokens,
    };
  }

  async login(input: LoginInput, meta?: { userAgent?: string; ip?: string }): Promise<AuthResult> {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.login }, { username: input.login }],
      },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const tokens = await this.createSession(
      { userId: user.id, username: user.username },
      meta,
    );

    return {
      user: { id: user.id, email: user.email, username: user.username },
      tokens,
    };
  }

  async resetLocal(input: ResetLocalInput): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.login }, { username: input.login }],
      },
    });

    if (!user) {
      throw new AppError(401, 'User not found.', 'USER_NOT_FOUND');
    }

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }

  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ip?: string },
  ): Promise<AuthTokens> {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid refresh token.', 'REFRESH_INVALID');
    }

    // Find and invalidate old session
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      // If token was reused after rotation, invalidate ALL sessions (security)
      if (!session) {
        await prisma.session.deleteMany({ where: { userId: payload.userId } });
      }
      throw new AppError(401, 'Refresh token expired or revoked.', 'REFRESH_EXPIRED');
    }

    // Delete old session (rotation)
    await prisma.session.delete({ where: { id: session.id } });

    // Create new session with new refresh token (strip exp/iat from old token)
    const newTokens = await this.createSession(
      { userId: payload.userId, username: payload.username },
      meta,
    );
    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  async logoutAll(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        emailVerified: true,
        createdAt: true,
        profile: true,
        settings: true,
        privacy: true,
        _count: {
          select: {
            media: true,
            friendshipsA: true,
            friendshipsB: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found.', 'USER_NOT_FOUND');
    }

    return {
      ...user,
      friendCount: user._count.friendshipsA + user._count.friendshipsB,
      mediaCount: user._count.media,
    };
  }

  // ── Private helpers ──

  private async createSession(
    payload: TokenPayload,
    meta?: { userAgent?: string; ip?: string },
  ): Promise<AuthTokens> {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date(
      Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
    );

    await prisma.session.create({
      data: {
        userId: payload.userId,
        refreshToken,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ip,
        expiresAt,
      },
    });

    // Clean up expired sessions for this user
    await prisma.session.deleteMany({
      where: {
        userId: payload.userId,
        expiresAt: { lt: new Date() },
      },
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
