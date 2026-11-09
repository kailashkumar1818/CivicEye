import notificationsService from './notifications.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const notificationsController = {
  list: asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === 'true';
    const data = await notificationsService.getNotifications(req.user.id, { unreadOnly });

    return res.status(200).json({
      success: true,
      data: data.notifications,
      meta: {
        unreadCount: data.unreadCount,
      },
    });
  }),

  markRead: asyncHandler(async (req, res) => {
    const updated = await notificationsService.markAsRead(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await notificationsService.markAllAsRead(req.user.id);
    return res.status(200).json({
      success: true,
      data: { message: 'All notifications marked as read' },
    });
  }),
};

export default notificationsController;

