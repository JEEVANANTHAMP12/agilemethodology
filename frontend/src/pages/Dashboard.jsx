import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import { TopCards } from '../components/TopCards';
import { LiveInspection } from '../components/LiveInspection';
import { CrackAnalysis } from '../components/CrackAnalysis';
import { HealthAndReportsView } from '../components/HealthAndReportsView';
import {
  Alert,
  Button,
  Spinner,
  useTheme,
  useToast,
} from '../ui';
import {
  Bot,
  Crosshair,
  Activity,
  Cpu,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';

const ScalaStreamView = lazy(() => import('../components/ScalaStreamView').then(m => ({ default: m.ScalaStreamView })));

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
  const toast = useToast();

  const fetchOverview = useCallback(
    async (showSyncIndicator = false) => {
      if (showSyncIndicator) setIsSyncing(true);
      try {
        const data = await api.dashboard.getOverview();
        setDashboardData(data);
        setLastSyncTime(new Date().toLocaleTimeString());

        const currentInspId = data?.live_inspection?.inspection_id;
        if (prevInspectionIdRef.current && currentInspId && currentInspId !== prevInspectionIdRef.current) {
          const primarySeverity = data?.crack_analysis?.primary_severity || 'INSPECTED';
          setRealtimeNotification(
            `New inspection synced: ${primarySeverity} crack profile registered · SHI ${data?.top_cards?.health_index || 0} pts`
          );
          window.setTimeout(() => setRealtimeNotification(null), 5000);
        }
        prevInspectionIdRef.current = currentInspId;
      } catch (err) {
        console.error('Failed to query real-time dashboard telemetry:', err);
        if (showSyncIndicator) {
          toast.error(err.message || 'Unable to reach the inspection API.', { title: 'Telemetry unavailable' });
        }
      } finally {
        setLoading(false);
        if (showSyncIndicator) {
          window.setTimeout(() => setIsSyncing(false), 300);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOverview(false);
    }, 0);

    if (pollingRate <= 0) {
      return () => clearTimeout(timer);
    }

    const interval = window.setInterval(() => {
      fetchOverview(false);
    }, pollingRate);

    return () => {
      clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [fetchOverview, pollingRate]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash === 'scala' || hash === 'scala-stream') {
        setActiveTab('scala_stream');
      } else if (hash === 'inspection') {
        setActiveTab('inspection');
      } else if (hash === 'health' || hash === 'health-reports') {
        setActiveTab('health_reports');
      } else if (hash === 'live') {
        setActiveTab('live');
      }
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
      toast.success('Synthetic HIGH-severity scan registered.', { title: 'Simulation complete' });
    } catch (err) {
      toast.error(err.message || 'The simulation could not be started.', { title: 'Simulation failed' });
    } finally {
      setDemoRunning(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="ui-app dash-loading">
        <Spinner size="lg" />
        <div>
          <div className="dash-loading__title">Synchronizing autonomous crawler telemetry</div>
          <div className="dash-loading__subtitle">Loading vision models and structural records…</div>
        </div>
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
    { id: 'live', label: 'Live', icon: <Bot size={15} /> },
    { id: 'inspection', label: 'Inspection', icon: <Crosshair size={15} /> },
    {
      id: 'health_reports',
      label: 'Health & Reports',
      icon: <Activity size={15} />,
      badge: unackAlertsCount > 0 ? unackAlertsCount : null,
    },
    {
      id: 'scala_pipeline',
      label: 'Scala Pipeline',
      icon: <Cpu size={15} />,
    },
  ];

  return (
    <div className="ui-app dash">
      {/* 1. Slim, Elegant Navbar */}
      <Navbar
        roverStatus={top_cards.rover_status}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          if (tabId === 'scala_pipeline') {
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

      <main className="ui-main dash__main">
        {realtimeNotification && (
          <Alert variant="success" title="Telemetry updated" className="dash__notification">
            <div className="dash__notification-row">
              <span>{realtimeNotification}</span>
              <button
                type="button"
                className="dash__notification-close"
                onClick={() => setRealtimeNotification(null)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </Alert>
        )}

        {/* 2. 1 Slim Breadcrumb Header (< 44px) */}
        <section className="dash-breadcrumb" aria-label="Current facade context">
          <div className="dash-breadcrumb__left">
            <span className="dash-breadcrumb__structure">
              {live_inspection.wall_name || 'North Bearing Facade'}
            </span>
            <ChevronRight size={13} className="dash-breadcrumb__chevron" />
            <span className="dash-breadcrumb__spec">C35 Concrete · Standoff 250mm · 2.50 px/mm</span>
            <span className="dash-breadcrumb__divider">|</span>
            <span className="dash-breadcrumb__crawler">
              <span className="ui-live-dot" />
              <span>ROVER-01 · {top_cards.rover_status === 'CONNECTED' ? 'Active' : top_cards.rover_status}</span>
            </span>
          </div>

          <div className="dash-breadcrumb__right">
            <Button
              variant="secondary"
              size="sm"
              loading={demoRunning}
              icon={<Cpu size={13} />}
              onClick={handleQuickDemoScan}
            >
              Simulate Scan
            </Button>

            <button
              type="button"
              className="dash-breadcrumb__rate-btn"
              onClick={() => setPollingRate(prev => (prev === 3000 ? 1000 : prev === 1000 ? 5000 : prev === 5000 ? 0 : 3000))}
              title="Click to toggle telemetry polling cadence"
            >
              Cadence: {pollingRate === 0 ? 'Paused' : `${pollingRate / 1000}s`}
            </button>

            <a
              href="#/scala"
              className="dash-breadcrumb__rate-btn"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Open dedicated Scala 3 / Apache Pekko live stream engine console"
            >
              <Cpu size={12} />
              <span>Scala Engine (8090)</span>
            </a>

            {lastSyncTime && (
              <span className="dash-breadcrumb__sync">
                Synced {lastSyncTime}
              </span>
            )}
          </div>
        </section>

        {/* 3. 1 Slim Metric Bar (< 70px) */}
        <TopCards data={top_cards} crackData={crack_analysis} />

        {/* 4. Tab Workspace Content */}
        <div key={activeTab} className="tab-content-enter dash-workspace">
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
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Scala Stream Engine…</div>}>
              <ScalaStreamView
                onActionComplete={() => fetchOverview(true)}
              />
            </Suspense>
          )}
        </div>
      </main>

      <footer className="ui-footer">
        <div className="ui-footer__inner">
          <span>Agile Rover · Autonomous Structural Intelligence &amp; Metrology</span>
          <span className="dash__footer-right">
            <a href="#/scala">Scala Stream</a>
            <a href="#/ui-kit">UI Kit</a>
            <span>ISO 1920 / ACI 224R Compliant</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
