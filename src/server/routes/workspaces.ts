import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { getDb } from '../db/client.js';
import { requireRole, recordAuditEvent } from '../middleware/authorize.js';
import { AppError } from '../middleware/errorHandler.js';

export function createWorkspacesRouter(db: DatabaseSync = getDb()): Router {
  const router = Router();

  const checkTenant = (req: Request, workspaceId: string) => {
    if (req.membership?.companyId !== workspaceId) {
      throw new AppError('FORBIDDEN', 'Access denied to this workspace.', 403);
    }
  };

  // GET /api/v1/workspaces/:workspaceId
  router.get('/:workspaceId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(workspaceId) as any;
      if (!company) {
        throw new AppError('NOT_FOUND', 'Workspace not found', 404);
      }

      const metrics = db.prepare("SELECT * FROM sales_metrics WHERE company_id = ? AND status = 'active'").all(workspaceId);
      const teams = db.prepare("SELECT * FROM teams WHERE company_id = ? AND status = 'active'").all(workspaceId);

      res.json({
        data: {
          company,
          metrics,
          teams,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/workspaces/:workspaceId/members
  router.get('/:workspaceId/members', (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const members = db.prepare(`
        SELECT m.id, m.company_id, m.user_id, m.role, m.title, m.territory, m.status, m.joined_at,
               u.display_name, u.email, u.avatar_initials,
               t.id as team_id, t.name as team_name, t.code as team_code
        FROM memberships m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN team_memberships tm ON tm.membership_id = m.id
        LEFT JOIN teams t ON tm.team_id = t.id
        WHERE m.company_id = ?
        ORDER BY m.role = 'admin' DESC, m.role = 'manager' DESC, u.display_name ASC
      `).all(workspaceId);

      res.json({ data: members });
    } catch (err) {
      next(err);
    }
  });

  const inviteSchema = z.object({
    email: z.string().email(),
    displayName: z.string().min(2),
    role: z.enum(['admin', 'manager', 'rep']),
    title: z.string().min(2),
    teamId: z.string().optional(),
    territory: z.string().optional(),
  });

  // POST /api/v1/workspaces/:workspaceId/members/invite
  router.post('/:workspaceId/members/invite', requireRole('admin', 'manager'), (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const input = inviteSchema.parse(req.body);
      const now = new Date().toISOString();

      let user = db.prepare('SELECT id FROM users WHERE email = ?').get(input.email) as { id: string } | undefined;
      const userId = user?.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      if (!user) {
        const initials = input.displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
        db.prepare(`
          INSERT INTO users (id, email, display_name, avatar_initials, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'active', ?, ?)
        `).run(userId, input.email, input.displayName, initials, now, now);
      }

      const existingMember = db.prepare('SELECT id FROM memberships WHERE company_id = ? AND user_id = ?').get(workspaceId, userId);
      if (existingMember) {
        throw new AppError('CONFLICT', 'User is already a member of this company', 409);
      }

      const membershipId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO memberships (id, company_id, user_id, role, title, territory, status, joined_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(membershipId, workspaceId, userId, input.role, input.title, input.territory || null, now);

      if (input.teamId) {
        db.prepare(`
          INSERT INTO team_memberships (id, team_id, membership_id)
          VALUES (?, ?, ?)
        `).run(`tm_${Date.now()}`, input.teamId, membershipId);
      }

      recordAuditEvent(db, {
        companyId: workspaceId,
        actorMembershipId: req.membership!.id,
        action: 'MEMBER_INVITED',
        entityType: 'membership',
        entityId: membershipId,
        requestId: req.requestId,
        details: { email: input.email, role: input.role, title: input.title },
      });

      res.status(201).json({
        data: {
          membershipId,
          email: input.email,
          displayName: input.displayName,
          role: input.role,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/workspaces/:workspaceId/teams
  router.get('/:workspaceId/teams', (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const teams = db.prepare(`
        SELECT t.*, COUNT(tm.membership_id) as member_count
        FROM teams t
        LEFT JOIN team_memberships tm ON tm.team_id = t.id
        WHERE t.company_id = ? AND t.status = 'active'
        GROUP BY t.id
        ORDER BY t.name ASC
      `).all(workspaceId);

      res.json({ data: teams });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
