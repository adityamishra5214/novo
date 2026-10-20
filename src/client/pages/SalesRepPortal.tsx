import React, { useState, useEffect } from 'react';
import {
  Download,
  Plus,
  TrendingUp,
  CheckCircle2,
  Circle,
  Zap,
  MoreHorizontal,
  Lightbulb,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { RepPortalData } from '../types.js';
import { fetchRepPortal, confirmSalesEntry } from '../api.js';

interface SalesRepPortalProps {
  workspaceId: string;
  membershipId?: string;
  onOpenSalesLogger: () => void;
  onToast: (msg: string) => void;
}

export const SalesRepPortal: React.FC<SalesRepPortalProps> = ({
  workspaceId,
  membershipId,
  onOpenSalesLogger,
  onToast,
}) => {
  const [data, setData] = useState<RepPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchRepPortal(workspaceId, membershipId);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load rep portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId, membershipId]);

  const handleResumeDraft = async (draftId: string) => {
    try {
      await confirmSalesEntry(workspaceId, draftId);
      onToast('Draft deal confirmed and committed to live pacing!');
      loadData();
    } catch (err: any) {
      onToast(err.message || 'Failed to confirm draft');
    }
  };

  const handleExportLedger = () => {
    if (!data) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Client,Category,Amount,Status']
        .concat(data.recentEntries.map((e) => `"${e.business_date}","${e.client_name}","${e.deal_category}",${e.actual_value},"${e.status}"`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vantage_My_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('Ledger transactions exported to CSV.');
  };

  if (loading && !data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 12px auto', color: '#64748b' }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Loading representative performance ledger...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="alert-card" style={{ marginTop: '20px' }}>
          <p style={{ color: '#991b1b', fontWeight: 600 }}>Error loading rep portal</p>
          <p style={{ color: '#475569', fontSize: '13px' }}>{error}</p>
          <button className="btn-secondary" onClick={loadData} style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { rep, kpi, chart, pacingSurplus, compliance, pacingTrack, drafts, recentEntries } = data;
  const filteredEntries =
    selectedCategory === 'All Categories'
      ? recentEntries
      : recentEntries.filter((e) => e.deal_category === selectedCategory);

  return (
    <div className="page-container">
      {/* Header Row */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 className="page-title">Good afternoon, {rep.name.split(' ')[0]}</h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#065f46',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              • {rep.territory}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Mid-Market Territory • Current Period: {rep.period} • {rep.remainingBusinessDays} Business Days Remaining
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportLedger}>
            <Download size={14} />
            <span>Export My Ledger</span>
          </button>

          <button className="btn-primary-dark" onClick={onOpenSalesLogger}>
            <Plus size={14} />
            <span>+ Log Today's Sales</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="kpi-grid">
        {/* Card 1: TODAY'S SALES LOGGED */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">TODAY'S SALES LOGGED</span>
            <FileText size={14} color="#64748b" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">${kpi.todaySalesLogged.value.toLocaleString()}</span>
            <span className="kpi-sub-number">/ ${kpi.todaySalesLogged.target.toLocaleString()} target</span>
          </div>
          <div className="progress-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, kpi.todaySalesLogged.percent)}%` }}
            ></div>
          </div>
          <div className="kpi-footer-note" style={{ justifyContent: 'space-between' }}>
            <span>Delta -${Math.abs(kpi.todaySalesLogged.delta).toLocaleString()} • {kpi.todaySalesLogged.note}</span>
            <span style={{ fontWeight: 600 }}>{kpi.todaySalesLogged.percent}%</span>
          </div>
        </div>

        {/* Card 2: MONTH-TO-DATE CLOSED */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">MONTH-TO-DATE CLOSED</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>▦</span>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">${kpi.monthToDateClosed.value.toLocaleString()}</span>
            <span className="kpi-sub-number">/ ${kpi.monthToDateClosed.target.toLocaleString()} goal</span>
          </div>
          <div className="progress-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(100, kpi.monthToDateClosed.percent)}%` }}
            ></div>
          </div>
          <div className="kpi-footer-note" style={{ justifyContent: 'space-between' }}>
            <span>Need ${kpi.monthToDateClosed.needPerDay.toLocaleString()} / day across {kpi.monthToDateClosed.remainingDays} remaining</span>
            <span style={{ fontWeight: 600 }}>{kpi.monthToDateClosed.percent}%</span>
          </div>
        </div>

        {/* Card 3: PROJECTED MONTH-END */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">PROJECTED MONTH-END</span>
            <TrendingUp size={14} color="#10b981" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">${kpi.projectedMonthEnd.value.toLocaleString()}</span>
            <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 600 }}>{kpi.projectedMonthEnd.nominalPercent}</span>
          </div>
          <div className="progress-container">
            <div
              className="progress-bar-fill"
              style={{ width: '100%', background: '#0f172a' }}
            ></div>
          </div>
          <div className="kpi-footer-note" style={{ justifyContent: 'space-between' }}>
            <span>{kpi.projectedMonthEnd.pacingBuffer}</span>
            <span style={{ fontWeight: 600 }}>108.4%</span>
          </div>
        </div>

        {/* Card 4: WIN / ENTRY RATE */}
        <div className="kpi-card">
          <div className="kpi-top-row">
            <span className="kpi-label">WIN / ENTRY RATE</span>
            <CheckCircle2 size={14} color="#0f172a" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">{kpi.winEntryRate.value}</span>
            <span className="kpi-sub-number">{kpi.winEntryRate.label}</span>
          </div>
          <div style={{ height: '6px' }}></div>
          <div className="kpi-footer-note" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
            <span style={{ color: '#065f46', fontWeight: 600 }}>• {kpi.winEntryRate.consecutiveDays} Consecutive Days Recorded</span>
            <span style={{ color: '#64748b', fontSize: '11px' }}>{kpi.winEntryRate.badge}</span>
          </div>
        </div>
      </div>

      {/* Main Two Column Section */}
      <div className="dashboard-columns">
        {/* Left Column: 7-Day Chart & Recent Deal Submissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 7-Day Sales Output vs Quota */}
          <div className="chart-card">
            <div className="card-header-between">
              <div>
                <h2 className="card-title">7-Day Sales Output vs Quota</h2>
                <div className="card-subtitle">{chart.dateRange} • Benchmark Quota: ${(chart.benchmarkQuota / 1000).toFixed(1)}k/day</div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-swatch black"></span>
                  <span>Logged (Daily)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-swatch dashed"></span>
                  <span>Quota (${(chart.benchmarkQuota / 1000).toFixed(1)}k)</span>
                </div>
              </div>
            </div>

            {/* SVG 7-Day Bar Chart */}
            <div className="chart-container" style={{ height: '180px' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 170" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                {/* Horizontal Quota Benchmark Dashed Line ($4,500) */}
                <line x1="20" y1="58" x2="580" y2="58" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="540" y="52" fontSize="10" fill="#64748b" fontWeight="600">$4.5k</text>

                {/* Bars for 7 days */}
                {chart.bars.map((bar, idx) => {
                  const x = 40 + idx * 78;
                  const maxAmt = 6000;
                  const barHeight = (bar.amount / maxAmt) * 110;
                  const y = 140 - barHeight;

                  return (
                    <g key={bar.day}>
                      <rect
                        x={x - 16}
                        y={y}
                        width={32}
                        height={Math.max(2, barHeight)}
                        rx={2}
                        fill={bar.isToday ? '#0f172a' : '#e2e8f0'}
                      />
                      <text
                        x={x}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill={bar.isToday ? '#0f172a' : '#64748b'}
                      >
                        {bar.amount > 0 ? `$${(bar.amount / 1000).toFixed(1)}k` : '$0'}
                      </text>
                      <text
                        x={x}
                        y={156}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={bar.isToday ? '700' : '500'}
                        fill={bar.isToday ? '#0f172a' : '#64748b'}
                      >
                        {bar.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Pacing Surplus & Acceleration Banner */}
            <div
              style={{
                marginTop: '12px',
                padding: '14px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={15} color="#0f172a" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Pacing Surplus & Acceleration</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        background: '#f1f5f9',
                        borderRadius: '4px',
                        color: '#475569',
                        fontWeight: 600,
                      }}
                    >
                      {pacingSurplus.nominalDelta}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    Remaining quota delta is <strong>${pacingSurplus.remainingDelta.toLocaleString()}</strong>. At your current 7-day rolling cadence (${pacingSurplus.rollingCadence.toLocaleString()}/day), you will cross the 100% quota threshold on day {pacingSurplus.thresholdDay} ({pacingSurplus.daysAhead} days ahead of schedule).
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '16px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Est. Q2 Tier</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{pacingSurplus.tier}</div>
              </div>
            </div>
          </div>

          {/* Recent Deal Submissions (Last 5 Days) */}
          <div className="table-container">
            <div className="table-header-bar">
              <div>
                <h2 className="card-title">Recent Deal Submissions</h2>
                <div className="card-subtitle">Last 5 Days</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Filter:</span>
                <select
                  className="btn-secondary"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  <option value="All Categories">All Categories</option>
                  <option value="New ARR">New ARR</option>
                  <option value="Expansion">Expansion</option>
                  <option value="Services">Services</option>
                  <option value="Renewal">Renewal ARR</option>
                </select>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>BUSINESS DATE</th>
                  <th>DEAL & CLIENT</th>
                  <th>CATEGORY</th>
                  <th>LOGGED AMOUNT</th>
                  <th>QUOTA CONTRIB.</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const dayQuotaContrib = Math.round((entry.actual_value / 4500) * 1000) / 10;
                  return (
                    <tr key={entry.id}>
                      <td style={{ color: '#475569', fontSize: '12px' }}>{entry.business_date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{entry.client_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{entry.note || 'Contract #LN-8902 • 24 Mo.'}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                            color: '#334155',
                          }}
                        >
                          {entry.deal_category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>${entry.actual_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '12px' }}>{dayQuotaContrib}% (Day)</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: entry.status === 'Confirmed' ? '#065f46' : '#475569',
                            background: entry.status === 'Confirmed' ? '#ecfdf5' : '#f1f5f9',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            border: `1px solid ${entry.status === 'Confirmed' ? '#a7f3d0' : '#e2e8f0'}`,
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: entry.status === 'Confirmed' ? '#10b981' : '#64748b' }}></span>
                          {entry.status}
                        </span>
                      </td>
                      <td>
                        <button className="icon-btn" style={{ width: '28px', height: '28px' }} aria-label="More actions">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="table-footer">
              <span>Showing {filteredEntries.length} of 24 logged ledger transactions this month</span>
              <a href="#ledger" className="table-link">View Full Ledger →</a>
            </div>
          </div>
        </div>

        {/* Right Column Stack */}
        <div className="side-panel-stack">
          {/* Daily Compliance Card */}
          <div className="panel-card">
            <div className="panel-card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#0f172a" />
                <span>Daily Compliance</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{compliance.time}</span>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, marginBottom: '14px' }}>
              Per Vantage sales policy, all daily closed business must be committed before <strong>6:00 PM EST</strong> to count toward daily bonus pacing.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {compliance.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {item.completed ? (
                    <CheckCircle2 size={16} color="#0f172a" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <Circle size={16} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: item.completed ? '#0f172a' : '#475569' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Pacing Track ($85k Goal) */}
          <div className="panel-card">
            <div className="panel-card-title">
              <span>Monthly Pacing Track</span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>${(pacingTrack.goal / 1000).toFixed(0)}k Goal</span>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
              Current MTD progress against tiered quarterly accelerators:
            </div>

            {/* Stepper Slider */}
            <div style={{ position: 'relative', margin: '20px 4px 20px 4px' }}>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', width: '100%' }}>
                <div style={{ width: '80.5%', height: '100%', background: '#0f172a', borderRadius: '9999px' }}></div>
              </div>
              {/* Slider thumb dot */}
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '80.5%',
                  transform: 'translateX(-50%)',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              ></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '14px' }}>
              <span>$0 (0%)</span>
              <span>$42.5k (50%)</span>
              <span>$63.7k (75%)</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>$85k (100%)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} color="#10b981" />
                  Base Commission (75%)
                </span>
                <span style={{ fontWeight: 600, color: '#065f46' }}>Unlocked</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Circle size={13} color="#64748b" />
                  Quota Target (100%)
                </span>
                <span style={{ fontWeight: 600 }}>$16,600 to go</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Circle size={13} color="#cbd5e1" />
                  Super Accelerator (125%)
                </span>
                <span style={{ color: '#64748b' }}>$106,250</span>
              </div>
            </div>
          </div>

          {/* Deal Log Drafts */}
          <div className="panel-card">
            <div className="panel-card-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} />
                <span>Deal Log Drafts</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  background: '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {drafts.length} Saved
              </span>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
              Incomplete entries are automatically cleared at month end.
            </div>

            {drafts.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                No active drafts.
              </div>
            ) : (
              drafts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{d.client_name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>${d.actual_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                    Type: {d.deal_category} • {d.note}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-primary-dark"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => handleResumeDraft(d.id)}
                    >
                      Resume Log
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => onToast('Draft discarded.')}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Fast Key tip box */}
          <div
            style={{
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Lightbulb size={16} color="#0f172a" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Fast Key: Press <strong>⌘ + L</strong> from anywhere in Vantage to open the instant Sales Logger dialog.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
