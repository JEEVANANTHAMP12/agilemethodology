import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DesignTokens } from './tokens';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: DesignTokens.colors.canvas,
        color: DesignTokens.colors.textPrimary,
        fontFamily: DesignTokens.typography.sans
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: 32,
            height: 32,
            border: `2px solid ${DesignTokens.colors.border}`,
            borderTopColor: DesignTokens.colors.textPrimary,
            borderRadius: '50%',
            margin: '0 auto 14px'
          }} />
          <div style={{ fontSize: '13px', color: DesignTokens.colors.textSecondary, fontWeight: 500 }}>
            Initializing Autonomous Inspection System...
          </div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
