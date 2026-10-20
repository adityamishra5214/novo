import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index.js';
import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../server/db/client.js';

describe('Multi-Tenant Isolation & Authorization Boundaries', () => {
  let app: any;

  beforeAll(() => {
    // Uses seeded database
    app = createServer();
  });

  it('prohibits cross-tenant access when an Acme user requests Beta Dynamics workspace', async () => {
    // Alex Mercer belongs to company_acme
    const res = await request(app)
      .get('/api/v1/workspaces/company_beta')
      .set('x-membership-id', 'mem_alex');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toMatch(/access denied/i);
  });

  it('permits access when requesting own workspace', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces/company_acme')
      .set('x-membership-id', 'mem_alex');

    expect(res.status).toBe(200);
    expect(res.body.data.company.id).toBe('company_acme');
  });

  it('prevents regular sales representative from inviting team members', async () => {
    // Priya Singh is a rep
    const res = await request(app)
      .post('/api/v1/workspaces/company_acme/members/invite')
      .set('x-membership-id', 'mem_priya')
      .send({
        email: 'attacker@example.com',
        displayName: 'Attacker User',
        role: 'admin',
        title: 'Unauthorized Admin',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('prevents a sales representative from logging sales on behalf of another rep (IDOR guard)', async () => {
    // Priya Singh tries to log sales under Marcus Vance's membership
    const res = await request(app)
      .post('/api/v1/workspaces/company_acme/sales-entries')
      .set('x-membership-id', 'mem_priya')
      .send({
        membershipId: 'mem_marcus',
        clientName: 'Spoofed Enterprise Deal',
        dealCategory: 'New ARR',
        businessDate: '2025-04-28',
        actualValue: 50000,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toMatch(/cannot log sales on behalf of others/i);
  });

  it('rejects invalid or negative monetary values with standard schema validation error', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces/company_acme/sales-entries')
      .set('x-membership-id', 'mem_priya')
      .send({
        clientName: 'Invalid Deal',
        dealCategory: 'New ARR',
        businessDate: '2025-04-28',
        actualValue: -500, // Negative amount not allowed
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
