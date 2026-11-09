import axios from 'axios';
import logger from '../utils/logger.js';

// In-memory cache for reverse geocoding results: key "lat,lng" -> address object
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export const geocodeService = {
  /**
   * Reverse geocode latitude & longitude to address using OpenStreetMap Nominatim
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<{ address: string, city: string, area: string, displayName: string }>}
   */
  async reverseGeocode(lat, lng) {
    if (!lat || !lng) {
      return { address: '', city: '', area: '', displayName: '' };
    }

    // Round to 4 decimal places for caching (~11m resolution)
    const roundedLat = parseFloat(lat).toFixed(4);
    const roundedLng = parseFloat(lng).toFixed(4);
    const cacheKey = `${roundedLat},${roundedLng}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          format: 'jsonv2',
          lat: roundedLat,
          lon: roundedLng,
          zoom: 18,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'CivicEye-Platform/1.0 (civiceye-smart-city@civiceye.local)',
          'Accept-Language': 'en',
        },
        timeout: 4000,
      });

      const resAddress = response.data?.address || {};
      const road = resAddress.road || resAddress.pedestrian || resAddress.highway || '';
      const suburb = resAddress.suburb || resAddress.neighbourhood || resAddress.residential || '';
      const city =
        resAddress.city || resAddress.town || resAddress.municipality || resAddress.county || '';
      const displayName = response.data?.display_name || '';

      const formattedAddress = [road, suburb, city].filter(Boolean).join(', ') || displayName;

      const result = {
        address: formattedAddress,
        city: city || 'Metro City',
        area: suburb || road || 'General Ward',
        displayName,
      };

      cache.set(cacheKey, {
        timestamp: Date.now(),
        data: result,
      });

      return result;
    } catch (err) {
      logger.warn({ err: err.message, lat, lng }, 'Nominatim reverse geocoding failed or timed out');
      return {
        address: '',
        city: '',
        area: '',
        displayName: '',
      };
    }
  },
};

export default geocodeService;

