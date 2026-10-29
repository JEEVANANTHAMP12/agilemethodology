import React, { useId, useMemo, useState } from 'react';
import { cx } from '../utils/cx';
import { buildAreaPath, buildBandPath, buildSplinePath, niceTicks } from './path';

const DEFAULT_PALETTE = [
  'var(--chart-accent)',
  'var(--chart-info)',
  'var(--chart-good)',
  'var(--chart-warn)',
  'var(--chart-bad)',
];

function normalizeSeries(series, data, color) {
  if (series?.length) {
    return series.map((item, index) => ({
      name: item.name || `Series ${index + 1}`,
      color: item.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
      data: item.data || [],
    }));
  }
  return [{ name: 'Value', color: color || DEFAULT_PALETTE[0], data: data || [] }];
}

export function LineChart({
  data = [],
  series,
  color,
  height = 240,
  yDomain,
  yTicks: yTicksProp,
  area = true,
  areaOpacity = 1,
  band = null,
  thresholds = [],
  showDots = true,
  showLegend = false,
  xLabel,
  yLabel,
  valueSuffix = '',
  formatValue = (value) => value,
  formatX = (value) => value,
  className = '',
  ariaLabel = 'Line chart',
  emptyMessage = 'No data available.',
}) {
  const gradientId = `line-${useId().replace(/:/g, '')}`;
  const [activeIndex, setActiveIndex] = useState(null);

  const normalized = useMemo(() => normalizeSeries(series, data, color), [series, data, color]);
  const primary = normalized[0];
  const pointsData = primary?.data || [];

  const width = 760;
  const padLeft = 44;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 32;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const allValues = normalized.flatMap((item) => item.data.map((point) => Number(point.y))).filter(Number.isFinite);
  const bandValues = band
    ? pointsData.flatMap((point) => [Number(point[band.lowerKey]), Number(point[band.upperKey])]).filter(Number.isFinite)
    : [];
  const thresholdValues = thresholds.map((threshold) => Number(threshold.value)).filter(Number.isFinite);
  const autoMin = Math.min(0, ...allValues, ...bandValues, ...thresholdValues);
  const autoMax = Math.max(1, ...allValues, ...bandValues, ...thresholdValues);
  const domain = yDomain || [autoMin, Math.ceil(autoMax * 1.08)];
  const [domainMin, domainMax] = domain;
  const domainSpan = domainMax - domainMin || 1;

  const yTicks = yTicksProp || niceTicks(domainMin, domainMax, 4);
  const getX = (index) => padLeft + (index / Math.max(1, pointsData.length - 1)) * plotWidth;
  const getY = (value) => padTop + plotHeight - ((Number(value) - domainMin) / domainSpan) * plotHeight;

  const seriesPoints = normalized.map((item) => ({
    ...item,
    points: item.data.map((point, index) => ({
      ...point,
      x: getX(index),
      y: getY(point.y),
    })),
  }));

  const primaryPoints = seriesPoints[0]?.points || [];

  const bandUpper = band
    ? primaryPoints.map((point, index) => ({ x: point.x, y: getY(pointsData[index][band.upperKey]) }))
    : [];
  const bandLower = band
    ? primaryPoints.map((point, index) => ({ x: point.x, y: getY(pointsData[index][band.lowerKey]) }))
    : [];
  const bandPath = band ? buildBandPath(bandUpper, bandLower) : '';

  const activePoint = activeIndex != null ? primaryPoints[activeIndex] : null;
  const activeData = activeIndex != null ? pointsData[activeIndex] : null;
  const xTickStep = Math.max(1, Math.ceil(pointsData.length / 8));

  if (pointsData.length === 0) {
    return <div className={cx('ui-chart', className)} style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>{emptyMessage}</div>;
  }

  return (
    <div className={cx('ui-chart', className)}>
      <svg
        className="ui-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        style={{ height }}
        onMouseLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary.color} stopOpacity="0.28" />
            <stop offset="70%" stopColor={primary.color} stopOpacity="0.05" />
            <stop offset="100%" stopColor={primary.color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={`tick-${tick}`}>
              <line className="ui-chart__grid-line" x1={padLeft} y1={y} x2={width - padRight} y2={y} />
              <text className="ui-chart__tick" x={padLeft - 9} y={y + 3.5} textAnchor="end">
                {formatValue(tick)}
              </text>
            </g>
          );
        })}

        {yLabel && (
          <text
            className="ui-chart__axis-label"
            x={12}
            y={padTop + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${padTop + plotHeight / 2})`}
          >
            {yLabel}
          </text>
        )}

        {thresholds.map((threshold) => {
          const y = getY(threshold.value);
          return (
            <g key={`threshold-${threshold.value}`}>
              <line
                className="ui-chart__threshold"
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke={threshold.color || 'var(--chart-bad)'}
              />
              {threshold.label && (
                <text
                  className="ui-chart__threshold-label"
                  x={width - padRight}
                  y={y - 4}
                  textAnchor="end"
                  fill={threshold.color || 'var(--chart-bad)'}
                >
                  {threshold.label}
                </text>
              )}
            </g>
          );
        })}

        {bandPath && (
          <path
            className="ui-chart__band"
            d={bandPath}
            fill={band.color || 'var(--chart-info)'}
            fillOpacity={band.opacity ?? 0.16}
            stroke={band.color || 'var(--chart-info)'}
            strokeOpacity="0.35"
            strokeDasharray="3 3"
          />
        )}

        {area && seriesPoints.map((item, index) => {
          const areaPath = buildAreaPath(item.points, padTop + plotHeight);
          if (!areaPath) return null;
          return (
            <path
              key={`area-${item.name}`}
              className="ui-chart__area"
              d={areaPath}
              fill={index === 0 ? `url(#${gradientId})` : item.color}
              fillOpacity={index === 0 ? areaOpacity : 0.08}
            />
          );
        })}

        {seriesPoints.map((item, index) => (
          <path
            key={`line-${item.name}`}
            className={cx('ui-chart__line', index > 0 && 'ui-chart__line--dashed')}
            d={buildSplinePath(item.points)}
            stroke={item.color}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {showDots && primaryPoints.map((point, index) => {
          const isActive = activeIndex === index;
          return (
            <circle
              key={`dot-${index}`}
              className={cx('ui-chart__dot', isActive && 'is-active')}
              cx={point.x}
              cy={point.y}
              r={isActive ? 5.5 : 3.5}
              fill={primary.color}
            />
          );
        })}

        <line className="ui-chart__axis" x1={padLeft} y1={padTop + plotHeight} x2={width - padRight} y2={padTop + plotHeight} />

        {pointsData.map((point, index) => {
          if (index % xTickStep !== 0 && index !== pointsData.length - 1) return null;
          const x = getX(index);
          return (
            <g key={`x-${index}`}>
              <line className="ui-chart__axis" x1={x} y1={padTop + plotHeight} x2={x} y2={padTop + plotHeight + 4} />
              <text className="ui-chart__tick" x={x} y={padTop + plotHeight + 16} textAnchor="middle">
                {formatX(point.x, index)}
              </text>
            </g>
          );
        })}

        {xLabel && (
          <text className="ui-chart__axis-label" x={padLeft + plotWidth / 2} y={height - 2} textAnchor="middle">
            {xLabel}
          </text>
        )}

        {activePoint && (
          <g>
            <line className="ui-chart__cursor" x1={activePoint.x} y1={padTop} x2={activePoint.x} y2={padTop + plotHeight} />
            {seriesPoints.map((item) => {
              const point = item.points[activeIndex];
              return point ? (
                <circle key={`active-${item.name}`} cx={point.x} cy={point.y} r="4" fill={item.color} stroke="var(--surface)" strokeWidth="2" />
              ) : null;
            })}
          </g>
        )}

        <rect
          className="ui-chart__hitbox"
          x={padLeft}
          y={padTop}
          width={plotWidth}
          height={plotHeight}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            const index = Math.round(fraction * (pointsData.length - 1));
            setActiveIndex(index);
          }}
        />
      </svg>

      {activePoint && activeData && (
        <div
          className="ui-chart__tooltip"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${Math.max(8, (activePoint.y / height) * 100 - 2)}%`,
          }}
        >
          <div className="ui-chart__tooltip-title">{formatX(activeData.x, activeIndex)}</div>
          {seriesPoints.map((item) => {
            const point = item.data[activeIndex];
            return (
              <div className="ui-chart__tooltip-row" key={`tooltip-${item.name}`}>
                <span>{item.name}</span>
                <span className="ui-chart__tooltip-value">
                  {formatValue(point?.y)}{valueSuffix}
                </span>
              </div>
            );
          })}
          {band && (
            <div className="ui-chart__tooltip-row">
              <span>Range</span>
              <span className="ui-chart__tooltip-value">
                {formatValue(activeData[band.lowerKey])}–{formatValue(activeData[band.upperKey])}
              </span>
            </div>
          )}
        </div>
      )}

      {showLegend && seriesPoints.length > 1 && (
        <div className="ui-chart__legend" style={{ marginTop: 8 }}>
          {seriesPoints.map((item) => (
            <span className="ui-chart__legend-item" key={`legend-${item.name}`}>
              <span className="ui-chart__legend-swatch" style={{ background: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
