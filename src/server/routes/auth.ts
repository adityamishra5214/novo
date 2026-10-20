import { Router, Request, Response } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/client.js';

export function createAuthRouter(db: DatabaseSync = getDb()): Router {
  const router = Router();

  // GET /api/v1/me
  router.get('/me', (req: Request, res: Response) => {
    // Also fetch available active memberships in company for switching personas in the UI
    const availableMemberships = db.prepare(`
      SELECT m.id, m.role, m.title, m.territory, m.company_id,
             u.id as user_id, u.display_name, u.email, u.avatar_initials,
             c.name as company_name,
             t.name as team_name, t.code as team_code
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      JOIN companies c ON m.company_id = c.id
      LEFT JOIN team_memberships tm ON tm.membership_id = m.id
      LEFT JOIN teams t ON tm.team_id = t.id
      WHERE m.status = 'active'
      ORDER BY m.role = 'admin' DESC, m.role = 'manager' DESC, u.display_name ASC
    `).all() as any[];

    res.json({
      data: {
        user: req.user,
        membership: req.membership,
        company: req.company,
        availableMemberships: availableMemberships.map((m) => ({
          membershipId: m.id,
          companyId: m.company_id,
          companyName: m.company_name,
          userId: m.user_id,
          displayName: m.display_name,
          email: m.email,
          avatarInitials: m.avatar_initials,
          role: m.role,
          title: m.title,
          territory: m.territory,
          teamName: m.team_name,
          teamCode: m.team_code,
        })),
      },
    });
  });

  return router;
}
