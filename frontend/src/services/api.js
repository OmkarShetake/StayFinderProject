import axios from 'axios';

const TOKEN_KEY = 'sf_token';
const REFRESH_KEY = 'sf_refresh';
const USER_KEY = 'sf_user';

export const getStoredToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getStoredRefreshToken = () => sessionStorage.getItem(REFRESH_KEY);
export const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveAuthData = (data) => {
  if (data.accessToken) sessionStorage.setItem(TOKEN_KEY, data.accessToken);
  if (data.refreshToken) sessionStorage.setItem(REFRESH_KEY, data.refreshToken);
  if (data.user) sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
};

export const clearAuthData = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
};

// Base URL detection matching original StayFinder API client
const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocal
    ? ['3000', '80', '443', ''].includes(window.location.port)
      ? '/api/v1'
      : 'http://localhost:8080/api/v1'
    : 'https://stayfinder-backend-5en8.onrender.com/api/v1');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with 401 refresh token retry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : null;

    if (status === 401 && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        clearAuthData();
        return Promise.reject(new Error(error.response?.data?.message || 'Unauthorized'));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const data = refreshResponse.data;
        saveAuthData(data);
        const newToken = data.accessToken;

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearAuthData();
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      `Request failed (${status || 'Network Error'})`;

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
