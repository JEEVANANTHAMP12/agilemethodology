import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';

// Custom Glassmorphic Tooltip wrapper
const GlassTooltip = ({ active, payload, label, formatter, title, extra }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: 'var(--surface-raised, #142125)',
        border: '1px solid var(--border-strong, rgba(148, 180, 178, 0.28))',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        minWidth: '160px',
        fontSize: '12px',
        color: 'var(--text-primary, #eef7f4)',
        zIndex: 50
      }}
    >
      {title ? (
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary, #9bb0ab)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </div>
      ) : label ? (
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary, #9bb0ab)' }}>
          {label}
        </div>
      ) : null}

      {payload.map((entry, index) => {
        const val = formatter ? formatter(entry.value, entry.name, entry) : entry.value;
        return (
          <div key={`tip-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '3px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #9bb0ab)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color || entry.stroke || 'var(--accent-primary, #2dd4bf)' }} />
              {entry.name || 'Value'}:
            </span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: entry.color || 'var(--text-primary, #eef7f4)' }}>
              {val}
            </span>
          </div>
        );
      })}

      {extra && <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle, rgba(148, 180, 178, 0.1))' }}>{extra}</div>}
    </div>
  );
};

/**
 * 1. ShiTrendAreaChart
 * Visualizes chronological Structural Health Index with smooth gradients and ACI health zones.
 */
export const ShiTrendAreaChart = ({
  data = [],
  height = 240,
  strokeColor = '#2dd4bf',
  fillGradientId = 'shiAreaGrad',
  onHoverPoint
}) => {
  if (!data || data.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No historical cycles recorded.</div>;
  }

  // Format data for Recharts
  const chartData = data.map((d, i) => ({
    cycle: d.inspection_code || `Cycle -${data.length - 1 - i}`,
    date: d.date || `C${i + 1}`,
    shi: typeof d.shi_score === 'number' ? Math.round(d.shi_score * 10) / 10 : 80.0,
    status: d.health_status || (d.shi_score >= 80 ? 'HEALTHY' : d.shi_score >= 50 ? 'MODERATE' : 'CRITICAL')
  }));

  const minShi = Math.max(0, Math.min(...chartData.map(d => d.shi)) - 10);
  const maxShi = 100;

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 20, left: -16, bottom: 0 }}
          onMouseMove={(e) => {
            if (e && e.activePayload && onHoverPoint) {
              onHoverPoint(e.activePayload[0].payload);
            }
          }}
          onMouseLeave={() => onHoverPoint && onHoverPoint(null)}
        >
          <defs>
            <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.45} />
              <stop offset="60%" stopColor={strokeColor} stopOpacity={0.12} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(148, 180, 178, 0.1))" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted, #6b817c)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-subtle, rgba(148, 180, 178, 0.15))' }}
          />
          <YAxis
            domain={[Math.floor(minShi / 10) * 10, maxShi]}
            stroke="var(--text-muted, #6b817c)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip
            content={<GlassTooltip title="Structural Health Index" formatter={(val) => `${val} pts`} />}
          />
          <ReferenceLine
            y={80}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'ACI Healthy (80+)', fill: '#10b981', fontSize: 10, position: 'right' }}
          />
          <ReferenceLine
            y={50}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Action Limit (50)', fill: '#f59e0b', fontSize: 10, position: 'right' }}
          />
          <Area
            type="monotone"
            dataKey="shi"
            name="SHI Score"
            stroke={strokeColor}
            strokeWidth={2.5}
            fill={`url(#${fillGradientId})`}
            dot={{ r: 4, fill: 'var(--surface-raised, #142125)', stroke: strokeColor, strokeWidth: 2 }}
            activeDot={{ r: 7, fill: strokeColor, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 2. DegradationRadarChart
 * 5-factor structural assessment radar chart.
 */
export const DegradationRadarChart = ({
  crackPenalty = 10.5,
  agePenalty = 4.2,
  envPenalty = 3.3,
  vibrationPenalty = 2.0,
  historyPenalty = 1.8,
  height = 240
}) => {
  const radarData = [
    { subject: 'Crack Metrology', value: Math.min(100, Math.round(crackPenalty * 4.5)), fullMark: 100 },
    { subject: 'Structural Age', value: Math.min(100, Math.round(agePenalty * 6)), fullMark: 100 },
    { subject: 'Environment', value: Math.min(100, Math.round(envPenalty * 8)), fullMark: 100 },
    { subject: 'Dynamics / Tilt', value: Math.min(100, Math.round(vibrationPenalty * 15)), fullMark: 100 },
    { subject: 'Historical Drop', value: Math.min(100, Math.round(historyPenalty * 10)), fullMark: 100 }
  ];

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="var(--border-strong, rgba(148, 180, 178, 0.2))" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--text-secondary, #9bb0ab)', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            stroke="var(--text-muted, #6b817c)"
            fontSize={9}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Penalty Severity"
            dataKey="value"
            stroke="var(--accent-primary, #2dd4bf)"
            fill="var(--accent-primary, #2dd4bf)"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip
            content={<GlassTooltip title="Penalty Factor" formatter={(val) => `${val}% influence`} />}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 3. RulPrognosticComposedChart
 * Composed Chart for Remaining Useful Life with median curve and shaded uncertainty interval.
 */
export const RulPrognosticComposedChart = ({
  currentShi = 76.0,
  estimatedRulYears = 14.5,
  riskLevel = 'Moderate',
  height = 240
}) => {
  // Generate 6 years of prognostic forecast points
  const annualDrop = Math.max(0.8, (currentShi - 40.0) / Math.max(1, estimatedRulYears));
  const forecastData = [];

  for (let year = 0; year <= 5; year++) {
    const projShi = Math.max(15, Math.round((currentShi - (year * annualDrop)) * 10) / 10);
    const uncertainty = Math.round(year * 1.8 * 10) / 10;
    const upper = Math.min(100, Math.round((projShi + uncertainty) * 10) / 10);
    const lower = Math.max(10, Math.round((projShi - uncertainty) * 10) / 10);

    forecastData.push({
      year: year === 0 ? 'Current' : `+${year} Yrs`,
      yearNum: year,
      shi: projShi,
      upper,
      lower,
      uncertaintyRange: [lower, upper],
      annualDrop: Math.round(year * annualDrop * 10) / 10
    });
  }

  const getRiskColor = () => {
    if (riskLevel === 'Critical') return '#ef4444';
    if (riskLevel === 'High') return '#f59e0b';
    return '#2dd4bf';
  };

  const riskColor = getRiskColor();

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={forecastData}
          margin={{ top: 16, right: 20, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="rulEnvelopeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={riskColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={riskColor} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(148, 180, 178, 0.1))" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="var(--text-muted, #6b817c)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-subtle, rgba(148, 180, 178, 0.15))' }}
          />
          <YAxis
            domain={[10, 100]}
            stroke="var(--text-muted, #6b817c)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={
              <GlassTooltip
                title="RUL Degradation Forecast"
                formatter={(val, name) => {
                  if (name === 'Uncertainty Interval') return `${val[0]} - ${val[1]} pts`;
                  return `${val} pts`;
                }}
              />
            }
          />
          <ReferenceLine
            y={40}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Critical Failure Limit (40 SHI)', fill: '#ef4444', fontSize: 10, position: 'right' }}
          />
          <Area
            type="monotone"
            dataKey="upper"
            name="Upper 95% Bound"
            stroke="none"
            fill="url(#rulEnvelopeGrad)"
          />
          <Line
            type="monotone"
            dataKey="shi"
            name="Median Trajectory"
            stroke={riskColor}
            strokeWidth={3}
            dot={{ r: 4, fill: 'var(--surface-raised, #142125)', stroke: riskColor, strokeWidth: 2 }}
            activeDot={{ r: 7, fill: riskColor, stroke: '#ffffff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="lower"
            name="Lower 95% Bound"
            stroke={riskColor}
            strokeDasharray="3 3"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 4. CrackApertureProfileChart
 * Area chart visualizing the fissure aperture width (mm) across crack length.
 */
export const CrackApertureProfileChart = ({
  primaryLengthMm = 180.0,
  primaryWidthMm = 0.42,
  height = 220
}) => {
  const samples = 24;
  const maxWidthNum = Math.max(0.1, Number(primaryWidthMm) || 0.35);
  const totalLen = Math.max(10, Number(primaryLengthMm) || 100);

  const profileData = [];
  for (let i = 0; i <= samples; i++) {
    const fraction = i / samples;
    const posMm = Math.round(fraction * totalLen * 10) / 10;
    // Parabolic profile with synthetic roughness
    const baseW = Math.sin(fraction * Math.PI) * maxWidthNum;
    const jitter = Math.sin(fraction * 18.0) * (maxWidthNum * 0.08);
    const measuredW = Math.max(0.02, Math.round((baseW + jitter) * 100) / 100);

    profileData.push({
      distance: `${posMm}mm`,
      distanceMm: posMm,
      width: measuredW,
      limitExternal: 0.30,
      limitInternal: 0.40
    });
  }

  const isCritical = maxWidthNum >= 0.40;
  const isHigh = maxWidthNum >= 0.30 && maxWidthNum < 0.40;
  const strokeColor = isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#2dd4bf';

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={profileData}
          margin={{ top: 16, right: 20, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="apertureGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(148, 180, 178, 0.1))" vertical={false} />
          <XAxis
            dataKey="distance"
            stroke="var(--text-muted, #6b817c)"
            fontSize={10}
            tickLine={false}
            interval={4}
          />
          <YAxis
            domain={[0, Math.max(0.6, Math.ceil(maxWidthNum * 1.35 * 10) / 10)]}
            stroke="var(--text-muted, #6b817c)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}mm`}
          />
          <Tooltip
            content={<GlassTooltip title="Sub-pixel Fissure Metrology" formatter={(val) => `${val} mm`} />}
          />
          <ReferenceLine
            y={0.30}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'ACI 224R Ext (0.30mm)', fill: '#f59e0b', fontSize: 10, position: 'right' }}
          />
          <ReferenceLine
            y={0.40}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'ACI 224R Int (0.40mm)', fill: '#ef4444', fontSize: 10, position: 'right' }}
          />
          <Area
            type="monotone"
            dataKey="width"
            name="Aperture Width"
            stroke={strokeColor}
            strokeWidth={2.5}
            fill="url(#apertureGrad)"
            dot={false}
            activeDot={{ r: 6, fill: strokeColor, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 5. DefectSeverityBarChart
 * Bar chart showing defect counts categorized by severity.
 */
export const DefectSeverityBarChart = ({
  defects = [],
  height = 200
}) => {
  const counts = {
    CRITICAL: 0,
    HIGH: 0,
    MODERATE: 0,
    LOW: 0
  };

  defects.forEach(d => {
    const sev = (d.severity || 'LOW').toUpperCase();
    if (counts[sev] !== undefined) counts[sev]++;
  });

  const barData = [
    { severity: 'Critical', key: 'CRITICAL', count: counts.CRITICAL, color: '#ef4444' },
    { severity: 'High', key: 'HIGH', count: counts.HIGH, color: '#f59e0b' },
    { severity: 'Moderate', key: 'MODERATE', count: counts.MODERATE, color: '#38bdf8' },
    { severity: 'Low', key: 'LOW', count: counts.LOW, color: '#2dd4bf' }
  ];

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          margin={{ top: 12, right: 16, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(148, 180, 178, 0.1))" vertical={false} />
          <XAxis dataKey="severity" stroke="var(--text-muted, #6b817c)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--text-muted, #6b817c)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<GlassTooltip title="Defect Classification" formatter={(val) => `${val} cracks`} />} />
          <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 6. WhatIfComparisonChart
 * Comparative trajectories: Baseline vs Mitigated remediation scenario.
 */
export const WhatIfComparisonChart = ({
  currentShi = 76.0,
  baseRul = 14.5,
  simulatedRul = 22.0,
  height = 200
}) => {
  const years = 6;
  const baseDrop = Math.max(0.8, (currentShi - 40.0) / Math.max(1, baseRul));
  const simDrop = Math.max(0.4, (currentShi - 40.0) / Math.max(1, simulatedRul));

  const compareData = [];
  for (let yr = 0; yr <= years; yr++) {
    compareData.push({
      year: yr === 0 ? 'Now' : `+${yr}y`,
      baseline: Math.max(20, Math.round((currentShi - (yr * baseDrop)) * 10) / 10),
      mitigated: Math.max(20, Math.round((currentShi - (yr * simDrop)) * 10) / 10)
    });
  }

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={compareData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, rgba(148, 180, 178, 0.1))" vertical={false} />
          <XAxis dataKey="year" stroke="var(--text-muted, #6b817c)" fontSize={10} tickLine={false} />
          <YAxis domain={[20, 100]} stroke="var(--text-muted, #6b817c)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip content={<GlassTooltip title="Scenario Comparison" formatter={(val) => `${val} SHI`} />} />
          <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Limit (40)', fill: '#ef4444', fontSize: 9 }} />
          <Line
            type="monotone"
            dataKey="baseline"
            name="Do-Nothing Baseline"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="mitigated"
            name="Remediated Scenario"
            stroke="#2dd4bf"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#2dd4bf' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 7. TelemetrySparkline
 * Mini real-time sparkline for TopCards and Rover teleoperation.
 */
export const TelemetrySparkline = ({
  data = [12, 14, 15, 13, 16, 18, 19, 17, 20, 22],
  color = '#2dd4bf',
  height = 42
}) => {
  const points = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            fill={`url(#sparkGrad-${color.replace('#', '')})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

