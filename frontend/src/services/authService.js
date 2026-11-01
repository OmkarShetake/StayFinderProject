import apiClient from './api';

export const authService = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  me: () => apiClient.get('/auth/me'),
  becomeHost: () => apiClient.post('/auth/become-host'),
  updateProfile: (data) => apiClient.patch('/auth/profile', data),
  forgotPassword: (email) => {
    const frontendUrl = window.location.origin;
    return apiClient.post('/auth/forgot-password', { email, frontendUrl });
  },
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email) =>
    apiClient.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`),
};

export default authService;
