import usersService from './users.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const usersController = {
  getProfile: asyncHandler(async (req, res) => {
    const userWithStats = await usersService.getProfileWithStats(req.user.id);
    return res.status(200).json({
      success: true,
      data: userWithStats,
    });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { name, phone, city, email_notifications } = req.body;
    const updated = await usersService.updateProfile(req.user.id, {
      name,
      phone,
      city,
      email_notifications,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await usersService.changePassword(req.user.id, {
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully. Please log in again with your new credentials.',
      },
    });
  }),

  updateAvatar: asyncHandler(async (req, res) => {
    const avatarUrl = req.body.avatar_url || req.file?.path || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    const updated = await usersService.updateAvatar(req.user.id, avatarUrl);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  }),
};

export default usersController;

