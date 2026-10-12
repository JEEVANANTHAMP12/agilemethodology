import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { TopCards } from '../components/TopCards';
import { LiveInspection } from '../components/LiveInspection';
import { CrackAnalysis } from '../components/CrackAnalysis';
import { HealthAnalysis } from '../components/HealthAnalysis';
import { PredictionView } from '../components/PredictionView';
import { AlertsView } from '../components/AlertsView';
import { ReportsView } from '../components/ReportsView';
import { Button } from '../components/UI/Components';
import {
  IconRover,
  IconCrosshair,
  IconActivity,
  IconClock,
  IconAlert,
  IconFileText,
  IconRefresh,
  IconPrinter
} from '../components/UI/Icons';
import { DesignTokens } from '../tokens';
import { api } from '../services/api';

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inspection');

  const fetchOverview = async () => {
    try {
      const data = await api.dashboard.getOverview();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to query dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenReport = () => {
    if (!dashboardData?.live_inspection?.inspection_id) return;
    const url = api.reports.getHtmlUrl(dashboardData.live_inspection.inspection_id);
    window.open(url, '_blank');
  };

  if (loading && !dashboardData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: DesignTokens.colors.canvas,
        color: DesignTokens.colors.textPrimary,
        fontFamily: DesignTokens.typography.sans
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: DesignTokens.colors.textSecondary,
          marginBottom: '16px'
        }}>
          Synchronizing rover telemetry and computer vision models...
        </div>
        <div className="spinner" style={{
          width: 28,
          height: 28,
          border: `2px solid ${DesignTokens.colors.border}`,
          borderTopColor: DesignTokens.colors.textPrimary,
          borderRadius: '50%'
        }} />
      </div>
    );
  }

  const {
    top_cards = {},
    live_inspection = {},
    crack_analysis = {},
    health_analysis = {},
    prediction = {},
    alerts = []
  } = dashboardData || {};

  const unackAlertsCount = alerts.filter(a => !a.is_acknowledged).length;

  const tabs = [
    { id: 'inspection', label: 'Live Inspection', icon: <IconRover size={15} /> },
    { id: 'cracks', label: 'Crack Metrology', icon: <IconCrosshair size={15} /> },
    { id: 'health', label: 'Structural Health (SHI)', icon: <IconActivity size={15} /> },
    { id: 'prediction', label: 'RUL Prognosis', icon: <IconClock size={15} /> },
    { id: 'alerts', label: 'Hazards & Alerts', icon: <IconAlert size={15} />, badge: unackAlertsCount > 0 ? unackAlertsCount : null },
    { id: 'reports', label: 'Dossier Reports', icon: <IconFileText size={15} /> }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: DesignTokens.colors.canvas,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: DesignTokens.typography.sans,
      color: DesignTokens.colors.textPrimary
    }}>
      <Navbar
        roverStatus={top_cards.rover_status}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSync={fetchOverview}
        onOpenReport={handleOpenReport}
        hasReport={Boolean(live_inspection?.inspection_id)}
      />

      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '68px 24px 48px',
        flex: 1
      }}>
        {/* Editorial Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '24px',
          borderBottom: `1px solid ${DesignTokens.colors.border}`,
          paddingBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: DesignTokens.colors.textSecondary,
              marginBottom: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: DesignTokens.colors.pastelGreen.text }} />
              Active Inspection Sector &middot; North Facade Wall 01
            </div>
            <h1 style={{
              fontFamily: DesignTokens.typography.serif,
              fontSize: '26px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              margin: '0 0 4px 0',
              color: DesignTokens.colors.textPrimary,
              lineHeight: 1.2
            }}>
              Structural Health &amp; Remaining Useful Life Console
            </h1>
            <div style={{
              fontSize: '12px',
              color: DesignTokens.colors.textSecondary,
              fontFamily: DesignTokens.typography.sans
            }}>
              C40/50 Reinforced Concrete &middot; Sensor Standoff: 250 mm &middot; Camera Resolution: 1920&times;1080 px
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOverview}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconRefresh size={14} />
              <span>Sync Telemetry</span>
            </Button>

            {live_inspection.inspection_id && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenReport}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <IconPrinter size={14} />
                <span>View Certified Dossier</span>
              </Button>
            )}
          </div>
        </div>

        {/* 1. TOP CARDS */}
        <TopCards data={top_cards} />

        {/* Active Module Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          borderBottom: `1px solid ${DesignTokens.colors.border}`,
          paddingBottom: '12px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: DesignTokens.colors.textSecondary
            }}>
              Active Module
            </span>
            <span style={{ color: DesignTokens.colors.border }}>/</span>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: DesignTokens.colors.textPrimary,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {tabs.find(t => t.id === activeTab)?.icon}
              {tabs.find(t => t.id === activeTab)?.label}
            </span>
          </div>

          <div style={{
            fontSize: '12px',
            color: DesignTokens.colors.textSecondary
          }}>
            {activeTab === 'inspection' && 'Real-time telemetry stream & optical feed'}
            {activeTab === 'cracks' && 'OpenCV contour segmentation & mm metrology'}
            {activeTab === 'health' && 'Multi-parameter SHI composite evaluation'}
            {activeTab === 'prediction' && 'Prognostic degradation & RUL forecasting'}
            {activeTab === 'alerts' && 'Critical safety threshold notifications'}
            {activeTab === 'reports' && 'Certified inspection dossiers & export'}
          </div>
        </div>

        {/* 2. TAB WORKFLOW CONTENT */}
        <div key={activeTab} className="tab-content-enter">
          {activeTab === 'inspection' && (
            <LiveInspection
              inspectionData={live_inspection}
              roverData={top_cards}
              onActionComplete={fetchOverview}
            />
          )}

          {activeTab === 'cracks' && (
            <CrackAnalysis crackData={crack_analysis} />
          )}

          {activeTab === 'health' && (
            <HealthAnalysis healthData={health_analysis} />
          )}

          {activeTab === 'prediction' && (
            <PredictionView predictionData={prediction} />
          )}

          {activeTab === 'alerts' && (
            <AlertsView alerts={alerts} onAlertAcknowledged={fetchOverview} />
          )}

          {activeTab === 'reports' && (
            <ReportsView inspectionId={live_inspection.inspection_id} />
          )}
        </div>
      </main>

      <footer style={{
        padding: '16px 24px',
        fontSize: '11px',
        color: DesignTokens.colors.textMuted,
        borderTop: `1px solid ${DesignTokens.colors.border}`,
        background: DesignTokens.colors.surface,
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span>Autonomous Crawler Inspection System &middot; Sub-Pixel Crack Profiling &middot; Structural Health Assessment</span>
        <span>ISO 1920 / ACI 224R Compliance &middot; Certified NDT Telemetry</span>
      </footer>
    </div>
  );
};
