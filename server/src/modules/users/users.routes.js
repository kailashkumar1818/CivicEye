import { Router } from 'express';
import usersController from './users.controller.js';
import { updateProfileSchema, changePasswordSchema } from './users.schema.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/me', usersController.getProfile);
router.patch('/me', validate(updateProfileSchema), usersController.updateProfile);
router.patch('/me/password', validate(changePasswordSchema), usersController.changePassword);
router.post('/me/avatar', usersController.updateAvatar);

export default router;

