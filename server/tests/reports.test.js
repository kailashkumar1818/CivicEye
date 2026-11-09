import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import env from '../src/config/env.js';
import * as poolModule from '../src/db/pool.js';

describe('Reports API Validation', () => {
  beforeEach(() => {
    vi.spyOn(poolModule, 'query').mockImplementation(async (sql, params) => {
      if (typeof sql === 'string' && sql.includes('FROM users')) {
        return {
          rows: [
            {
              id: params ? params[0] : '11111111-1111-1111-1111-111111111111',
              name: 'Jane Citizen',
              email: 'citizen@test.local',
              role: 'citizen',
              is_active: true,
            },
          ],
        };
      }
      return { rows: [] };
    });
  });

  const citizenToken = jwt.sign(
    { id: '11111111-1111-1111-1111-111111111111', role: 'citizen', email: 'citizen@test.local' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  it('POST /api/reports/check-duplicates should reject invalid coordinates with 400', async () => {
    const res = await request(app)
      .post('/api/reports/check-duplicates')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        lat: 999, // Out of range
        lng: 78.4867,
        category: 'pothole',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/reports/check-duplicates should reject invalid category with 400', async () => {
    const res = await request(app)
      .post('/api/reports/check-duplicates')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        lat: 17.385,
        lng: 78.4867,
        category: 'alien_invasion', // Invalid category
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/reports/track/:complaintNo should reject malformed complaint format with 400', async () => {
    const res = await request(app).get('/api/reports/track/INVALID-123');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
