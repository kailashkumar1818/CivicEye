import { z } from 'zod';

export const reportCategories = [
  'pothole',
  'garbage',
  'broken_streetlight',
  'damaged_road',
  'other',
];

export const reportStatuses = [
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
];

export const createReportSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
    description: z.string().trim().max(2000).optional().default(''),
    category: z.enum(reportCategories, {
      errorMap: () => ({ message: 'Invalid category. Choose pothole, garbage, broken_streetlight, damaged_road, or other.' }),
    }),
    lat: z.coerce.number().min(-90).max(90, 'Invalid latitude coordinates'),
    lng: z.coerce.number().min(-180).max(180, 'Invalid longitude coordinates'),
    locationSource: z.enum(['gps', 'exif', 'manual']).optional().default('gps'),
    address: z.string().trim().max(500).optional().default(''),
    area: z.string().trim().max(150).optional().default(''),
    city: z.string().trim().max(100).optional().default(''),
  }),
});

export const myReportsQuerySchema = z.object({
  query: z.object({
    status: z.enum(reportStatuses).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  }),
});

export const checkDuplicatesSchema = z.object({
  body: z.object({
    lat: z.coerce.number().min(-90).max(90, 'Invalid latitude coordinates'),
    lng: z.coerce.number().min(-180).max(180, 'Invalid longitude coordinates'),
    category: z.enum(reportCategories, {
      errorMap: () => ({ message: 'Invalid category' }),
    }),
  }),
});

export const trackComplaintSchema = z.object({
  params: z.object({
    complaintNo: z
      .string()
      .trim()
      .regex(/^CE-\d{4}-\d{6}$/, 'Complaint number must be in format CE-YYYY-NNNNNN'),
  }),
});

