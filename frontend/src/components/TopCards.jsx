import React from 'react';
import { Card, Badge, RadialGauge, LevelMeter } from '../ui';
import { IconRover, IconActivity, IconLayers, IconClock, IconWifi } from './UI/Icons';
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

const KpiCard = ({ icon, title, subtitle, tag, value, unit, hint, footerLabel, footerValue, gauge, gaugeTone, children }) => (
  <Card
    className="dash-kpi"
    title={
      <span className="dash-kpi__title">
        {icon}
        {title}
      </span>
    }
    subtitle={subtitle}
    tag={tag}
  >
    <div className="dash-kpi__main">
      <div className="dash-kpi__readout">
        <div className="dash-kpi__value">
          {value}
          {unit && <span className="dash-kpi__unit">{unit}</span>}
        </div>
        {hint && <div className="dash-kpi__hint">{hint}</div>}
        {children}
      </div>
      {gauge != null && (
        <RadialGauge
          value={gauge}
          size={82}
          thickness={6}
          showTicks={false}
          tone={gaugeTone}
          valueText=""
          label=""
        />
      )}
    </div>
    <div className="dash-kpi__footer">
      <span>{footerLabel}</span>
      <strong>{footerValue}</strong>
    </div>
  </Card>
);

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
    risk_level = 'Low',
  } = data;

  const animatedBattery = useAnimatedNumber(battery_percentage, 1000, 0);
  const animatedHealth = useAnimatedNumber(health_index, 1000, 1);
  const animatedRul = useAnimatedNumber(estimated_rul_years, 1000, 1);

  const isHealthy = wall_status === 'HEALTHY';
  const isCritical = wall_status === 'CRITICAL';
  const healthTone = isCritical ? 'danger' : isHealthy ? 'success' : 'warning';

  return (
    <div className="ui-grid ui-grid--auto dash-kpis">
      <KpiCard
        icon={<IconRover size={15} />}
        title="Crawler Telemetry"
        subtitle={rover_code}
        tag={
          <Badge variant={rover_status === 'CONNECTED' ? 'success' : 'danger'} size="sm" dot>
            {rover_status}
          </Badge>
        }
        value={animatedBattery}
        unit="%"
        hint="Nominal power cell"
        footerLabel={
          <span className="dash-kpi__inline">
            <IconWifi size={13} /> Wi-Fi RSSI
          </span>
        }
        footerValue={`${wifi_signal_dbm} dBm`}
        gauge={battery_percentage}
        gaugeTone="success"
      />

      <KpiCard
        icon={<IconActivity size={15} />}
        title="Structural Health"
        subtitle="Normalized index"
        tag={<Badge variant={statusVariant(wall_status)} size="sm">{wall_status}</Badge>}
        value={animatedHealth}
        unit="/ 100 SHI"
        hint={isHealthy ? 'Nominal structural integrity' : 'Aperture penalty applied'}
        footerLabel="Baseline evaluation"
        footerValue={isHealthy ? 'Nominal tolerance' : 'Degradation logged'}
        gauge={health_index}
        gaugeTone={healthTone}
      />

      <KpiCard
        icon={<IconLayers size={15} />}
        title="Bearing Substrate"
        subtitle="Target concrete facade"
        tag={<Badge variant={statusVariant(wall_status)} size="sm">{wall_status}</Badge>}
        value={isHealthy ? 'Grade A' : isCritical ? 'Grade C' : 'Grade B'}
        unit="integrity"
        hint="C35 reinforced concrete"
        footerLabel="Target material"
        footerValue="C35 / 40 MPa"
      >
        <div className="dash-kpi__meter">
          <LevelMeter value={isHealthy ? 100 : isCritical ? 33 : 66} bars={3} tone={healthTone} />
          <span className="ui-text-xs ui-muted">3-zone assessment</span>
        </div>
      </KpiCard>

      <KpiCard
        icon={<IconClock size={15} />}
        title="Prognosis Horizon"
        subtitle="Remaining useful life"
        tag={<Badge variant={riskVariant(risk_level)} size="sm">{risk_level} risk</Badge>}
        value={animatedRul}
        unit="years"
        hint="50-year service benchmark"
        footerLabel="Progression trend"
        footerValue={deterioration_trend}
        gauge={(estimated_rul_years / 50) * 100}
        gaugeTone="info"
      />
    </div>
  );
};
