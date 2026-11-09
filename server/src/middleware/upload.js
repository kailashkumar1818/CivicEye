import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Magic bytes signatures for additional verification
const MAGIC_NUMBERS = {
  jpg: ['ffd8ff'],
  png: ['89504e47'],
  webp: ['52494646'], // 'RIFF' in hex
};

/**
 * Validate file header magic bytes
 */
export function validateMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return false;
  const hex = buffer.toString('hex', 0, 4).toLowerCase();

  const isJpg = hex.startsWith('ffd8ff');
  const isPng = hex === '89504e47';
  const isWebp = hex === '52494646' && buffer.toString('utf8', 8, 12) === 'WEBP';

  return isJpg || isPng || isWebp;
}

// Memory storage for direct processing / Cloudinary streaming
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WebP images are allowed.`,
        'INVALID_FILE_TYPE'
      ),
      false
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 3, // max 3 files
  },
  fileFilter,
});

export default upload;

