import React, { useState } from 'react';
import { X, UserPlus, CheckCircle } from 'lucide-react';
import { inviteMember } from '../api.js';

interface InviteRepModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const InviteRepModal: React.FC<InviteRepModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'rep'>('rep');
  const [title, setTitle] = useState('Enterprise AE');
  const [teamId, setTeamId] = useState('team_ent');
  const [territory, setTerritory] = useState('Enterprise North America');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await inviteMember(workspaceId, {
        email: email.trim(),
        displayName: displayName.trim(),
        role,
        title: title.trim(),
        teamId,
        territory: territory.trim() || undefined,
      });

      onSuccess(`Invited ${displayName} (${email}) as ${role.toUpperCase()}!`);
      onClose();
      setEmail('');
      setDisplayName('');
    } catch (err: any) {
      setError(err.message || 'Failed to invite member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} color="#0f172a" />
            <h2 className="modal-title">Invite Team Member</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '14px',
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="displayName">Full Name *</label>
              <input
                id="displayName"
                type="text"
                className="form-input"
                placeholder="e.g. Jordan Lee"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Work Email *</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="jordan.lee@acme.corp"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="role">Role</label>
                <select
                  id="role"
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="rep">Sales Representative</option>
                  <option value="manager">Team Manager</option>
                  <option value="admin">Company Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="teamId">Assigned Team</label>
                <select
                  id="teamId"
                  className="form-select"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  <option value="team_ent">Enterprise (ENT)</option>
                  <option value="team_mm">Mid-Market (MM)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Job Title</label>
                <input
                  id="title"
                  type="text"
                  className="form-input"
                  placeholder="Enterprise AE"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="territory">Territory</label>
                <input
                  id="territory"
                  type="text"
                  className="form-input"
                  placeholder="North America West"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-dark" disabled={loading}>
              <CheckCircle size={14} />
              <span>{loading ? 'Inviting...' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
