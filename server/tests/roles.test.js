import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import env from '../src/config/env.js';
import * as poolModule from '../src/db/pool.js';

describe('Role Authorization & RBAC Middleware', () => {
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

  it('GET /api/admin/reports should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/reports');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/reports should reject citizen role with 403 FORBIDDEN', async () => {
    const citizenToken = jwt.sign(
      { id: '11111111-1111-1111-1111-111111111111', role: 'citizen', email: 'citizen@test.local' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/analytics/summary should reject citizen role with 403 FORBIDDEN', async () => {
    const citizenToken = jwt.sign(
      { id: '11111111-1111-1111-1111-111111111111', role: 'citizen', email: 'citizen@test.local' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
