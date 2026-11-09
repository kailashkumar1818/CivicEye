import { z } from 'zod';

export const trendQuerySchema = z.object({
  query: z.object({
    interval: z.enum(['day', 'week', 'month']).optional().default('day'),
    from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  }),
});

export const hotspotsQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  }),
});

export const topAreasQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

