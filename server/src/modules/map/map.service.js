import { pool } from '../../db/pool.js';
import geocodeService from '../../services/geocode.js';
import logger from '../../utils/logger.js';

export const mapService = {
  /**
   * Fetch reports inside a geographical bounding box with optional filters
   * @param {Object} options - { bbox, category, status, from, to }
   */
  async getReportsInBBox({ bbox, category, status, from, to }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    // Viewport bounding box filter: west, south, east, north (minLng, minLat, maxLng, maxLat)
    if (bbox) {
      const [west, south, east, north] = bbox.split(',').map(Number);
      conditions.push(`r.location && ST_MakeEnvelope($${idx++}, $${idx++}, $${idx++}, $${idx++}, 4326)::geography`);
      params.push(west, south, east, north);
    }

    if (category) {
      conditions.push(`r.category = $${idx++}`);
      params.push(category);
    }

    if (status) {
      conditions.push(`r.status = $${idx++}`);
      params.push(status);
    }

    if (from) {
      conditions.push(`r.created_at >= $${idx++}`);
      params.push(from);
    }

    if (to) {
      conditions.push(`r.created_at <= $${idx++}`);
      params.push(to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        r.id, r.complaint_no, r.title, r.category, r.status, r.priority,
        r.address, r.area, r.city, r.created_at,
        ST_Y(r.location::geometry) AS lat, 
        ST_X(r.location::geometry) AS lng,
        img.url AS image_url
      FROM reports r
      LEFT JOIN LATERAL (
        SELECT url FROM report_images 
        WHERE report_id = r.id 
        ORDER BY is_primary DESC, created_at ASC 
        LIMIT 1
      ) img ON true
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT 500
    `;

    const result = await pool.query(sql, params);
    return result.rows;
  },

  /**
   * Reverse geocode lat/lng to human-readable address
   */
  async reverseGeocode(lat, lng) {
    return geocodeService.reverseGeocode(lat, lng);
  },
};

export default mapService;

