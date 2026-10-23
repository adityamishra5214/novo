import { DatabaseClient } from '../db/client.js';

export interface ResolvedTarget {
  id: string;
  scopeType: 'user' | 'team' | 'company';
  scopeId: string;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
  metricId: string;
  metricName: string;
  metricUnit: string;
}

/**
 * Resolves active target for a representative for a given period.
 * Precedence rule: user-specific target > assigned team target > company default target.
 */
export async function resolveRepTarget(
  db: DatabaseClient,
  params: {
    companyId: string;
    membershipId: string;
    periodStart: string;
    periodEnd: string;
    metricId?: string;
  }
): Promise<ResolvedTarget | null> {
  const { companyId, membershipId, periodStart, periodEnd, metricId } = params;

  // 1. Try user-specific target
  let sql = `
    SELECT t.*, m.name as metric_name, m.unit as metric_unit
    FROM targets t
    JOIN sales_metrics m ON t.metric_id = m.id
    WHERE t.company_id = ?
      AND t.scope_type = 'user'
      AND t.scope_id = ?
      AND t.period_start <= ?
      AND t.period_end >= ?
      AND t.status = 'active'
  `;
  const sqlParams: any[] = [companyId, membershipId, periodEnd, periodStart];
  if (metricId) {
    sql += ' AND t.metric_id = ?';
    sqlParams.push(metricId);
  }
  sql += ' ORDER BY t.version DESC LIMIT 1';

  let row = await db.prepare(sql).get(...sqlParams) as any;
  if (row) {
    return {
      id: row.id,
      scopeType: 'user',
      scopeId: row.scope_id,
      targetValue: Number(row.target_value),
      periodStart: row.period_start,
      periodEnd: row.period_end,
      metricId: row.metric_id,
      metricName: row.metric_name,
      metricUnit: row.metric_unit,
    };
  }

  // 2. Try team target for rep's team
  const teamMembership = await db.prepare(`
    SELECT team_id FROM team_memberships WHERE membership_id = ? LIMIT 1
  `).get(membershipId) as { team_id: string } | undefined;

  if (teamMembership) {
    let teamSql = `
      SELECT t.*, m.name as metric_name, m.unit as metric_unit
      FROM targets t
      JOIN sales_metrics m ON t.metric_id = m.id
      WHERE t.company_id = ?
        AND t.scope_type = 'team'
        AND t.scope_id = ?
        AND t.period_start <= ?
        AND t.period_end >= ?
        AND t.status = 'active'
    `;
    const teamSqlParams: any[] = [companyId, teamMembership.team_id, periodEnd, periodStart];
    if (metricId) {
      teamSql += ' AND t.metric_id = ?';
      teamSqlParams.push(metricId);
    }
    teamSql += ' ORDER BY t.version DESC LIMIT 1';
    row = await db.prepare(teamSql).get(...teamSqlParams) as any;
    if (row) {
      return {
        id: row.id,
        scopeType: 'team',
        scopeId: row.scope_id,
        targetValue: Number(row.target_value),
        periodStart: row.period_start,
        periodEnd: row.period_end,
        metricId: row.metric_id,
        metricName: row.metric_name,
        metricUnit: row.metric_unit,
      };
    }
  }

  // 3. Fallback to company target
  let compSql = `
    SELECT t.*, m.name as metric_name, m.unit as metric_unit
    FROM targets t
    JOIN sales_metrics m ON t.metric_id = m.id
    WHERE t.company_id = ?
      AND t.scope_type = 'company'
      AND t.period_start <= ?
      AND t.period_end >= ?
      AND t.status = 'active'
  `;
  const compSqlParams: any[] = [companyId, periodEnd, periodStart];
  if (metricId) {
    compSql += ' AND t.metric_id = ?';
    compSqlParams.push(metricId);
  }
  compSql += ' ORDER BY t.version DESC LIMIT 1';
  row = await db.prepare(compSql).get(...compSqlParams) as any;
  if (row) {
    return {
      id: row.id,
      scopeType: 'company',
      scopeId: row.scope_id,
      targetValue: Number(row.target_value),
      periodStart: row.period_start,
      periodEnd: row.period_end,
      metricId: row.metric_id,
      metricName: row.metric_name,
      metricUnit: row.metric_unit,
    };
  }

  return null;
}
