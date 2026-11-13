import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Bot, Crosshair, Activity, Cpu, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';
import { TopCards } from '../components/TopCards';
import { LiveInspection } from '../components/LiveInspection';
import { CrackAnalysis } from '../components/CrackAnalysis';
import { HealthAndReportsView } from '../components/HealthAndReportsView';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { useTheme } from '../context/themeContextDef';
import { api } from '../services/api';

const ScalaStreamPanel = lazy(() =>
  import('../components/ScalaStreamPanel').then((m) => ({ default: m.ScalaStreamPanel }))
);

function getInitialTab() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash === 'scala' || hash === 'scala-stream') return 'scala_stream';
  if (hash === 'inspection') return 'inspection';
  if (hash === 'health' || hash === 'health-reports') return 'health_reports';
  return 'live';
}

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [pollingRate, setPollingRate] = useState(3000);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [realtimeNotification, setRealtimeNotification] = useState(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const prevInspectionIdRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const fetchOverview = useCallback(async (showSyncIndicator = false) => {
    if (showSyncIndicator) setIsSyncing(true);
    try {
      const data = await api.dashboard.getOverview();
      setDashboardData(data);
      setLastSyncTime(new Date().toLocaleTimeString());

      const currentInspId = data?.live_inspection?.inspection_id;
      if (prevInspectionIdRef.current && currentInspId && currentInspId !== prevInspectionIdRef.current) {
        const primarySeverity = data?.crack_analysis?.primary_severity || 'INSPECTED';
        setRealtimeNotification(
          `Inspection synced: ${primarySeverity} profile · SHI ${data?.top_cards?.health_index || 0} pts`
        );
        window.setTimeout(() => setRealtimeNotification(null), 5000);
      }
      prevInspectionIdRef.current = currentInspId;
    } catch (err) {
      if (showSyncIndicator) {
        toast.error(err.message || 'Unable to reach inspection API');
      }
    } finally {
      setLoading(false);
      if (showSyncIndicator) {
        window.setTimeout(() => setIsSyncing(false), 250);
      }
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => fetchOverview(false), 0);
    if (pollingRate <= 0) return () => window.clearTimeout(t);

    const interval = window.setInterval(() => fetchOverview(false), pollingRate);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(interval);
    };
  }, [fetchOverview, pollingRate]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash === 'scala' || hash === 'scala-stream') setActiveTab('scala_stream');
      else if (hash === 'inspection') setActiveTab('inspection');
      else if (hash === 'health' || hash === 'health-reports') setActiveTab('health_reports');
      else if (hash === 'live') setActiveTab('live');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleQuickDemoScan = async () => {
    try {
      setDemoRunning(true);
      await api.rover.simulateScan('HIGH');
      await fetchOverview(true);
      setActiveTab('inspection');
      toast.success('Simulated HIGH-severity inspection scan recorded');
    } catch (err) {
      toast.error(err.message || 'Simulation failed');
    } finally {
      setDemoRunning(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <div className="text-sm font-medium">Loading structural inspection telemetry...</div>
      </div>
    );
  }

  const {
    top_cards = {},
    live_inspection = {},
    crack_analysis = {},
    health_analysis = {},
    prediction = {},
    alerts = [],
  } = dashboardData || {};

  const unackAlertsCount = alerts.filter((a) => !a.is_acknowledged).length;

  const tabs = [
    { id: 'live', label: 'Live', icon: <Bot className="h-3.5 w-3.5" /> },
    { id: 'inspection', label: 'Inspection', icon: <Crosshair className="h-3.5 w-3.5" /> },
    {
      id: 'health_reports',
      label: 'Health & Reports',
      icon: <Activity className="h-3.5 w-3.5" />,
      badge: unackAlertsCount > 0 ? unackAlertsCount : null,
    },
    { id: 'scala_stream', label: 'Scala Stream', icon: <Cpu className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar
        roverStatus={top_cards.rover_status}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          if (tabId === 'scala_stream') {
            window.location.hash = '#/scala';
          } else {
            setActiveTab(tabId);
          }
        }}
        onSync={() => fetchOverview(true)}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-5 sm:px-6">
        {realtimeNotification && (
          <Alert variant="success" className="flex items-center justify-between">
            <div>
              <AlertTitle>Telemetry Updated</AlertTitle>
              <AlertDescription>{realtimeNotification}</AlertDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRealtimeNotification(null)}>
              Dismiss
            </Button>
          </Alert>
        )}

        {/* Context Bar */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{live_inspection.wall_name || 'North Bearing Facade'}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">C35 Concrete · 250mm standoff · 2.50 px/mm</span>
            <span className="hidden text-border sm:inline">|</span>
            <span className="text-muted-foreground">
              ROVER-01 · {top_cards.rover_status === 'CONNECTED' ? 'Active' : top_cards.rover_status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" loading={demoRunning} onClick={handleQuickDemoScan}>
              <Cpu className="h-3.5 w-3.5" />
              <span>Simulate Scan</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPollingRate((prev) => (prev === 3000 ? 1000 : prev === 1000 ? 5000 : prev === 5000 ? 0 : 3000))
              }
            >
              Cadence: {pollingRate === 0 ? 'Paused' : `${pollingRate / 1000}s`}
            </Button>

            <Button variant="outline" size="sm" asChild>
              <a href="#/scala">
                <Cpu className="h-3.5 w-3.5" />
                <span>Scala Console</span>
              </a>
            </Button>

            {lastSyncTime && (
              <span className="font-mono text-[11px] text-muted-foreground">
                Synced {lastSyncTime}
              </span>
            )}
          </div>
        </section>

        {/* KPI Bar */}
        <TopCards data={top_cards} crackData={crack_analysis} />

        {/* Active Workspace */}
        <div>
          {activeTab === 'live' && (
            <LiveInspection
              inspectionData={live_inspection}
              roverData={top_cards}
              onActionComplete={() => fetchOverview(true)}
            />
          )}

          {activeTab === 'inspection' && (
            <CrackAnalysis
              crackData={crack_analysis}
              onActionComplete={() => fetchOverview(true)}
            />
          )}

          {activeTab === 'health_reports' && (
            <HealthAndReportsView
              healthData={health_analysis}
              predictionData={prediction}
              alerts={alerts}
              inspectionId={live_inspection.inspection_id}
              onActionComplete={() => fetchOverview(true)}
            />
          )}

          {activeTab === 'scala_stream' && (
            <Suspense fallback={<div className="py-10 text-center text-xs text-muted-foreground">Loading Scala Stream Engine...</div>}>
              <ScalaStreamPanel onActionComplete={() => fetchOverview(true)} />
            </Suspense>
          )}
        </div>
      </main>

      <footer className="border-t py-4 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
          <span>Agile Rover · Structural Inspection &amp; Metrology</span>
          <div className="flex items-center gap-4">
            <a href="#/scala" className="hover:text-foreground">Scala Stream</a>
            <span>ISO 1920 / ACI 224R</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
