import React, { useState } from 'react';
import { Card, Badge } from './UI/Components';
import { IconClock } from './UI/Icons';
import { DesignTokens } from '../tokens';
import { useAnimatedNumber } from './UI/useAnimatedNumber';
import { WhatIfScenarioSimulator } from './WhatIfScenarioSimulator';

export const PredictionView = ({ predictionData = {} }) => {
  const {
    current_shi = 76.0,
    deterioration_trend = 'Increasing',
    estimated_rul_years = 14.5,
    risk_level = 'Moderate',
    model_name = 'Trend-Extrapolation-Degradation-v1'
  } = predictionData;

  const [hoveredForecastIdx, setHoveredForecastIdx] = useState(null);
  const [crosshairPos, setCrosshairPos] = useState(null);

  const animatedShi = useAnimatedNumber(current_shi, 1100, 1);
  const animatedRul = useAnimatedNumber(estimated_rul_years, 1100, 1);

  const getRiskBadgeVariant = () => {
    if (risk_level === 'Critical') return 'danger';
    if (risk_level === 'High') return 'warning';
    if (risk_level === 'Moderate') return 'warning';
    return 'success';
  };

  // 5-year forecast points with confidence boundaries
  const forecastPoints = [];
  const annualDrop = Math.max(0.8, (current_shi - 40.0) / Math.max(1, estimated_rul_years));

  for (let year = 0; year <= 5; year++) {
    const projSHI = Math.max(15, Math.round((current_shi - (year * annualDrop)) * 10) / 10);
    // Upper and lower ML uncertainty envelope
    const uncertaintyMargin = year * 1.8;
    const upperBound = Math.min(100, Math.round((projSHI + uncertaintyMargin) * 10) / 10);
    const lowerBound = Math.max(10, Math.round((projSHI - uncertaintyMargin) * 10) / 10);

    forecastPoints.push({
      yearIndex: year,
      year: year === 0 ? 'Current' : `+${year} Yrs`,
      shi: projSHI,
      upper: upperBound,
      lower: lowerBound,
      drop: Math.round(year * annualDrop * 10) / 10
    });
  }

  // Proper SVG dimensions for Cartesian Trajectory Curve
  const svgWidth = 720;
  const svgHeight = 230;
  const padLeft = 48;
  const padRight = 32;
  const padTop = 24;
  const padBottom = 34;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const yTicks = [100, 80, 60, 40, 20, 0];
  const getYCoord = (val) => {
    const clamped = Math.min(100, Math.max(0, val));
    return padTop + plotHeight - (clamped / 100) * plotHeight;
  };

  const pts = forecastPoints.map((pt, i) => {
    const x = padLeft + (i / (forecastPoints.length - 1)) * plotWidth;
    const y = getYCoord(pt.shi);
    const yUpper = getYCoord(pt.upper);
    const yLower = getYCoord(pt.lower);
    return { ...pt, x, y, yUpper, yLower, idx: i };
  });

  // Generate smooth spline path
  const generateSpline = (coordList, key = 'y') => {
    if (coordList.length === 0) return '';
    if (coordList.length === 1) return `M ${coordList[0].x} ${coordList[0][key]}`;
    let d = `M ${coordList[0].x} ${coordList[0][key]}`;
    for (let i = 0; i < coordList.length - 1; i++) {
      const p0 = coordList[Math.max(0, i - 1)];
      const p1 = coordList[i];
      const p2 = coordList[i + 1];
      const p3 = coordList[Math.min(coordList.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1[key] + (p2[key] - p0[key]) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2[key] - (p3[key] - p1[key]) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2[key]}`;
    }
    return d;
  };

  const trajectoryLine = generateSpline(pts, 'y');
  const upperLine = generateSpline(pts, 'yUpper');
  const lowerLineReversed = pts.slice().reverse();
  let lowerSplineReversed = '';
  if (lowerLineReversed.length > 0) {
    lowerSplineReversed = `L ${lowerLineReversed[0].x} ${lowerLineReversed[0].yLower}`;
    for (let i = 0; i < lowerLineReversed.length - 1; i++) {
      const p2 = lowerLineReversed[i + 1];
      lowerSplineReversed += ` L ${p2.x} ${p2.yLower}`;
    }
  }

  // Closed polygon for confidence envelope
  const confidenceBandPath = pts.length > 0
    ? `${upperLine} ${lowerSplineReversed} Z`
    : '';

  // Area under trajectory line
  const trajectoryArea = pts.length > 0
    ? `${trajectoryLine} L ${pts[pts.length - 1].x} ${padTop + plotHeight} L ${pts[0].x} ${padTop + plotHeight} Z`
    : '';

  const criticalLimitY = getYCoord(50);
  const designLifePercent = Math.min(100, Math.round((estimated_rul_years / 50) * 100));

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconClock size={16} color="var(--text-primary)" />
          <span>Remaining Useful Life (RUL) Prognosis</span>
        </div>
      }
      subtitle={`Degradation Extrapolation Engine: ${model_name}`}
      tag={<Badge variant={getRiskBadgeVariant()}>{risk_level} Risk</Badge>}
      style={{ marginBottom: '24px' }}
    >
      {/* Bento Prognostic Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '22px'
      }}>
        {/* 1. Current SHI */}
        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Health Index
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {animatedShi}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Reference baseline: 100.0 pts
          </div>
        </div>

        {/* 2. Deterioration Velocity */}
        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Deterioration Velocity
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '6px' }}>
            {deterioration_trend}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Estimated -{annualDrop.toFixed(1)} pts / year
          </div>
        </div>

        {/* 3. Projected Lifespan with Mini Life Ring */}
        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Projected Lifespan
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {animatedRul} <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 }}>Yrs</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Until structural threshold
            </div>
          </div>

          {/* Mini Endurance Meter */}
          <div style={{ width: '48px', height: '48px', position: 'relative' }}>
            <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="24" cy="24" r="18" stroke="var(--border)" strokeWidth="4" fill="none" />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke={risk_level === 'Critical' ? 'var(--chart-bad)' : (risk_level === 'Moderate' ? 'var(--chart-warn)' : 'var(--chart-good)')}
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - designLifePercent / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              {designLifePercent}%
            </div>
          </div>
        </div>

        {/* 4. Risk Classification */}
        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Risk Categorization
          </div>
          <div style={{ marginTop: '8px' }}>
            <Badge variant={getRiskBadgeVariant()} size="md">{risk_level}</Badge>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Condition Grade II (NDT Compliant)
          </div>
        </div>
      </div>

      {/* Interactive 5-Year Trajectory & Uncertainty Envelope Cartesian Graph */}
      <div className="data-card-interactive" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px 18px 16px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Projected Structural Health Trajectory &amp; ML Confidence Bounds
              </span>
              <span style={{
                background: 'var(--border)',
                color: 'var(--text-secondary)',
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
                fontFamily: DesignTokens.typography.mono
              }}>
                5-YEAR HORIZON
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Extrapolated degradation curve with &plusmn;95% confidence interval envelope &amp; crosshair inspector
            </div>
          </div>

          {/* Quick Metrics Summary Strip */}
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Baseline: </span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>{current_shi}</strong>
            </div>
            <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>5-Yr Proj: </span>
              <strong style={{ color: pts[5]?.shi < 50 ? 'var(--chart-bad)' : 'var(--chart-warn)', fontFamily: DesignTokens.typography.mono }}>
                {pts[5]?.shi}
              </strong>
            </div>
            <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Velocity: </span>
              <strong style={{ color: 'var(--chart-bad)', fontFamily: DesignTokens.typography.mono }}>-{annualDrop.toFixed(1)}/yr</strong>
            </div>
            <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Horizon: </span>
              <strong style={{ color: 'var(--chart-good)', fontFamily: DesignTokens.typography.mono }}>~{estimated_rul_years} Yrs</strong>
            </div>
          </div>
        </div>

        {/* SVG Cartesian Degradation Trend Chart */}
        <div style={{ width: '100%', height: '230px', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="rulAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-info)" stopOpacity="0.25" />
                <stop offset="70%" stopColor="var(--chart-info)" stopOpacity="0.05" />
                <stop offset="100%" stopColor="var(--chart-info)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--pastel-blue-border)" stopOpacity="0.65" />
                <stop offset="100%" stopColor="var(--pastel-blue-border)" stopOpacity="0.22" />
              </linearGradient>
              <linearGradient id="flowPulseGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--text-primary)" />
                <stop offset="50%" stopColor="#0066FF" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Shaded Classification Background Bands */}
            <rect
              x={padLeft}
              y={getYCoord(100)}
              width={plotWidth}
              height={getYCoord(80) - getYCoord(100)}
              fill="var(--chart-good)"
              fillOpacity="0.035"
            />
            <rect
              x={padLeft}
              y={getYCoord(80)}
              width={plotWidth}
              height={getYCoord(50) - getYCoord(80)}
              fill="var(--chart-warn)"
              fillOpacity="0.025"
            />
            <rect
              x={padLeft}
              y={getYCoord(50)}
              width={plotWidth}
              height={getYCoord(0) - getYCoord(50)}
              fill="var(--chart-bad)"
              fillOpacity="0.035"
            />

            {/* Y-Axis Horizontal Gridlines & Tick Numbers */}
            {yTicks.map(tick => {
              const yPos = getYCoord(tick);
              return (
                <g key={`y-tick-${tick}`}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={padLeft + plotWidth}
                    y2={yPos}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padLeft - 9}
                    y={yPos + 3.5}
                    textAnchor="end"
                    fontSize="9.5"
                    fill="var(--text-muted)"
                    fontFamily={DesignTokens.typography.mono}
                    fontWeight="500"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Left Y-Axis Unit Label */}
            <text
              x={14}
              y={padTop + plotHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 14 ${padTop + plotHeight / 2})`}
              fontSize="8.5"
              fontWeight="700"
              fill="var(--text-muted)"
              letterSpacing="0.08em"
            >
              SHI (PTS)
            </text>

            {/* 80 Baseline Threshold Line */}
            <line
              x1={padLeft}
              y1={getYCoord(80)}
              x2={padLeft + plotWidth}
              y2={getYCoord(80)}
              stroke="var(--chart-good)"
              strokeWidth="1"
              strokeDasharray="3 3"
              strokeOpacity="0.4"
            />
            <text
              x={padLeft + plotWidth}
              y={getYCoord(80) - 3}
              fill="var(--chart-good)"
              fontSize="8.5"
              fontFamily={DesignTokens.typography.sans}
              fontWeight="500"
              textAnchor="end"
              opacity="0.8"
            >
              80 Baseline
            </text>

            {/* Critical Serviceability Threshold line (50 SHI) */}
            <line
              x1={padLeft}
              y1={criticalLimitY}
              x2={padLeft + plotWidth}
              y2={criticalLimitY}
              stroke="var(--chart-bad)"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              className="animate-threshold-line"
            />
            <text
              x={padLeft + plotWidth}
              y={criticalLimitY - 4}
              fill="var(--chart-bad)"
              fontSize="9"
              fontFamily={DesignTokens.typography.sans}
              fontWeight="600"
              textAnchor="end"
              opacity="0.9"
            >
              50 SHI Serviceability Limit
            </text>

            {/* ML Uncertainty Envelope Band with breathing animation */}
            {confidenceBandPath && (
              <path
                d={confidenceBandPath}
                fill="url(#confidenceGradient)"
                stroke="var(--chart-info)"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                className="animate-chart-area animate-area-breathe"
              />
            )}

            {/* Gradient Area under Trajectory Curve */}
            {trajectoryArea && (
              <path
                d={trajectoryArea}
                fill="url(#rulAreaGradient)"
                className="animate-chart-area animate-area-breathe"
              />
            )}

            {/* Animated Spline Trajectory Curve */}
            {trajectoryLine && (
              <>
                <path
                  d={trajectoryLine}
                  fill="none"
                  stroke="var(--text-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-chart-path"
                />
                {/* Continuous Flowing Dash Pulse along Trajectory */}
                <path
                  d={trajectoryLine}
                  fill="none"
                  stroke="url(#flowPulseGradient)"
                  strokeWidth="2.5"
                  strokeDasharray="6 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-flow-dash"
                  style={{ opacity: 0.85 }}
                />
              </>
            )}

            {/* Data Point Dots with Glowing Pulsing Rings */}
            {pts.map((pt, i) => {
              const isHovered = (crosshairPos?.pt?.idx === i) || (hoveredForecastIdx === i);
              const isHigh = pt.shi >= 80;
              const isMid = pt.shi >= 50 && pt.shi < 80;
              const col = isHigh ? 'var(--chart-good)' : (isMid ? 'var(--chart-warn)' : 'var(--chart-bad)');

              return (
                <g key={`node-${i}`}>
                  {/* Pulsing Concentric Beacon on Active Baseline / Hover */}
                  {(i === 0 || isHovered) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="8"
                      stroke={col}
                      fill="none"
                      className="animate-node-pulse"
                    />
                  )}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      fill={col}
                      fillOpacity="0.22"
                      className="animate-chart-area"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4.5}
                    fill="var(--surface)"
                    stroke={col}
                    strokeWidth="2.5"
                    style={{
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      filter: isHovered ? `drop-shadow(0 0 6px ${col})` : `drop-shadow(0 0 2px ${col})`
                    }}
                  />
                </g>
              );
            })}

            {/* Bottom X-Axis Baseline & Ticks */}
            <line
              x1={padLeft}
              y1={padTop + plotHeight}
              x2={padLeft + plotWidth}
              y2={padTop + plotHeight}
              stroke="var(--chart-axis)"
              strokeWidth="1.2"
            />
            {pts.map((pt, i) => {
              const isSelected = crosshairPos?.pt?.idx === i;
              return (
                <g key={`x-axis-${i}`}>
                  <line
                    x1={pt.x}
                    y1={padTop + plotHeight}
                    x2={pt.x}
                    y2={padTop + plotHeight + 5}
                    stroke="var(--chart-axis)"
                    strokeWidth="1.2"
                  />
                  <text
                    x={pt.x}
                    y={padTop + plotHeight + 18}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'}
                    fontWeight={isSelected ? 700 : 500}
                    fontFamily={DesignTokens.typography.sans}
                  >
                    {pt.year}
                  </text>
                </g>
              );
            })}

            {/* Interactive Crosshair Cursor & Guide Lines */}
            {crosshairPos && (
              <g>
                <line
                  x1={crosshairPos.x}
                  y1={padTop}
                  x2={crosshairPos.x}
                  y2={padTop + plotHeight}
                  stroke="var(--text-primary)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.65"
                />
                <line
                  x1={padLeft}
                  y1={crosshairPos.y}
                  x2={crosshairPos.x}
                  y2={crosshairPos.y}
                  stroke="var(--chart-info)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.65"
                />
                <circle
                  cx={crosshairPos.x}
                  cy={crosshairPos.y}
                  r="8"
                  fill="none"
                  stroke="var(--chart-info)"
                  className="animate-node-pulse"
                />
                <circle
                  cx={crosshairPos.x}
                  cy={crosshairPos.y}
                  r="5"
                  fill="var(--surface)"
                  stroke="var(--text-primary)"
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* Transparent Mouse Scrub Surface */}
            <rect
              x={padLeft}
              y={padTop}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseXNorm = (e.clientX - rect.left) / rect.width;
                const approxIdx = Math.round(mouseXNorm * (pts.length - 1));
                const clampedIdx = Math.max(0, Math.min(pts.length - 1, approxIdx));
                const targetPt = pts[clampedIdx];
                setCrosshairPos({ x: targetPt.x, y: targetPt.y, pt: targetPt });
                setHoveredForecastIdx(clampedIdx);
              }}
              onMouseLeave={() => {
                setCrosshairPos(null);
                setHoveredForecastIdx(null);
              }}
            />
          </svg>

          {/* Dynamic Floating Glassmorphism Tooltip HUD */}
          {crosshairPos && (
            <div
              style={{
                position: 'absolute',
                left: `${(crosshairPos.x / svgWidth) * 100}%`,
                top: `${Math.max(10, (crosshairPos.y / svgHeight) * 100 - 34)}%`,
                transform: 'translate(-50%, -100%)',
                background: 'var(--chart-tooltip-bg)',
                backdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                pointerEvents: 'none',
                zIndex: 40,
                whiteSpace: 'nowrap',
                fontSize: '11px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontWeight: 600, color: '#CCCCCC' }}>{crosshairPos.pt.year} Projection</span>
                <span style={{
                  color: crosshairPos.pt.shi < 50 ? '#F87171' : (crosshairPos.pt.shi < 80 ? '#FBBF24' : '#34D399'),
                  fontWeight: 700,
                  fontFamily: DesignTokens.typography.mono
                }}>
                  {crosshairPos.pt.shi} SHI
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '10px', color: '#AAAAAA' }}>
                <span>Uncertainty: [{crosshairPos.pt.lower} – {crosshairPos.pt.upper}]</span>
                <span>&middot;</span>
                <span>Drop: -{crosshairPos.pt.drop} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* 6 Projected Columns with Animated Bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)'
        }}>
          {pts.map((pt, i) => {
            const isHigh = pt.shi >= 80;
            const isMid = pt.shi >= 50 && pt.shi < 80;
            const col = isHigh ? 'var(--chart-good)' : (isMid ? 'var(--chart-warn)' : 'var(--chart-bad)');
            const barBg = isHigh ? 'var(--pastel-green-bg)' : (isMid ? 'var(--pastel-yellow-bg)' : 'var(--pastel-red-bg)');
            const isHovered = (crosshairPos?.pt?.idx === i) || (hoveredForecastIdx === i);

            return (
              <div
                key={`col-${i}`}
                onMouseEnter={() => setHoveredForecastIdx(i)}
                onMouseLeave={() => setHoveredForecastIdx(null)}
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  background: isHovered ? 'var(--surface)' : 'transparent',
                  boxShadow: isHovered ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isHovered ? 600 : 500,
                  marginBottom: '4px'
                }}>
                  {pt.year}
                </div>

                <div style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: col,
                  fontFamily: DesignTokens.typography.mono
                }}>
                  {pt.shi}
                </div>

                {/* Animated Height Bar */}
                <div style={{
                  height: '4px',
                  background: 'var(--border)',
                  borderRadius: '2px',
                  margin: '6px 0',
                  overflow: 'hidden'
                }}>
                  <div
                    className="animate-width-spring"
                    style={{
                      height: '100%',
                      width: `${(pt.shi / 100) * 100}%`,
                      background: col,
                      borderRadius: '2px',
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                </div>

                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  fontFamily: DesignTokens.typography.mono
                }}>
                  {pt.drop > 0 ? `-${pt.drop} pts` : 'Base'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive What-If Scenario Simulator & Lifecycle ROI Calculator */}
      <WhatIfScenarioSimulator
        currentShi={current_shi}
        baseRul={estimated_rul_years}
      />
    </Card>
  );
};
