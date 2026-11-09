import mapService from './map.service.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const mapController = {
  getReportsInBBox: asyncHandler(async (req, res) => {
    const { bbox, category, status, from, to } = req.query;
    const reports = await mapService.getReportsInBBox({
      bbox,
      category,
      status,
      from,
      to,
    });

    return res.status(200).json({
      success: true,
      data: reports,
      meta: {
        count: reports.length,
      },
    });
  }),

  reverseGeocode: asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    const location = await mapService.reverseGeocode(lat, lng);

    return res.status(200).json({
      success: true,
      data: location,
    });
  }),
};

export default mapController;

