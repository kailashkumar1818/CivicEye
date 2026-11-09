import api from './client';

export const adminApi = {
  /**
   * Get reports for triage with pagination, filters, and search
   */
  async getReports(params = {}) {
    const res = await api.get('/admin/reports', { params });
    return {
      reports: res.data || [],
      meta: res.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  /**
   * Get detailed admin view of report with full audit trail and confirmations
   */
  async getReportById(id) {
    const res = await api.get(`/admin/reports/${id}`);
    return res.data || res;
  },

  /**
   * Update report status (with optional note, isInternal, and rejectionReason)
   */
  async updateStatus(id, { status, note, isInternal, rejectionReason }) {
    const res = await api.patch(`/admin/reports/${id}/status`, {
      status,
      note,
      isInternal,
      rejectionReason,
    });
    return res.data || res;
  },

  /**
   * Assign report to a department and/or officer
   */
  async assignDepartment(id, { departmentId, assignedTo, note }) {
    const res = await api.patch(`/admin/reports/${id}/assign`, {
      departmentId,
      assignedTo,
      note,
    });
    return res.data || res;
  },

  /**
   * Update complaint priority score (0-10)
   */
  async updatePriority(id, priority) {
    const res = await api.patch(`/admin/reports/${id}/priority`, { priority });
    return res.data || res;
  },

  /**
   * Correct or confirm report category
   */
  async updateCategory(id, category) {
    const res = await api.patch(`/admin/reports/${id}/category`, { category });
    return res.data || res;
  },

  /**
   * Merge child duplicate into master report
   */
  async mergeReport(id, { duplicateOfId, note }) {
    const res = await api.post(`/admin/reports/${id}/merge`, { duplicateOfId, note });
    return res.data || res;
  },

  /**
   * Bulk update status for multiple reports
   */
  async bulkUpdateStatus({ ids, status, note }) {
    const res = await api.post('/admin/reports/bulk-status', { ids, status, note });
    return res.data || res;
  },

  /**
   * Get all departments
   */
  async getDepartments() {
    const res = await api.get('/admin/departments');
    return res.data || [];
  },

  /**
   * Create a new municipal department
   */
  async createDepartment({ name, handles }) {
    const res = await api.post('/admin/departments', { name, handles });
    return res.data || res;
  },

  /**
   * Get paginated users for admin management
   */
  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return {
      users: res.data || [],
      meta: res.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  /**
   * Update user role or active status
   */
  async updateUser(id, { role, isActive, departmentId }) {
    const res = await api.patch(`/admin/users/${id}`, { role, isActive, departmentId });
    return res.data || res;
  },

  /**
   * Upload an official "after" resolution proof photo
   */
  async uploadResolutionPhoto(id, formData) {
    const res = await api.post(`/admin/reports/${id}/resolution-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data || res;
  },
};

export default adminApi;

