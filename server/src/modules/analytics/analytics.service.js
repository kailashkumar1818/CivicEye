import { pool } from '../../db/pool.js';

export const analyticsService = {
  /**
   * System summary metrics (totals, open, resolved, avg resolution time, needs review)
   */
  async getSummary() {
    const summarySql = `
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'rejected'))::int AS open,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
        COUNT(*) FILTER (WHERE needs_review = true)::int AS needs_review,
        COUNT(*) FILTER (WHERE priority >= 3)::int AS high_priority,
        COALESCE(
          ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE status = 'resolved' AND resolved_at IS NOT NULL)::numeric, 1)::float,
          0
        ) AS avg_resolution_hours
      FROM reports;
    `;
    const res = await pool.query(summarySql);
    return res.rows[0];
  },

  /**
   * Problem counts grouped by category
   */
  async getByCategory() {
    const sql = `
      SELECT 
        category,
        COUNT(*)::int AS count
      FROM reports
      GROUP BY category
      ORDER BY count DESC;
    `;
    const res = await pool.query(sql);
    return res.rows;
  },

  /**
   * Problem counts grouped by resolution status
   */
  async getByStatus() {
    const sql = `
      SELECT 
        status,
        COUNT(*)::int AS count
      FROM reports
      GROUP BY status
      ORDER BY count DESC;
    `;
    const res = await pool.query(sql);
    return res.rows;
  },

  /**
   * Time series reporting trend
   */
  async getTrend({ interval = 'day', from, to }) {
    const conditions = ['1=1'];
    const values = [interval];
    let idx = 2;

    if (from) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(from);
    }
    if (to) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(to);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        to_char(date_trunc($1, created_at), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved
      FROM reports
      WHERE ${whereClause}
      GROUP BY date_trunc($1, created_at)
      ORDER BY date_trunc($1, created_at) ASC;
    `;

    const res = await pool.query(sql, values);
    return res.rows;
  },

  /**
   * Geospatial hotspot clusters (grid aggregation) for Leaflet heatmap
   */
  async getHotspots({ limit = 100 }) {
    const sql = `
      SELECT 
        ROUND(ST_Y(ST_Centroid(ST_Collect(location::geometry)))::numeric, 6)::float AS lat,
        ROUND(ST_X(ST_Centroid(ST_Collect(location::geometry)))::numeric, 6)::float AS lng,
        COUNT(*)::int AS total
      FROM reports
      WHERE status NOT IN ('rejected')
      GROUP BY ST_SnapToGrid(location::geometry, 0.005)
      ORDER BY total DESC
      LIMIT $1;
    `;
    const res = await pool.query(sql, [limit]);
    return res.rows;
  },

  /**
   * Top problem areas ranked by open complaints
   */
  async getTopAreas({ limit = 10 }) {
    const sql = `
      SELECT 
        COALESCE(NULLIF(TRIM(area), ''), 'City Center') AS area,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'rejected'))::int AS open_count,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_count
      FROM reports
      GROUP BY COALESCE(NULLIF(TRIM(area), ''), 'City Center')
      ORDER BY open_count DESC, total DESC
      LIMIT $1;
    `;
    const res = await pool.query(sql, [limit]);
    return res.rows;
  },

  /**
   * Average resolution turnaround time per problem category
   */
  async getResolutionTime() {
    const sql = `
      SELECT 
        category,
        COALESCE(
          ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1)::float,
          0
        ) AS avg_hours,
        COUNT(*)::int AS resolved_count
      FROM reports 
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
      GROUP BY category
      ORDER BY avg_hours ASC;
    `;
    const res = await pool.query(sql);
    return res.rows;
  },

  /**
   * Model prediction accuracy (comparing AI detection vs finalized citizen/admin category)
   */
  async getAiAccuracy() {
    const overallSql = `
      SELECT 
        COUNT(*)::int AS total_analyzed,
        COUNT(*) FILTER (WHERE ai_category = category)::int AS accurate_count,
        COALESCE(
          ROUND(
            (COUNT(*) FILTER (WHERE ai_category = category)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric,
            1
          )::float,
          0
        ) AS accuracy_percentage
      FROM reports
      WHERE ai_status = 'ok' AND ai_category IS NOT NULL;
    `;

    const categoryBreakdownSql = `
      SELECT 
        category,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE ai_category = category)::int AS accurate,
        COALESCE(
          ROUND(
            (COUNT(*) FILTER (WHERE ai_category = category)::numeric / NULLIF(COUNT(*), 0) * 100)::numeric,
            1
          )::float,
          0
        ) AS match_rate
      FROM reports
      WHERE ai_status = 'ok' AND ai_category IS NOT NULL
      GROUP BY category
      ORDER BY total DESC;
    `;

    const [overallRes, breakdownRes] = await Promise.all([
      pool.query(overallSql),
      pool.query(categoryBreakdownSql),
    ]);

    return {
      ...overallRes.rows[0],
      byCategory: breakdownRes.rows,
    };
  },

  /**
   * Export municipal complaints to CSV format
   */
  async exportReportsCsv(filters = {}) {
    const conditions = ['1=1'];
    const values = [];
    let idx = 1;

    if (filters.status) {
      conditions.push(`r.status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters.category) {
      conditions.push(`r.category = $${idx++}`);
      values.push(filters.category);
    }
    if (filters.area) {
      conditions.push(`LOWER(r.area) = LOWER($${idx++})`);
      values.push(filters.area.trim());
    }
    if (filters.from) {
      conditions.push(`r.created_at >= $${idx++}`);
      values.push(filters.from);
    }
    if (filters.to) {
      conditions.push(`r.created_at <= $${idx++}`);
      values.push(filters.to);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        r.complaint_no,
        r.title,
        r.category,
        r.status,
        r.priority,
        r.confirmation_count,
        COALESCE(r.area, '') AS area,
        COALESCE(r.city, '') AS city,
        ROUND(ST_Y(r.location::geometry)::numeric, 6) AS latitude,
        ROUND(ST_X(r.location::geometry)::numeric, 6) AS longitude,
        COALESCE(r.ai_category, '') AS ai_category,
        COALESCE(ROUND((r.ai_confidence * 100)::numeric, 1), 0) AS ai_confidence_percent,
        COALESCE(r.ai_severity, '') AS ai_severity,
        r.created_at,
        r.resolved_at,
        COALESCE(ROUND(EXTRACT(EPOCH FROM (r.resolved_at - r.created_at)) / 3600)::numeric, 0) AS turnaround_hours
      FROM reports r
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT 2000;
    `;

    const res = await pool.query(sql, values);

    const headers = [
      'Complaint No',
      'Title',
      'Category',
      'Status',
      'Priority',
      'Confirmations',
      'Area',
      'City',
      'Latitude',
      'Longitude',
      'AI Category',
      'AI Confidence (%)',
      'AI Severity',
      'Created At',
      'Resolved At',
      'Turnaround Hours',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [headers.join(',')];

    for (const row of res.rows) {
      const line = [
        escapeCsv(row.complaint_no),
        escapeCsv(row.title),
        escapeCsv(row.category),
        escapeCsv(row.status),
        row.priority,
        row.confirmation_count,
        escapeCsv(row.area),
        escapeCsv(row.city),
        row.latitude,
        row.longitude,
        escapeCsv(row.ai_category),
        row.ai_confidence_percent,
        escapeCsv(row.ai_severity),
        escapeCsv(row.created_at ? new Date(row.created_at).toISOString() : ''),
        escapeCsv(row.resolved_at ? new Date(row.resolved_at).toISOString() : ''),
        row.turnaround_hours,
      ];
      csvLines.push(line.join(','));
    }

    return csvLines.join('\r\n');
  },
};

export default analyticsService;

