import React, { useState } from 'react';
import { Input, Button } from '../components/UI/Components';
import { IconUser, IconLock, IconMail, IconArrowRight, IconKey } from '../components/UI/Icons';
import { DesignTokens } from '../tokens';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('inspector');
  const [password, setPassword] = useState('admin123');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!email) {
          setError('Email address is required for registration.');
          setLoading(false);
          return;
        }
        await register({
          username,
          password,
          email,
          full_name: fullName || username,
          role: 'inspector'
        });
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIsRegister(false);
    setUsername('inspector');
    setPassword('admin123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: DesignTokens.colors.canvas,
      padding: '24px 16px',
      fontFamily: DesignTokens.typography.sans
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: DesignTokens.colors.pastelGreen.bg,
            color: DesignTokens.colors.pastelGreen.text,
            border: `1px solid ${DesignTokens.colors.pastelGreen.border}`,
            padding: '4px 10px',
            borderRadius: DesignTokens.radius.pill,
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: DesignTokens.colors.pastelGreen.text }} />
            Autonomous Inspection Platform
          </div>
          <h1 style={{
            fontFamily: DesignTokens.typography.serif,
            color: DesignTokens.colors.textPrimary,
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
            lineHeight: 1.2
          }}>
            Rover Console Access
          </h1>
          <p style={{
            color: DesignTokens.colors.textSecondary,
            fontSize: '13px',
            margin: 0,
            lineHeight: 1.5
          }}>
            Sign in to access structural telemetry, crack metrology, and health prognosis.
          </p>
        </div>

        {/* Auth Card */}
        <div style={{
          background: DesignTokens.colors.surface,
          border: `1px solid ${DesignTokens.colors.border}`,
          borderRadius: DesignTokens.radius.lg,
          padding: '28px',
          boxShadow: DesignTokens.shadow.subtle
        }}>
          {/* Segmented Switcher */}
          <div style={{
            display: 'flex',
            background: DesignTokens.colors.surfaceAlt,
            padding: '3px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                background: !isRegister ? DesignTokens.colors.surface : 'transparent',
                color: !isRegister ? DesignTokens.colors.textPrimary : DesignTokens.colors.textSecondary,
                boxShadow: !isRegister ? DesignTokens.shadow.subtle : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                background: isRegister ? DesignTokens.colors.surface : 'transparent',
                color: isRegister ? DesignTokens.colors.textPrimary : DesignTokens.colors.textSecondary,
                boxShadow: isRegister ? DesignTokens.shadow.subtle : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Register Inspector
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: `1px solid ${DesignTokens.colors.pastelRed.border}`,
              background: DesignTokens.colors.pastelRed.bg,
              color: DesignTokens.colors.pastelRed.text,
              fontSize: '12px',
              lineHeight: 1.5,
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. inspector"
            />

            {isRegister && (
              <>
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jeeva"
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@inspection-rover.org"
                />
              </>
            )}

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <span>{isRegister ? 'Create Inspector Account' : 'Sign In to Console'}</span>
              <IconArrowRight size={15} />
            </Button>
          </form>

          {!isRegister && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${DesignTokens.colors.border}`, textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleFillDemo}
                style={{
                  fontSize: '12px',
                  color: DesignTokens.colors.textSecondary,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => e.target.style.color = DesignTokens.colors.textPrimary}
                onMouseOut={(e) => e.target.style.color = DesignTokens.colors.textSecondary}
              >
                <IconKey size={13} />
                <span>Autofill demo credentials (<strong style={{ fontFamily: DesignTokens.typography.mono, fontWeight: 600 }}>inspector / admin123</strong>)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: DesignTokens.colors.textMuted }}>
          Certified Non-Destructive Testing (NDT) &middot; OpenCV Metrology
        </div>
      </div>
    </div>
  );
};
