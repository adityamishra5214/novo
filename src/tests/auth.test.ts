import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index.js';

describe('Authentication & Session Management', () => {
  let app: any;

  beforeAll(() => {
    app = createServer();
  });

  it('rejects protected endpoints when no session cookie or header is provided', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects login with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex@acme.corp',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('successfully logs in with valid credentials and sets session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex@acme.corp',
        password: 'password123',
        remember: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('alex@acme.corp');
    expect(res.body.data.membershipId).toBe('mem_alex');

    // Check Set-Cookie header
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const sessionCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.startsWith('vantage_session='));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/HttpOnly/i);
  });

  it('allows access to protected routes with valid session cookie', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'sarah@acme.corp',
        password: 'password123',
      });
    const cookie = loginRes.headers['set-cookie'];

    // 2. Access /me using cookie
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('sarah@acme.corp');
    expect(meRes.body.data.membership.role).toBe('manager');
  });

  it('registers a new user and company workspace', async () => {
    const rand = Math.random().toString(36).substring(2, 7);
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        displayName: 'Test Founder',
        email: `founder_${rand}@newco.io`,
        password: 'securepassword123',
        companyName: `NewCo Cloud ${rand}`,
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.user.email).toBe(`founder_${rand}@newco.io`);
    expect(regRes.body.data.companyId).toBeDefined();

    // Verify session cookie was set
    const cookie = regRes.headers['set-cookie'];
    expect(cookie).toBeDefined();

    // Verify authenticated access with newly created session
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.displayName).toBe('Test Founder');
    expect(meRes.body.data.membership.role).toBe('admin');
  });

  it('clears session on logout', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex@acme.corp',
        password: 'password123',
      });
    const cookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    const clearedCookie = logoutRes.headers['set-cookie'] as unknown as string[];
    expect(clearedCookie[0]).toMatch(/vantage_session=;/);
  });
});
