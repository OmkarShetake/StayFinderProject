import apiClient from './api';

export const adminService = {
  adminGetProperties: (status = 'PENDING', page = 0) =>
    apiClient.get(`/admin/properties?status=${status}&page=${page}`),
  adminApproveProperty: (id) => apiClient.patch(`/admin/properties/${id}/approve`),
  adminRejectProperty: (id) => apiClient.patch(`/admin/properties/${id}/reject`),
  adminDeleteProperty: (id) => apiClient.delete(`/admin/properties/${id}`),
  adminGetBookings: (page = 0) => apiClient.get(`/admin/bookings?page=${page}`),
};

export default adminService;
