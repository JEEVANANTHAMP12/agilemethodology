import React from 'react';
import { Card, Badge } from './UI/Components';
import { IconRover, IconActivity, IconLayers, IconClock, IconWifi, IconBattery } from './UI/Icons';
import { DesignTokens } from '../tokens';
import { useAnimatedNumber } from './UI/useAnimatedNumber';

export const TopCards = ({ data = {} }) => {
  const {
    rover_status = 'CONNECTED',
    rover_code = 'ROVER-01',
    battery_percentage = 95.0,
    wifi_signal_dbm = -58,
    health_index = 82.0,
    wall_status = 'HEALTHY',
    estimated_rul_years = 18.5,
    deterioration_trend = 'Stable',
    risk_level = 'Low'
  } = data;

  const animatedBattery = useAnimatedNumber(battery_percentage, 1000, 0);
  const animatedHealth = useAnimatedNumber(health_index, 1000, 1);
  const animatedRul = useAnimatedNumber(estimated_rul_years, 1000, 1);

  const isHealthy = wall_status === 'HEALTHY';
  const isCritical = wall_status === 'CRITICAL';

  const getStatusBadgeVariant = () => {
    if (isCritical) return 'danger';
    if (!isHealthy) return 'warning';
    return 'success';
  };

  const getRiskBadgeVariant = () => {
    if (risk_level === 'Critical') return 'danger';
    if (risk_level === 'High') return 'warning';
    if (risk_level === 'Moderate') return 'warning';
    return 'success';
  };

  const healthColor = isCritical ? '#9F2F2D' : (!isHealthy ? '#956400' : '#346538');

  // Mini circular gauge helper
  const renderMiniRadial = (percent, color) => {
    const r = 16;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(100, Math.max(0, percent)) / 100) * circ;
    return (
      <svg width="40" height="40" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <circle cx="20" cy="20" r={r} stroke="#EAEAEA" strokeWidth="3.5" fill="none" />
        <circle
          cx="20"
          cy="20"
          r={r}
          stroke={color}
          strokeWidth="3.5"
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. ROVER STATUS */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconRover size={15} color="#111111" />
            <span>Crawler Telemetry</span>
          </div>
        }
        subtitle={rover_code}
        tag={
          <Badge
            variant="success"
            style={{ animation: 'pulseBeacon 2.5s infinite', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <IconBattery size={12} />
            <span>{rover_status}</span>
          </Badge>
        }
        style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: '#111111', letterSpacing: '-0.03em' }}>
                {animatedBattery}%
              </span>
              <span style={{ fontSize: '13px', color: '#787774', marginLeft: '8px' }}>
                reserve
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#346538', fontWeight: 500, marginTop: '2px' }}>
              Nominal power cell
            </div>
          </div>

          <div>
            {renderMiniRadial(battery_percentage, '#346538')}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #F0F0EE',
          fontSize: '12px',
          color: '#787774'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <IconWifi size={13} />
            <span>Wi-Fi Signal (RSSI)</span>
          </span>
          <span style={{ color: '#111111', fontWeight: 600, fontFamily: DesignTokens.typography.mono }}>
            {wifi_signal_dbm} dBm
          </span>
        </div>
      </Card>

      {/* 2. HEALTH INDEX */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconActivity size={15} color="#111111" />
            <span>Structural Health</span>
          </div>
        }
        subtitle="Normalized Index"
        tag={<Badge variant={getStatusBadgeVariant()}>{wall_status}</Badge>}
        style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: healthColor, letterSpacing: '-0.03em' }}>
                {animatedHealth}
              </span>
              <span style={{ fontSize: '13px', color: '#787774', marginLeft: '6px' }}>
                / 100 SHI
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#787774', marginTop: '2px' }}>
              {isHealthy ? 'Nominal structural integrity' : 'Aperture penalty applied'}
            </div>
          </div>

          <div>
            {renderMiniRadial(health_index, healthColor)}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #F0F0EE',
          fontSize: '12px',
          color: '#787774'
        }}>
          <span>Baseline Evaluation</span>
          <span style={{ color: '#111111', fontWeight: 500 }}>
            {isHealthy ? 'Nominal Tolerance' : 'Degradation Logged'}
          </span>
        </div>
      </Card>

      {/* 3. WALL STATUS */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconLayers size={15} color="#111111" />
            <span>Bearing Substrate</span>
          </div>
        }
        subtitle="North Facade Section"
        tag={<Badge variant={getStatusBadgeVariant()}>{wall_status}</Badge>}
        style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: '#111111', letterSpacing: '-0.03em' }}>
                {isHealthy ? 'Grade A' : (isCritical ? 'Grade C' : 'Grade B')}
              </span>
              <span style={{ fontSize: '13px', color: '#787774', marginLeft: '8px' }}>
                integrity
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#787774', marginTop: '2px' }}>
              C35 Reinforced concrete
            </div>
          </div>

          {/* Substrate Segment Meter */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <div style={{ width: '8px', height: '24px', borderRadius: '2px', background: '#346538' }} />
            <div style={{ width: '8px', height: '24px', borderRadius: '2px', background: isHealthy || !isCritical ? '#346538' : '#ECEBE7' }} />
            <div style={{ width: '8px', height: '24px', borderRadius: '2px', background: isHealthy ? '#346538' : '#ECEBE7' }} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #F0F0EE',
          fontSize: '12px',
          color: '#787774'
        }}>
          <span>Target Material</span>
          <span style={{ color: '#111111', fontWeight: 500 }}>C35 Reinforced Concrete</span>
        </div>
      </Card>

      {/* 4. RUL PREDICTION */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconClock size={15} color="#111111" />
            <span>Prognosis Horizon</span>
          </div>
        }
        subtitle="Remaining Useful Life"
        tag={<Badge variant={getRiskBadgeVariant()}>{risk_level} Risk</Badge>}
        style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '32px', fontWeight: 700, color: '#111111', letterSpacing: '-0.03em' }}>
                {animatedRul}
              </span>
              <span style={{ fontSize: '13px', color: '#787774', marginLeft: '6px' }}>
                Years
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#787774', marginTop: '2px' }}>
              50-year service benchmark
            </div>
          </div>

          <div>
            {renderMiniRadial((estimated_rul_years / 50) * 100, '#1F6C9F')}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #F0F0EE',
          fontSize: '12px',
          color: '#787774'
        }}>
          <span>Progression Trend</span>
          <span style={{ color: '#111111', fontWeight: 600 }}>{deterioration_trend}</span>
        </div>
      </Card>
    </div>
  );
};
