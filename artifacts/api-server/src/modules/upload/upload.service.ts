import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import sharp from 'sharp';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const BANNERS_DIR = path.join(UPLOADS_DIR, 'banners');
const CHAT_DIR = path.join(UPLOADS_DIR, 'chat');

// Ensure directories exist
async function ensureDirs() {
  await fs.mkdir(AVATARS_DIR, { recursive: true });
  await fs.mkdir(BANNERS_DIR, { recursive: true });
  await fs.mkdir(CHAT_DIR, { recursive: true });
}
ensureDirs();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_GIF_TYPES = ['image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALL_BANNER_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_GIF_TYPES, ...ALLOWED_VIDEO_TYPES];

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_BANNER_SIZE = 20 * 1024 * 1024;  // 20MB

function generateFilename(ext: string): string {
  return `${crypto.randomUUID()}${ext}`;
}

function getBannerType(mimetype: string): 'static' | 'gif' | 'video' {
  if (ALLOWED_GIF_TYPES.includes(mimetype)) return 'gif';
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return 'video';
  return 'static';
}

export class UploadService {
  /**
   * Process and save avatar image.
   * Resizes to 512x512, converts to WebP, quality 85.
   */
  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new AppError(400, 'Avatar must be PNG, JPG, or WEBP.', 'INVALID_TYPE');
    }
    if (file.size > MAX_AVATAR_SIZE) {
      throw new AppError(400, 'Avatar must be under 5MB.', 'FILE_TOO_LARGE');
    }

    // Process with sharp
    const filename = generateFilename('.webp');
    const outputPath = path.join(AVATARS_DIR, filename);

    await sharp(file.buffer)
      .resize(512, 512, { fit: 'cover', position: 'centre' })
      .webp({ quality: 85 })
      .toFile(outputPath);

    // Clean up old avatar
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile?.avatarUrl) {
      await this.deleteFile(profile.avatarUrl);
    }

    // Update database
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });

    return avatarUrl;
  }

  /**
   * Process and save banner.
   * Static images: resize to max 1920px wide, WebP quality 85.
   * GIF/Video: save as-is.
   */
  async uploadBanner(userId: string, file: Express.Multer.File): Promise<{ bannerUrl: string; bannerType: string }> {
    if (!ALL_BANNER_TYPES.includes(file.mimetype)) {
      throw new AppError(400, 'Banner must be JPG, PNG, WEBP, GIF, MP4, or WEBM.', 'INVALID_TYPE');
    }
    if (file.size > MAX_BANNER_SIZE) {
      throw new AppError(400, 'Banner must be under 20MB.', 'FILE_TOO_LARGE');
    }

    const bannerType = getBannerType(file.mimetype);
    let filename: string;
    let outputPath: string;

    if (bannerType === 'static') {
      // Optimize static images
      filename = generateFilename('.webp');
      outputPath = path.join(BANNERS_DIR, filename);

      await sharp(file.buffer)
        .resize(1920, undefined, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outputPath);
    } else {
      // GIF and video: save as-is
      const ext = file.mimetype === 'image/gif' ? '.gif'
        : file.mimetype === 'video/mp4' ? '.mp4' : '.webm';
      filename = generateFilename(ext);
      outputPath = path.join(BANNERS_DIR, filename);

      await fs.writeFile(outputPath, file.buffer);
    }

    // Clean up old banner
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile?.bannerUrl) {
      await this.deleteFile(profile.bannerUrl);
    }

    // Update database
    const bannerUrl = `/uploads/banners/${filename}`;
    await prisma.profile.update({
      where: { userId },
      data: { bannerUrl, bannerType },
    });

    return { bannerUrl, bannerType };
  }

  /**
   * Process and save a chat image.
   * Resizes to max 1080px wide, converts to WebP, quality 85.
   */
  async uploadChatImage(userId: string, file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new AppError(400, 'Chat image must be PNG, JPG, or WEBP.', 'INVALID_TYPE');
    }
    if (file.size > MAX_BANNER_SIZE) { // Using 20MB max size for chat images
      throw new AppError(400, 'Chat image must be under 20MB.', 'FILE_TOO_LARGE');
    }

    const filename = generateFilename('.webp');
    const outputPath = path.join(CHAT_DIR, filename);

    await sharp(file.buffer)
      .resize(1080, undefined, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(outputPath);

    return `/uploads/chat/${filename}`;
  }

  async removeAvatar(userId: string): Promise<void> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile?.avatarUrl) {
      await this.deleteFile(profile.avatarUrl);
    }
    await prisma.profile.update({
      where: { userId },
      data: { avatarUrl: null },
    });
  }

  async removeBanner(userId: string): Promise<void> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile?.bannerUrl) {
      await this.deleteFile(profile.bannerUrl);
    }
    await prisma.profile.update({
      where: { userId },
      data: { bannerUrl: null, bannerType: 'static' },
    });
  }

  private async deleteFile(urlPath: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), urlPath);
      await fs.unlink(filePath);
    } catch {
      // File may not exist — ignore
    }
  }
}

export const uploadService = new UploadService();
