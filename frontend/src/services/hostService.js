import apiClient from './api';

export const hostService = {
  getMyProperties: (page = 0) => apiClient.get(`/host/properties?page=${page}`),
  createProperty: (body) => apiClient.post('/host/properties', body),
  updateAvailability: (id, body) => apiClient.put(`/host/properties/${id}/availability`, body),
  getHostBookings: (page = 0) => apiClient.get(`/host/bookings?page=${page}`),
  confirmBooking: (id) => apiClient.patch(`/host/bookings/${id}/confirm`),
  rejectBooking: (id) => apiClient.patch(`/host/bookings/${id}/reject`),
  generateDescription: (body) =>
    apiClient.post('/host/properties/generate-description', body),
  getPriceRecommendationPreview: (body) =>
    apiClient.post('/host/properties/price-recommendation-preview', body),
  getSmartPriceRecommendation: (propertyId) =>
    apiClient.get(`/host/properties/${propertyId}/price-recommendation`),
};

export default hostService;
