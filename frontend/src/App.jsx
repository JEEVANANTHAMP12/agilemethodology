import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeProvider';
import { TooltipProvider } from './components/ui/tooltip';
import { Dashboard } from './pages/Dashboard';

const ScalaStreamPage = lazy(() =>
  import('./pages/ScalaStreamPage').then((m) => ({ default: m.ScalaStreamPage }))
);

function readRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash.startsWith('scala')) return 'scala';
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
      <TooltipProvider>
        <AuthProvider>
          {route === 'scala' ? (
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center text-xs text-muted-foreground">
                  Loading Scala Telemetry Stream...
                </div>
              }
            >
              <ScalaStreamPage />
            </Suspense>
          ) : (
            <Dashboard />
          )}
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
