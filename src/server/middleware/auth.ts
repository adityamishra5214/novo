import { Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/client.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  avatarInitials: string;
  status: string;
}

export interface AuthenticatedMembership {
  id: string;
  companyId: string;
  userId: string;
  role: 'operator' | 'admin' | 'manager' | 'rep';
  title: string;
  territory: string | null;
  status: string;
  teamId?: string | null;
  teamCode?: string | null;
  teamName?: string | null;
}

export interface AuthenticatedCompany {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      membership?: AuthenticatedMembership;
      company?: AuthenticatedCompany;
      requestId: string;
    }
  }
}

/**
 * Middleware that authenticates caller and resolves company membership context.
 * In production/demo, accepts either session token or header overrides (e.g. x-membership-id)
 * to seamlessly support multi-persona switching.
 */
export function authenticate(db: DatabaseSync = getDb()) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate request ID for correlation and audit trail
    req.requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const membershipIdHeader = (req.headers['x-membership-id'] as string) || (req.query.membershipId as string);
    const companyIdHeader = (req.headers['x-company-id'] as string) || (req.query.companyId as string);

    let membershipRow: any = null;

    if (membershipIdHeader) {
      membershipRow = db.prepare(`
        SELECT m.*, u.email, u.display_name, u.avatar_initials, u.status as user_status,
               c.name as company_name, c.slug as company_slug, c.timezone as company_timezone, c.status as company_status,
               t.id as team_id, t.code as team_code, t.name as team_name
        FROM memberships m
        JOIN users u ON m.user_id = u.id
        JOIN companies c ON m.company_id = c.id
        LEFT JOIN team_memberships tm ON tm.membership_id = m.id
        LEFT JOIN teams t ON tm.team_id = t.id
        WHERE m.id = ? AND m.status = 'active'
      `).get(membershipIdHeader);
    } else {
      // Default to Alex Mercer (Exec/Admin at Acme Corp)
      membershipRow = db.prepare(`
        SELECT m.*, u.email, u.display_name, u.avatar_initials, u.status as user_status,
               c.name as company_name, c.slug as company_slug, c.timezone as company_timezone, c.status as company_status,
               t.id as team_id, t.code as team_code, t.name as team_name
        FROM memberships m
        JOIN users u ON m.user_id = u.id
        JOIN companies c ON m.company_id = c.id
        LEFT JOIN team_memberships tm ON tm.membership_id = m.id
        LEFT JOIN teams t ON tm.team_id = t.id
        WHERE m.status = 'active' AND (m.role = 'admin' OR m.title LIKE '%Admin%')
        ORDER BY m.id ASC
        LIMIT 1
      `).get();
    }

    if (!membershipRow) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Active membership not found or unauthenticated session.',
          requestId: req.requestId,
        },
      });
      return;
    }

    // Optional cross-tenant guard: If client explicitly specified a companyId, it must match membership.
    if (companyIdHeader && companyIdHeader !== membershipRow.company_id) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Caller membership does not belong to the requested company.',
          requestId: req.requestId,
        },
      });
      return;
    }

    req.user = {
      id: membershipRow.user_id,
      email: membershipRow.email,
      displayName: membershipRow.display_name,
      avatarInitials: membershipRow.avatar_initials,
      status: membershipRow.user_status,
    };

    req.membership = {
      id: membershipRow.id,
      companyId: membershipRow.company_id,
      userId: membershipRow.user_id,
      role: membershipRow.role,
      title: membershipRow.title,
      territory: membershipRow.territory,
      status: membershipRow.status,
      teamId: membershipRow.team_id || null,
      teamCode: membershipRow.team_code || null,
      teamName: membershipRow.team_name || null,
    };

    req.company = {
      id: membershipRow.company_id,
      name: membershipRow.company_name,
      slug: membershipRow.company_slug,
      timezone: membershipRow.company_timezone,
      status: membershipRow.company_status,
    };

    next();
  };
}
