import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address.')
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(24, 'Username must be at most 24 characters.')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens.',
    )
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128),
});

export const loginSchema = z.object({
  login: z
    .string()
    .min(1, 'Email or username is required.')
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required.'),
});

export const resetLocalSchema = z.object({
  login: z
    .string()
    .min(1, 'Email or username is required.')
    .transform((v) => v.toLowerCase().trim()),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetLocalInput = z.infer<typeof resetLocalSchema>;
