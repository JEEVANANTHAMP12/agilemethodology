import React from 'react';
import { Badge } from '../ui';
import { Bot, Activity, Crosshair, Clock } from 'lucide-react';
import { useAnimatedNumber } from './UI/useAnimatedNumber';

const statusVariant = (status) => {
  if (status === 'CRITICAL') return 'danger';
  if (status === 'HEALTHY') return 'success';
  return 'warning';
};

const riskVariant = (risk) => {
  if (risk === 'Critical') return 'danger';
  if (risk === 'High' || risk === 'Moderate') return 'warning';
  return 'success';
};

export const TopCards = ({ data = {}, crackData = {} }) => {
  const {
    rover_status = 'CONNECTED',
    rover_code = 'ROVER-01',
    battery_percentage = 95.0,
    wifi_signal_dbm = -58,
    health_index = 82.0,
    wall_status = 'HEALTHY',
    estimated_rul_years = 18.5,
    risk_level = 'Low',
  } = data;

  const crackWidth = crackData?.primary_width_mm ?? data?.primary_width_mm ?? 0.0;
  const crackSeverity = crackData?.primary_severity || (wall_status === 'HEALTHY' ? 'NONE' : 'MODERATE');

  const animatedBattery = useAnimatedNumber(battery_percentage, 800, 0);
  const animatedHealth = useAnimatedNumber(health_index, 800, 1);
  const animatedRul = useAnimatedNumber(estimated_rul_years, 800, 1);
  const animatedWidth = useAnimatedNumber(crackWidth, 800, 2);

  const isHealthy = wall_status === 'HEALTHY';

  return (
    <section className="dash-metric-bar" aria-label="Key Performance Indicators">
      {/* 1. Structural Health Index */}
      <div className="dash-metric-item">
        <div className="dash-metric-header">
          <Activity size={13} className="dash-metric-icon" />
          <span className="dash-metric-label">Structural Health</span>
        </div>
        <div className="dash-metric-body">
          <div className="dash-metric-val-wrap">
            <span className="dash-metric-value">{animatedHealth}</span>
            <span className="dash-metric-unit">/ 100 SHI</span>
          </div>
          <Badge variant={statusVariant(wall_status)} size="sm">
            {isHealthy ? 'Grade A' : wall_status}
          </Badge>
        </div>
      </div>

      {/* 2. Crack Metrology */}
      <div className="dash-metric-item">
        <div className="dash-metric-header">
          <Crosshair size={13} className="dash-metric-icon" />
          <span className="dash-metric-label">Max Aperture</span>
        </div>
        <div className="dash-metric-body">
          <div className="dash-metric-val-wrap">
            <span className="dash-metric-value">{animatedWidth}</span>
            <span className="dash-metric-unit">mm</span>
          </div>
          <Badge
            variant={
              crackSeverity === 'CRITICAL'
                ? 'danger'
                : crackSeverity === 'HIGH' || crackSeverity === 'MODERATE'
                ? 'warning'
                : 'success'
            }
            size="sm"
          >
            {crackSeverity}
          </Badge>
        </div>
      </div>

      {/* 3. Forecast Prognosis */}
      <div className="dash-metric-item">
        <div className="dash-metric-header">
          <Clock size={13} className="dash-metric-icon" />
          <span className="dash-metric-label">Prognosis RUL</span>
        </div>
        <div className="dash-metric-body">
          <div className="dash-metric-val-wrap">
            <span className="dash-metric-value">{animatedRul}</span>
            <span className="dash-metric-unit">years</span>
          </div>
          <Badge variant={riskVariant(risk_level)} size="sm">
            {risk_level} Risk
          </Badge>
        </div>
      </div>

      {/* 4. Crawler Telemetry */}
      <div className="dash-metric-item">
        <div className="dash-metric-header">
          <Bot size={13} className="dash-metric-icon" />
          <span className="dash-metric-label">{rover_code} Link</span>
        </div>
        <div className="dash-metric-body">
          <div className="dash-metric-val-wrap">
            <span className="dash-metric-value">{animatedBattery}%</span>
            <span className="dash-metric-unit">power</span>
          </div>
          <Badge variant={rover_status === 'CONNECTED' ? 'success' : 'danger'} size="sm" dot>
            {wifi_signal_dbm} dBm
          </Badge>
        </div>
      </div>
    </section>
  );
};
