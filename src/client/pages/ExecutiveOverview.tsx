import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Send,
  Download,
  SlidersHorizontal,
  UserPlus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { OverviewData } from '../types.js';
import { fetchExecutiveOverview } from '../api.js';

interface ExecutiveOverviewProps {
  workspaceId: string;
  onOpenSalesLogger: () => void;
  onOpenInviteModal: () => void;
  onOpenQuotasModal: () => void;
  onNavigateTab: (tab: string) => void;
  onToast: (msg: string) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  workspaceId,
  onOpenSalesLogger,
  onOpenInviteModal,
  onOpenQuotasModal,
  onNavigateTab,
  onToast,
}) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [showAllReps, setShowAllReps] = useState(false);
  const [slackSent, setSlackSent] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchExecutiveOverview(workspaceId);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleSendSlack = () => {
    setSlackSent(true);
    onToast('Slack reminder sent to Marcus Vance (@marcus.vance)!');
  };

  const handleExportCsv = () => {
    if (!data) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Rep Name,Team,Quota Target,Actual Closed,Attainment %']
        .concat(data.leaderboard.map((r) => `"${r.name}","${r.team}",${r.quotaTarget},${r.actualClosed},${r.attainmentPercent}%`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vantage_Executive_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Executive summary exported to CSV.');
  };

  if (loading && !data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 12px auto', color: '#64748b' }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading operational sync data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="alert-card" style={{ marginTop: '20px' }}>
          <p style={{ color: '#991b1b', fontWeight: 600 }}>Error loading executive overview</p>
          <p style={{ color: '#475569', fontSize: '13px' }}>{error}</p>
          <button className="btn-secondary" onClick={loadData} style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { kpi, segments, leaderboard, recentCloses, cadenceDays, immediateAttention } = data;
  const filteredReps = selectedTeam === 'All Teams' ? leaderboard : leaderboard.filter((r) => r.team === (selectedTeam === 'Enterprise' ? 'ENT' : 'MM'));
  const displayedReps = showAllReps ? filteredReps : filteredReps.slice(0, 5);

  return (
    <div className="page-container">
      {/* Header Row */}
      <div className="page-header-row">
        <div>
          <div className="sync-subtitle">
            <span className="pulse-dot"></span>
            <span>LIVE OPERATIONAL SYNC • Updated 3m ago</span>
          </div>
          <h1 className="page-title">Executive Overview</h1>
        </div>

        <div className="header-actions">
          <button className="btn-secondary" style={{ fontWeight: 600 }}>April 2025</button>
          <button className="btn-secondary">QTD</button>
          <select
            className="btn-secondary"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ padding: '6px 10px', cursor: 'pointer' }}
          >
            <option value="All Teams">All Teams</option>
            <option value="Enterprise">Enterprise (ENT)</option>
            <option value="Mid-Market">Mid-Market (MM)</option>
          </select>

          <button className="btn-secondary" onClick={handleExportCsv} title="Export CSV">
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button className="btn-secondary" onClick={onOpenQuotasModal} title="Manage Quotas">
            <SlidersHorizontal size={14} />
            <span>Manage Quotas</span>
          </button>

          <button className="btn-primary-dark" onClick={onOpenInviteModal}>
            <UserPlus size={14} />
            <span>Invite Rep</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="kpi-grid">
        {/* Card 1: TOTAL CLOSED REVENUE */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">TOTAL CLOSED REVENUE</span>
            <span className="kpi-tag green">
              <ArrowUpRight size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {kpi.totalClosedRevenue.curveDelta}
            </span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">${kpi.totalClosedRevenue.value.toLocaleString()}</span>
          </div>
          <div className="progress-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, kpi.totalClosedRevenue.attainmentPercent)}%` }}
            ></div>
          </div>
          <div className="kpi-footer-note">
            <span>Target: ${(kpi.totalClosedRevenue.target / 1000000).toFixed(2)}M</span>
            <span>•</span>
            <span style={{ fontWeight: 600 }}>{kpi.totalClosedRevenue.attainmentPercent}% achieved</span>
          </div>
        </div>

        {/* Card 2: TARGET DELTA / GAP */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">TARGET DELTA / GAP</span>
            <Clock size={14} color="#64748b" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">${kpi.targetDeltaGap.value.toLocaleString()}</span>
          </div>
          <div className="progress-container" style={{ background: '#f1f5f9' }}>
            <div
              className="progress-bar-fill"
              style={{ width: '100%', background: '#94a3b8' }}
            ></div>
          </div>
          <div className="kpi-footer-note" style={{ justifyContent: 'space-between' }}>
            <span>{kpi.targetDeltaGap.remainingDays} business days remaining</span>
            <span style={{ fontWeight: 600 }}>${(kpi.targetDeltaGap.requiredRatePerDay / 1000).toFixed(0)}k/day required</span>
          </div>
        </div>

        {/* Card 3: BURN / RUN PACE */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">BURN / RUN PACE</span>
            <span className="kpi-tag green">
              <TrendingUp size={12} style={{ display: 'inline', marginRight: '2px' }} />
              {kpi.burnRunPace.pacingText}
            </span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">${kpi.burnRunPace.value.toLocaleString()}</span>
            <span className="kpi-sub-number">/day</span>
          </div>
          <div className="progress-container">
            <div
              className="progress-bar-fill"
              style={{ width: '82%', background: '#10b981' }}
            ></div>
          </div>
          <div className="kpi-footer-note" style={{ justifyContent: 'space-between' }}>
            <span>Req: ${(kpi.burnRunPace.requiredPace / 1000).toFixed(1)}k</span>
            <span style={{ color: '#065f46', fontWeight: 600 }}>{kpi.burnRunPace.bufferPercent}</span>
          </div>
        </div>

        {/* Card 4: SUBMISSION HEALTH */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">SUBMISSION HEALTH</span>
            <span className="kpi-tag red">{kpi.submissionHealth.alertCount} Alert</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">{kpi.submissionHealth.percent}%</span>
          </div>
          {/* Segmented status bar */}
          <div style={{ display: 'flex', gap: '4px', height: '6px', marginBottom: '6px' }}>
            <div style={{ flex: 1, background: '#0f172a', borderRadius: '2px' }}></div>
            <div style={{ flex: 1, background: '#0f172a', borderRadius: '2px' }}></div>
            <div style={{ flex: 1, background: '#0f172a', borderRadius: '2px' }}></div>
            <div style={{ flex: 1, background: '#0f172a', borderRadius: '2px' }}></div>
            <div style={{ width: '12px', background: '#ef4444', borderRadius: '2px' }} title="Marcus Vance pending"></div>
          </div>
          <div className="kpi-footer-note" style={{ justifyContent: 'space-between' }}>
            <span>{kpi.submissionHealth.submittedCount} of {kpi.submissionHealth.totalCount} reps submitted</span>
            <span style={{ color: '#991b1b', fontWeight: 600 }}>{kpi.submissionHealth.pendingRep}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Chart & Side Panel */}
      <div className="dashboard-columns">
        {/* Left Column: Attainment Cadence Chart */}
        <div className="chart-card">
          <div className="card-header-between">
            <div>
              <h2 className="card-title">Attainment Velocity & Weekday Cadence</h2>
              <div className="card-subtitle">MTD daily recognized revenue volume vs linear quota target baseline</div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-swatch black"></span>
                <span>Actual Inflow</span>
              </div>
              <div className="legend-item">
                <span className="legend-swatch dashed"></span>
                <span>Target Trajectory</span>
              </div>
            </div>
          </div>

          {/* SVG Attainment Cadence Chart */}
          <div className="chart-container">
            <svg width="100%" height="100%" viewBox="0 0 700 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f5f9" strokeWidth="1" />

              {/* Target Trajectory Line (Dashed) */}
              <line x1="30" y1="150" x2="670" y2="50" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />

              {/* Cadence Bars */}
              {cadenceDays.map((day, idx) => {
                const totalBars = cadenceDays.length;
                const x = 30 + idx * (640 / (totalBars - 1));
                const barHeight = (day.value / 95000) * 130;
                const y = 170 - barHeight;
                const isHighlight = day.isPeak || idx === totalBars - 1;

                return (
                  <g key={day.date}>
                    <rect
                      x={x - 12}
                      y={y}
                      width={24}
                      height={barHeight}
                      rx={3}
                      fill={isHighlight ? '#0f172a' : '#cbd5e1'}
                      style={{ transition: 'all 0.3s' }}
                    />
                    {isHighlight && (
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                        fill="#0f172a"
                      >
                        ${(day.value / 1000).toFixed(1)}k Peak
                      </text>
                    )}
                    <text
                      x={x}
                      y={188}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                      fontWeight={isHighlight ? '600' : '400'}
                    >
                      {day.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom stats row */}
          <div className="chart-bottom-metrics">
            <div className="bottom-stat">
              <span className="bottom-stat-label">Enterprise Volume</span>
              <span className="bottom-stat-value">${(segments.enterprise.actual).toLocaleString()}</span>
            </div>
            <div className="bottom-stat">
              <span className="bottom-stat-label">Mid-Market Volume</span>
              <span className="bottom-stat-value">${(segments.midMarket.actual).toLocaleString()}</span>
            </div>
            <div className="bottom-stat">
              <span className="bottom-stat-label">Run Rate Forecast</span>
              <span className="bottom-stat-value">${(data.runRateForecast / 1000000).toFixed(2)}M</span>
            </div>
          </div>
        </div>

        {/* Right Column Stack */}
        <div className="side-panel-stack">
          {/* Immediate Attention Card (Marcus Vance Alert) */}
          {immediateAttention && (
            <div className="alert-card">
              <div className="alert-top">
                <div className="alert-title-row">
                  <AlertCircle size={14} />
                  <span>IMMEDIATE ATTENTION</span>
                </div>
                <span className="alert-cutoff">Cutoff: {immediateAttention.cutoff}</span>
              </div>

              <div className="alert-user-row">
                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                  MV
                </div>
                <div className="alert-user-info">
                  <span className="alert-user-name">{immediateAttention.name} <span style={{ color: '#64748b', fontSize: '11px' }}>{immediateAttention.team}</span></span>
                  <span className="alert-user-msg">{immediateAttention.message}</span>
                </div>
              </div>

              <button
                className="btn-slack-alert"
                onClick={handleSendSlack}
                disabled={slackSent}
              >
                {slackSent ? <CheckCircle2 size={13} color="#10b981" /> : <Send size={13} />}
                <span>{slackSent ? 'Reminder Dispatched' : 'Send Slack Reminder'}</span>
                <ExternalLink size={12} style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          )}

          {/* Target Realization by Segment MTD */}
          <div className="panel-card">
            <div className="panel-card-title">
              <span>Target Realization by Segment</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>MTD</span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Enterprise Tier</span>
                <span>
                  <strong>${segments.enterprise.actual.toLocaleString()}</strong> ({segments.enterprise.percent}%)
                </span>
              </div>
              <div className="progress-container">
                <div className="progress-bar-fill" style={{ width: `${segments.enterprise.percent}%` }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Mid-Market Tier</span>
                <span>
                  <strong>${segments.midMarket.actual.toLocaleString()}</strong> ({segments.midMarket.percent}%)
                </span>
              </div>
              <div className="progress-container">
                <div className="progress-bar-fill" style={{ width: `${segments.midMarket.percent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Recent High-Value Closes Live Feed */}
          <div className="panel-card">
            <div className="panel-card-title">
              <span>Recent High-Value Closes</span>
              <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>LIVE FEED</span>
            </div>

            <div>
              {recentCloses.slice(0, 3).map((item) => (
                <div key={item.id} className="feed-item">
                  <div className="feed-left">
                    <div className="feed-icon">
                      <TrendingUp size={14} color="#0f172a" />
                    </div>
                    <div>
                      <div className="feed-title">{item.client_name}</div>
                      <div className="feed-sub">{item.rep_name} • Closed today</div>
                    </div>
                  </div>
                  <span className="feed-amount">+${item.actual_value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '12px', justifyContent: 'center', fontSize: '12px' }}
              onClick={() => onNavigateTab('audit')}
            >
              View Audit Log & Historical Closes
            </button>
          </div>

          {/* Target Sync Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot"></span>
              <span style={{ fontWeight: 600 }}>Target Sync Active</span>
            </div>
            <span style={{ color: '#64748b', fontSize: '11px' }}>Salesforce & HubSpot webhooks OK</span>
          </div>
        </div>
      </div>

      {/* Rep Attainment Leaderboard Table */}
      <div className="table-container">
        <div className="table-header-bar">
          <div>
            <h2 className="card-title">Rep Attainment Leaderboard</h2>
            <div className="card-subtitle">Individual quota realization MTD sorted by pacing efficiency</div>
          </div>
          <button className="btn-secondary" style={{ fontSize: '12px' }}>
            Sorted by Attainment
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>SALES REPRESENTATIVE</th>
              <th>TEAM</th>
              <th>QUOTA TARGET</th>
              <th>ACTUAL CLOSED</th>
              <th>ATTAINMENT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {displayedReps.map((rep, idx) => {
              return (
                <tr key={rep.membershipId}>
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {rep.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{rep.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{rep.title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        background: '#f1f5f9',
                        borderRadius: '4px',
                        color: '#475569',
                      }}
                    >
                      {rep.team}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>${rep.quotaTarget.toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>${rep.actualClosed.toLocaleString()}</td>
                  <td style={{ width: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, minWidth: '46px' }}>{rep.attainmentPercent}%</span>
                      <div className="progress-container" style={{ margin: 0 }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(100, rep.attainmentPercent)}%`,
                            background: rep.attainmentPercent >= 100 ? '#10b981' : '#0f172a',
                          }}
                        ></div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          color: rep.delta >= 0 ? '#065f46' : '#991b1b',
                          fontWeight: 600,
                        }}
                      >
                        {rep.delta >= 0 ? `+$${(rep.delta / 1000).toFixed(0)}k` : `-$${(Math.abs(rep.delta) / 1000).toFixed(0)}k`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`kpi-tag ${
                        rep.status === 'Ahead' ? 'green' : rep.status === 'Needs Nudge' ? 'red' : 'green'
                      }`}
                      style={{
                        background: rep.status === 'On Track' ? '#f1f5f9' : undefined,
                        color: rep.status === 'On Track' ? '#0f172a' : undefined,
                        border: rep.status === 'On Track' ? '1px solid #cbd5e1' : undefined,
                      }}
                    >
                      • {rep.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="table-footer">
          <span>Showing {displayedReps.length} of {filteredReps.length} active reps</span>
          <button
            className="table-link"
            style={{ background: 'none', border: 'none' }}
            onClick={() => setShowAllReps(!showAllReps)}
          >
            {showAllReps ? 'Show top 5 reps ↑' : 'View all rep records →'}
          </button>
        </div>
      </div>
    </div>
  );
};
