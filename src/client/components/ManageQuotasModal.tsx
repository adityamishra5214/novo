import React, { useState } from 'react';
import { X, Target, CheckCircle } from 'lucide-react';
import { createTarget } from '../api.js';

interface ManageQuotasModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ManageQuotasModal: React.FC<ManageQuotasModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [scopeType, setScopeType] = useState<'company' | 'team' | 'user'>('team');
  const [scopeId, setScopeId] = useState('team_ent');
  const [targetValue, setTargetValue] = useState('');
  const [periodStart, setPeriodStart] = useState('2025-04-01');
  const [periodEnd, setPeriodEnd] = useState('2025-04-30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const val = parseFloat(targetValue);
    if (isNaN(val) || val <= 0) {
      setError('Target value must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      await createTarget(workspaceId, {
        metricId: 'metric_new_arr',
        scopeType,
        scopeId: scopeType === 'company' ? workspaceId : scopeId,
        periodType: 'month',
        periodStart,
        periodEnd,
        targetValue: val,
      });

      onSuccess(`Successfully assigned ${scopeType} quota of $${val.toLocaleString()}!`);
      onClose();
      setTargetValue('');
    } catch (err: any) {
      setError(err.message || 'Failed to assign target.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#0f172a" />
            <h2 className="modal-title">Manage Quota Targets</h2>
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
              <label className="form-label">Quota Target Scope</label>
              <select
                className="form-select"
                value={scopeType}
                onChange={(e) => {
                  const s = e.target.value as any;
                  setScopeType(s);
                  if (s === 'company') setScopeId(workspaceId);
                  else if (s === 'team') setScopeId('team_ent');
                  else setScopeId('mem_sarah');
                }}
              >
                <option value="company">Entire Company Workspace</option>
                <option value="team">Team Level Target</option>
                <option value="user">Individual Representative Quota</option>
              </select>
            </div>

            {scopeType === 'team' && (
              <div className="form-group">
                <label className="form-label">Select Team</label>
                <select
                  className="form-select"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                >
                  <option value="team_ent">Enterprise Team (ENT)</option>
                  <option value="team_mm">Mid-Market Team (MM)</option>
                </select>
              </div>
            )}

            {scopeType === 'user' && (
              <div className="form-group">
                <label className="form-label">Select Representative</label>
                <select
                  className="form-select"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                >
                  <option value="mem_sarah">Sarah Kim (Enterprise Lead)</option>
                  <option value="mem_priya">Priya Singh (Enterprise AE)</option>
                  <option value="mem_alex">Alex Mercer (Mid-Market Senior)</option>
                  <option value="mem_elena">Elena Rostova (Enterprise AE)</option>
                  <option value="mem_marcus">Marcus Vance (Mid-Market AE)</option>
                  <option value="mem_john">John Doe (Mid-Market AE)</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Target Amount ($ USD) *</label>
              <input
                type="number"
                step="1000"
                min="1000"
                className="form-input"
                placeholder="250000"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Period Start</label>
                <input
                  type="date"
                  className="form-input"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Period End</label>
                <input
                  type="date"
                  className="form-input"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
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
              <span>{loading ? 'Saving...' : 'Set Quota Target'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
