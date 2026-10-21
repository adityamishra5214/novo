import React, { useState } from 'react';
import { login, register, ApiError } from '../api.js';
import { User } from '../types.js';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password, remember });
      } else {
        await register({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          companyName: companyName.trim(),
        });
      }
      onSuccess();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  const handleSSO = (provider: string) => {
    setError(`Single Sign-On with ${provider} requires workspace domain configuration. Please sign in with your work email credentials or choose a demo account.`);
  };

  return (
    <div className="auth-layout">
      {/* Top Navigation */}
      <header className="auth-top-nav">
        <div className="auth-brand">
          <svg className="auth-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>Vantage</span>
        </div>
        <div className="auth-env-badge">
          <span className="dot" />
          <span>PRODUCTION ENV</span>
        </div>
      </header>

      {/* Main Centered Auth Form */}
      <main className="auth-main">
        <div className="auth-card-wrapper">
          {/* Brand Logo Badge */}
          <div className="auth-logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>

          <h1 className="auth-title">
            {mode === 'login' ? 'Sign in to Vantage' : 'Create your Vantage account'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Enter your work email to access your sales workspace.'
              : 'Launch your high-velocity sales quota and performance workspace.'}
          </p>

          <div className="auth-card">
            {error && (
              <div className="auth-error-banner" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="register-name">Full Name</label>
                    <input
                      id="register-name"
                      className="auth-input"
                      type="text"
                      placeholder="e.g. Alex Mercer"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label" htmlFor="register-company">Company Name</label>
                    <input
                      id="register-company"
                      className="auth-input"
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="auth-field">
                <label className="auth-label" htmlFor="work-email">Work Email</label>
                <input
                  id="work-email"
                  className="auth-input"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={mode === 'login'}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label" htmlFor="work-password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="auth-link"
                      onClick={() => setError('Password reset instructions have been sent to your administrator.')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-password-wrapper">
                  <input
                    id="work-password"
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === 'register' ? 8 : 1}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div className="auth-remember-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      style={{ accentColor: '#09090b' }}
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="auth-remember-badge">30 days</span>
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'login'
                    ? 'Sign in to Workspace'
                    : 'Create Workspace & Account'}
                </span>
                <span style={{ fontSize: '15px' }}>↵</span>
              </button>

              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>

              <button
                type="button"
                className="auth-sso-btn"
                onClick={() => handleSSO('Google Workspace')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Workspace</span>
              </button>

              <button
                type="button"
                className="auth-sso-btn"
                onClick={() => handleSSO('SAML / Okta')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Sign in with SAML / Okta</span>
              </button>
            </form>
          </div>

          {/* Under card note */}
          <div className="auth-security-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>256-bit encrypted · SOC-2 Type II Certified</span>
          </div>

          <div className="auth-toggle-note">
            {mode === 'login' ? (
              <>
                New to Vantage?{' '}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Quick Demo Accounts Drawer */}
          <div className="auth-demo-picker">
            <div className="auth-demo-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Quick Demo Accounts (Password: <code>password123</code>)</span>
            </div>
            <div className="auth-demo-btns">
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('alex@acme.corp')}
                title="Admin / Executive Overview"
              >
                Alex Mercer (Admin)
              </button>
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('sarah@acme.corp')}
                title="Sales Manager"
              >
                Sarah Kim (Manager)
              </button>
              <button
                type="button"
                className="auth-demo-chip"
                onClick={() => handleQuickDemo('priya@acme.corp')}
                title="Account Executive"
              >
                Priya Singh (AE)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="auth-bottom-footer">
        <div>© 2025 Vantage Technologies Inc. Encrypted SOC-2 Type II.</div>
        <div className="auth-bottom-links">
          <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="#status" onClick={(e) => e.preventDefault()}>Status</a>
          <a href="#support" onClick={(e) => e.preventDefault()}>Support</a>
        </div>
      </footer>
    </div>
  );
};
