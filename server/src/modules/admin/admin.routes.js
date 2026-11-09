import { Router } from 'express';
import adminController from './admin.controller.js';
import {
  adminReportsQuerySchema,
  updateReportStatusSchema,
  assignReportSchema,
  updatePrioritySchema,
  updateCategorySchema,
  mergeReportSchema,
  bulkStatusSchema,
  createDepartmentSchema,
  adminUsersQuerySchema,
  updateUserSchema,
} from './admin.schema.js';
import authenticate from '../../middleware/authenticate.js';
import requireRole from '../../middleware/requireRole.js';
import validate from '../../middleware/validate.js';
import upload from '../../middleware/upload.js';

const router = Router();

// Protect all admin routes with authentication and role check
router.use(authenticate);
router.use(requireRole('admin', 'officer'));

// Reports triage & detail
router.get('/reports', validate(adminReportsQuerySchema), adminController.getReports);
router.get('/reports/:id', adminController.getReportById);

// Report workflow mutations
router.patch('/reports/:id/status', validate(updateReportStatusSchema), adminController.updateStatus);
router.patch('/reports/:id/assign', validate(assignReportSchema), adminController.assignDepartment);
router.patch('/reports/:id/priority', validate(updatePrioritySchema), adminController.updatePriority);
router.patch('/reports/:id/category', validate(updateCategorySchema), adminController.updateCategory);
router.post('/reports/:id/merge', validate(mergeReportSchema), adminController.mergeReport);
router.post('/reports/:id/resolution-photo', upload.single('image'), adminController.uploadResolutionPhoto);
router.post('/reports/bulk-status', validate(bulkStatusSchema), adminController.bulkUpdateStatus);

// Departments
router.get('/departments', adminController.getDepartments);
router.post(
  '/departments',
  requireRole('admin'),
  validate(createDepartmentSchema),
  adminController.createDepartment
);

// Users management
router.get('/users', validate(adminUsersQuerySchema), adminController.getUsers);
router.patch(
  '/users/:id',
  requireRole('admin'),
  validate(updateUserSchema),
  adminController.updateUser
);

export default router;
