import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { getDb, withTransaction } from '../db/client.js';
import { recordAuditEvent } from '../middleware/authorize.js';
import { AppError } from '../middleware/errorHandler.js';

export function createSalesEntriesRouter(db: DatabaseSync = getDb()): Router {
  const router = Router();

  const checkTenant = (req: Request, workspaceId: string) => {
    if (req.membership?.companyId !== workspaceId) {
      throw new AppError('FORBIDDEN', 'Access denied to this workspace.', 403);
    }
  };

  // GET /api/v1/workspaces/:workspaceId/sales-entries
  router.get('/:workspaceId/sales-entries', (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const { membershipId, from, to, status, category, limit = '50', offset = '0' } = req.query;

      let sql = `
        SELECT e.*, m.name as metric_name, m.unit as metric_unit,
               u.display_name as rep_name, u.avatar_initials as rep_initials,
               mem.title as rep_title, t.code as team_code
        FROM daily_sales_entries e
        JOIN sales_metrics m ON e.metric_id = m.id
        JOIN memberships mem ON e.membership_id = mem.id
        JOIN users u ON mem.user_id = u.id
        LEFT JOIN team_memberships tm ON tm.membership_id = mem.id
        LEFT JOIN teams t ON tm.team_id = t.id
        WHERE e.company_id = ?
      `;
      const params: any[] = [workspaceId];

      if (req.membership!.role === 'rep') {
        sql += ' AND e.membership_id = ?';
        params.push(req.membership!.id);
      } else if (membershipId) {
        sql += ' AND e.membership_id = ?';
        params.push(String(membershipId));
      }

      if (from) {
        sql += ' AND e.business_date >= ?';
        params.push(String(from));
      }
      if (to) {
        sql += ' AND e.business_date <= ?';
        params.push(String(to));
      }
      if (status) {
        sql += ' AND e.status = ?';
        params.push(String(status));
      }
      if (category) {
        sql += ' AND e.deal_category = ?';
        params.push(String(category));
      }

      sql += ' ORDER BY e.business_date DESC, e.created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const entries = db.prepare(sql).all(...params);
      res.json({ data: entries });
    } catch (err) {
      next(err);
    }
  });

  const entryCreateSchema = z.object({
    membershipId: z.string().optional(),
    metricId: z.string().optional(),
    clientName: z.string().min(2),
    dealCategory: z.enum(['New ARR', 'Expansion', 'Services', 'Renewal']),
    businessDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    actualValue: z.number().positive(),
    note: z.string().max(500).optional(),
    status: z.enum(['Confirmed', 'Audited', 'Draft']).default('Confirmed'),
  });

  // POST /api/v1/workspaces/:workspaceId/sales-entries
  router.post('/:workspaceId/sales-entries', (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const input = entryCreateSchema.parse(req.body);
      const now = new Date().toISOString();

      const targetMembershipId = input.membershipId || req.membership!.id;
      if (req.membership!.role === 'rep' && targetMembershipId !== req.membership!.id) {
        throw new AppError('FORBIDDEN', 'Sales representatives cannot log sales on behalf of others.', 403);
      }

      let metricId: string = input.metricId || '';
      if (!metricId) {
        const defaultMetric = db.prepare("SELECT id FROM sales_metrics WHERE company_id = ? AND status = 'active' LIMIT 1").get(workspaceId) as any;
        metricId = defaultMetric?.id || 'metric_new_arr';
      }

      const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      withTransaction(db, () => {
        db.prepare(`
          INSERT INTO daily_sales_entries (
            id, company_id, membership_id, metric_id, client_name, deal_category, business_date,
            actual_value, note, status, created_by_membership_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          entryId,
          workspaceId,
          targetMembershipId,
          metricId,
          input.clientName,
          input.dealCategory,
          input.businessDate,
          input.actualValue,
          input.note || null,
          input.status,
          req.membership!.id,
          now,
          now
        );

        recordAuditEvent(db, {
          companyId: workspaceId,
          actorMembershipId: req.membership!.id,
          action: 'SALES_ENTRY_CREATED',
          entityType: 'daily_sales_entry',
          entityId: entryId,
          requestId: req.requestId,
          details: {
            clientName: input.clientName,
            dealCategory: input.dealCategory,
            businessDate: input.businessDate,
            actualValue: input.actualValue,
            targetMembershipId,
          },
        });
      });

      res.status(201).json({
        data: {
          id: entryId,
          companyId: workspaceId,
          membershipId: targetMembershipId,
          metricId,
          ...input,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/workspaces/:workspaceId/sales-entries/:entryId/confirm
  router.post('/:workspaceId/sales-entries/:entryId/confirm', (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      const entryId = String(req.params.entryId);
      checkTenant(req, workspaceId);

      const entry = db.prepare('SELECT * FROM daily_sales_entries WHERE id = ? AND company_id = ?').get(entryId, workspaceId) as any;
      if (!entry) {
        throw new AppError('NOT_FOUND', 'Sales entry not found', 404);
      }

      const now = new Date().toISOString();
      db.prepare("UPDATE daily_sales_entries SET status = 'Confirmed', updated_at = ? WHERE id = ?").run(now, entryId);

      recordAuditEvent(db, {
        companyId: workspaceId,
        actorMembershipId: req.membership!.id,
        action: 'SALES_ENTRY_CONFIRMED',
        entityType: 'daily_sales_entry',
        entityId: entryId,
        requestId: req.requestId,
        details: { previousStatus: entry.status, clientName: entry.client_name },
      });

      res.json({ data: { id: entryId, status: 'Confirmed' } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
