import { z } from 'zod';
import { reportCategories, reportStatuses } from '../reports/reports.schema.js';

export const bboxQuerySchema = z.object({
  query: z.object({
    bbox: z
      .string()
      .trim()
      .regex(
        /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/,
        'bbox must be formatted as west,south,east,north (minLng,minLat,maxLng,maxLat)'
      )
      .optional(),
    category: z.enum(reportCategories).optional(),
    status: z.enum(reportStatuses).optional(),
    from: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    to: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  }),
});

export const reverseGeocodeSchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(-90).max(90, 'Invalid latitude coordinates'),
    lng: z.coerce.number().min(-180).max(180, 'Invalid longitude coordinates'),
  }),
});

