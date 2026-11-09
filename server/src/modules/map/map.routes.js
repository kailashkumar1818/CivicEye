import { Router } from 'express';
import mapController from './map.controller.js';
import { bboxQuerySchema, reverseGeocodeSchema } from './map.schema.js';
import validate from '../../middleware/validate.js';

const router = Router();

// Public map endpoints (no auth required)
router.get('/reports', validate(bboxQuerySchema), mapController.getReportsInBBox);
router.get('/reverse-geocode', validate(reverseGeocodeSchema), mapController.reverseGeocode);

export default router;

