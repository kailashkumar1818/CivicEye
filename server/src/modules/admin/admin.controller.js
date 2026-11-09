import adminService from './admin.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const adminController = {
  getReports: asyncHandler(async (req, res) => {
    const result = await adminService.getReports(req.query);
    return res.status(200).json({
      success: true,
      data: result.reports,
      meta: result.meta,
    });
  }),

  getReportById: asyncHandler(async (req, res) => {
    const report = await adminService.getReportById(req.params.id);
    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status, note, isInternal, rejectionReason } = req.body;
    const report = await adminService.updateStatus(req.params.id, req.user.id, {
      status,
      note,
      isInternal,
      rejectionReason,
    });
    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  assignDepartment: asyncHandler(async (req, res) => {
    const { departmentId, assignedTo, note } = req.body;
    const report = await adminService.assignDepartment(req.params.id, req.user.id, {
      departmentId,
      assignedTo,
      note,
    });
    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  updatePriority: asyncHandler(async (req, res) => {
    const report = await adminService.updatePriority(
      req.params.id,
      req.user.id,
      req.body.priority
    );
    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  updateCategory: asyncHandler(async (req, res) => {
    const report = await adminService.updateCategory(
      req.params.id,
      req.user.id,
      req.body.category
    );
    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  mergeReport: asyncHandler(async (req, res) => {
    const { duplicateOfId, note } = req.body;
    const report = await adminService.mergeReport(
      req.params.id,
      req.user.id,
      duplicateOfId,
      note
    );
    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  bulkUpdateStatus: asyncHandler(async (req, res) => {
    const { ids, status, note } = req.body;
    const result = await adminService.bulkUpdateStatus(ids, req.user.id, status, note);
    return res.status(200).json({
      success: true,
      data: result,
    });
  }),

  getDepartments: asyncHandler(async (req, res) => {
    const departments = await adminService.getDepartments();
    return res.status(200).json({
      success: true,
      data: departments,
    });
  }),

  createDepartment: asyncHandler(async (req, res) => {
    const { name, handles } = req.body;
    const department = await adminService.createDepartment({ name, handles });
    return res.status(201).json({
      success: true,
      data: department,
    });
  }),

  getUsers: asyncHandler(async (req, res) => {
    const result = await adminService.getUsers(req.query);
    return res.status(200).json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  }),

  updateUser: asyncHandler(async (req, res) => {
    const { role, isActive, departmentId } = req.body;
    const user = await adminService.updateUser(req.params.id, {
      role,
      isActive,
      departmentId,
    });
    return res.status(200).json({
      success: true,
      data: user,
    });
  }),

  uploadResolutionPhoto: asyncHandler(async (req, res) => {
    const report = await adminService.uploadResolutionPhoto(
      req.params.id,
      req.user.id,
      req.file,
      req.body.note
    );
    return res.status(200).json({
      success: true,
      data: report,
    });
  }),
};

export default adminController;

