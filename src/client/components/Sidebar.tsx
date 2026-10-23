import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  FileEdit,
  Users,
  Target,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronDown,
  Building2,
  LogOut,
} from 'lucide-react';
import { Membership, User, Company } from '../types.js';
import { TadmiLogo } from './TadmiLogo.js';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  membership: Membership | null;
  company: Company | null;
  onOpenPersonaModal: () => void;
  onOpenSalesLogger: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  membership,
  company,
  onOpenPersonaModal,
  onOpenSalesLogger,
  onLogout,
}) => {
  return (
    <aside className="sidebar">
      {/* Brand & Workspace Switcher */}
      <div className="sidebar-header">
        <div className="brand-row">
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div className="brand-icon-box" style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TadmiLogo variant="icon" height={18} color="#ffffff" />
            </div>
            <TadmiLogo variant="full" height={18} color="#0f172a" />
          </div>
          <div className="live-badge">
            <span className="pulse-dot"></span>
            <span>Live</span>
          </div>
        </div>

        <button className="workspace-select-btn" onClick={onOpenPersonaModal} title="Switch Workspace / Persona">
          <div className="workspace-left">
            <Building2 size={15} color="#475569" />
            <span>{company?.name || 'Acme Corp'}</span>
          </div>
          <ChevronDown size={14} color="#64748b" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">WORKSPACE</div>

        <button
          className={`nav-link ${currentTab === 'overview' ? 'active' : ''}`}
          onClick={() => onSelectTab('overview')}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button
          className={`nav-link ${currentTab === 'rep-portal' ? 'active' : ''}`}
          onClick={() => onSelectTab('rep-portal')}
        >
          <UserCheck size={16} />
          <span>Sales Rep Portal</span>
        </button>

        <button
          className="nav-link"
          onClick={onOpenSalesLogger}
        >
          <FileEdit size={16} />
          <span>Enter Sales</span>
        </button>

        <button
          className={`nav-link ${currentTab === 'team' ? 'active' : ''}`}
          onClick={() => onSelectTab('team')}
        >
          <Users size={16} />
          <span>Team</span>
        </button>

        <button
          className={`nav-link ${currentTab === 'targets' ? 'active' : ''}`}
          onClick={() => onSelectTab('targets')}
        >
          <Target size={16} />
          <span>Targets</span>
        </button>

        <button
          className={`nav-link ${currentTab === 'reports' ? 'active' : ''}`}
          onClick={() => onSelectTab('reports')}
        >
          <BarChart3 size={16} />
          <span>Reports</span>
        </button>

        <div className="nav-group-title" style={{ marginTop: '16px' }}>SYSTEM</div>

        <button
          className={`nav-link ${currentTab === 'audit' ? 'active' : ''}`}
          onClick={() => onSelectTab('audit')}
        >
          <ShieldAlert size={16} />
          <span>Audit Log</span>
        </button>

        <button
          className={`nav-link ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="profile-left" onClick={onOpenPersonaModal} title="Click to switch persona context" style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar">
              {user?.avatarInitials || 'AM'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.displayName || 'Alex Mercer'}</span>
              <span className="profile-role">
                {membership?.role === 'admin' ? 'Exec / Admin' : membership?.title || 'Sales Representative'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLogout?.();
            }}
            title="Sign out of TADMI"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              color: '#94a3b8',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
