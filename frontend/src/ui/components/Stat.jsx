import React from 'react';
import { cx } from '../utils/cx';

export function Stat({
  label,
  value,
  unit,
  hint,
  icon,
  tone = 'default',
  footer,
  className = '',
  children,
  ...props
}) {
  return (
    <div className={cx('ui-stat', tone !== 'default' && `ui-stat--${tone}`, className)} {...props}>
      <div className="ui-stat__top">
        <span className="ui-stat__label">{label}</span>
        {icon && <span className="ui-stat__icon">{icon}</span>}
      </div>
      {value != null && (
        <div className="ui-stat__value">
          {value}
          {unit && <span className="ui-stat__unit">{unit}</span>}
        </div>
      )}
      {children}
      {hint && <div className="ui-stat__hint">{hint}</div>}
      {footer && <div className="ui-stat__footer">{footer}</div>}
    </div>
  );
}
