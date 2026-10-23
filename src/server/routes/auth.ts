import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient, getDb, withTransaction } from '../db/client.js';
import { hashPassword, verifyPassword, generateSessionToken } from '../utils/password.js';
import { AppError } from '../middleware/errorHandler.js';

const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_SHORT_DAYS = 1;

function setSessionCookie(res: Response, token: string, remember: boolean): void {
  const maxAge = remember
    ? SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
    : SESSION_DURATION_SHORT_DAYS * 24 * 60 * 60 * 1000;

  res.cookie('vantage_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Public auth routes (login, register, logout) — no authentication required.
 */
export function createPublicAuthRouter(db: DatabaseClient = getDb()): Router {
  const router = Router();

  // ─── Login ─────────────────────────────────────────────────
  const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
    remember: z.boolean().optional().default(false),
  });

  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = loginSchema.parse(req.body);

      const user = await db.prepare(`
        SELECT id, email, display_name, avatar_initials, status, password_hash
        FROM users WHERE email = ?
      `).get(input.email.toLowerCase()) as any;

      if (!user || !user.password_hash) {
        throw new AppError('UNAUTHENTICATED', 'Invalid email or password.', 401);
      }

      if (!verifyPassword(input.password, user.password_hash)) {
        throw new AppError('UNAUTHENTICATED', 'Invalid email or password.', 401);
      }

      if (user.status !== 'active') {
        throw new AppError('FORBIDDEN', 'Account has been deactivated. Contact your workspace admin.', 403);
      }

      // Find user's first active membership
      const membership = await db.prepare(`
        SELECT m.id FROM memberships m
        WHERE m.user_id = ? AND m.status = 'active'
        ORDER BY (m.role = 'admin') DESC, (m.role = 'manager') DESC
        LIMIT 1
      `).get(user.id) as { id: string } | undefined;

      // Create session
      const token = generateSessionToken();
      const now = new Date();
      const durationDays = input.remember ? SESSION_DURATION_DAYS : SESSION_DURATION_SHORT_DAYS;
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await db.prepare(`
        INSERT INTO sessions (id, user_id, token, membership_id, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sessionId, user.id, token, membership?.id || null, expiresAt.toISOString(), now.toISOString());

      // Set cookie
      setSessionCookie(res, token, input.remember);

      res.json({
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarInitials: user.avatar_initials,
          },
          membershipId: membership?.id || null,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // ─── Register ──────────────────────────────────────────────
  const registerSchema = z.object({
    displayName: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid work email.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
  });

  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = registerSchema.parse(req.body);
      const now = new Date().toISOString();

      // Check if user already exists
      const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(input.email.toLowerCase());
      if (existingUser) {
        throw new AppError('CONFLICT', 'An account with this email already exists. Please sign in instead.', 409);
      }

      // Check if company slug already exists
      const slug = input.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingCompany = await db.prepare('SELECT id FROM companies WHERE slug = ?').get(slug);
      if (existingCompany) {
        throw new AppError('CONFLICT', 'A workspace with a similar name already exists.', 409);
      }

      // Create everything in a transaction
      const passwordHash = hashPassword(input.password);
      const initials = input.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const companyId = `company_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const membershipId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const metricId = `metric_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await withTransaction(async (tx) => {
        // Create user
        await tx.prepare(`
          INSERT INTO users (id, email, display_name, avatar_initials, status, created_at, updated_at, password_hash)
          VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
        `).run(userId, input.email.toLowerCase(), input.displayName, initials, now, now, passwordHash);

        // Create company
        await tx.prepare(`
          INSERT INTO companies (id, name, slug, timezone, status, created_at, updated_at)
          VALUES (?, ?, ?, 'America/New_York', 'active', ?, ?)
        `).run(companyId, input.companyName, slug, now, now);

        // Create admin membership
        await tx.prepare(`
          INSERT INTO memberships (id, company_id, user_id, role, title, territory, status, joined_at)
          VALUES (?, ?, ?, 'admin', 'Workspace Owner', NULL, 'active', ?)
        `).run(membershipId, companyId, userId, now);

        // Create default revenue metric
        await tx.prepare(`
          INSERT INTO sales_metrics (id, company_id, name, code, unit, value_type, allows_negative, status)
          VALUES (?, ?, 'Revenue', 'revenue', 'USD', 'currency', false, 'active')
        `).run(metricId, companyId);

        // Audit
        await tx.prepare(`
          INSERT INTO audit_events (id, company_id, actor_membership_id, action, entity_type, entity_id, occurred_at, request_id, details_json)
          VALUES (?, ?, ?, 'WORKSPACE_CREATED', 'company', ?, ?, ?, ?)
        `).run(
          `audit_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          companyId, membershipId, companyId, now,
          `req_register_${Date.now()}`,
          JSON.stringify({ companyName: input.companyName, ownerEmail: input.email })
        );
      });

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await db.prepare(`
        INSERT INTO sessions (id, user_id, token, membership_id, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sessionId, userId, token, membershipId, expiresAt.toISOString(), now);

      setSessionCookie(res, token, true);

      res.status(201).json({
        data: {
          user: {
            id: userId,
            email: input.email.toLowerCase(),
            displayName: input.displayName,
            avatarInitials: initials,
          },
          companyId,
          membershipId,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // ─── Logout ────────────────────────────────────────────────
  router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.vantage_session;
      if (token) {
        await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      }
      res.clearCookie('vantage_session', { path: '/' });
      res.json({ data: { message: 'Signed out successfully.' } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/**
 * Authenticated auth routes (requires valid session or membership header).
 */
export function createAuthRouter(db: DatabaseClient = getDb()): Router {
  const router = Router();

  // GET /api/v1/auth/me — returns current user context
  router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch available active memberships for persona switching
      const availableMemberships = await db.prepare(`
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
        ORDER BY (m.role = 'admin') DESC, (m.role = 'manager') DESC, u.display_name ASC
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
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/auth/switch-membership — switch active membership context
  router.post('/switch-membership', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { membershipId } = req.body;
      if (!membershipId) {
        throw new AppError('VALIDATION_ERROR', 'membershipId is required.', 400);
      }
      const token = req.cookies?.vantage_session;
      if (token) {
        await db.prepare('UPDATE sessions SET membership_id = ? WHERE token = ?').run(membershipId, token);
      }
      res.json({ data: { success: true, activeMembershipId: membershipId } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
