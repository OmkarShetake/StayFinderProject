import apiClient from './api';
import { buildQuery } from '../utils/formatters';

export const propertyService = {
  searchProperties: (params = {}) => {
    const q = buildQuery(params);
    return apiClient.get(`/properties/search${q ? `?${q}` : ''}`);
  },
  getProperty: (id) => apiClient.get(`/properties/${id}`),
  getAvailability: (id, from, to) =>
    apiClient.get(`/properties/${id}/availability?from=${from}&to=${to}`),
  getPersonalizedRecommendations: (query = '') =>
    apiClient.get(`/properties/recommendations?query=${encodeURIComponent(query)}`),
  interpretNaturalSearch: (query) =>
    apiClient.post('/properties/interpret-search', { query }),
};

export default propertyService;
