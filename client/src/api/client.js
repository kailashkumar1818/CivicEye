import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

let inMemoryToken = null;
let logoutCallback = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

export const setLogoutHandler = (callback) => {
  logoutCallback = callback;
};

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach Authorization header
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh token rotation
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

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt refresh on auth endpoints like login or refresh itself
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        const errorData = error.response?.data?.error || {
          code: 'AUTH_FAILED',
          message: error.response?.data?.error?.message || 'Authentication failed',
          details: [],
        };
        return Promise.reject(errorData);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        isRefreshing = false;
        if (logoutCallback) logoutCallback();
        return Promise.reject(
          error.response?.data?.error || {
            code: 'UNAUTHORIZED',
            message: 'Session expired. Please log in again.',
          }
        );
      }

      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const data = refreshResponse.data?.data || refreshResponse.data;
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        setAccessToken(newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        if (logoutCallback) logoutCallback();
        return Promise.reject(
          refreshErr.response?.data?.error || {
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please sign in again.',
          }
        );
      } finally {
        isRefreshing = false;
      }
    }

    const errorData = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Request failed',
      details: [],
    };
    return Promise.reject(errorData);
  }
);

export default api;
