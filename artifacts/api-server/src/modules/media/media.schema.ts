import { z } from 'zod';

export const createMediaSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(['movie', 'series', 'anime', 'music']),
  coverImageUrl: z.string().nullable().optional(),
  rating: z.number().min(0).max(10).nullable().optional(),
  imdbId: z.string().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  isFavorite: z.boolean().optional().default(false),
  totalSeasonsKnown: z.number().int().nullable().optional(),
});

export const updateMediaSchema = createMediaSchema.partial();

export const createSeasonSchema = z.object({
  seasonNumber: z.number().int().min(1),
  completed: z.boolean().default(false),
  rating: z.number().min(0).max(10).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const updateSeasonSchema = createSeasonSchema.partial();

export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
