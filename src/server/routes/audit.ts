import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseClient, getDb } from '../db/client.js';
import { requireRole } from '../middleware/authorize.js';
import { AppError } from '../middleware/errorHandler.js';

export function createAuditRouter(db: DatabaseClient = getDb()): Router {
  const router = Router();

  const checkTenant = (req: Request, workspaceId: string) => {
    if (req.membership?.companyId !== workspaceId) {
      throw new AppError('FORBIDDEN', 'Access denied to this workspace.', 403);
    }
  };

  // GET /api/v1/workspaces/:workspaceId/audit-events
  router.get('/:workspaceId/audit-events', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const { limit = '50', offset = '0', entityType } = req.query;

      let sql = `
        SELECT a.*, u.display_name as actor_name, u.email as actor_email, m.role as actor_role
        FROM audit_events a
        LEFT JOIN memberships m ON a.actor_membership_id = m.id
        LEFT JOIN users u ON m.user_id = u.id
        WHERE a.company_id = ?
      `;
      const params: any[] = [workspaceId];

      if (entityType) {
        sql += ' AND a.entity_type = ?';
        params.push(String(entityType));
      }

      sql += ' ORDER BY a.occurred_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const events = await db.prepare(sql).all(...params) as any[];

      const formatted = events.map((e) => {
        let details = {};
        try {
          details = JSON.parse(e.details_json);
        } catch {}
        return {
          id: e.id,
          action: e.action,
          entityType: e.entity_type,
          entityId: e.entity_id,
          occurredAt: e.occurred_at,
          requestId: e.request_id,
          actor: {
            membershipId: e.actor_membership_id,
            name: e.actor_name || 'System',
            email: e.actor_email,
            role: e.actor_role,
          },
          details,
        };
      });

      res.json({ data: formatted });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
