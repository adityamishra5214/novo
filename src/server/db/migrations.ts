import { DatabaseSync } from 'node:sqlite';
import { getDb } from './client.js';
import { hashPassword } from '../utils/password.js';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db: DatabaseSync) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS companies (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          timezone TEXT NOT NULL DEFAULT 'America/New_York',
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          display_name TEXT NOT NULL,
          avatar_initials TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memberships (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK(role IN ('operator', 'admin', 'manager', 'rep')),
          title TEXT NOT NULL,
          territory TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          joined_at TEXT NOT NULL,
          UNIQUE(company_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          code TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          UNIQUE(company_id, code)
        );

        CREATE TABLE IF NOT EXISTS team_memberships (
          id TEXT PRIMARY KEY,
          team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          membership_id TEXT NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
          UNIQUE(team_id, membership_id)
        );

        CREATE TABLE IF NOT EXISTS sales_metrics (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          code TEXT NOT NULL,
          unit TEXT NOT NULL DEFAULT 'USD',
          value_type TEXT NOT NULL DEFAULT 'currency',
          allows_negative INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          UNIQUE(company_id, code)
        );

        CREATE TABLE IF NOT EXISTS targets (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          metric_id TEXT NOT NULL REFERENCES sales_metrics(id),
          scope_type TEXT NOT NULL CHECK(scope_type IN ('company', 'team', 'user')),
          scope_id TEXT NOT NULL,
          period_type TEXT NOT NULL CHECK(period_type IN ('month', 'quarter', 'custom')),
          period_start TEXT NOT NULL,
          period_end TEXT NOT NULL,
          target_value REAL NOT NULL CHECK(target_value >= 0),
          effective_from TEXT NOT NULL,
          effective_to TEXT NOT NULL,
          created_by_membership_id TEXT REFERENCES memberships(id),
          status TEXT NOT NULL DEFAULT 'active',
          version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS daily_sales_entries (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          membership_id TEXT NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
          metric_id TEXT NOT NULL REFERENCES sales_metrics(id),
          client_name TEXT NOT NULL,
          deal_category TEXT NOT NULL CHECK(deal_category IN ('New ARR', 'Expansion', 'Services', 'Renewal')),
          business_date TEXT NOT NULL,
          actual_value REAL NOT NULL CHECK(actual_value >= 0),
          note TEXT,
          status TEXT NOT NULL CHECK(status IN ('Confirmed', 'Audited', 'Draft')),
          created_by_membership_id TEXT NOT NULL REFERENCES memberships(id),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_events (
          id TEXT PRIMARY KEY,
          company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
          actor_membership_id TEXT REFERENCES memberships(id),
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          occurred_at TEXT NOT NULL,
          request_id TEXT NOT NULL,
          details_json TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_memberships_company ON memberships(company_id, user_id);
        CREATE INDEX IF NOT EXISTS idx_targets_scope ON targets(company_id, scope_type, scope_id, period_start, period_end);
        CREATE INDEX IF NOT EXISTS idx_sales_entries_lookup ON daily_sales_entries(company_id, membership_id, business_date);
        CREATE INDEX IF NOT EXISTS idx_sales_entries_date ON daily_sales_entries(company_id, business_date);
        CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_events(company_id, occurred_at);
      `);
    },
  },
  {
    version: 2,
    name: 'add_authentication',
    up: (db: DatabaseSync) => {
      db.exec(`
        ALTER TABLE users ADD COLUMN password_hash TEXT;

        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          membership_id TEXT REFERENCES memberships(id),
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      `);
    },
  },
  {
    version: 3,
    name: 'backfill_passwords',
    up: (db: DatabaseSync) => {
      const defaultHash = hashPassword('password123');
      db.prepare('UPDATE users SET password_hash = ? WHERE password_hash IS NULL').run(defaultHash);
    },
  },
];

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM schema_migrations ORDER BY version ASC').all() as { version: number }[];
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  for (const migration of migrations) {
    if (!appliedSet.has(migration.version)) {
      console.log(`Applying migration ${migration.version}: ${migration.name}`);
      migration.up(db);
      const stmt = db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)');
      stmt.run(migration.version, migration.name, new Date().toISOString());
    }
  }
}

import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Allow standalone execution
if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()) {
  const db = getDb();
  runMigrations(db);
  console.log('Migrations complete.');
}

