import { pool } from '../../db/pool.js';
import cloudinaryService from '../../services/cloudinary.js';
import aiClient from '../../services/aiClient.js';
import duplicatesService from '../../services/duplicates.js';
import notificationsService from '../notifications/notifications.service.js';
import mailerService from '../../services/mailer.js';
import { formatComplaintId } from '../../utils/complaintId.js';
import { validateMagicBytes } from '../../middleware/upload.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';

export const reportsService = {
  /**
   * Submit a new civic complaint with images
   */
  async createReport({
    userId,
    title,
    description,
    category,
    lat,
    lng,
    locationSource = 'gps',
    address = '',
    area = '',
    city = '',
    files = [],
  }) {
    if (!files || files.length === 0) {
      throw ApiError.badRequest('At least one photo of the civic issue is required', 'IMAGE_REQUIRED');
    }

    if (files.length > 3) {
      throw ApiError.badRequest('Maximum 3 photos can be uploaded per report', 'MAX_IMAGES_EXCEEDED');
    }

    // Validate magic bytes for every file
    for (const file of files) {
      if (!validateMagicBytes(file.buffer)) {
        throw ApiError.badRequest(
          `File '${file.originalname}' contains invalid or corrupted image bytes`,
          'INVALID_IMAGE_BYTES'
        );
      }
    }

    // Run AI detection on primary image (gracefully continues if AI service is offline)
    const aiResult = await aiClient.predict(files[0].buffer, files[0].originalname);
    const isOverride = aiResult.category && aiResult.category !== category;
    const needsReview = aiResult.needs_review || isOverride;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Generate unique sequential complaint number (CE-YYYY-NNNNNN)
      const seqResult = await client.query("SELECT nextval('report_seq') AS seq");
      const seqNumber = seqResult.rows[0].seq;
      const complaintNo = formatComplaintId(seqNumber);

      // 2. Insert report with PostGIS point and AI detection metrics
      const insertReportSql = `
        INSERT INTO reports (
          complaint_no, user_id, title, description, category,
          location, address, area, city, location_source,
          status, priority,
          ai_status, ai_category, ai_confidence, ai_severity, ai_detections, needs_review
        ) VALUES (
          $1, $2, $3, $4, $5,
          ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8, $9, $10, $11,
          'submitted', 0,
          $12, $13, $14, $15, $16, $17
        )
        RETURNING 
          id, complaint_no, user_id, title, description, category,
          status, priority, address, area, city, location_source,
          ai_status, ai_category, ai_confidence, ai_severity, needs_review,
          confirmation_count, created_at, updated_at,
          ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
      `;

      const reportResult = await client.query(insertReportSql, [
        complaintNo,
        userId,
        title,
        description || null,
        category,
        lng, // Longitude
        lat, // Latitude
        address || null,
        area || null,
        city || null,
        locationSource,
        aiResult.ai_status,
        aiResult.category,
        aiResult.confidence,
        aiResult.severity,
        JSON.stringify(aiResult.detections || []),
        needsReview,
      ]);

      const report = reportResult.rows[0];

      // 3. Upload images and record them
      const uploadedImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isPrimary = i === 0;

        const uploadRes = await cloudinaryService.uploadImage(file.buffer, 'civiceye/reports');

        const imageInsertSql = `
          INSERT INTO report_images (report_id, url, public_id, is_primary)
          VALUES ($1, $2, $3, $4)
          RETURNING id, url, public_id, is_primary, created_at
        `;

        const imageResult = await client.query(imageInsertSql, [
          report.id,
          uploadRes.url,
          uploadRes.public_id,
          isPrimary,
        ]);

        uploadedImages.push(imageResult.rows[0]);
      }

      // 4. Record initial status history event
      await client.query(
        `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal)
         VALUES ($1, NULL, 'submitted', $2, 'Complaint submitted by citizen', false)`,
        [report.id, userId]
      );

      await client.query('COMMIT');

      logger.info({ complaintNo, reportId: report.id, userId }, 'Complaint report created successfully');

      return {
        ...report,
        images: uploadedImages,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ err: err.message, userId }, 'Failed to create complaint report');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Get paginated list of complaints filed by the authenticated user
   */
  async getMyReports(userId, { status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const conditions = ['r.user_id = $1'];
    const params = [userId];
    let idx = 2;

    if (status) {
      conditions.push(`r.status = $${idx++}`);
      params.push(status);
    }

    const whereClause = conditions.join(' AND ');

    // 1. Total count
    const countSql = `SELECT COUNT(*)::int AS total FROM reports r WHERE ${whereClause}`;
    const countResult = await pool.query(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    // 2. Paginated rows with primary image thumbnail
    const dataSql = `
      SELECT 
        r.id, r.complaint_no, r.title, r.description, r.category,
        r.status, r.priority, r.address, r.area, r.city, r.location_source,
        r.ai_status, r.ai_category, r.ai_confidence, r.ai_severity,
        r.confirmation_count, r.created_at, r.updated_at,
        ST_Y(r.location::geometry) AS lat, ST_X(r.location::geometry) AS lng,
        img.url AS primary_image_url
      FROM reports r
      LEFT JOIN LATERAL (
        SELECT url FROM report_images 
        WHERE report_id = r.id 
        ORDER BY is_primary DESC, created_at ASC 
        LIMIT 1
      ) img ON true
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataParams = [...params, limit, offset];
    const dataResult = await pool.query(dataSql, dataParams);

    return {
      reports: dataResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Get single report detail with images and history timeline
   */
  async getReportById(reportId, userId, userRole) {
    const reportSql = `
      SELECT 
        r.id, r.complaint_no, r.user_id, r.title, r.description, r.category,
        r.status, r.priority, r.address, r.area, r.city, r.location_source,
        r.ai_status, r.ai_category, r.ai_confidence, r.ai_severity, r.ai_detections,
        r.needs_review, r.assigned_department_id, r.assigned_to, r.duplicate_of,
        r.confirmation_count, r.resolved_at, r.resolved_image_url, r.rejection_reason,
        r.created_at, r.updated_at,
        ST_Y(r.location::geometry) AS lat, ST_X(r.location::geometry) AS lng,
        u.name AS citizen_name, u.email AS citizen_email
      FROM reports r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `;

    const reportResult = await pool.query(reportSql, [reportId]);
    if (reportResult.rows.length === 0) {
      throw ApiError.notFound('Complaint report not found', 'REPORT_NOT_FOUND');
    }

    const report = reportResult.rows[0];

    // Ownership guard: only report owner or admin/officer can access detail
    const isOwner = report.user_id === userId;
    const isAdminOrOfficer = userRole === 'admin' || userRole === 'officer';

    if (!isOwner && !isAdminOrOfficer) {
      throw ApiError.forbidden('You do not have permission to view this complaint report', 'ACCESS_DENIED');
    }

    // Fetch images
    const imagesResult = await pool.query(
      `SELECT id, url, public_id, is_primary, created_at 
       FROM report_images 
       WHERE report_id = $1 
       ORDER BY is_primary DESC, created_at ASC`,
      [reportId]
    );

    // Fetch status history (hide internal notes from citizens)
    const historySql = `
      SELECT 
        h.id, h.from_status, h.to_status, h.note, h.is_internal, h.created_at,
        u.name AS changed_by_name, u.role AS changed_by_role
      FROM report_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.report_id = $1 
        AND ($2 = true OR h.is_internal = false)
      ORDER BY h.created_at ASC
    `;

    const historyResult = await pool.query(historySql, [reportId, isAdminOrOfficer]);

    return {
      ...report,
      images: imagesResult.rows,
      timeline: historyResult.rows,
    };
  },

  /**
   * Check for duplicate reports nearby within 30 meters over last 30 days
   */
  async checkDuplicates({ lat, lng, category }) {
    return duplicatesService.findDuplicates({ lat, lng, category });
  },

  /**
   * Citizen confirms an existing report ("same issue" / +1 vote)
   */
  async confirmReport(reportId, userId) {
    const reportRes = await pool.query(
      'SELECT id, complaint_no, title, user_id FROM reports WHERE id = $1',
      [reportId]
    );

    if (reportRes.rows.length === 0) {
      throw ApiError.notFound('Complaint report not found');
    }

    const report = reportRes.rows[0];

    // Check if user already confirmed this report
    const checkRes = await pool.query(
      'SELECT 1 FROM report_confirmations WHERE report_id = $1 AND user_id = $2',
      [reportId, userId]
    );

    if (checkRes.rows.length > 0) {
      throw ApiError.conflict('You have already confirmed this complaint', 'ALREADY_CONFIRMED');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record confirmation
      await client.query(
        'INSERT INTO report_confirmations (report_id, user_id) VALUES ($1, $2)',
        [reportId, userId]
      );

      // Increment confirmation_count and bump priority
      const updateRes = await client.query(
        `UPDATE reports 
         SET confirmation_count = confirmation_count + 1, priority = priority + 1, updated_at = now()
         WHERE id = $1 
         RETURNING confirmation_count, priority`,
        [reportId]
      );

      await client.query('COMMIT');

      // Notify report owner
      if (report.user_id !== userId) {
        await notificationsService.createNotification({
          userId: report.user_id,
          reportId: report.id,
          title: 'Complaint Upvoted (+1)',
          message: `Another citizen confirmed your complaint (${report.complaint_no}). Priority increased!`,
        });
      }

      logger.info({ reportId, userId }, 'Report confirmed by citizen');

      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Reopen a resolved complaint within 7 days of resolution
   */
  async reopenReport(reportId, userId) {
    const reportRes = await pool.query(
      'SELECT id, user_id, status, resolved_at, complaint_no, title FROM reports WHERE id = $1',
      [reportId]
    );

    if (reportRes.rows.length === 0) {
      throw ApiError.notFound('Complaint report not found');
    }

    const report = reportRes.rows[0];

    // Ownership check: only original creator can reopen
    if (report.user_id !== userId) {
      throw ApiError.forbidden('Only the original complainant can reopen this issue');
    }

    if (report.status !== 'resolved') {
      throw ApiError.badRequest('Only resolved complaints can be reopened');
    }

    if (!report.resolved_at) {
      throw ApiError.badRequest('Complaint does not have a valid resolution timestamp');
    }

    const resolvedTime = new Date(report.resolved_at).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - resolvedTime > sevenDaysMs) {
      throw ApiError.badRequest(
        'Complaints can only be reopened within 7 days of resolution',
        'REOPEN_WINDOW_EXPIRED'
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE reports 
         SET status = 'under_review', resolved_at = NULL, updated_at = now()
         WHERE id = $1 
         RETURNING id, complaint_no, status, updated_at`,
        [reportId]
      );

      // Record timeline event
      await client.query(
        `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal)
         VALUES ($1, 'resolved', 'under_review', $2, 'Citizen reopened the issue (problem still persists)', false)`,
        [reportId, userId]
      );

      await client.query('COMMIT');

      // Create notification
      await notificationsService.createNotification({
        userId,
        reportId: report.id,
        title: 'Complaint Reopened',
        message: `Your complaint (${report.complaint_no}) has been reopened and returned to under review.`,
      });

      logger.info({ reportId, userId }, 'Complaint reopened by citizen');

      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Public tracking lookup by complaint number (CE-YYYY-NNNNNN)
   */
  async trackComplaint(complaintNo) {
    const reportSql = `
      SELECT 
        r.id, r.complaint_no, r.title, r.description, r.category,
        r.status, r.priority, r.address, r.area, r.city,
        r.created_at, r.resolved_at, r.resolved_image_url,
        ST_Y(r.location::geometry) AS lat, 
        ST_X(r.location::geometry) AS lng,
        img.url AS primary_image_url
      FROM reports r
      LEFT JOIN LATERAL (
        SELECT url FROM report_images 
        WHERE report_id = r.id 
        ORDER BY is_primary DESC, created_at ASC 
        LIMIT 1
      ) img ON true
      WHERE r.complaint_no = $1
    `;

    const reportRes = await pool.query(reportSql, [complaintNo]);
    if (reportRes.rows.length === 0) {
      throw ApiError.notFound(`No complaint found with reference ${complaintNo}`);
    }

    const report = reportRes.rows[0];

    // Fetch public timeline history (exclude internal notes)
    const historySql = `
      SELECT h.id, h.from_status, h.to_status, h.note, h.created_at, u.role AS changed_by_role
      FROM report_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.report_id = $1 AND h.is_internal = false
      ORDER BY h.created_at ASC
    `;

    const historyRes = await pool.query(historySql, [report.id]);

    return {
      ...report,
      timeline: historyRes.rows,
    };
  },
};

export default reportsService;

