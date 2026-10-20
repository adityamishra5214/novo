import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Plus, ChevronDown, Check } from 'lucide-react';
import { User, Membership, PersonaOption } from '../types.js';

interface NavbarProps {
  currentTab: string;
  user: User | null;
  membership: Membership | null;
  availablePersonas: PersonaOption[];
  onSwitchPersona: (membershipId: string) => void;
  onOpenSalesLogger: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  user,
  membership,
  availablePersonas,
  onSwitchPersona,
  onOpenSalesLogger,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Overview';
      case 'rep-portal':
        return 'Sales Rep Portal';
      case 'team':
        return 'Team Directory';
      case 'targets':
        return 'Targets & Quotas';
      case 'audit':
        return 'Compliance Audit Log';
      case 'reports':
        return 'Performance Reports';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="top-navbar">
      {/* Left: Breadcrumbs */}
      <div className="navbar-left">
        <div className="breadcrumbs">
          <span>Vantage</span>
          <span>/</span>
          <span className="current">{getBreadcrumbTitle()}</span>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="search-bar-container">
        <Search size={15} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search metrics, deals, reps..."
          aria-label="Search metrics, deals, reps"
        />
        <span className="search-badge">⌘K</span>
      </div>

      {/* Right: Actions & User Switcher */}
      <div className="navbar-right">
        {/* Persona Switcher Dropdown for Testing/Reviewing Multi-Tenant Roles */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            style={{ fontSize: '12px', padding: '5px 10px' }}
            title="Switch Persona / Role for demo"
          >
            <span>Role: <strong>{membership?.role?.toUpperCase() || 'ADMIN'}</strong> ({user?.displayName?.split(' ')[0]})</span>
            <ChevronDown size={13} />
          </button>

          {showPersonaMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '260px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                padding: '6px',
                zIndex: 60,
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', padding: '6px 8px' }}>
                SWITCH ACTIVE PERSONA
              </div>
              {availablePersonas.map((p) => {
                const isActive = p.membershipId === membership?.id;
                return (
                  <button
                    key={p.membershipId}
                    onClick={() => {
                      onSwitchPersona(p.membershipId);
                      setShowPersonaMenu(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 8px',
                      borderRadius: '5px',
                      border: 'none',
                      background: isActive ? '#f1f5f9' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                        {p.displayName} {p.membershipId === 'mem_marcus' ? '⚠️ (Pending Rep)' : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {p.title} • {p.companyName}
                      </div>
                    </div>
                    {isActive && <Check size={14} color="#0f172a" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="alert-dot"></span>
          </button>

          {showAlertMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '280px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                padding: '12px',
                zIndex: 60,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991b1b', marginBottom: '4px' }}>
                1 Immediate Attention Alert
              </div>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                <strong>Marcus Vance (MM)</strong> has not logged daily sales today before the 18:00 EST cutoff.
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button className="icon-btn" aria-label="Help">
          <HelpCircle size={16} />
        </button>

        {/* Primary Log Sales Button */}
        <button className="btn-primary-dark" onClick={onOpenSalesLogger}>
          <Plus size={15} />
          <span>Log Sales</span>
        </button>

        {/* User Avatar */}
        <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
          {user?.avatarInitials || 'AM'}
        </div>
      </div>
    </header>
  );
};
