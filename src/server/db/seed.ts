import { DatabaseClient, getDb, withTransaction } from './client.js';
import { hashPassword } from '../utils/password.js';

export async function seedDatabase(db: DatabaseClient = getDb()): Promise<void> {
  const existing = await db.prepare('SELECT id FROM companies WHERE id = ?').get('company_acme');
  if (existing) {
    console.log('Database already contains company_acme. Re-verifying key entries...');
  }

  console.log('Seeding Acme Corp, Beta Dynamics, and multi-tenant data into Supabase...');

  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const defaultPasswordHash = hashPassword('password123');

  await withTransaction(async (tx) => {
    // 1. Companies
    await tx.prepare(`
      INSERT INTO companies (id, name, slug, timezone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = 'active'
    `).run('company_acme', 'Acme Corp', 'acme-corp', 'America/New_York', 'active', now, now);

    await tx.prepare(`
      INSERT INTO companies (id, name, slug, timezone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = 'active'
    `).run('company_beta', 'Beta Dynamics', 'beta-dynamics', 'America/Los_Angeles', 'active', now, now);

    // 2. Metrics for Acme Corp
    const insertMetric = tx.prepare(`
      INSERT INTO sales_metrics (id, company_id, name, code, unit, value_type, allows_negative, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO NOTHING
    `);
    await insertMetric.run('metric_new_arr', 'company_acme', 'New ARR', 'new_arr', 'USD', 'currency', false, 'active');
    await insertMetric.run('metric_expansion', 'company_acme', 'Expansion', 'expansion', 'USD', 'currency', false, 'active');
    await insertMetric.run('metric_services', 'company_acme', 'Services', 'services', 'USD', 'currency', false, 'active');
    await insertMetric.run('metric_renewal', 'company_acme', 'Renewal ARR', 'renewal', 'USD', 'currency', false, 'active');

    // Metric for Beta Dynamics
    await insertMetric.run('metric_beta_arr', 'company_beta', 'Software ARR', 'software_arr', 'USD', 'currency', false, 'active');

    // 3. Teams for Acme Corp & Beta
    const insertTeam = tx.prepare(`
      INSERT INTO teams (id, company_id, name, code, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, status = 'active'
    `);
    await insertTeam.run('team_ent', 'company_acme', 'Enterprise', 'ENT', 'active', now);
    await insertTeam.run('team_mm', 'company_acme', 'Mid-Market', 'MM', 'active', now);
    await insertTeam.run('team_beta_sales', 'company_beta', 'Direct Sales', 'DIR', 'active', now);

    // 4. Users & Memberships
    const insertUser = tx.prepare(`
      INSERT INTO users (id, email, display_name, avatar_initials, password_hash, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
      ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'
    `);
    const insertMember = tx.prepare(`
      INSERT INTO memberships (id, company_id, user_id, role, title, territory, status, joined_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, title = EXCLUDED.title, territory = EXCLUDED.territory, status = 'active'
    `);
    const insertTeamMember = tx.prepare(`
      INSERT INTO team_memberships (id, team_id, membership_id)
      VALUES (?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET team_id = EXCLUDED.team_id
    `);

    // Key Reps matching design & test suite
    const repsData = [
      { id: 'alex', name: 'Alex Mercer', email: 'alex@acme.corp', role: 'admin', title: 'Mid-Market Senior', initials: 'AM', team: 'team_mm', target: 180000, territory: 'Mid-Market North', todayDeal: 3850 },
      { id: 'sarah', name: 'Sarah Kim', email: 'sarah@acme.corp', role: 'manager', title: 'Enterprise Lead', initials: 'SK', team: 'team_ent', target: 250000, territory: 'Enterprise Global', todayDeal: 3850 },
      { id: 'priya', name: 'Priya Singh', email: 'priya@acme.corp', role: 'rep', title: 'Enterprise AE', initials: 'PS', team: 'team_ent', target: 220000, territory: 'Enterprise West', todayDeal: 4920 },
      { id: 'elena', name: 'Elena Rostova', email: 'elena@acme.corp', role: 'rep', title: 'Enterprise AE', initials: 'ER', team: 'team_ent', target: 200000, territory: 'Enterprise EMEA', todayDeal: 2500 },
      { id: 'john', name: 'John Doe', email: 'john@acme.corp', role: 'rep', title: 'Mid-Market AE', initials: 'JD', team: 'team_mm', target: 150000, territory: 'Mid-Market South', todayDeal: 1800 },
      { id: 'marcus', name: 'Marcus Vance', email: 'marcus@acme.corp', role: 'rep', title: 'Mid-Market AE', initials: 'MV', team: 'team_mm', target: 160000, territory: 'Mid-Market East', todayDeal: 0 },
    ];

    // Add remaining 11 reps to total 17 active reps
    for (let i = 1; i <= 11; i++) {
      const isEnt = i <= 6;
      repsData.push({
        id: `rep_${i}`,
        name: isEnt ? `Enterprise Rep ${i}` : `Mid-Market Rep ${i}`,
        email: `rep${i}@acme.corp`,
        role: 'rep',
        title: isEnt ? 'Enterprise AE' : 'Mid-Market AE',
        initials: isEnt ? `E${i}` : `M${i}`,
        team: isEnt ? 'team_ent' : 'team_mm',
        target: isEnt ? 80000 : 40000,
        territory: isEnt ? 'Enterprise Strategic' : 'Mid-Market Central',
        todayDeal: 1200 + (i * 150),
      });
    }

    // Seed Beta company user for multi-tenant testing
    await insertUser.run('user_beta_admin', 'admin@betadynamics.com', 'Beta Admin', 'BA', defaultPasswordHash, now, now);
    await insertMember.run('mem_beta_admin', 'company_beta', 'user_beta_admin', 'admin', 'VP of Sales', 'North America', 'active', now);

    // Insert all users and memberships first
    for (const rep of repsData) {
      const userId = `user_${rep.id}`;
      const memId = `mem_${rep.id}`;
      await insertUser.run(userId, rep.email, rep.name, rep.initials, defaultPasswordHash, now, now);
      await insertMember.run(memId, 'company_acme', userId, rep.role, rep.title, rep.territory, 'active', now);
      await insertTeamMember.run(`tm_${rep.id}`, rep.team, memId);
    }

    // 5. Targets
    const insertTarget = tx.prepare(`
      INSERT INTO targets (
        id, company_id, metric_id, scope_type, scope_id, period_type, period_start, period_end,
        target_value, effective_from, effective_to, created_by_membership_id, status, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET target_value = EXCLUDED.target_value, status = 'active'
    `);

    // Company Targets for Q2 2025 (April)
    await insertTarget.run(
      'target_acme_q2', 'company_acme', 'metric_new_arr', 'company', 'company_acme', 'month',
      '2025-04-01', '2025-04-30', 1600000, '2025-04-01', '2025-04-30', 'mem_alex', 'active', 1, now, now
    );

    // Team targets
    await insertTarget.run(
      'target_team_ent', 'company_acme', 'metric_new_arr', 'team', 'team_ent', 'month',
      '2025-04-01', '2025-04-30', 1000000, '2025-04-01', '2025-04-30', 'mem_alex', 'active', 1, now, now
    );
    await insertTarget.run(
      'target_team_mm', 'company_acme', 'metric_new_arr', 'team', 'team_mm', 'month',
      '2025-04-01', '2025-04-30', 600000, '2025-04-01', '2025-04-30', 'mem_alex', 'active', 1, now, now
    );

    // Beta target
    await insertTarget.run(
      'target_beta_q2', 'company_beta', 'metric_beta_arr', 'company', 'company_beta', 'month',
      '2025-04-01', '2025-04-30', 500000, '2025-04-01', '2025-04-30', 'mem_beta_admin', 'active', 1, now, now
    );

    // 6. Insert individual targets and sales entries
    const insertEntry = tx.prepare(`
      INSERT INTO daily_sales_entries (
        id, company_id, membership_id, metric_id, client_name, deal_category, business_date,
        actual_value, note, status, created_by_membership_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET actual_value = EXCLUDED.actual_value, status = EXCLUDED.status
    `);

    for (const rep of repsData) {
      const memId = `mem_${rep.id}`;

      // Rep quota target
      await insertTarget.run(
        `target_${rep.id}`, 'company_acme', 'metric_new_arr', 'user', memId, 'month',
        '2025-04-01', '2025-04-30', rep.target, '2025-04-01', '2025-04-30', 'mem_alex', 'active', 1, now, now
      );

      // Specific known actual values from leaderboard:
      let targetAttainmentRatio = 0.85;
      if (rep.id === 'sarah') targetAttainmentRatio = 1.20;
      else if (rep.id === 'priya') targetAttainmentRatio = 0.90;
      else if (rep.id === 'alex') targetAttainmentRatio = 0.88;
      else if (rep.id === 'elena') targetAttainmentRatio = 0.84;
      else if (rep.id === 'john') targetAttainmentRatio = 0.77;
      else if (rep.id === 'marcus') targetAttainmentRatio = 0.75;

      const totalClosed = rep.target * targetAttainmentRatio;
      const priorClosed = rep.todayDeal > 0 ? totalClosed - rep.todayDeal : totalClosed;

      const dates = ['2025-04-07', '2025-04-14', '2025-04-18', '2025-04-21', '2025-04-22'];
      const portion = Math.round((priorClosed / dates.length) * 100) / 100;

      for (let idx = 0; idx < dates.length; idx++) {
        await insertEntry.run(
          `entry_${rep.id}_${idx}`, 'company_acme', memId, 'metric_new_arr',
          `Client ${rep.initials}-${idx + 1}`, 'New ARR', dates[idx], portion,
          'Contract booked', 'Audited', memId, now, now
        );
      }

      // Insert TODAY deal if applicable (Marcus Vance has 0 today)
      if (rep.todayDeal > 0) {
        let clientName = 'Linear Orbit Inc.';
        let cat: 'New ARR' | 'Expansion' | 'Services' | 'Renewal' = 'New ARR';
        if (rep.id === 'sarah') clientName = 'Enterprise Deal A';
        else if (rep.id === 'priya') { clientName = 'Expansion Contract'; cat = 'Expansion'; }
        else if (rep.id === 'elena') clientName = 'Global Services Pack';
        else if (rep.id === 'john') clientName = 'Nexus Software Sub';

        await insertEntry.run(
          `entry_${rep.id}_today`, 'company_acme', memId, 'metric_new_arr',
          clientName, cat, today, rep.todayDeal,
          'Midday closing commitment', 'Confirmed', memId, now, now
        );
      }
    }

    // Alex Mercer's specific entries
    await insertEntry.run(
      'entry_alex_recent_1', 'company_acme', 'mem_alex', 'metric_expansion',
      'Global Tech Systems', 'Expansion', '2025-04-22', 4920,
      'Seat Expansion - 150 Users', 'Audited', 'mem_alex', now, now
    );
    await insertEntry.run(
      'entry_alex_recent_2', 'company_acme', 'mem_alex', 'metric_services',
      'Horizon Media Cloud', 'Services', '2025-04-21', 2100,
      'Enterprise Cloud Sync', 'Audited', 'mem_alex', now, now
    );
    await insertEntry.run(
      'entry_alex_recent_3', 'company_acme', 'mem_alex', 'metric_renewal',
      'Apex Logic Partners', 'Renewal', '2025-04-21', 3200,
      'Annual License Renewal', 'Audited', 'mem_alex', now, now
    );
    await insertEntry.run(
      'entry_alex_draft_1', 'company_acme', 'mem_alex', 'metric_expansion',
      'Nexis Media Solutions', 'Expansion', today, 1200,
      'Expansion Add-on • Needs PO attachment', 'Draft', 'mem_alex', now, now
    );

    // Initial audit event
    await tx.prepare(`
      INSERT INTO audit_events (
        id, company_id, actor_membership_id, action, entity_type, entity_id, occurred_at, request_id, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO NOTHING
    `).run(
      'audit_init_1', 'company_acme', 'mem_alex', 'WORKSPACE_INITIALIZED',
      'company', 'company_acme', now, 'req_seed_001',
      JSON.stringify({ note: 'Vantage workspace initialized with Q2 2025 targets and team memberships.' })
    );

    console.log('Seeding completed successfully!');
  });
}

import { fileURLToPath } from 'node:url';
import path from 'node:path';

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase()) {
  const db = getDb();
  seedDatabase(db).then(() => {
    console.log('Done!');
    process.exit(0);
  }).catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
