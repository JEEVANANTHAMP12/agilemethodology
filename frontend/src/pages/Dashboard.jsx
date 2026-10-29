import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { TopCards } from '../components/TopCards';
import { LiveInspection } from '../components/LiveInspection';
import { CrackAnalysis } from '../components/CrackAnalysis';
import { HealthAnalysis } from '../components/HealthAnalysis';
import { PredictionView } from '../components/PredictionView';
import { AlertsView } from '../components/AlertsView';
import { ReportsView } from '../components/ReportsView';
import {
  Alert,
  Badge,
  Button,
  PageHeader,
  SegmentedControl,
  Spinner,
  useTheme,
  useToast,
} from '../ui';
import {
  IconRover,
  IconCrosshair,
  IconActivity,
  IconClock,
  IconAlert,
  IconFileText,
  IconRefresh,
  IconPrinter,
  IconCpu,
} from '../components/UI/Icons';
import { api } from '../services/api';
import './Dashboard.css';

const TAB_COPY = {
  inspection: 'Real-time telemetry stream, RF link & crawler teleoperation',
  cracks: 'ML computer vision ensemble, sub-pixel metric profiling & digital microscope',
  health: 'Multi-parameter Structural Health Index decomposition & trend telemetry',
  prediction: 'Prognostic degradation extrapolation, RUL forecasting & lifecycle simulation',
  alerts: 'Critical safety threshold monitoring & engineering intervention triggers',
  reports: 'Certified inspection dossiers & printable photogrammetric records',
};

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('inspection');
  const [pollingRate, setPollingRate] = useState(3000);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [realtimeNotification, setRealtimeNotification] = useState(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevInspectionIdRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const playChirp = useCallback(
    (freq = 880, duration = 0.08) => {
      if (!soundEnabled) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch {
        // AudioContext policy-safe fallback
      }
    },
    [soundEnabled]
  );

  const fetchOverview = useCallback(
    async (showSyncIndicator = false) => {
      if (showSyncIndicator) setIsSyncing(true);
      try {
        const data = await api.dashboard.getOverview();
        setDashboardData(data);
        setLastSyncTime(new Date().toLocaleTimeString());
        playChirp(880, 0.06);

        const currentInspId = data?.live_inspection?.inspection_id;
        if (prevInspectionIdRef.current && currentInspId && currentInspId !== prevInspectionIdRef.current) {
          const primarySeverity = data?.crack_analysis?.primary_severity || 'INSPECTED';
          setRealtimeNotification(
            `Real-time telemetry synced: ${primarySeverity} crack profile registered · SHI ${data?.top_cards?.health_index || 0} pts`
          );
          playChirp(1046, 0.12);
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
    [playChirp, toast]
  );

  useEffect(() => {
    fetchOverview(false);
    if (pollingRate <= 0) return undefined;

    const interval = window.setInterval(() => {
      fetchOverview(false);
    }, pollingRate);

    return () => window.clearInterval(interval);
  }, [fetchOverview, pollingRate]);

  const handleOpenReport = () => {
    if (!dashboardData?.live_inspection?.inspection_id) return;
    const url = api.reports.getHtmlUrl(dashboardData.live_inspection.inspection_id);
    window.open(url, '_blank');
  };

  const handleQuickDemoScan = async () => {
    try {
      setDemoRunning(true);
      playChirp(659, 0.08);
      await api.rover.simulateScan('HIGH');
      await fetchOverview(true);
      playChirp(880, 0.1);
      setActiveTab('cracks');
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
          <div className="dash-loading__subtitle">Loading ML vision models and structural health records…</div>
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
    { id: 'inspection', label: 'Live Inspection', icon: <IconRover size={15} /> },
    { id: 'cracks', label: 'Crack Metrology', icon: <IconCrosshair size={15} /> },
    { id: 'health', label: 'Structural Health', icon: <IconActivity size={15} /> },
    { id: 'prediction', label: 'RUL Prognosis', icon: <IconClock size={15} /> },
    { id: 'alerts', label: 'Hazards & Alerts', icon: <IconAlert size={15} />, badge: unackAlertsCount || null },
    { id: 'reports', label: 'Dossier Reports', icon: <IconFileText size={15} /> },
  ];

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="ui-app dash">
      <Navbar
        roverStatus={top_cards.rover_status}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          playChirp(587, 0.05);
        }}
        onSync={() => {
          playChirp(880, 0.06);
          fetchOverview(true);
        }}
        onOpenReport={handleOpenReport}
        hasReport={Boolean(live_inspection?.inspection_id)}
        theme={theme}
        onToggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      <main className="ui-main dash__main">
        {realtimeNotification && (
          <Alert variant="success" title="New inspection synced" className="dash__notification">
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

        <PageHeader
          eyebrow={
            <>
              <span className="ui-live-dot" />
              <span>
                Autonomous crawler {pollingRate > 0 ? 'active' : 'paused'} · {live_inspection.wall_name || 'North Bearing Facade'}
              </span>
            </>
          }
          title="Autonomous Structural Health & Crack Metrology Platform"
          description={
            <>
              C35/40 high-strength concrete · Optical standoff 250 mm · Vision calibration 2.50 px/mm
              {lastSyncTime ? ` · Last sync ${lastSyncTime}` : ''}
            </>
          }
          actions={
            <div className="dash__toolbar">
              <Button
                variant="secondary"
                size="sm"
                loading={demoRunning}
                icon={<IconCpu size={14} />}
                onClick={handleQuickDemoScan}
              >
                Simulate scan
              </Button>

              <SegmentedControl
                label="Rate"
                ariaLabel="Telemetry polling rate"
                value={pollingRate}
                onChange={(value) => {
                  setPollingRate(value);
                  playChirp(440, 0.04);
                }}
                items={[
                  { id: 1000, label: '1s' },
                  { id: 3000, label: '3s' },
                  { id: 5000, label: '5s' },
                  { id: 0, label: 'Pause' },
                ]}
              />

              <Button
                variant="outline"
                size="sm"
                loading={isSyncing}
                icon={<IconRefresh size={14} />}
                onClick={() => fetchOverview(true)}
              >
                Fetch now
              </Button>

              {live_inspection.inspection_id && (
                <Button variant="primary" size="sm" icon={<IconPrinter size={14} />} onClick={handleOpenReport}>
                  Certified dossier
                </Button>
              )}
            </div>
          }
        />

        <TopCards data={top_cards} />

        <div className="dash__modulebar">
          <div className="dash__module">
            <span className="dash__module-label">Active module</span>
            <span className="dash__module-sep">/</span>
            <span className="dash__module-name">
              {activeTabMeta?.icon}
              {activeTabMeta?.label}
            </span>
            {unackAlertsCount > 0 && (
              <Badge variant="danger" size="sm" dot>
                {unackAlertsCount} open
              </Badge>
            )}
          </div>
          <p className="dash__module-copy">{TAB_COPY[activeTab]}</p>
        </div>

        <div key={activeTab} className="tab-content-enter">
          {activeTab === 'inspection' && (
            <LiveInspection inspectionData={live_inspection} roverData={top_cards} onActionComplete={() => fetchOverview(true)} />
          )}

          {activeTab === 'cracks' && <CrackAnalysis crackData={crack_analysis} onActionComplete={() => fetchOverview(true)} />}

          {activeTab === 'health' && <HealthAnalysis healthData={health_analysis} onActionComplete={() => fetchOverview(true)} />}

          {activeTab === 'prediction' && <PredictionView predictionData={prediction} onActionComplete={() => fetchOverview(true)} />}

          {activeTab === 'alerts' && <AlertsView alerts={alerts} onAlertAcknowledged={() => fetchOverview(true)} />}

          {activeTab === 'reports' && <ReportsView inspectionId={live_inspection.inspection_id} />}
        </div>
      </main>

      <footer className="ui-footer">
        <div className="ui-footer__inner">
          <span>Autonomous Crawler Inspection System · Sub-Pixel Crack Profiling · Structural Health Assessment</span>
          <span className="dash__footer-right">
            <a href="#/ui-kit">UI Kit</a>
            <span>ISO 1920 / ACI 224R Compliance</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
