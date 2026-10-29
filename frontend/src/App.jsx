import React, { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { UiKit } from './pages/UiKit';
import { ThemeProvider } from './ui/theme/ThemeProvider';
import { ToastProvider } from './ui/feedback/ToastProvider';

function readRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  return hash === 'ui-kit' ? 'ui-kit' : 'dashboard';
}

export default function App() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {route === 'ui-kit' ? <UiKit /> : <Dashboard />}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
