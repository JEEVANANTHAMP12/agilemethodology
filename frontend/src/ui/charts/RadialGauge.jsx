import React, { useId } from 'react';
import { cx } from '../utils/cx';

const TONE_COLORS = {
  success: 'var(--chart-good)',
  warning: 'var(--chart-warn)',
  danger: 'var(--chart-bad)',
  info: 'var(--chart-info)',
  accent: 'var(--chart-accent)',
};

function autoTone(percent) {
  if (percent < 50) return 'danger';
  if (percent < 80) return 'warning';
  return 'success';
}

export function RadialGauge({
  value = 0,
  max = 100,
  size = 168,
  thickness = 10,
  tone,
  color,
  label,
  sublabel,
  valueText,
  decimals = 1,
  showTicks = true,
  className = '',
}) {
  const gradientId = `gauge-${useId().replace(/:/g, '')}`;
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const resolvedTone = tone || autoTone(percent);
  const resolvedColor = color || TONE_COLORS[resolvedTone] || TONE_COLORS.accent;

  const radius = (size - thickness * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const ticks = 12;

  return (
    <div className={cx('ui-gauge', className)} style={{ width: size, height: size }}>
      <svg className="ui-gauge__svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label || 'Gauge'}: ${value} of ${max}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.65" />
            <stop offset="100%" stopColor={resolvedColor} stopOpacity="1" />
          </linearGradient>
        </defs>

        {showTicks &&
          Array.from({ length: ticks }, (_, index) => {
            const angle = (index * 360) / ticks;
            const radians = (angle * Math.PI) / 180;
            const inner = radius - thickness - 6;
            const outer = radius - thickness - 2;
            return (
              <line
                key={index}
                className="ui-gauge__tick"
                x1={center + inner * Math.cos(radians)}
                y1={center + inner * Math.sin(radians)}
                x2={center + outer * Math.cos(radians)}
                y2={center + outer * Math.sin(radians)}
              />
            );
          })}

        <circle className="ui-gauge__track" cx={center} cy={center} r={radius} strokeWidth={thickness} />
        <circle
          className="ui-gauge__value"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={thickness}
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ color: resolvedColor }}
        />
      </svg>
      <div className="ui-gauge__center">
        <span className="ui-gauge__value-text" style={{ fontSize: Math.max(20, size * 0.17) }}>
          {valueText ?? Number(value).toFixed(decimals)}
        </span>
        {label && <span className="ui-gauge__label">{label}</span>}
        {sublabel && <span className="ui-gauge__sub">{sublabel}</span>}
      </div>
    </div>
  );
}
