import React, { useEffect, useState, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { ThemeProvider } from './ui/theme/ThemeProvider';
import { ToastProvider } from './ui/feedback/ToastProvider';

const UiKit = lazy(() => import('./pages/UiKit').then(m => ({ default: m.UiKit })));
const ScalaPipelinePage = lazy(() => import('./pages/ScalaPipelinePage').then(m => ({ default: m.ScalaPipelinePage })));

function readRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash === 'ui-kit') return 'ui-kit';
  if (hash === 'scala' || hash === 'scala-stream') return 'scala';
  return 'dashboard';
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
          {route === 'ui-kit' ? (
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading UI Kit...</div>}>
              <UiKit />
            </Suspense>
          ) : route === 'scala' ? (
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Scala Stream Pipeline...</div>}>
              <ScalaPipelinePage />
            </Suspense>
          ) : (
            <Dashboard />
          )}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
