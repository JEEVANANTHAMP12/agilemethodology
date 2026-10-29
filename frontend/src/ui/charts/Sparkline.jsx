import React, { useId } from 'react';
import { cx } from '../utils/cx';
import { buildAreaPath, buildSplinePath } from './path';

export function Sparkline({
  data = [],
  width = 120,
  height = 32,
  color = 'var(--chart-info)',
  fill = true,
  showDot = true,
  className = '',
  ariaLabel = 'Trend sparkline',
}) {
  const gradientId = `spark-${useId().replace(/:/g, '')}`;
  const values = data.map((point) => (typeof point === 'number' ? point : point.y));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pad = 3;

  const points = values.map((value, index) => ({
    x: pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / span) * (height - pad * 2),
  }));

  const line = buildSplinePath(points);
  const area = buildAreaPath(points, height);
  const last = points[points.length - 1];

  if (points.length === 0) return null;

  return (
    <svg
      className={cx('ui-sparkline', className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path className="ui-sparkline__area" d={area} fill={`url(#${gradientId})`} />}
      <path className="ui-sparkline__line" d={line} stroke={color} vectorEffect="non-scaling-stroke" />
      {showDot && last && (
        <circle className="ui-sparkline__dot" cx={last.x} cy={last.y} r="2.2" fill={color} />
      )}
    </svg>
  );
}
