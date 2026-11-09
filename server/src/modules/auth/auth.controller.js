import authService from './auth.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const result = await authService.register({ name, email, password, phone });

    return res.status(201).json({
      success: true,
      data: result,
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      data: result,
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const userId = req.user?.id;
    await authService.logout({ refreshToken, userId });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  }),

  getMe: asyncHandler(async (req, res) => {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  }),
};

export default authController;

