import { Router } from 'express';
import notificationsController from './notifications.controller.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get('/', notificationsController.list);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);

export default router;

