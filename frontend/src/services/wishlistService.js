import apiClient from './api';

export const wishlistService = {
  getWishlist: () => apiClient.get('/wishlists'),
  toggleWishlist: (propertyId) => apiClient.post(`/wishlists/${propertyId}`),
};

export default wishlistService;
