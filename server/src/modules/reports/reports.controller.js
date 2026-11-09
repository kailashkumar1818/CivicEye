import reportsService from './reports.service.js';
import aiClient from '../../services/aiClient.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const reportsController = {
  analyze: asyncHandler(async (req, res) => {
    if (!req.file) {
      throw ApiError.badRequest('An image file is required for AI analysis', 'IMAGE_REQUIRED');
    }

    const result = await aiClient.predict(req.file.buffer, req.file.originalname);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }),

  create: asyncHandler(async (req, res) => {
    const { title, description, category, lat, lng, locationSource, address, area, city } = req.body;
    const files = req.files || [];

    const report = await reportsService.createReport({
      userId: req.user.id,
      title,
      description,
      category,
      lat,
      lng,
      locationSource,
      address,
      area,
      city,
      files,
    });

    return res.status(201).json({
      success: true,
      data: report,
    });
  }),

  getMyReports: asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const result = await reportsService.getMyReports(req.user.id, {
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.reports,
      meta: result.meta,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const report = await reportsService.getReportById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  checkDuplicates: asyncHandler(async (req, res) => {
    const { lat, lng, category } = req.body;
    const duplicates = await reportsService.checkDuplicates({ lat, lng, category });

    return res.status(200).json({
      success: true,
      data: duplicates,
      meta: {
        count: duplicates.length,
      },
    });
  }),

  confirm: asyncHandler(async (req, res) => {
    const result = await reportsService.confirmReport(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }),

  reopen: asyncHandler(async (req, res) => {
    const report = await reportsService.reopenReport(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      data: report,
    });
  }),

  track: asyncHandler(async (req, res) => {
    const report = await reportsService.trackComplaint(req.params.complaintNo);

    return res.status(200).json({
      success: true,
      data: report,
    });
  }),
};

export default reportsController;

