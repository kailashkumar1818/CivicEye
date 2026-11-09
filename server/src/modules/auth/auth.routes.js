import { Router } from 'express';
import authController from './auth.controller.js';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';
import validate from '../../middleware/validate.js';
import authenticate from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;

