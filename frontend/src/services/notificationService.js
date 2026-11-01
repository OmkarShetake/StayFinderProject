import apiClient from './api';

export const notificationService = {
  getNotifications: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread/count'),
  markAllRead: () => apiClient.patch('/notifications/mark-all-read'),
};

export default notificationService;
