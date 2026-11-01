import apiClient from './api';

export const reviewService = {
  createReview: (body) => apiClient.post('/reviews', body),
  getReviews: (propertyId, page = 0) =>
    apiClient.get(`/reviews/property/${propertyId}?page=${page}`),
  getRatingSummary: (propertyId) =>
    apiClient.get(`/reviews/property/${propertyId}/summary`),
};

export default reviewService;
