import { pool } from '../../db/pool.js';
import ApiError from '../../utils/ApiError.js';
import notificationsService from '../notifications/notifications.service.js';
import mailerService from '../../services/mailer.js';
import cloudinaryService from '../../services/cloudinary.js';
import logger from '../../utils/logger.js';

// Allowed status transitions
const validTransitions = {
  submitted: ['under_review', 'rejected'],
  under_review: ['assigned', 'in_progress', 'rejected'],
  assigned: ['in_progress', 'under_review', 'rejected'],
  in_progress: ['resolved', 'assigned', 'rejected'],
  resolved: ['under_review'],
  rejected: ['under_review'],
};

export const adminService = {
  /**
   * Get paginated reports with administrative filters, search, and sorting
   */
  async getReports({
    status,
    category,
    severity,
    needsReview,
    area,
    q,
    from,
    to,
    sort = 'created_at:desc',
    page = 1,
    limit = 20,
  }) {
    const conditions = ['1=1'];
    const values = [];
    let idx = 1;

    if (status) {
      conditions.push(`r.status = $${idx++}`);
      values.push(status);
    }

    if (category) {
      conditions.push(`r.category = $${idx++}`);
      values.push(category);
    }

    if (severity) {
      conditions.push(`r.ai_severity = $${idx++}`);
      values.push(severity);
    }

    if (typeof needsReview === 'boolean') {
      conditions.push(`r.needs_review = $${idx++}`);
      values.push(needsReview);
    }

    if (area) {
      conditions.push(`LOWER(r.area) = LOWER($${idx++})`);
      values.push(area.trim());
    }

    if (q) {
      conditions.push(`(
        r.complaint_no ILIKE $${idx} OR
        r.title ILIKE $${idx} OR
        r.description ILIKE $${idx} OR
        r.address ILIKE $${idx} OR
        u.name ILIKE $${idx} OR
        u.email ILIKE $${idx}
      )`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    if (from) {
      conditions.push(`r.created_at >= $${idx++}`);
      values.push(from);
    }

    if (to) {
      conditions.push(`r.created_at <= $${idx++}`);
      values.push(to);
    }

    // Determine sort clause
    let sortClause = 'r.created_at DESC';
    switch (sort) {
      case 'created_at:asc':
        sortClause = 'r.created_at ASC';
        break;
      case 'priority:desc':
        sortClause = 'r.priority DESC, r.created_at DESC';
        break;
      case 'priority:asc':
        sortClause = 'r.priority ASC, r.created_at DESC';
        break;
      case 'confirmation_count:desc':
        sortClause = 'r.confirmation_count DESC, r.created_at DESC';
        break;
      default:
        sortClause = 'r.created_at DESC';
    }

    const whereClause = conditions.join(' AND ');

    // Count total matching records
    const countSql = `
      SELECT COUNT(*) AS total
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
    `;
    const countRes = await pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    // Fetch reports with citizen details, department, and primary image
    const dataSql = `
      SELECT 
        r.id, r.complaint_no, r.title, r.description, r.category,
        r.status, r.priority, r.address, r.area, r.city,
        r.ai_status, r.ai_category, r.ai_confidence, r.ai_severity, r.needs_review,
        r.confirmation_count, r.created_at, r.updated_at, r.resolved_at, r.rejection_reason,
        ST_Y(r.location::geometry) AS lat, ST_X(r.location::geometry) AS lng,
        u.id AS citizen_id, u.name AS citizen_name, u.email AS citizen_email,
        d.id AS department_id, d.name AS department_name,
        officer.name AS assigned_to_name,
        img.url AS primary_image_url,
        COALESCE(img_count.count, 0) AS image_count
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN departments d ON r.assigned_department_id = d.id
      LEFT JOIN users officer ON r.assigned_to = officer.id
      LEFT JOIN LATERAL (
        SELECT url FROM report_images 
        WHERE report_id = r.id 
        ORDER BY is_primary DESC, created_at ASC 
        LIMIT 1
      ) img ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS count FROM report_images WHERE report_id = r.id
      ) img_count ON true
      WHERE ${whereClause}
      ORDER BY ${sortClause}
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataRes = await pool.query(dataSql, [...values, limit, offset]);

    return {
      reports: dataRes.rows,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  /**
   * Get complete admin detail for a single report
   */
  async getReportById(id) {
    const reportSql = `
      SELECT 
        r.id, r.complaint_no, r.user_id, r.title, r.description, r.category,
        r.status, r.priority, r.location_source, r.address, r.area, r.city,
        r.ai_status, r.ai_category, r.ai_confidence, r.ai_severity, r.ai_detections, r.needs_review,
        r.assigned_department_id, r.assigned_to, r.duplicate_of, r.confirmation_count,
        r.resolved_at, r.resolved_image_url, r.rejection_reason, r.created_at, r.updated_at,
        ST_Y(r.location::geometry) AS lat, ST_X(r.location::geometry) AS lng,
        u.name AS citizen_name, u.email AS citizen_email, u.phone AS citizen_phone,
        d.name AS department_name,
        officer.name AS assigned_to_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN departments d ON r.assigned_department_id = d.id
      LEFT JOIN users officer ON r.assigned_to = officer.id
      WHERE r.id = $1
    `;

    const reportRes = await pool.query(reportSql, [id]);
    if (reportRes.rows.length === 0) {
      throw ApiError.notFound('Report not found');
    }

    const report = reportRes.rows[0];

    // Fetch images
    const imagesRes = await pool.query(
      'SELECT id, url, public_id, is_primary FROM report_images WHERE report_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [id]
    );

    // Fetch complete audit timeline (including internal notes)
    const historySql = `
      SELECT 
        h.id, h.from_status, h.to_status, h.note, h.is_internal, h.created_at,
        u.name AS changed_by_name, u.role AS changed_by_role
      FROM report_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.report_id = $1
      ORDER BY h.created_at ASC
    `;
    const historyRes = await pool.query(historySql, [id]);

    // Fetch confirmations
    const confSql = `
      SELECT c.user_id, c.created_at, u.name, u.email
      FROM report_confirmations c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.report_id = $1
      ORDER BY c.created_at DESC
    `;
    const confRes = await pool.query(confSql, [id]);

    return {
      ...report,
      images: imagesRes.rows,
      timeline: historyRes.rows,
      confirmations: confRes.rows,
    };
  },

  /**
   * Update report status with audit history and citizen notifications
   */
  async updateStatus(id, changedBy, { status: newStatus, note, isInternal = false, rejectionReason }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentRes = await client.query(
        'SELECT id, complaint_no, status, user_id, title FROM reports WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (currentRes.rows.length === 0) {
        throw ApiError.notFound('Report not found');
      }

      const report = currentRes.rows[0];
      const oldStatus = report.status;

      if (oldStatus === newStatus) {
        throw ApiError.badRequest(`Report is already in status '${newStatus}'`);
      }

      // Check transition validity
      const allowed = validTransitions[oldStatus] || [];
      if (!allowed.includes(newStatus)) {
        throw ApiError.badRequest(
          `Cannot transition from status '${oldStatus}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ') || 'none'}`
        );
      }

      // Resolved / rejection fields
      const isResolved = newStatus === 'resolved';
      const isRejected = newStatus === 'rejected';

      const updateSql = `
        UPDATE reports
        SET 
          status = $1,
          resolved_at = CASE WHEN $2::boolean THEN now() ELSE resolved_at END,
          rejection_reason = CASE WHEN $3::boolean THEN $4 ELSE rejection_reason END,
          updated_at = now()
        WHERE id = $5
        RETURNING *
      `;
      const updateRes = await client.query(updateSql, [
        newStatus,
        isResolved,
        isRejected,
        rejectionReason || note || 'Marked as rejected by administration',
        id,
      ]);

      // Insert audit history
      await client.query(
        `INSERT INTO report_status_history 
          (report_id, from_status, to_status, changed_by, note, is_internal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, oldStatus, newStatus, changedBy, note || null, isInternal]
      );

      await client.query('COMMIT');

      // Send citizen notifications (asynchronous, non-blocking)
      const userRes = await pool.query(
        'SELECT name, email, email_notifications FROM users WHERE id = $1',
        [report.user_id]
      );
      const citizen = userRes.rows[0];

      if (citizen) {
        const notifTitle = `Status updated: ${newStatus.replace('_', ' ').toUpperCase()}`;
        const notifMessage = `Your complaint #${report.complaint_no} ("${report.title}") is now ${newStatus.replace('_', ' ')}.${note && !isInternal ? ` Note: ${note}` : ''}`;

        notificationsService.createNotification({
          userId: report.user_id,
          reportId: id,
          title: notifTitle,
          message: notifMessage,
        }).catch((e) => logger.warn({ err: e }, 'Notification create failed'));

        if (citizen.email_notifications) {
          mailerService.sendStatusChangeEmail({
            toEmail: citizen.email,
            citizenName: citizen.name,
            complaintNo: report.complaint_no,
            title: report.title,
            fromStatus: oldStatus,
            toStatus: newStatus,
            note: isInternal ? null : note,
          }).catch((e) => logger.warn({ err: e }, 'Mailer dispatch failed'));
        }
      }

      logger.info({ reportId: id, from: oldStatus, to: newStatus }, 'Admin updated report status');

      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Assign a report to a municipal department and optionally an officer
   */
  async assignDepartment(id, changedBy, { departmentId, assignedTo, note }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const reportRes = await client.query(
        'SELECT id, complaint_no, status, user_id, title FROM reports WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (reportRes.rows.length === 0) {
        throw ApiError.notFound('Report not found');
      }

      const report = reportRes.rows[0];

      // Validate department if specified
      let deptName = 'Unassigned';
      if (departmentId) {
        const deptRes = await client.query('SELECT name FROM departments WHERE id = $1', [departmentId]);
        if (deptRes.rows.length === 0) {
          throw ApiError.badRequest('Selected department does not exist');
        }
        deptName = deptRes.rows[0].name;
      }

      // Automatically advance status to 'assigned' if it was 'under_review' or 'submitted'
      let newStatus = report.status;
      if (departmentId && (report.status === 'submitted' || report.status === 'under_review')) {
        newStatus = 'assigned';
      }

      const updateSql = `
        UPDATE reports
        SET 
          assigned_department_id = $1,
          assigned_to = $2,
          status = $3,
          updated_at = now()
        WHERE id = $4
        RETURNING *
      `;
      const updateRes = await client.query(updateSql, [
        departmentId || null,
        assignedTo || null,
        newStatus,
        id,
      ]);

      // Record in history
      const historyNote = note || `Assigned to ${deptName}`;
      await client.query(
        `INSERT INTO report_status_history 
          (report_id, from_status, to_status, changed_by, note, is_internal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, report.status, newStatus, changedBy, historyNote, false]
      );

      await client.query('COMMIT');

      // Citizen notification
      notificationsService.createNotification({
        userId: report.user_id,
        reportId: id,
        title: `Complaint Assigned to ${deptName}`,
        message: `Your complaint #${report.complaint_no} has been assigned to the ${deptName} department for inspection.`,
      }).catch((e) => logger.warn({ err: e }, 'Notification failed'));

      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Update priority score (0-10)
   */
  async updatePriority(id, changedBy, priority) {
    const res = await pool.query(
      'UPDATE reports SET priority = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [priority, id]
    );
    if (res.rows.length === 0) {
      throw ApiError.notFound('Report not found');
    }

    await pool.query(
      `INSERT INTO report_status_history 
        (report_id, from_status, to_status, changed_by, note, is_internal)
       VALUES ($1, $2, $2, $3, $4, true)`,
      [id, res.rows[0].status, changedBy, `Priority adjusted to ${priority}`]
    );

    return res.rows[0];
  },

  /**
   * Correct or confirm report problem category
   */
  async updateCategory(id, changedBy, category) {
    const res = await pool.query(
      `UPDATE reports 
       SET category = $1, needs_review = false, updated_at = now() 
       WHERE id = $2 
       RETURNING *`,
      [category, id]
    );
    if (res.rows.length === 0) {
      throw ApiError.notFound('Report not found');
    }

    await pool.query(
      `INSERT INTO report_status_history 
        (report_id, from_status, to_status, changed_by, note, is_internal)
       VALUES ($1, $2, $2, $3, $4, true)`,
      [id, res.rows[0].status, changedBy, `Category corrected to ${category.replace('_', ' ')}`]
    );

    return res.rows[0];
  },

  /**
   * Merge a duplicate report into a master report
   */
  async mergeReport(id, changedBy, duplicateOfId, note) {
    if (id === duplicateOfId) {
      throw ApiError.badRequest('Cannot merge a report into itself');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch master report
      const masterRes = await client.query(
        'SELECT id, complaint_no FROM reports WHERE id = $1',
        [duplicateOfId]
      );
      if (masterRes.rows.length === 0) {
        throw ApiError.notFound('Target master report not found');
      }
      const master = masterRes.rows[0];

      // Fetch child duplicate report
      const childRes = await client.query(
        'SELECT id, complaint_no, status, user_id FROM reports WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (childRes.rows.length === 0) {
        throw ApiError.notFound('Report to merge not found');
      }
      const child = childRes.rows[0];

      // Update child report
      const childUpdateSql = `
        UPDATE reports
        SET 
          duplicate_of = $1,
          status = 'rejected',
          rejection_reason = $2,
          updated_at = now()
        WHERE id = $3
        RETURNING *
      `;
      const reason = `Duplicate of #${master.complaint_no}${note ? ` (${note})` : ''}`;
      const childUpdateRes = await client.query(childUpdateSql, [duplicateOfId, reason, id]);

      // Boost master report confirmation count & priority
      await client.query(
        `UPDATE reports 
         SET confirmation_count = confirmation_count + 1, priority = priority + 1, updated_at = now() 
         WHERE id = $1`,
        [duplicateOfId]
      );

      // Record in history for both reports
      await client.query(
        `INSERT INTO report_status_history 
          (report_id, from_status, to_status, changed_by, note, is_internal)
         VALUES ($1, $2, 'rejected', $3, $4, false)`,
        [id, child.status, changedBy, `Merged into #${master.complaint_no}`]
      );

      await client.query(
        `INSERT INTO report_status_history 
          (report_id, from_status, to_status, changed_by, note, is_internal)
         VALUES ($1, $2, $2, $3, $4, true)`,
        [duplicateOfId, 'assigned', changedBy, `Absorbed duplicate report #${child.complaint_no}`]
      );

      await client.query('COMMIT');

      // Notify citizen of the duplicate report
      notificationsService.createNotification({
        userId: child.user_id,
        reportId: id,
        title: 'Report Merged as Duplicate',
        message: `Your complaint #${child.complaint_no} has been consolidated into existing complaint #${master.complaint_no}. Your details have been preserved.`,
      }).catch((e) => logger.warn({ err: e }, 'Notification failed'));

      return childUpdateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Bulk update status for multiple reports
   */
  async bulkUpdateStatus(ids, changedBy, status, note) {
    const updated = [];
    for (const id of ids) {
      try {
        const res = await this.updateStatus(id, changedBy, { status, note, isInternal: false });
        updated.push(res);
      } catch (err) {
        logger.warn({ id, err: err.message }, 'Failed to update report in bulk');
      }
    }
    return {
      updatedCount: updated.length,
      requestedCount: ids.length,
      reports: updated,
    };
  },

  /**
   * Get all departments
   */
  async getDepartments() {
    const res = await pool.query(
      'SELECT id, name, handles FROM departments ORDER BY name ASC'
    );
    return res.rows;
  },

  /**
   * Create a new department
   */
  async createDepartment({ name, handles = [] }) {
    const checkRes = await pool.query('SELECT id FROM departments WHERE LOWER(name) = LOWER($1)', [name]);
    if (checkRes.rows.length > 0) {
      throw ApiError.conflict(`Department '${name}' already exists`);
    }

    const res = await pool.query(
      'INSERT INTO departments (name, handles) VALUES ($1, $2) RETURNING id, name, handles',
      [name, handles]
    );
    return res.rows[0];
  },

  /**
   * Get paginated users for admin management
   */
  async getUsers({ q, role, active, page = 1, limit = 20 }) {
    const conditions = ['1=1'];
    const values = [];
    let idx = 1;

    if (role) {
      conditions.push(`u.role = $${idx++}`);
      values.push(role);
    }

    if (typeof active === 'boolean') {
      conditions.push(`u.is_active = $${idx++}`);
      values.push(active);
    }

    if (q) {
      conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone ILIKE $${idx})`);
      values.push(`%${q.trim()}%`);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `SELECT COUNT(*) AS total FROM users u WHERE ${whereClause}`;
    const countRes = await pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    const dataSql = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.is_active, u.city,
        u.department_id, d.name AS department_name,
        u.created_at,
        COUNT(r.id) AS reports_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN reports r ON u.id = r.user_id
      WHERE ${whereClause}
      GROUP BY u.id, d.name
      ORDER BY u.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataRes = await pool.query(dataSql, [...values, limit, offset]);

    return {
      users: dataRes.rows,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  /**
   * Update user role, active status, or department
   */
  async updateUser(id, { role, isActive, departmentId }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (role) {
      fields.push(`role = $${idx++}`);
      values.push(role);
    }

    if (typeof isActive === 'boolean') {
      fields.push(`is_active = $${idx++}`);
      values.push(isActive);
    }

    if (departmentId !== undefined) {
      fields.push(`department_id = $${idx++}`);
      values.push(departmentId);
    }

    if (fields.length === 0) {
      throw ApiError.badRequest('No update fields provided');
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const sql = `
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${idx} 
      RETURNING id, name, email, role, is_active, department_id, updated_at
    `;

    const res = await pool.query(sql, values);
    if (res.rows.length === 0) {
      throw ApiError.notFound('User not found');
    }

    return res.rows[0];
  },

  /**
   * Upload an "after" resolution photo proving municipal repair completion
   */
  async uploadResolutionPhoto(id, changedBy, file, note) {
    if (!file) {
      throw ApiError.badRequest('Resolution proof photo is required');
    }

    const reportRes = await pool.query(
      'SELECT id, complaint_no, status, user_id, title FROM reports WHERE id = $1',
      [id]
    );
    if (reportRes.rows.length === 0) {
      throw ApiError.notFound('Report not found');
    }
    const report = reportRes.rows[0];

    // Upload to Cloudinary (or local data URI fallback)
    const uploadResult = await cloudinaryService.uploadBuffer(file.buffer, {
      folder: 'civiceye/resolutions',
      tags: ['resolution', report.complaint_no],
    });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateSql = `
        UPDATE reports
        SET 
          resolved_image_url = $1,
          status = 'resolved',
          resolved_at = COALESCE(resolved_at, now()),
          updated_at = now()
        WHERE id = $2
        RETURNING *
      `;
      const updateRes = await client.query(updateSql, [uploadResult.secure_url, id]);

      await client.query(
        `INSERT INTO report_images (report_id, url, public_id, is_primary, is_resolution)
         VALUES ($1, $2, $3, false, true)`,
        [id, uploadResult.secure_url, uploadResult.public_id]
      );

      const historyNote = note || 'Official resolution proof photo attached by municipal authority';
      await client.query(
        `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal)
         VALUES ($1, $2, 'resolved', $3, $4, false)`,
        [id, report.status, changedBy, historyNote]
      );

      await client.query('COMMIT');

      notificationsService.createNotification({
        userId: report.user_id,
        reportId: id,
        title: 'Work Completed — Resolution Photo Attached!',
        message: `Field teams have resolved your complaint #${report.complaint_no} and attached official proof photos. Check your complaint status to view the resolution evidence.`,
      }).catch((e) => logger.warn({ err: e }, 'Notification dispatch failed'));

      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

export default adminService;

