import api from './client';

export const analyticsApi = {
  /**
   * Get KPI summary
   */
  async getSummary() {
    const res = await api.get('/analytics/summary');
    return res.data || res;
  },

  /**
   * Get complaints count by category
   */
  async getByCategory() {
    const res = await api.get('/analytics/by-category');
    return res.data || [];
  },

  /**
   * Get complaints count by status
   */
  async getByStatus() {
    const res = await api.get('/analytics/by-status');
    return res.data || [];
  },

  /**
   * Get reporting trend time series
   */
  async getTrend(params = {}) {
    const res = await api.get('/analytics/trend', { params });
    return res.data || [];
  },

  /**
   * Get hotspots geospatial coordinate clusters for heatmap
   */
  async getHotspots(params = {}) {
    const res = await api.get('/analytics/hotspots', { params });
    return res.data || [];
  },

  /**
   * Get top problem areas
   */
  async getTopAreas(params = {}) {
    const res = await api.get('/analytics/top-areas', { params });
    return res.data || [];
  },

  /**
   * Get average resolution turnaround time per category
   */
  async getResolutionTime() {
    const res = await api.get('/analytics/resolution-time');
    return res.data || [];
  },

  /**
   * Get AI model prediction accuracy metrics
   */
  async getAiAccuracy() {
    const res = await api.get('/analytics/ai-accuracy');
    return res.data || res;
  },

  /**
   * Download filtered reports as CSV spreadsheet file
   */
  async downloadExportCsv(params = {}) {
    const res = await api.get('/analytics/export', {
      params,
      responseType: 'blob',
    });
    const blob = res instanceof Blob ? res : new Blob([res], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `civiceye-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

export default analyticsApi;

