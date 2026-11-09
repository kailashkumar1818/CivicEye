import api from './client';

export const notificationsApi = {
  /**
   * Fetch in-app notifications for current user
   * @param {{ unread?: boolean }} params
   */
  async getNotifications(params = {}) {
    const res = await api.get('/notifications', { params });
    return {
      notifications: res.data || [],
      unreadCount: res.meta?.unreadCount ?? 0,
    };
  },

  /**
   * Mark a single notification as read
   * @param {string} id
   */
  async markRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data || res;
  },

  /**
   * Mark all notifications as read
   */
  async markAllRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data || res;
  },
};

export default notificationsApi;

