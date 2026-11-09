import api from './client';
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const authApi = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data || res;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    return res.data || res;
  },

  async refresh(refreshToken) {
    // Direct axios call to avoid interceptor loop
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    return res.data?.data || res.data;
  },

  async logout(refreshToken) {
    try {
      const res = await api.post('/auth/logout', { refreshToken });
      return res.data || res;
    } catch {
      // Ignore logout errors
      return true;
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data || res;
  },

  async getProfile() {
    const res = await api.get('/users/me');
    return res.data || res;
  },

  async updateProfile(data) {
    const res = await api.patch('/users/me', data);
    return res.data || res;
  },

  async changePassword(data) {
    const res = await api.patch('/users/me/password', data);
    return res.data || res;
  },
};

export default authApi;

