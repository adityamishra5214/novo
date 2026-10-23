import React, { useState } from 'react';
import { login, register, ApiError } from '../api.js';
import { User } from '../types.js';
import { TadmiLogo } from '../components/TadmiLogo.js';

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


  return (
    <div className="auth-layout">
      {/* Top Navigation */}
      <header className="auth-top-nav">
        <div className="auth-brand">
          <TadmiLogo variant="full" height={24} color="#09090b" />
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
            <TadmiLogo variant="icon" height={24} color="#ffffff" />
          </div>

          <h1 className="auth-title">
            {mode === 'login' ? 'Sign in to TADMI' : 'Create your TADMI account'}
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
                New to TADMI?{' '}
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

        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="auth-bottom-footer">
        <div>© 2025 TADMI Inc. Encrypted SOC-2 Type II.</div>
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
