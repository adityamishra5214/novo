import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient, getDb } from '../db/client.js';
import { requireRole, recordAuditEvent } from '../middleware/authorize.js';
import { AppError } from '../middleware/errorHandler.js';

export function createTargetsRouter(db: DatabaseClient = getDb()): Router {
  const router = Router();

  const checkTenant = (req: Request, workspaceId: string) => {
    if (req.membership?.companyId !== workspaceId) {
      throw new AppError('FORBIDDEN', 'Access denied to this workspace.', 403);
    }
  };

  // GET /api/v1/workspaces/:workspaceId/targets
  router.get('/:workspaceId/targets', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const { scopeType, periodStart, periodEnd } = req.query;

      let sql = `
        SELECT t.*, m.name as metric_name, m.unit as metric_unit,
               creator_u.display_name as created_by_name,
               CASE 
                 WHEN t.scope_type = 'company' THEN c.name
                 WHEN t.scope_type = 'team' THEN tm.name
                 WHEN t.scope_type = 'user' THEN rep_u.display_name
               END as scope_name
        FROM targets t
        JOIN sales_metrics m ON t.metric_id = m.id
        LEFT JOIN memberships creator ON t.created_by_membership_id = creator.id
        LEFT JOIN users creator_u ON creator.user_id = creator_u.id
        LEFT JOIN companies c ON t.scope_type = 'company' AND t.scope_id = c.id
        LEFT JOIN teams tm ON t.scope_type = 'team' AND t.scope_id = tm.id
        LEFT JOIN memberships rep ON t.scope_type = 'user' AND t.scope_id = rep.id
        LEFT JOIN users rep_u ON rep.user_id = rep_u.id
        WHERE t.company_id = ? AND t.status = 'active'
      `;
      const params: any[] = [workspaceId];

      if (scopeType) {
        sql += ' AND t.scope_type = ?';
        params.push(String(scopeType));
      }
      if (periodStart) {
        sql += ' AND t.period_start >= ?';
        params.push(String(periodStart));
      }
      if (periodEnd) {
        sql += ' AND t.period_end <= ?';
        params.push(String(periodEnd));
      }

      sql += ' ORDER BY t.scope_type ASC, t.target_value DESC';

      const targets = await db.prepare(sql).all(...params);
      res.json({ data: targets });
    } catch (err) {
      next(err);
    }
  });

  const targetCreateSchema = z.object({
    metricId: z.string(),
    scopeType: z.enum(['company', 'team', 'user']),
    scopeId: z.string(),
    periodType: z.enum(['month', 'quarter', 'custom']).default('month'),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    targetValue: z.number().positive(),
  });

  // POST /api/v1/workspaces/:workspaceId/targets
  router.post('/:workspaceId/targets', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const input = targetCreateSchema.parse(req.body);
      const now = new Date().toISOString();
      const targetId = `target_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await db.prepare(`
        INSERT INTO targets (
          id, company_id, metric_id, scope_type, scope_id, period_type, period_start, period_end,
          target_value, effective_from, effective_to, created_by_membership_id, status, version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?)
      `).run(
        targetId,
        workspaceId,
        input.metricId,
        input.scopeType,
        input.scopeId,
        input.periodType,
        input.periodStart,
        input.periodEnd,
        input.targetValue,
        input.periodStart,
        input.periodEnd,
        req.membership!.id,
        now,
        now
      );

      await recordAuditEvent(db, {
        companyId: workspaceId,
        actorMembershipId: req.membership!.id,
        action: 'TARGET_CREATED',
        entityType: 'target',
        entityId: targetId,
        requestId: req.requestId,
        details: { ...input },
      });

      res.status(201).json({
        data: {
          id: targetId,
          ...input,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
