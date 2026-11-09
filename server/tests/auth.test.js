import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Auth Validation & Security Endpoints', () => {
  it('POST /api/auth/register should reject empty body with 400 validation error', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('details');
  });

  it('POST /api/auth/register should reject weak password (< 8 chars)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Citizen',
      email: 'test@citizen.local',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login should reject missing email/password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'invalid-email',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me should reject unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

