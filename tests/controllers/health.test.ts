import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRoutes from '../../src/routes/health.routes.js';

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', healthRoutes);
  });

  it('should return success response with pong message', async () => {
    const response = await request(app).get('/api/health/ping');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { message: 'pong' },
    });
  });

  it('should have correct content-type', async () => {
    const response = await request(app).get('/api/health/ping');

    expect(response.headers['content-type']).toMatch(/json/);
  });
});
