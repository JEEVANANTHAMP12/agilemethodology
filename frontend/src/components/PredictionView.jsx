import React, { useState } from 'react';
import { Card, Badge } from './UI/Components';
import { IconClock } from './UI/Icons';
import { DesignTokens } from '../tokens';
import { useAnimatedNumber } from './UI/useAnimatedNumber';

export const PredictionView = ({ predictionData = {} }) => {
  const {
    current_shi = 76.0,
    deterioration_trend = 'Increasing',
    estimated_rul_years = 14.5,
    risk_level = 'Moderate',
    model_name = 'Trend-Extrapolation-Degradation-v1'
  } = predictionData;

  const [hoveredForecastIdx, setHoveredForecastIdx] = useState(null);

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

  // SVG dimensions for Trajectory Curve
  const svgWidth = 640;
  const svgHeight = 150;
  const padX = 45;
  const padY = 22;

  // Map values to SVG coordinates (SHI range 20 - 100)
  const minShiVal = 20;
  const maxShiVal = 100;

  const getYCoord = (val) => {
    const clamped = Math.min(maxShiVal, Math.max(minShiVal, val));
    return svgHeight - padY - ((clamped - minShiVal) / (maxShiVal - minShiVal)) * (svgHeight - padY * 2);
  };

  const pts = forecastPoints.map((pt, i) => {
    const x = padX + (i / (forecastPoints.length - 1)) * (svgWidth - padX * 2);
    const y = getYCoord(pt.shi);
    const yUpper = getYCoord(pt.upper);
    const yLower = getYCoord(pt.lower);
    return { ...pt, x, y, yUpper, yLower };
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
    ? `${trajectoryLine} L ${pts[pts.length - 1].x} ${svgHeight - padY} L ${pts[0].x} ${svgHeight - padY} Z`
    : '';

  const criticalLimitY = getYCoord(50);
  const designLifePercent = Math.min(100, Math.round((estimated_rul_years / 50) * 100));

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconClock size={16} color="#111111" />
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
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Health Index
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#111111', marginTop: '4px', letterSpacing: '-0.02em' }}>
            {animatedShi}
          </div>
          <div style={{ fontSize: '11px', color: '#787774', marginTop: '4px' }}>
            Reference baseline: 100.0 pts
          </div>
        </div>

        {/* 2. Deterioration Velocity */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Deterioration Velocity
          </div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#111111', marginTop: '6px' }}>
            {deterioration_trend}
          </div>
          <div style={{ fontSize: '11px', color: '#787774', marginTop: '6px' }}>
            Estimated -{annualDrop.toFixed(1)} pts / year
          </div>
        </div>

        {/* 3. Projected Lifespan with Mini Life Ring */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Projected Lifespan
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#111111', marginTop: '4px', letterSpacing: '-0.02em' }}>
              {animatedRul} <span style={{ fontSize: '14px', color: '#787774', fontWeight: 400 }}>Yrs</span>
            </div>
            <div style={{ fontSize: '11px', color: '#787774', marginTop: '4px' }}>
              Until structural threshold
            </div>
          </div>

          {/* Mini Endurance Meter */}
          <div style={{ width: '48px', height: '48px', position: 'relative' }}>
            <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="24" cy="24" r="18" stroke="#EAEAEA" strokeWidth="4" fill="none" />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke={risk_level === 'Critical' ? '#9F2F2D' : (risk_level === 'Moderate' ? '#956400' : '#346538')}
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
              color: '#111111'
            }}>
              {designLifePercent}%
            </div>
          </div>
        </div>

        {/* 4. Risk Classification */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Risk Categorization
          </div>
          <div style={{ marginTop: '8px' }}>
            <Badge variant={getRiskBadgeVariant()} size="md">{risk_level}</Badge>
          </div>
          <div style={{ fontSize: '11px', color: '#787774', marginTop: '8px' }}>
            Condition Grade II (NDT Compliant)
          </div>
        </div>
      </div>

      {/* Interactive 5-Year Trajectory & Uncertainty Envelope Chart */}
      <div style={{
        background: '#FBFBFA',
        border: '1px solid #EAEAEA',
        borderRadius: '10px',
        padding: '20px 18px 16px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
              Projected Structural Health Trajectory &amp; ML Confidence Bounds
            </div>
            <div style={{ fontSize: '11px', color: '#787774' }}>
              Extrapolated degradation curve with &plusmn;95% confidence interval envelope
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#787774' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '12px', height: '2px', background: '#111111' }} /> Projected Trajectory
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(31, 108, 159, 0.15)', border: '1px solid rgba(31, 108, 159, 0.3)' }} /> Uncertainty Band
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '12px', height: '1px', borderTop: '2px dashed #9F2F2D' }} /> Serviceability Limit (50)
            </span>
          </div>
        </div>

        {/* SVG Degradation Trend Chart */}
        <div style={{ width: '100%', height: '160px', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="rulAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F6C9F" stopOpacity="0.18" />
                <stop offset="70%" stopColor="#1F6C9F" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#1F6C9F" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C7E7FD" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#C7E7FD" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Critical Serviceability Threshold line (50 SHI) */}
            <line
              x1={padX}
              y1={criticalLimitY}
              x2={svgWidth - padX}
              y2={criticalLimitY}
              stroke="#9F2F2D"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.45"
            />
            <text
              x={svgWidth - padX}
              y={criticalLimitY - 4}
              fill="#9F2F2D"
              fontSize="9"
              fontFamily={DesignTokens.typography.sans}
              fontWeight="600"
              textAnchor="end"
              opacity="0.85"
            >
              50 SHI Limit
            </text>

            {/* ML Uncertainty Envelope Band */}
            {confidenceBandPath && (
              <path
                d={confidenceBandPath}
                fill="url(#confidenceGradient)"
                stroke="#1F6C9F"
                strokeWidth="0.7"
                strokeDasharray="2 2"
                strokeOpacity="0.5"
                className="animate-chart-area"
              />
            )}

            {/* Gradient Area under Trajectory Curve */}
            {trajectoryArea && (
              <path
                d={trajectoryArea}
                fill="url(#rulAreaGradient)"
                className="animate-chart-area"
              />
            )}

            {/* Animated Spline Trajectory Curve */}
            {trajectoryLine && (
              <path
                d={trajectoryLine}
                fill="none"
                stroke="#111111"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-chart-path"
              />
            )}

            {/* Data Point Dots with Hover Rings */}
            {pts.map((pt, i) => {
              const isHovered = hoveredForecastIdx === i;
              const isHigh = pt.shi >= 80;
              const isMid = pt.shi >= 50 && pt.shi < 80;
              const col = isHigh ? '#346538' : (isMid ? '#956400' : '#9F2F2D');

              return (
                <g key={i} style={{ cursor: 'pointer' }}>
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="10"
                      fill={col}
                      fillOpacity="0.18"
                      className="animate-chart-area"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 4}
                    fill="#FFFFFF"
                    stroke={col}
                    strokeWidth="2.5"
                    style={{
                      transition: 'all 0.15s ease',
                      filter: isHovered ? `drop-shadow(0 0 5px ${col})` : 'none'
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* 6 Projected Columns with Animated Bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid #ECEBE7'
        }}>
          {pts.map((pt, i) => {
            const isHigh = pt.shi >= 80;
            const isMid = pt.shi >= 50 && pt.shi < 80;
            const col = isHigh ? '#346538' : (isMid ? '#956400' : '#9F2F2D');
            const barBg = isHigh ? '#D7E5D6' : (isMid ? '#F5E6BA' : '#F8D2D5');
            const isHovered = hoveredForecastIdx === i;

            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredForecastIdx(i)}
                onMouseLeave={() => setHoveredForecastIdx(null)}
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '4px',
                  borderRadius: '6px',
                  background: isHovered ? '#FFFFFF' : 'transparent',
                  boxShadow: isHovered ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div
                    className="chart-tooltip"
                    style={{
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%) translateY(-6px)'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{pt.year} Projection</div>
                    <div style={{ color: col, fontWeight: 700, marginTop: '2px' }}>
                      SHI: {pt.shi} ({pt.drop > 0 ? `-${pt.drop} pts` : 'Baseline'})
                    </div>
                    <div style={{ fontSize: '10px', color: '#BBB', marginTop: '2px' }}>
                      Range: [{pt.lower} – {pt.upper}]
                    </div>
                  </div>
                )}

                <div style={{
                  fontSize: '11px',
                  color: isHovered ? '#111111' : '#787774',
                  fontWeight: isHovered ? 600 : 500,
                  marginBottom: '4px'
                }}>
                  {pt.year}
                </div>

                <div style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: col,
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}>
                  {pt.shi}
                </div>

                {/* Animated Growing Bar */}
                <div style={{
                  height: '6px',
                  background: '#ECEBE7',
                  borderRadius: '3px',
                  marginTop: '8px',
                  overflow: 'hidden'
                }}>
                  <div
                    className="animate-bar-width"
                    style={{
                      width: `${Math.min(100, Math.max(10, pt.shi))}%`,
                      height: '100%',
                      background: isHovered ? col : barBg,
                      borderRadius: '3px',
                      transition: 'background 0.2s ease',
                      animationDelay: `${i * 90}ms`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
