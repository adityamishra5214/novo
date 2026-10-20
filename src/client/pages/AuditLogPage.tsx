import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Key, User, Calendar } from 'lucide-react';
import { fetchAuditEvents } from '../api.js';

interface AuditLogPageProps {
  workspaceId: string;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ workspaceId }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await fetchAuditEvents(workspaceId);
      setEvents(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [workspaceId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Compliance Audit Trail</h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Immutable chronological record of sales entries, target assignments, and workspace mutations
          </div>
        </div>

        <button className="btn-secondary" onClick={loadAudit}>
          <RefreshCw size={14} />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <RefreshCw size={20} className="spin-animation" style={{ margin: '0 auto 8px auto', color: '#64748b' }} />
          <p style={{ color: '#64748b', fontSize: '13px' }}>Loading audit records...</p>
        </div>
      ) : error ? (
        <div className="alert-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP (UTC)</th>
                <th>ACTION</th>
                <th>ENTITY</th>
                <th>ACTOR</th>
                <th>REQUEST ID</th>
                <th>MUTATION DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontSize: '12px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {new Date(e.occurredAt).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#334155' }}>
                      {e.entityType} ({e.entityId})
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} color="#64748b" />
                      <span style={{ fontWeight: 600 }}>{e.actor.name}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>({e.actor.role})</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                    <Key size={11} style={{ display: 'inline', marginRight: '3px' }} />
                    {e.requestId}
                  </td>
                  <td>
                    <pre
                      style={{
                        fontSize: '11px',
                        background: '#f8fafc',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        maxWidth: '260px',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(e.details, null, 1)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Showing {events.length} audit entries • Cryptographically sealed log</span>
          </div>
        </div>
      )}
    </div>
  );
};
