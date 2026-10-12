import React, { useState } from 'react';
import { Card, Badge } from './UI/Components';
import { IconActivity } from './UI/Icons';
import { DesignTokens } from '../tokens';
import { useAnimatedNumber } from './UI/useAnimatedNumber';

export const HealthAnalysis = ({ healthData = {} }) => {
  const {
    shi_score = 82.0,
    health_status = 'HEALTHY',
    crack_penalty = 10.5,
    age_penalty = 4.2,
    env_penalty = 3.3,
    historical_trend = []
  } = healthData;

  const [hoveredHistoryIdx, setHoveredHistoryIdx] = useState(null);

  // Smooth animated count-up numbers
  const animatedShi = useAnimatedNumber(shi_score, 1100, 1);
  const animatedCrackPenalty = useAnimatedNumber(crack_penalty, 900, 1);
  const animatedAgePenalty = useAnimatedNumber(age_penalty, 900, 1);
  const animatedEnvPenalty = useAnimatedNumber(env_penalty, 900, 1);

  const getStatusBadgeVariant = (status = health_status) => {
    if (status === 'CRITICAL') return 'danger';
    if (status !== 'HEALTHY') return 'warning';
    return 'success';
  };

  const getGaugeColor = (score = shi_score) => {
    if (score < 50) return '#9F2F2D';
    if (score < 80) return '#956400';
    return '#346538';
  };

  // Circular gauge parameters
  const radius = 72;
  const stroke = 9;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, shi_score)) / 100) * circumference;

  // Tip marker position on circle
  const progressRatio = Math.min(100, Math.max(0, shi_score)) / 100;
  const angleDeg = -90 + progressRatio * 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  const tipX = radius + normalizedRadius * Math.cos(angleRad);
  const tipY = radius + normalizedRadius * Math.sin(angleRad);

  // SVG dimensions for historical trend
  const svgWidth = 600;
  const svgHeight = 130;
  const paddingX = 40;
  const paddingY = 24;

  const trendPoints = historical_trend.map((pt, idx) => {
    const total = Math.max(1, historical_trend.length - 1);
    const x = paddingX + (idx / total) * (svgWidth - paddingX * 2);
    // Y mapped from SHI 0-100 to svg coordinates (higher SHI is near top)
    const y = svgHeight - paddingY - (pt.shi_score / 100) * (svgHeight - paddingY * 2);
    return { ...pt, x, y };
  });

  // Generate smooth SVG curve path string (Bezier Catmull-Rom/Monotone)
  const generatePath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = generatePath(trendPoints);
  const areaPath = trendPoints.length > 0
    ? `${linePath} L ${trendPoints[trendPoints.length - 1].x} ${svgHeight - paddingY} L ${trendPoints[0].x} ${svgHeight - paddingY} Z`
    : '';

  const healthyBaselineY = svgHeight - paddingY - (80 / 100) * (svgHeight - paddingY * 2);

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconActivity size={16} color="#111111" />
          <span>Structural Health Index (SHI)</span>
        </div>
      }
      subtitle="Multi-parameter normalized structural integrity model"
      tag={<Badge variant={getStatusBadgeVariant()}>{health_status}</Badge>}
      style={{ marginBottom: '24px' }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Animated Minimalist Radial Gauge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px 24px',
          background: '#FBFBFA',
          border: '1px solid #EAEAEA',
          borderRadius: '10px',
          position: 'relative'
        }}>
          <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
            <svg
              height={radius * 2}
              width={radius * 2}
              style={{ overflow: 'visible' }}
            >
              {/* Radial Ticks */}
              {[...Array(12)].map((_, i) => {
                const tickAngle = (i * 30 * Math.PI) / 180;
                const rInner = normalizedRadius - 8;
                const rOuter = normalizedRadius - 4;
                const x1 = radius + rInner * Math.cos(tickAngle);
                const y1 = radius + rInner * Math.sin(tickAngle);
                const x2 = radius + rOuter * Math.cos(tickAngle);
                const y2 = radius + rOuter * Math.sin(tickAngle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#E5E5E5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Background Track */}
              <circle
                stroke="#EFEFEF"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />

              {/* Animated Foreground Progress Circle */}
              <circle
                stroke={getGaugeColor()}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.6s ease',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />

              {/* Glowing Pointer Bead at Gauge Tip */}
              {progressRatio > 0.02 && (
                <g style={{ transition: 'all 1.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r={stroke * 0.9}
                    fill={getGaugeColor()}
                    style={{
                      filter: `drop-shadow(0 0 4px ${getGaugeColor()})`,
                      animation: 'pulseBeacon 2.4s infinite'
                    }}
                  />
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r={stroke * 0.4}
                    fill="#FFFFFF"
                  />
                </g>
              )}
            </svg>

            {/* Inner Center Numeric Readout */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                fontSize: '34px',
                fontWeight: 700,
                color: '#111111',
                letterSpacing: '-0.03em',
                lineHeight: 1
              }}>
                {animatedShi}
              </div>
              <div style={{ fontSize: '10px', color: '#787774', fontWeight: 600, marginTop: '4px', letterSpacing: '0.04em' }}>
                OUT OF 100
              </div>
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <Badge variant={getStatusBadgeVariant()} size="md">
              Classification: {health_status}
            </Badge>
          </div>

          <div style={{ marginTop: '12px', fontSize: '11px', color: '#787774', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#346538', fontWeight: 500 }}>Healthy 80–100</span>
            <span>&middot;</span>
            <span style={{ color: '#956400', fontWeight: 500 }}>Moderate 50–79</span>
            <span>&middot;</span>
            <span style={{ color: '#9F2F2D', fontWeight: 500 }}>Critical &lt;50</span>
          </div>
        </div>

        {/* Penalty Deduction Breakdown with Animated Fill */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
              Parameter Deduction Analysis
            </span>
            <span style={{ fontSize: '11px', color: '#787774' }}>
              Base: 100.0 pts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Crack Severity Bar */}
            <div style={{
              background: '#FBFBFA',
              border: '1px solid #EAEAEA',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: '#111111', fontWeight: 600 }}>Crack Severity &amp; Dimensions</span>
                <span style={{ color: '#9F2F2D', fontWeight: 700, fontFamily: DesignTokens.typography.mono }}>
                  -{animatedCrackPenalty} pts
                </span>
              </div>
              <div style={{ height: '7px', background: '#EFEFEF', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (crack_penalty / 50) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #F8D2D5 0%, #E87A82 100%)',
                    borderRadius: '4px',
                    transition: 'width 1.1s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#787774', marginTop: '6px' }}>
                <span>Sub-pixel aperture &amp; fissure length</span>
                <span>Max allocation: 50 pts</span>
              </div>
            </div>

            {/* 2. Building Age Bar */}
            <div style={{
              background: '#FBFBFA',
              border: '1px solid #EAEAEA',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: '#111111', fontWeight: 600 }}>Building Age &amp; Typology</span>
                <span style={{ color: '#956400', fontWeight: 700, fontFamily: DesignTokens.typography.mono }}>
                  -{animatedAgePenalty} pts
                </span>
              </div>
              <div style={{ height: '7px', background: '#EFEFEF', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (age_penalty / 20) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #F5E6BA 0%, #D4A832 100%)',
                    borderRadius: '4px',
                    transition: 'width 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#787774', marginTop: '6px' }}>
                <span>Concrete carbonation &amp; cure age</span>
                <span>Max allocation: 20 pts</span>
              </div>
            </div>

            {/* 3. Environmental Telemetry Bar */}
            <div style={{
              background: '#FBFBFA',
              border: '1px solid #EAEAEA',
              borderRadius: '8px',
              padding: '12px 14px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: '#111111', fontWeight: 600 }}>Environmental &amp; Tilt Telemetry</span>
                <span style={{ color: '#1F6C9F', fontWeight: 700, fontFamily: DesignTokens.typography.mono }}>
                  -{animatedEnvPenalty} pts
                </span>
              </div>
              <div style={{ height: '7px', background: '#EFEFEF', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (env_penalty / 15) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #C7E7FD 0%, #4D9FD9 100%)',
                    borderRadius: '4px',
                    transition: 'width 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#787774', marginTop: '6px' }}>
                <span>Ambient RH, temperature swing &amp; tilt</span>
                <span>Max allocation: 15 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Trend Progression - Hybrid Animated Curve & Column Visualization */}
      {historical_trend.length > 0 && (
        <div style={{ marginTop: '28px', paddingTop: '22px', borderTop: '1px solid #F0F0EE' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111111' }}>
                Historical Inspection Health Progression
              </div>
              <div style={{ fontSize: '11px', color: '#787774' }}>
                Timeline tracking Structural Health Index (SHI) across autonomous robot cycles
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#787774' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#346538' }} /> Healthy (&ge;80)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#956400' }} /> Moderate (50–79)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#9F2F2D' }} /> Critical (&lt;50)
              </span>
            </div>
          </div>

          <div style={{
            background: '#FBFBFA',
            borderRadius: '10px',
            border: '1px solid #EAEAEA',
            padding: '20px 16px 16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* SVG Trendline Layer */}
            <div style={{ width: '100%', height: '140px', position: 'relative' }}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#346538" stopOpacity="0.22" />
                    <stop offset="60%" stopColor="#346538" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#346538" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Healthy Baseline Reference Line (SHI = 80) */}
                <line
                  x1={paddingX}
                  y1={healthyBaselineY}
                  x2={svgWidth - paddingX}
                  y2={healthyBaselineY}
                  stroke="#346538"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.35"
                />
                <text
                  x={svgWidth - paddingX}
                  y={healthyBaselineY - 4}
                  fill="#346538"
                  fontSize="9"
                  fontFamily={DesignTokens.typography.sans}
                  textAnchor="end"
                  opacity="0.8"
                >
                  80 Baseline
                </text>

                {/* Gradient Area under curve */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#historyGradient)"
                    className="animate-chart-area"
                  />
                )}

                {/* Animated Trajectory Spline Curve */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#111111"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-chart-path"
                  />
                )}

                {/* Interactive Points on Spline */}
                {trendPoints.map((pt, idx) => {
                  const col = getGaugeColor(pt.shi_score);
                  const isHovered = hoveredHistoryIdx === idx;
                  return (
                    <g key={idx} style={{ cursor: 'pointer' }}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        fill="#FFFFFF"
                        stroke={col}
                        strokeWidth="2.5"
                        style={{
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          filter: isHovered ? `drop-shadow(0 0 6px ${col})` : 'none'
                        }}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Animated Column Bars & Labels */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
              paddingTop: '8px',
              borderTop: '1px solid #ECEBE7'
            }}>
              {historical_trend.map((pt, idx) => {
                const col = getGaugeColor(pt.shi_score);
                const barBg = pt.health_status === 'CRITICAL' ? '#F8D2D5' : (pt.health_status === 'MODERATE' ? '#F5E6BA' : '#D7E5D6');
                const isHovered = hoveredHistoryIdx === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredHistoryIdx(idx)}
                    onMouseLeave={() => setHoveredHistoryIdx(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: '60px',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div
                        className="chart-tooltip"
                        style={{
                          bottom: '100%',
                          marginBottom: '8px',
                          transform: 'translateY(-4px)'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '11px', color: '#FFF' }}>{pt.date}</div>
                        <div style={{ color: col, marginTop: '2px', fontWeight: 700 }}>
                          SHI: {pt.shi_score} &middot; {pt.health_status}
                        </div>
                      </div>
                    )}

                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: col,
                      marginBottom: '6px',
                      transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}>
                      {pt.shi_score}
                    </span>

                    {/* Animated Growing Bar */}
                    <div
                      className="animate-bar-grow"
                      style={{
                        width: '100%',
                        maxWidth: '44px',
                        height: `${Math.max(14, (pt.shi_score / 100) * 58)}px`,
                        background: isHovered ? col : barBg,
                        border: `1px solid ${col}`,
                        borderRadius: '4px 4px 0 0',
                        animationDelay: `${idx * 100}ms`,
                        transition: 'background 0.2s ease, transform 0.2s ease',
                        boxShadow: isHovered ? `0 2px 8px ${col}44` : 'none'
                      }}
                    />

                    <span style={{
                      fontSize: '10px',
                      color: isHovered ? '#111111' : '#787774',
                      fontWeight: isHovered ? 600 : 400,
                      marginTop: '6px',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s ease'
                    }}>
                      {pt.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
