import React, { useState, useEffect } from 'react';
import { Target, Plus, RefreshCw, Calendar, Layers } from 'lucide-react';
import { fetchTargets } from '../api.js';

interface TargetsPageProps {
  workspaceId: string;
  onOpenQuotasModal: () => void;
}

export const TargetsPage: React.FC<TargetsPageProps> = ({ workspaceId, onOpenQuotasModal }) => {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const res = await fetchTargets(workspaceId);
      setTargets(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, [workspaceId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Targets & Quota Management</h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Hierarchical sales targets: Company objective &gt; Team quotas &gt; Individual rep targets
          </div>
        </div>

        <button className="btn-primary-dark" onClick={onOpenQuotasModal}>
          <Plus size={15} />
          <span>Set Quota Target</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <RefreshCw size={20} className="spin-animation" style={{ margin: '0 auto 8px auto', color: '#64748b' }} />
          <p style={{ color: '#64748b', fontSize: '13px' }}>Loading quotas...</p>
        </div>
      ) : error ? (
        <div className="alert-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SCOPE</th>
                <th>ENTITY / OWNER</th>
                <th>METRIC</th>
                <th>TARGET VALUE</th>
                <th>PERIOD</th>
                <th>EFFECTIVE DATES</th>
                <th>VERSION</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          t.scope_type === 'company'
                            ? '#0f172a'
                            : t.scope_type === 'team'
                            ? '#e2e8f0'
                            : '#f1f5f9',
                        color: t.scope_type === 'company' ? '#fff' : '#0f172a',
                      }}
                    >
                      <Layers size={11} />
                      {t.scope_type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.scope_name || t.scope_id}</td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}>
                      {t.metric_name} ({t.metric_unit})
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '14px' }}>
                    ${t.target_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '12px' }}>{t.period_type}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                      <Calendar size={12} />
                      {t.period_start} to {t.period_end}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>v{t.version}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Showing {targets.length} active target definitions</span>
          </div>
        </div>
      )}
    </div>
  );
};
