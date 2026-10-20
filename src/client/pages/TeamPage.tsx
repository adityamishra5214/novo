import React, { useState, useEffect } from 'react';
import { Users, UserPlus, RefreshCw, Mail, Shield, MapPin } from 'lucide-react';
import { fetchMembers } from '../api.js';

interface TeamPageProps {
  workspaceId: string;
  onOpenInviteModal: () => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({ workspaceId, onOpenInviteModal }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetchMembers(workspaceId);
      setMembers(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load team directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Team Directory & Permissions</h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Active company members, organizational teams, and access roles
          </div>
        </div>

        <button className="btn-primary-dark" onClick={onOpenInviteModal}>
          <UserPlus size={15} />
          <span>Invite Member</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <RefreshCw size={20} className="spin-animation" style={{ margin: '0 auto 8px auto', color: '#64748b' }} />
          <p style={{ color: '#64748b', fontSize: '13px' }}>Loading members...</p>
        </div>
      ) : error ? (
        <div className="alert-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>MEMBER</th>
                <th>ROLE</th>
                <th>TEAM</th>
                <th>TITLE</th>
                <th>TERRITORY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                        {m.avatar_initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.display_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={11} />
                          {m.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: m.role === 'admin' ? '#0f172a' : m.role === 'manager' ? '#e2e8f0' : '#f1f5f9',
                        color: m.role === 'admin' ? '#ffffff' : '#0f172a',
                      }}
                    >
                      <Shield size={11} />
                      {m.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      {m.team_name || 'General'} ({m.team_code || 'ALL'})
                    </span>
                  </td>
                  <td style={{ fontSize: '13px' }}>{m.title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                      <MapPin size={12} />
                      {m.territory || 'Unassigned'}
                    </div>
                  </td>
                  <td>
                    <span className="live-badge" style={{ padding: '2px 6px' }}>
                      <span className="pulse-dot"></span>
                      active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Showing {members.length} registered workspace members</span>
          </div>
        </div>
      )}
    </div>
  );
};
