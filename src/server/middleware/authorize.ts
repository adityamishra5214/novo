import { Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';

export function requireRole(...allowedRoles: ('operator' | 'admin' | 'manager' | 'rep')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.membership) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
          requestId: req.requestId,
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.membership.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient role. Required one of: ${allowedRoles.join(', ')}`,
          requestId: req.requestId,
        },
      });
      return;
    }

    next();
  };
}

export function recordAuditEvent(
  db: DatabaseSync,
  params: {
    companyId: string;
    actorMembershipId: string;
    action: string;
    entityType: string;
    entityId: string;
    requestId: string;
    details: Record<string, any>;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO audit_events (
      id, company_id, actor_membership_id, action, entity_type, entity_id, occurred_at, request_id, details_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const eventId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  stmt.run(
    eventId,
    params.companyId,
    params.actorMembershipId,
    params.action,
    params.entityType,
    params.entityId,
    new Date().toISOString(),
    params.requestId,
    JSON.stringify(params.details)
  );
}
