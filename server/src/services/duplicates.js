import { pool } from '../db/pool.js';
import logger from '../utils/logger.js';

export const duplicatesService = {
  /**
   * Find nearby open reports in the same category within 30 meters created in the last 30 days
   * @param {Object} options - { lat, lng, category, excludeReportId }
   * @returns {Promise<Array>} List of matching nearby reports with distance in meters
   */
  async findDuplicates({ lat, lng, category, excludeReportId = null }) {
    if (!lat || !lng || !category) {
      return [];
    }

    const conditions = [
      'r.category = $1',
      "r.status NOT IN ('resolved', 'rejected')",
      "r.created_at > now() - interval '30 days'",
      'ST_DWithin(r.location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 30)',
    ];

    const params = [category, lng, lat]; // Note: ST_MakePoint(lng, lat)

    if (excludeReportId) {
      conditions.push('r.id != $4');
      params.push(excludeReportId);
    }

    const sql = `
      SELECT 
        r.id, r.complaint_no, r.title, r.description, r.category, r.status,
        r.confirmation_count, r.priority, r.address, r.created_at,
        ROUND(ST_Distance(r.location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography)::numeric, 1) AS meters,
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
      WHERE ${conditions.join(' AND ')}
      ORDER BY meters ASC
      LIMIT 5
    `;

    try {
      const result = await pool.query(sql, params);
      return result.rows;
    } catch (err) {
      logger.error({ err: err.message, lat, lng, category }, 'Duplicate search query failed');
      return [];
    }
  },
};

export default duplicatesService;

