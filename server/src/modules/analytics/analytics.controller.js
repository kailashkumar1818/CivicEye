import analyticsService from './analytics.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const analyticsController = {
  getSummary: asyncHandler(async (req, res) => {
    const summary = await analyticsService.getSummary();
    return res.status(200).json({
      success: true,
      data: summary,
    });
  }),

  getByCategory: asyncHandler(async (req, res) => {
    const data = await analyticsService.getByCategory();
    return res.status(200).json({
      success: true,
      data,
    });
  }),

  getByStatus: asyncHandler(async (req, res) => {
    const data = await analyticsService.getByStatus();
    return res.status(200).json({
      success: true,
      data,
    });
  }),

  getTrend: asyncHandler(async (req, res) => {
    const data = await analyticsService.getTrend(req.query);
    return res.status(200).json({
      success: true,
      data,
    });
  }),

  getHotspots: asyncHandler(async (req, res) => {
    const data = await analyticsService.getHotspots(req.query);
    return res.status(200).json({
      success: true,
      data,
    });
  }),

  getTopAreas: asyncHandler(async (req, res) => {
    const data = await analyticsService.getTopAreas(req.query);
    return res.status(200).json({
      success: true,
      data,
    });
  }),

  getResolutionTime: asyncHandler(async (req, res) => {
    const data = await analyticsService.getResolutionTime();
    return res.status(200).json({
      success: true,
      data,
    });
  }),

  getAiAccuracy: asyncHandler(async (req, res) => {
    const data = await analyticsService.getAiAccuracy();
    return res.status(200).json({
      success: true,
      data,
    });
  }),

  exportCsv: asyncHandler(async (req, res) => {
    const csvContent = await analyticsService.exportReportsCsv(req.query);
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="civiceye-reports-${dateStr}.csv"`);
    return res.status(200).send(csvContent);
  }),
};

export default analyticsController;

