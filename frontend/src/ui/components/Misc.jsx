import React from 'react';
import { cx } from '../utils/cx';

export function Kbd({ children, className = '' }) {
  return <kbd className={cx('ui-kbd', className)}>{children}</kbd>;
}

export function Avatar({ children, size = 'md', className = '', ...props }) {
  return (
    <span className={cx('ui-avatar', size !== 'md' && `ui-avatar--${size}`, className)} {...props}>
      {children}
    </span>
  );
}

export function Divider({ vertical = false, className = '' }) {
  return <hr className={cx('ui-divider', vertical && 'ui-divider--vertical', className)} />;
}

export function Chip({ children, className = '', ...props }) {
  return (
    <span className={cx('ui-chip', className)} {...props}>
      {children}
    </span>
  );
}

export function Metric({ label, value, unit, hint, icon, className = '', children }) {
  return (
    <div className={cx('ui-metric', className)}>
      <span className="ui-metric__label">
        {icon}
        {label}
      </span>
      {value != null && (
        <span className="ui-metric__value">
          {value}
          {unit && <span className="ui-metric__unit">{unit}</span>}
        </span>
      )}
      {children}
      {hint && <span className="ui-metric__hint">{hint}</span>}
    </div>
  );
}
