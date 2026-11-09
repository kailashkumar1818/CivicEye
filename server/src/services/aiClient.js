import axios from 'axios';
import FormData from 'form-data';
import env from '../config/env.js';
import logger from '../utils/logger.js';

export const aiClient = {
  /**
   * Send an image to the FastAPI AI service for problem detection and severity estimation.
   * Gracefully degrades with ai_status='unavailable' on failure so submission is never blocked.
   *
   * @param {Buffer} buffer - Image file buffer
   * @param {string} filename - Image filename
   * @returns {Promise<{
   *   ai_status: 'ok' | 'unavailable',
   *   category: string | null,
   *   confidence: number | null,
   *   severity: 'low' | 'medium' | 'high' | null,
   *   detections: Array,
   *   needs_review: boolean
   * }>}
   */
  async predict(buffer, filename = 'image.jpg') {
    if (!buffer || buffer.length === 0) {
      return {
        ai_status: 'unavailable',
        category: null,
        confidence: null,
        severity: null,
        detections: [],
        needs_review: false,
      };
    }

    const makeRequest = async () => {
      const form = new FormData();
      form.append('image', buffer, {
        filename,
        contentType: 'image/jpeg',
      });

      const response = await axios.post(`${env.AI_SERVICE_URL}/predict`, form, {
        headers: {
          ...form.getHeaders(),
          'X-API-Key': env.AI_SERVICE_API_KEY,
        },
        timeout: env.AI_REQUEST_TIMEOUT_MS,
      });

      return response.data;
    };

    try {
      let data;
      try {
        // First attempt
        data = await makeRequest();
      } catch (firstErr) {
        // Retry once on timeout or network error (e.g. Render / cold start)
        logger.warn({ err: firstErr.message }, 'AI service request failed on first attempt, retrying once...');
        data = await makeRequest();
      }

      const category = data.category || 'other';
      const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
      const severity = data.severity || 'low';
      const detections = data.detections || [];

      // Confidence below 0.40 flags for admin manual review
      const needsReview = confidence < 0.4 || category === 'other';

      logger.info(
        { category, confidence, severity, detectionsCount: detections.length, needsReview },
        'AI image analysis completed successfully'
      );

      return {
        ai_status: 'ok',
        category,
        confidence,
        severity,
        detections,
        needs_review: needsReview,
      };
    } catch (err) {
      logger.error(
        { err: err.message, status: err.response?.status, responseData: err.response?.data },
        'AI detection service unavailable or failed. Continuing gracefully without blocking.'
      );

      return {
        ai_status: 'unavailable',
        category: null,
        confidence: null,
        severity: null,
        detections: [],
        needs_review: true, // Needs review because AI was unavailable
      };
    }
  },
};

export default aiClient;

