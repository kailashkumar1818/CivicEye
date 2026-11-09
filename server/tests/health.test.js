import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

let app;

beforeEach(async () => {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  const mod = await import('../src/app.js');
  app = mod.default;
});

describe('Health Checks', () => {
  it('GET /api/health should respond with status code and system metrics', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('db');
    expect(res.body).toHaveProperty('ai');
  });

  it('GET /health alias should respond similarly', async () => {
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });
});