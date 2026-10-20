import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server/index.js';

describe('Sales Entries Vertical Slice & Workflow', () => {
  let app: any;

  beforeAll(() => {
    app = createServer();
  });

  it('allows a sales representative to log a valid daily deal', async () => {
    const res = await request(app)
      .post('/api/v1/workspaces/company_acme/sales-entries')
      .set('x-membership-id', 'mem_priya')
      .send({
        clientName: 'Acme Cloud Integration Corp',
        dealCategory: 'New ARR',
        businessDate: '2025-04-28',
        actualValue: 12500,
        note: 'Strategic closed ARR deal signed by VP of IT',
        status: 'Confirmed',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.clientName).toBe('Acme Cloud Integration Corp');
    expect(res.body.data.actualValue).toBe(12500);
    expect(res.body.data.status).toBe('Confirmed');
  });

  it('lists the logged sales entry in the rep ledger', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces/company_acme/sales-entries?membershipId=mem_priya')
      .set('x-membership-id', 'mem_priya');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((e: any) => e.client_name === 'Acme Cloud Integration Corp');
    expect(found).toBeDefined();
    expect(found.actual_value).toBe(12500);
  });

  it('allows confirming a draft sale entry', async () => {
    // Draft entry seeded for Alex Mercer
    const res = await request(app)
      .post('/api/v1/workspaces/company_acme/sales-entries/entry_alex_draft_1/confirm')
      .set('x-membership-id', 'mem_alex');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Confirmed');
  });
});
