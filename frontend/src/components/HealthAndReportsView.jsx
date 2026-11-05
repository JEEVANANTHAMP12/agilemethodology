import React, { useState } from 'react';
import { Card, Badge, Button } from '../ui';
import {
  Activity,
  Clock,
  AlertTriangle,
  FileText,
  Printer,
  Sliders,
  TrendingDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAnimatedNumber } from './UI/useAnimatedNumber';
import { ShiTrendAreaChart, DegradationRadarChart, RulPrognosticComposedChart } from '../ui';
import { WhatIfScenarioSimulator } from './WhatIfScenarioSimulator';
import { AlertsView } from './AlertsView';
import { ReportsView } from './ReportsView';
import { api } from '../services/api';

export const HealthAndReportsView = ({
  healthData = {},
  predictionData = {},
  alerts = [],
  inspectionId = null,
  onActionComplete = () => {}
}) => {
  const [subSection, setSubSection] = useState('overview'); // 'overview' | 'alerts' | 'reports'
  const [showSimulator, setShowSimulator] = useState(false);
  const [chartMode, setChartMode] = useState('forecast'); // 'forecast' | 'history' | 'radar'

  const {
    shi_score = 82.0,
    health_status = 'HEALTHY',
    crack_penalty = 10.5,
    age_penalty = 4.2,
    env_penalty = 3.3,
    historical_trend = []
  } = healthData;

  const {
    estimated_rul_years = 18.5,
    risk_level = 'Low',
    deterioration_trend = 'Stable'
  } = predictionData;

  const unackAlerts = alerts.filter(a => !a.is_acknowledged).length;

  const animatedShi = useAnimatedNumber(shi_score, 800, 1);
  const animatedCrackPenalty = useAnimatedNumber(crack_penalty, 800, 1);
  const animatedAgePenalty = useAnimatedNumber(age_penalty, 800, 1);
  const animatedEnvPenalty = useAnimatedNumber(env_penalty, 800, 1);
  const animatedRul = useAnimatedNumber(estimated_rul_years, 800, 1);

  const getStatusBadgeVariant = (status = health_status) => {
    if (status === 'CRITICAL') return 'danger';
    if (status !== 'HEALTHY') return 'warning';
    return 'success';
  };

  const getRiskBadgeVariant = (risk = risk_level) => {
    if (risk === 'Critical') return 'danger';
    if (risk === 'High' || risk === 'Moderate') return 'warning';
    return 'success';
  };

  // Printable certified dossier trigger
  const handleOpenReport = () => {
    if (!inspectionId) return;
    const url = api.reports.getHtmlUrl(inspectionId);
    window.open(url, '_blank');
  };

  return (
    <div className="health-reports-view">
      {/* Sub-navigation pills */}
      <div className="health-reports__subnav">
        <div className="health-reports__tabs">
          <button
            type="button"
            className={`health-reports__tab ${subSection === 'overview' ? 'is-active' : ''}`}
            onClick={() => setSubSection('overview')}
          >
            <Activity size={14} />
            <span>Structural Integrity &amp; Prognosis</span>
          </button>

          <button
            type="button"
            className={`health-reports__tab ${subSection === 'alerts' ? 'is-active' : ''}`}
            onClick={() => setSubSection('alerts')}
          >
            <AlertTriangle size={14} />
            <span>Safety Alerts</span>
            {unackAlerts > 0 && <span className="health-reports__badge">{unackAlerts}</span>}
          </button>

          <button
            type="button"
            className={`health-reports__tab ${subSection === 'reports' ? 'is-active' : ''}`}
            onClick={() => setSubSection('reports')}
          >
            <FileText size={14} />
            <span>Certified Dossiers</span>
          </button>
        </div>

        {inspectionId && (
          <Button
            variant="outline"
            size="sm"
            icon={<Printer size={13} />}
            onClick={handleOpenReport}
          >
            Print Dossier
          </Button>
        )}
      </div>

      {/* 1. Structural Integrity & Prognosis Overview */}
      {subSection === 'overview' && (
        <div className="health-overview ui-animate-rise">
          {/* Executive Integrity Decomposition Card */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} />
                <span>Structural Health Index (SHI) Decomposition</span>
              </div>
            }
            subtitle="Multi-parameter normalized structural integrity model & ACI degradation telemetry"
            tag={<Badge variant={getStatusBadgeVariant()}>{health_status}</Badge>}
            style={{ marginBottom: '16px' }}
          >
            <div className="health-kpi-summary">
              {/* Score Readout */}
              <div className="health-kpi-score">
                <div className="health-kpi-score__num">{animatedShi}</div>
                <div className="health-kpi-score__scale">/ 100 SHI</div>
                <div className="health-kpi-score__label">Baseline Structural Score</div>
              </div>

              {/* Penalty Deductions Breakdown */}
              <div className="health-kpi-penalties">
                <div className="health-penalty-row">
                  <div className="health-penalty-label">
                    <span className="health-penalty-dot" style={{ background: 'var(--accent-red)' }} />
                    <span>Crack Aperture Impact</span>
                  </div>
                  <div className="health-penalty-value">-{animatedCrackPenalty} pts</div>
                </div>

                <div className="health-penalty-row">
                  <div className="health-penalty-label">
                    <span className="health-penalty-dot" style={{ background: 'var(--accent-amber)' }} />
                    <span>Age &amp; Cyclic Fatigue</span>
                  </div>
                  <div className="health-penalty-value">-{animatedAgePenalty} pts</div>
                </div>

                <div className="health-penalty-row">
                  <div className="health-penalty-label">
                    <span className="health-penalty-dot" style={{ background: 'var(--accent-cyan)' }} />
                    <span>Environmental Stresses</span>
                  </div>
                  <div className="health-penalty-value">-{animatedEnvPenalty} pts</div>
                </div>
              </div>

              {/* RUL Prognosis Summary */}
              <div className="health-kpi-rul">
                <div className="health-rul-header">
                  <Clock size={14} className="ui-muted" />
                  <span>Remaining Useful Life</span>
                </div>
                <div className="health-rul-num">
                  {animatedRul} <span className="health-rul-unit">Years</span>
                </div>
                <div className="health-rul-footer">
                  <Badge variant={getRiskBadgeVariant()} size="sm">{risk_level} Risk</Badge>
                  <span className="health-rul-trend">{deterioration_trend}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Interactive Degradation Forecast Chart */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingDown size={16} />
                  <span>Lifecycle Prognosis &amp; Degradation Extrapolation</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`health-chart-btn ${chartMode === 'forecast' ? 'is-active' : ''}`}
                    onClick={() => setChartMode('forecast')}
                  >
                    5-Yr Forecast
                  </button>
                  <button
                    type="button"
                    className={`health-chart-btn ${chartMode === 'history' ? 'is-active' : ''}`}
                    onClick={() => setChartMode('history')}
                  >
                    Inspection History
                  </button>
                  <button
                    type="button"
                    className={`health-chart-btn ${chartMode === 'radar' ? 'is-active' : ''}`}
                    onClick={() => setChartMode('radar')}
                  >
                    Stress Radar
                  </button>
                </div>
              </div>
            }
            subtitle="Arrhenius / Weibull degradation extrapolation curve with critical intervention boundary"
            style={{ marginBottom: '16px' }}
          >
            <div style={{ padding: '12px 0' }}>
              {chartMode === 'forecast' && (
                <RulPrognosticComposedChart
                  predictionData={{
                    current_shi: shi_score,
                    estimated_rul_years,
                    risk_level
                  }}
                  height={280}
                />
              )}
              {chartMode === 'history' && (
                <ShiTrendAreaChart
                  trendData={historical_trend}
                  currentShi={shi_score}
                  height={280}
                />
              )}
              {chartMode === 'radar' && (
                <DegradationRadarChart
                  metrics={{
                    crack_penalty,
                    age_penalty,
                    env_penalty,
                    vibration: 0.08,
                    thermal: 26.5
                  }}
                  height={280}
                />
              )}
            </div>
          </Card>

          {/* Collapsible What-If Scenario Simulator */}
          <div className="health-simulator-section">
            <button
              type="button"
              className="health-simulator-toggle"
              onClick={() => setShowSimulator(!showSimulator)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={15} />
                <span style={{ fontWeight: 600 }}>What-If Scenario Simulator</span>
                <span className="ui-muted" style={{ fontSize: '12px' }}>— Test remediation and environmental stress models</span>
              </div>
              {showSimulator ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSimulator && (
              <div className="health-simulator-body ui-animate-rise">
                <WhatIfScenarioSimulator baselineShi={shi_score} baselineRul={estimated_rul_years} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Safety Thresholds & Alerts */}
      {subSection === 'alerts' && (
        <div className="ui-animate-rise">
          <AlertsView alerts={alerts} onAlertAcknowledged={onActionComplete} />
        </div>
      )}

      {/* 3. Certified Dossiers & Reports */}
      {subSection === 'reports' && (
        <div className="ui-animate-rise">
          <ReportsView inspectionId={inspectionId} />
        </div>
      )}
    </div>
  );
};
