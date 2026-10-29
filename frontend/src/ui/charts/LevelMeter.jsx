import React from 'react';
import { cx } from '../utils/cx';

export function LevelMeter({ value = 0, bars = 4, tone = 'success', className = '', ariaLabel = 'Signal level' }) {
  const normalized = Math.min(100, Math.max(0, value));
  const active = Math.round((normalized / 100) * bars);

  return (
    <span className={cx('ui-level', `ui-level--${tone}`, className)} role="img" aria-label={`${ariaLabel}: ${Math.round(normalized)}%`}>
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className={cx('ui-level__bar', index < active && 'is-on')}
          style={{ height: `${6 + index * 3}px` }}
        />
      ))}
    </span>
  );
}
