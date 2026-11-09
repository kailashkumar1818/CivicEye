import { Router } from 'express';
import reportsController from './reports.controller.js';
import {
  createReportSchema,
  myReportsQuerySchema,
  checkDuplicatesSchema,
  trackComplaintSchema,
} from './reports.schema.js';
import upload from '../../middleware/upload.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// Public route: Track complaint status by complaint number
router.get('/track/:complaintNo', validate(trackComplaintSchema), reportsController.track);

// Authenticated citizen/user routes
router.use(authenticate);

router.post('/check-duplicates', validate(checkDuplicatesSchema), reportsController.checkDuplicates);
router.post('/analyze', upload.single('image'), reportsController.analyze);
router.post('/', upload.array('images', 3), validate(createReportSchema), reportsController.create);
router.get('/mine', validate(myReportsQuerySchema), reportsController.getMyReports);
router.get('/:id', reportsController.getById);
router.post('/:id/confirm', reportsController.confirm);
router.post('/:id/reopen', reportsController.reopen);

export default router;

