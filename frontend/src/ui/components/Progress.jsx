import React from 'react';
import { cx } from '../utils/cx';

export function Progress({
  value = 0,
  max = 100,
  label,
  hint,
  showValue = true,
  valueText,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cx('ui-progress', `ui-progress--${size}`, `ui-progress--${variant}`, className)}>
      {(label || showValue) && (
        <div className="ui-progress__meta">
          <span>{label}</span>
          {showValue && (
            <span className="ui-progress__value">{valueText ?? `${Math.round(percent)}%`}</span>
          )}
        </div>
      )}
      <div
        className="ui-progress__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <div className="ui-progress__bar" style={{ width: `${percent}%` }} />
      </div>
      {hint && <span className="ui-field__hint">{hint}</span>}
    </div>
  );
}
