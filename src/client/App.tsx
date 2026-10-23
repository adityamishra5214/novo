import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { SalesLoggerModal } from './components/SalesLoggerModal.js';
import { InviteRepModal } from './components/InviteRepModal.js';
import { ManageQuotasModal } from './components/ManageQuotasModal.js';
import { ExecutiveOverview } from './pages/ExecutiveOverview.js';
import { SalesRepPortal } from './pages/SalesRepPortal.js';
import { TeamPage } from './pages/TeamPage.js';
import { TargetsPage } from './pages/TargetsPage.js';
import { AuditLogPage } from './pages/AuditLogPage.js';
import { AuthPage } from './pages/AuthPage.js';
import { User, Membership, Company, PersonaOption } from './types.js';
import { fetchMe, logout, switchMembershipContext, setActiveMembershipId } from './api.js';
import { TadmiLogo } from './components/TadmiLogo.js';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [availablePersonas, setAvailablePersonas] = useState<PersonaOption[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Modals
  const [isSalesLoggerOpen, setIsSalesLoggerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isQuotasModalOpen, setIsQuotasModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadIdentity = async () => {
    try {
      const data = await fetchMe();
      setUser(data.user);
      setMembership(data.membership);
      setCompany(data.company);
      setAvailablePersonas(data.availableMemberships);
    } catch (err) {
      setUser(null);
      setMembership(null);
      setCompany(null);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    loadIdentity();
  }, []);

  // Global Keyboard Shortcuts (⌘ + L for Sales Logger, ⌘ + K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsSalesLoggerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSwitchPersona = async (membershipId: string) => {
    await switchMembershipContext(membershipId);
    await loadIdentity();
    showToast(`Switched active persona context.`);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setMembership(null);
    setCompany(null);
    showToast('Signed out of TADMI.');
  };

  const workspaceId = company?.id || 'company_acme';

  // Splash loading screen while checking initial session cookie
  if (isInitializing) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', background: '#09090b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <TadmiLogo variant="icon" height={22} color="#ffffff" />
          </div>
          <TadmiLogo variant="full" height={20} color="#09090b" />
          <span style={{ fontSize: '12px', color: '#71717a', marginTop: '-4px' }}>Loading workspace...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Sign in / Sign up page
  if (!user) {
    return <AuthPage onSuccess={loadIdentity} />;
  }

  return (
    <div className="app-container">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        membership={membership}
        company={company}
        onOpenPersonaModal={() => handleSwitchPersona(membership?.id === 'mem_alex' ? 'mem_sarah' : 'mem_alex')}
        onOpenSalesLogger={() => setIsSalesLoggerOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          currentTab={currentTab}
          user={user}
          membership={membership}
          availablePersonas={availablePersonas}
          onSwitchPersona={handleSwitchPersona}
          onOpenSalesLogger={() => setIsSalesLoggerOpen(true)}
        />

        {/* Tab views */}
        <main>
          {currentTab === 'overview' && (
            <ExecutiveOverview
              key={`${workspaceId}_${membership?.id}`}
              workspaceId={workspaceId}
              onOpenSalesLogger={() => setIsSalesLoggerOpen(true)}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onOpenQuotasModal={() => setIsQuotasModalOpen(true)}
              onNavigateTab={setCurrentTab}
              onToast={showToast}
            />
          )}

          {currentTab === 'rep-portal' && (
            <SalesRepPortal
              key={`${workspaceId}_${membership?.id}`}
              workspaceId={workspaceId}
              membershipId={membership?.id}
              onOpenSalesLogger={() => setIsSalesLoggerOpen(true)}
              onToast={showToast}
            />
          )}

          {currentTab === 'team' && (
            <TeamPage
              workspaceId={workspaceId}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
            />
          )}

          {currentTab === 'targets' && (
            <TargetsPage
              workspaceId={workspaceId}
              onOpenQuotasModal={() => setIsQuotasModalOpen(true)}
            />
          )}

          {currentTab === 'reports' && (
            <ExecutiveOverview
              key={`reports_${workspaceId}_${membership?.id}`}
              workspaceId={workspaceId}
              onOpenSalesLogger={() => setIsSalesLoggerOpen(true)}
              onOpenInviteModal={() => setIsInviteModalOpen(true)}
              onOpenQuotasModal={() => setIsQuotasModalOpen(true)}
              onNavigateTab={setCurrentTab}
              onToast={showToast}
            />
          )}

          {currentTab === 'audit' && (
            <AuditLogPage workspaceId={workspaceId} />
          )}

          {currentTab === 'settings' && (
            <div className="page-container">
              <h1 className="page-title">Workspace Settings</h1>
              <div style={{ marginTop: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Company Configuration</h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Workspace: <strong>{company?.name}</strong> • Timezone: <strong>{company?.timezone}</strong> • Status: <strong>{company?.status}</strong>
                </p>
                <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#334155' }}>
                  Business dates are evaluated relative to {company?.timezone}. Sales cutoff auto-locks at 18:00 EST.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <SalesLoggerModal
        workspaceId={workspaceId}
        isOpen={isSalesLoggerOpen}
        onClose={() => setIsSalesLoggerOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          // Trigger re-render
          loadIdentity();
        }}
      />

      <InviteRepModal
        workspaceId={workspaceId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={showToast}
      />

      <ManageQuotasModal
        workspaceId={workspaceId}
        isOpen={isQuotasModalOpen}
        onClose={() => setIsQuotasModalOpen(false)}
        onSuccess={showToast}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
