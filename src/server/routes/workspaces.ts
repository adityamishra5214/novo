import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient, getDb } from '../db/client.js';
import { requireRole, recordAuditEvent } from '../middleware/authorize.js';
import { AppError } from '../middleware/errorHandler.js';

export function createWorkspacesRouter(db: DatabaseClient = getDb()): Router {
  const router = Router();

  const checkTenant = (req: Request, workspaceId: string) => {
    if (req.membership?.companyId !== workspaceId) {
      throw new AppError('FORBIDDEN', 'Access denied to this workspace.', 403);
    }
  };

  // GET /api/v1/workspaces/:workspaceId
  router.get('/:workspaceId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const company = await db.prepare('SELECT * FROM companies WHERE id = ?').get(workspaceId) as any;
      if (!company) {
        throw new AppError('NOT_FOUND', 'Workspace not found', 404);
      }

      const metrics = await db.prepare("SELECT * FROM sales_metrics WHERE company_id = ? AND status = 'active'").all(workspaceId);
      const teams = await db.prepare("SELECT * FROM teams WHERE company_id = ? AND status = 'active'").all(workspaceId);

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
  router.get('/:workspaceId/members', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const members = await db.prepare(`
        SELECT m.id, m.company_id, m.user_id, m.role, m.title, m.territory, m.status, m.joined_at,
               u.display_name, u.email, u.avatar_initials,
               t.id as team_id, t.name as team_name, t.code as team_code
        FROM memberships m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN team_memberships tm ON tm.membership_id = m.id
        LEFT JOIN teams t ON tm.team_id = t.id
        WHERE m.company_id = ?
        ORDER BY (m.role = 'admin') DESC, (m.role = 'manager') DESC, u.display_name ASC
      `).all(workspaceId);

      res.json({ data: members });
    } catch (err) {
      next(err);
    }
  });

  const memberCreateSchema = z.object({
    email: z.string().email(),
    displayName: z.string().min(2),
    role: z.enum(['operator', 'admin', 'manager', 'rep']),
    title: z.string().min(2),
    territory: z.string().optional(),
    teamId: z.string().optional(),
  });

  // POST /api/v1/workspaces/:workspaceId/members
  router.post('/:workspaceId/members', requireRole('admin', 'operator'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const input = memberCreateSchema.parse(req.body);
      const now = new Date().toISOString();

      let user = await db.prepare('SELECT id FROM users WHERE email = ?').get(input.email) as { id: string } | undefined;
      const userId = user?.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      if (!user) {
        const initials = input.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        await db.prepare(`
          INSERT INTO users (id, email, display_name, avatar_initials, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'active', ?, ?)
        `).run(userId, input.email, input.displayName, initials, now, now);
      }

      const membershipId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.prepare(`
        INSERT INTO memberships (id, company_id, user_id, role, title, territory, status, joined_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(membershipId, workspaceId, userId, input.role, input.title, input.territory || null, now);

      if (input.teamId) {
        const teamMemId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.prepare(`
          INSERT INTO team_memberships (id, team_id, membership_id)
          VALUES (?, ?, ?)
        `).run(teamMemId, input.teamId, membershipId);
      }

      await recordAuditEvent(db, {
        companyId: workspaceId,
        actorMembershipId: req.membership!.id,
        action: 'MEMBER_ADDED',
        entityType: 'membership',
        entityId: membershipId,
        requestId: req.requestId,
        details: { email: input.email, role: input.role, title: input.title },
      });

      res.status(201).json({
        data: {
          id: membershipId,
          companyId: workspaceId,
          userId,
          role: input.role,
          title: input.title,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/workspaces/:workspaceId/teams
  router.get('/:workspaceId/teams', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const teams = await db.prepare("SELECT * FROM teams WHERE company_id = ? AND status = 'active' ORDER BY name ASC").all(workspaceId);
      res.json({ data: teams });
    } catch (err) {
      next(err);
    }
  });

  const teamCreateSchema = z.object({
    name: z.string().min(2),
    code: z.string().min(2).max(10).toUpperCase(),
  });

  // POST /api/v1/workspaces/:workspaceId/teams
  router.post('/:workspaceId/teams', requireRole('admin', 'operator'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      checkTenant(req, workspaceId);

      const input = teamCreateSchema.parse(req.body);
      const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO teams (id, company_id, name, code, status, created_at)
        VALUES (?, ?, ?, ?, 'active', ?)
      `).run(teamId, workspaceId, input.name, input.code, now);

      await recordAuditEvent(db, {
        companyId: workspaceId,
        actorMembershipId: req.membership!.id,
        action: 'TEAM_CREATED',
        entityType: 'team',
        entityId: teamId,
        requestId: req.requestId,
        details: { name: input.name, code: input.code },
      });

      res.status(201).json({
        data: {
          id: teamId,
          companyId: workspaceId,
          name: input.name,
          code: input.code,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
