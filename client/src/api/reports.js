import api from './client';

export const reportsApi = {
  /**
   * Pre-analyze an image using AI detection (no database write)
   */
  async analyzeImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post('/reports/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data || res;
  },

  /**
   * Submit a new civic complaint with photos (multipart/form-data)
   */
  async createReport(formData) {
    const res = await api.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data || res;
  },

  /**
   * Get complaints submitted by the current citizen
   */
  async getMyReports(params = {}) {
    const res = await api.get('/reports/mine', { params });
    return {
      reports: res.data || [],
      meta: res.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
    };
  },

  /**
   * Get single complaint report detail by ID
   */
  async getReportById(id) {
    const res = await api.get(`/reports/${id}`);
    return res.data || res;
  },

  /**
   * Check for nearby open duplicate reports within 30m
   */
  async checkDuplicates({ lat, lng, category }) {
    const res = await api.post('/reports/check-duplicates', { lat, lng, category });
    return res.data || [];
  },

  /**
   * Confirm/upvote an existing report ("I have this issue too")
   */
  async confirmReport(id) {
    const res = await api.post(`/reports/${id}/confirm`);
    return res.data || res;
  },

  /**
   * Reopen a resolved report within 7 days
   */
  async reopenReport(id) {
    const res = await api.post(`/reports/${id}/reopen`);
    return res.data || res;
  },

  /**
   * Public tracking endpoint by complaint number (CE-YYYY-NNNNNN)
   */
  async trackComplaint(complaintNo) {
    const res = await api.get(`/reports/track/${encodeURIComponent(complaintNo)}`);
    return res.data || res;
  },
};

export default reportsApi;

