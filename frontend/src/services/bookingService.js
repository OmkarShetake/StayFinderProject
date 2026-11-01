import apiClient from './api';

export const bookingService = {
  createBooking: (body) => apiClient.post('/bookings', body),
  getMyBookings: (page = 0) => apiClient.get(`/bookings?page=${page}`),
  getBooking: (id) => apiClient.get(`/bookings/${id}`),
  cancelBooking: (id) => apiClient.patch(`/bookings/${id}/cancel`),
  modifyBooking: (id, body) => apiClient.patch(`/bookings/${id}/modify`, body),
  pricePreview: (body) => apiClient.post('/bookings/price-preview', body),
};

export default bookingService;
