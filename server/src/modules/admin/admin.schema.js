import { z } from 'zod';
import { reportCategories, reportStatuses } from '../reports/reports.schema.js';

export const adminReportsQuerySchema = z.object({
  query: z.object({
    status: z.enum(reportStatuses).optional(),
    category: z.enum(reportCategories).optional(),
    severity: z.enum(['low', 'medium', 'high']).optional(),
    needsReview: z
      .string()
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
    area: z.string().trim().optional(),
    q: z.string().trim().optional(),
    from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    sort: z
      .enum([
        'created_at:desc',
        'created_at:asc',
        'priority:desc',
        'priority:asc',
        'confirmation_count:desc',
      ])
      .optional()
      .default('created_at:desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export const updateReportStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID'),
  }),
  body: z.object({
    status: z.enum(reportStatuses, {
      errorMap: () => ({ message: 'Invalid target status' }),
    }),
    note: z.string().trim().max(1000).optional().default(''),
    isInternal: z.boolean().optional().default(false),
    rejectionReason: z.string().trim().max(500).optional(),
  }),
});

export const assignReportSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID'),
  }),
  body: z.object({
    departmentId: z.string().uuid('Invalid department ID').nullable().optional(),
    assignedTo: z.string().uuid('Invalid officer user ID').nullable().optional(),
    note: z.string().trim().max(500).optional(),
  }),
});

export const updatePrioritySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID'),
  }),
  body: z.object({
    priority: z.coerce.number().int().min(0).max(10, 'Priority must be between 0 and 10'),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID'),
  }),
  body: z.object({
    category: z.enum(reportCategories, {
      errorMap: () => ({ message: 'Invalid category' }),
    }),
  }),
});

export const mergeReportSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid report ID to merge'),
  }),
  body: z.object({
    duplicateOfId: z.string().uuid('Invalid target master report ID'),
    note: z.string().trim().max(500).optional(),
  }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one report ID is required'),
    status: z.enum(reportStatuses, {
      errorMap: () => ({ message: 'Invalid target status' }),
    }),
    note: z.string().trim().max(500).optional(),
  }),
});

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    handles: z.array(z.enum(reportCategories)).default([]),
  }),
});

export const adminUsersQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().optional(),
    role: z.enum(['citizen', 'admin', 'officer']).optional(),
    active: z
      .string()
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    role: z.enum(['citizen', 'admin', 'officer']).optional(),
    isActive: z.boolean().optional(),
    departmentId: z.string().uuid().nullable().optional(),
  }),
});

