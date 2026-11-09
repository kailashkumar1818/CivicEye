import exifr from 'exifr';

/**
 * Extract GPS coordinates from an image File object
 * @param {File} file - Image file
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function extractExifGps(file) {
  if (!file) return null;

  try {
    const gpsData = await exifr.gps(file);
    if (gpsData && typeof gpsData.latitude === 'number' && typeof gpsData.longitude === 'number') {
      return {
        lat: parseFloat(gpsData.latitude.toFixed(6)),
        lng: parseFloat(gpsData.longitude.toFixed(6)),
      };
    }
  } catch (err) {
    // Ignore images without EXIF or non-JPEG formats
  }

  return null;
}

export default extractExifGps;
