import { Router } from 'express';
import analyticsController from './analytics.controller.js';
import {
  trendQuerySchema,
  hotspotsQuerySchema,
  topAreasQuerySchema,
} from './analytics.schema.js';
import authenticate from '../../middleware/authenticate.js';
import requireRole from '../../middleware/requireRole.js';
import validate from '../../middleware/validate.js';

const router = Router();

// Protect all analytics endpoints with authentication and admin/officer role
router.use(authenticate);
router.use(requireRole('admin', 'officer'));

router.get('/summary', analyticsController.getSummary);
router.get('/by-category', analyticsController.getByCategory);
router.get('/by-status', analyticsController.getByStatus);
router.get('/trend', validate(trendQuerySchema), analyticsController.getTrend);
router.get('/hotspots', validate(hotspotsQuerySchema), analyticsController.getHotspots);
router.get('/top-areas', validate(topAreasQuerySchema), analyticsController.getTopAreas);
router.get('/resolution-time', analyticsController.getResolutionTime);
router.get('/ai-accuracy', analyticsController.getAiAccuracy);
router.get('/export', analyticsController.exportCsv);

export default router;

