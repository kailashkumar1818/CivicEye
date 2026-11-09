import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import env from '../config/env.js';
import logger from '../utils/logger.js';

// Configure Cloudinary if credentials provided
const isConfigured =
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_CLOUD_NAME !== 'mock_cloud_name' &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_KEY !== 'mock_api_key' &&
  env.CLOUDINARY_API_SECRET &&
  env.CLOUDINARY_API_SECRET !== 'mock_api_secret';

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const cloudinaryService = {
  /**
   * Upload an image buffer to Cloudinary (or mock CDN fallback for local dev)
   * @param {Buffer} buffer - Image file buffer
   * @param {string} folder - Target folder in Cloudinary
   * @returns {Promise<{ url: string, public_id: string }>}
   */
  async uploadImage(buffer, folder = 'civiceye/reports') {
    const publicId = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

    if (!isConfigured) {
      logger.info({ publicId }, 'Cloudinary credentials are mock/unset; using local data URI fallback');
      const base64Data = buffer.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64Data}`;
      return {
        url: dataUri,
        public_id: publicId,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            logger.error({ err: error.message }, 'Cloudinary upload failed, using fallback data URI');
            const base64Data = buffer.toString('base64');
            return resolve({
              url: `data:image/jpeg;base64,${base64Data}`,
              public_id: publicId,
            });
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  },

  /**
   * Delete an image by public_id
   */
  async deleteImage(publicId) {
    if (!isConfigured || !publicId) return true;
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (err) {
      logger.error({ err: err.message, publicId }, 'Failed to delete image from Cloudinary');
      return false;
    }
  },
};

export default cloudinaryService;

