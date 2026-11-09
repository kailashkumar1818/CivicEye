import api from './client';

export const mapApi = {
  /**
   * Fetch reports inside a viewport bounding box
   * @param {Object} params - { bbox: 'w,s,e,n', category, status, from, to }
   */
  async getReports(params = {}) {
    const res = await api.get('/map/reports', { params });
    return res.data || [];
  },

  /**
   * Reverse geocode coordinates to address details
   */
  async reverseGeocode(lat, lng) {
    const res = await api.get('/map/reverse-geocode', {
      params: { lat, lng },
    });
    return res.data || { address: '', city: '', area: '', displayName: '' };
  },
};

export default mapApi;

