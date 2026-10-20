import React, { useState } from 'react';
import { X, CheckCircle, DollarSign, Calendar, Tag, Building } from 'lucide-react';
import { createSalesEntry } from '../api.js';

interface SalesLoggerModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const SalesLoggerModal: React.FC<SalesLoggerModalProps> = ({
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [clientName, setClientName] = useState('');
  const [dealCategory, setDealCategory] = useState<'New ARR' | 'Expansion' | 'Services' | 'Renewal'>('New ARR');
  const [businessDate, setBusinessDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualValue, setActualValue] = useState('');
  const [note, setNote] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(actualValue);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid positive sales amount.');
      return;
    }

    if (!clientName.trim()) {
      setError('Client or deal name is required.');
      return;
    }

    setLoading(true);
    try {
      await createSalesEntry(workspaceId, {
        clientName: clientName.trim(),
        dealCategory,
        businessDate,
        actualValue: val,
        note: note.trim() || undefined,
        status: isDraft ? 'Draft' : 'Confirmed',
      });

      onSuccess(isDraft ? 'Draft transaction saved successfully.' : `Successfully logged $${val.toLocaleString()} deal for ${clientName}!`);
      onClose();
      // Reset form
      setClientName('');
      setActualValue('');
      setNote('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit sales entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="brand-icon-box" style={{ width: '22px', height: '22px', fontSize: '11px' }}>V</div>
            <h2 className="modal-title">Log Closed Sales Deal</h2>
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
              <label className="form-label" htmlFor="clientName">
                <Building size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Deal & Client Name *
              </label>
              <input
                id="clientName"
                type="text"
                className="form-input"
                placeholder="e.g. Linear Orbit Inc., Snowflake Data Cloud"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="dealCategory">
                  <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Deal Category
                </label>
                <select
                  id="dealCategory"
                  className="form-select"
                  value={dealCategory}
                  onChange={(e) => setDealCategory(e.target.value as any)}
                >
                  <option value="New ARR">New ARR</option>
                  <option value="Expansion">Expansion</option>
                  <option value="Services">Services</option>
                  <option value="Renewal">Renewal ARR</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="actualValue">
                  <DollarSign size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Amount ($ USD) *
                </label>
                <input
                  id="actualValue"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  placeholder="3850.00"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="businessDate">
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Business Date (Company Timezone)
              </label>
              <input
                id="businessDate"
                type="date"
                className="form-input"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="note">
                Notes & Contract Reference (Optional)
              </label>
              <textarea
                id="note"
                className="form-textarea"
                rows={2}
                placeholder="Contract #LN-8902 • 24 Mo. agreement"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="checkbox"
                id="saveAsDraft"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
              />
              <label htmlFor="saveAsDraft" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                Save as draft for review (will not count toward live daily pacing yet)
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-dark" disabled={loading}>
              <CheckCircle size={14} />
              <span>{loading ? 'Submitting...' : isDraft ? 'Save Draft' : 'Commit Sales Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
