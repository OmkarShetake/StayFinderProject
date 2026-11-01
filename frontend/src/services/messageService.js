import apiClient from './api';

export const messageService = {
  sendMessage: (body) => apiClient.post('/messages', body),
  getMessages: (bookingId) => apiClient.get(`/messages/booking/${bookingId}`),
  getUnreadCount: () => apiClient.get('/messages/unread/count'),
};

export default messageService;
