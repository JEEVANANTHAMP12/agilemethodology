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
  Cell,
} from 'recharts';

const ChartTooltip = ({ active, payload, label, formatter, title }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[140px] rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {(title || label) && (
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">
          {title || label}
        </div>
      )}
      {payload.map((entry, idx) => {
        const val = formatter ? formatter(entry.value, entry.name) : entry.value;
        return (
          <div key={`tip-${idx}`} className="flex items-center justify-between gap-3 py-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.stroke || '#0ea5e9' }}
              />
              {entry.name || 'Value'}
            </span>
            <span className="font-mono font-semibold tabular-nums">{val}</span>
          </div>
        );
      })}
    </div>
  );
};

export const ShiTrendAreaChart = ({ data = [], currentShi = 82, height = 250 }) => {
  const source =
    data && data.length > 0
      ? data
      : [
          { date: 'Baseline', shi_score: Math.min(100, currentShi + 4) },
          { date: 'Cycle -2', shi_score: Math.min(100, currentShi + 2.1) },
          { date: 'Cycle -1', shi_score: Math.min(100, currentShi + 0.8) },
          { date: 'Current', shi_score: currentShi },
        ];

  const chartData = source.map((d, i) => ({
    date: d.date || `C${i + 1}`,
    shi: typeof d.shi_score === 'number' ? Math.round(d.shi_score * 10) / 10 : currentShi,
  }));

  const minShi = Math.max(0, Math.floor(Math.min(...chartData.map((d) => d.shi)) / 10) * 10 - 10);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="shiFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
          <YAxis domain={[minShi, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip formatter={(val) => `${val} pts`} />} />
          <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Healthy (80)', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Action (50)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
          <Area
            type="monotone"
            dataKey="shi"
            name="SHI Score"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#shiFill)"
            dot={{ r: 3, fill: '#0ea5e9' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DegradationRadarChart = ({
  crackPenalty = 10.5,
  agePenalty = 4.2,
  envPenalty = 3.3,
  vibrationPenalty = 2.0,
  historyPenalty = 1.8,
  height = 250,
}) => {
  const radarData = [
    { subject: 'Crack Metrology', value: Math.min(100, Math.round(crackPenalty * 4.5)) },
    { subject: 'Structural Age', value: Math.min(100, Math.round(agePenalty * 6)) },
    { subject: 'Environment', value: Math.min(100, Math.round(envPenalty * 8)) },
    { subject: 'Dynamics / Tilt', value: Math.min(100, Math.round(vibrationPenalty * 15)) },
    { subject: 'Historical Drop', value: Math.min(100, Math.round(historyPenalty * 10)) },
  ];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Penalty Weight" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} strokeWidth={2} />
          <Tooltip content={<ChartTooltip formatter={(val) => `${val}%`} />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RulPrognosticComposedChart = ({
  currentShi = 76.0,
  estimatedRulYears = 14.5,
  riskLevel = 'Moderate',
  height = 250,
}) => {
  const annualDrop = Math.max(0.8, (currentShi - 40.0) / Math.max(1, estimatedRulYears));
  const forecastData = Array.from({ length: 6 }, (_, year) => {
    const projShi = Math.max(15, Math.round((currentShi - year * annualDrop) * 10) / 10);
    const spread = Math.round(year * 1.8 * 10) / 10;
    return {
      year: year === 0 ? 'Current' : `+${year}y`,
      shi: projShi,
      upper: Math.min(100, Math.round((projShi + spread) * 10) / 10),
      lower: Math.max(10, Math.round((projShi - spread) * 10) / 10),
    };
  });

  const color = riskLevel === 'Critical' ? '#ef4444' : riskLevel === 'High' ? '#f59e0b' : '#0ea5e9';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={forecastData} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
          <YAxis domain={[10, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip formatter={(val) => `${val} pts`} />} />
          <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Failure Limit (40)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
          <Area isAnimationActive={false} type="monotone" dataKey="upper" name="Upper 95%" stroke="none" fill={color} fillOpacity={0.12} />
          <Line isAnimationActive={false} type="monotone" dataKey="shi" name="Median SHI" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} />
          <Line isAnimationActive={false} type="monotone" dataKey="lower" name="Lower 95%" stroke={color} strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CrackApertureProfileChart = ({
  primaryLengthMm = 180.0,
  primaryWidthMm = 0.42,
  height = 210,
}) => {
  const samples = 24;
  const maxWidth = Math.max(0.1, Number(primaryWidthMm) || 0.35);
  const totalLen = Math.max(10, Number(primaryLengthMm) || 100);

  const profileData = Array.from({ length: samples + 1 }, (_, i) => {
    const f = i / samples;
    const posMm = Math.round(f * totalLen * 10) / 10;
    const width = Math.max(0.02, Math.round((Math.sin(f * Math.PI) * maxWidth + Math.sin(f * 18) * maxWidth * 0.06) * 100) / 100);
    return { distance: `${posMm}mm`, width };
  });

  const color = maxWidth >= 0.4 ? '#ef4444' : maxWidth >= 0.3 ? '#f59e0b' : '#0ea5e9';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={profileData} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="distance" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} interval={4} />
          <YAxis
            domain={[0, Math.max(0.6, Math.ceil(maxWidth * 1.35 * 10) / 10)]}
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}mm`}
          />
          <Tooltip content={<ChartTooltip formatter={(val) => `${val} mm`} />} />
          <ReferenceLine y={0.3} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Ext (0.30mm)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
          <ReferenceLine y={0.4} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Int (0.40mm)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
          <Area isAnimationActive={false} type="monotone" dataKey="width" name="Aperture" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.18} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DefectSeverityBarChart = ({ defects = [], height = 210 }) => {
  const counts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
  defects.forEach((d) => {
    const sev = (d.severity || 'LOW').toUpperCase();
    if (counts[sev] !== undefined) counts[sev] += 1;
  });

  const barData = [
    { severity: 'Critical', count: counts.CRITICAL, color: '#ef4444' },
    { severity: 'High', count: counts.HIGH, color: '#f59e0b' },
    { severity: 'Moderate', count: counts.MODERATE, color: '#0ea5e9' },
    { severity: 'Low', count: counts.LOW, color: '#10b981' },
  ];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barData} margin={{ top: 12, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="severity" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip formatter={(val) => `${val} defects`} />} />
          <Bar isAnimationActive={false} dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
            {barData.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WhatIfComparisonChart = ({
  currentShi = 76.0,
  baseRul = 14.5,
  simulatedRul = 22.0,
  height = 200,
}) => {
  const baseDrop = Math.max(0.8, (currentShi - 40.0) / Math.max(1, baseRul));
  const simDrop = Math.max(0.4, (currentShi - 40.0) / Math.max(1, simulatedRul));

  const compareData = Array.from({ length: 7 }, (_, yr) => ({
    year: yr === 0 ? 'Now' : `+${yr}y`,
    baseline: Math.max(20, Math.round((currentShi - yr * baseDrop) * 10) / 10),
    mitigated: Math.max(20, Math.round((currentShi - yr * simDrop) * 10) / 10),
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={compareData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
          <YAxis domain={[20, 100]} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip formatter={(val) => `${val} SHI`} />} />
          <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" />
          <Line isAnimationActive={false} type="monotone" dataKey="baseline" name="Baseline" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="mitigated" name="Remediated" stroke="#10b981" strokeWidth={2} dot={{ r: 2.5, fill: '#10b981' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
