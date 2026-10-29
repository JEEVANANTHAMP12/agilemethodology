import React from 'react';
import { cx } from '../utils/cx';

export function BarChart({
  data = [],
  height = 160,
  max,
  formatValue = (value) => value,
  color = 'var(--chart-accent)',
  className = '',
  ariaLabel = 'Bar chart',
}) {
  const maxValue = max ?? Math.max(1, ...data.map((item) => Number(item.value) || 0));

  return (
    <div className={cx('ui-chart', className)} style={{ height }} role="img" aria-label={ariaLabel}>
      <div className="ui-bars">
        {data.map((item) => {
          const value = Number(item.value) || 0;
          const percent = Math.max(0, Math.min(100, (value / maxValue) * 100));
          return (
            <div className="ui-bars__col" key={item.label}>
              <span className="ui-bars__value">{formatValue(value)}</span>
              <div className="ui-bars__track">
                <div
                  className="ui-bars__bar"
                  style={{
                    height: `${percent}%`,
                    background: item.color
                      ? `linear-gradient(180deg, ${item.color}, color-mix(in srgb, ${item.color} 55%, transparent))`
                      : undefined,
                    '--ui-bar-color': color,
                  }}
                  title={`${item.label}: ${formatValue(value)}`}
                />
              </div>
              <span className="ui-bars__label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
