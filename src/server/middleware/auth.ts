import { Request, Response, NextFunction } from 'express';
import { DatabaseClient, getDb } from '../db/client.js';

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
 * Accepts session token or header overrides (e.g. x-membership-id)
 */
export function authenticate(db: DatabaseClient = getDb()) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate request ID for correlation and audit trail
      req.requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const sessionToken = req.cookies?.vantage_session || (req.headers['authorization']?.startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null);
      const membershipIdHeader = (req.headers['x-membership-id'] as string) || (req.query.membershipId as string);
      const companyIdHeader = (req.headers['x-company-id'] as string) || (req.query.companyId as string);

      let membershipRow: any = null;

      if (sessionToken) {
        const session = await db.prepare(`
          SELECT s.id, s.user_id, s.membership_id, s.expires_at,
                 u.status as user_status
          FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.token = ?
        `).get(sessionToken) as any;

        if (!session || new Date(session.expires_at).getTime() < Date.now()) {
          if (session) {
            await db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
          }
          res.clearCookie('vantage_session', { path: '/' });
          res.status(401).json({
            error: {
              code: 'UNAUTHENTICATED',
              message: 'Your session has expired. Please sign in again.',
              requestId: req.requestId,
            },
          });
          return;
        }

        if (session.user_status !== 'active') {
          res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'Account has been deactivated. Contact your workspace admin.',
              requestId: req.requestId,
            },
          });
          return;
        }

        const targetMemId = membershipIdHeader || session.membership_id;

        if (targetMemId) {
          membershipRow = await db.prepare(`
            SELECT m.*, u.email, u.display_name, u.avatar_initials, u.status as user_status,
                   c.name as company_name, c.slug as company_slug, c.timezone as company_timezone, c.status as company_status,
                   t.id as team_id, t.code as team_code, t.name as team_name
            FROM memberships m
            JOIN users u ON m.user_id = u.id
            JOIN companies c ON m.company_id = c.id
            LEFT JOIN team_memberships tm ON tm.membership_id = m.id
            LEFT JOIN teams t ON tm.team_id = t.id
            WHERE m.id = ? AND m.status = 'active'
          `).get(targetMemId);
        }

        if (!membershipRow) {
          membershipRow = await db.prepare(`
            SELECT m.*, u.email, u.display_name, u.avatar_initials, u.status as user_status,
                   c.name as company_name, c.slug as company_slug, c.timezone as company_timezone, c.status as company_status,
                   t.id as team_id, t.code as team_code, t.name as team_name
            FROM memberships m
            JOIN users u ON m.user_id = u.id
            JOIN companies c ON m.company_id = c.id
            LEFT JOIN team_memberships tm ON tm.membership_id = m.id
            LEFT JOIN teams t ON tm.team_id = t.id
            WHERE m.user_id = ? AND m.status = 'active'
            ORDER BY (m.role = 'admin') DESC, (m.role = 'manager') DESC
            LIMIT 1
          `).get(session.user_id);
        }
      } else if (membershipIdHeader) {
        membershipRow = await db.prepare(`
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

      // Cross-tenant guard
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
    } catch (err) {
      next(err);
    }
  };
}
