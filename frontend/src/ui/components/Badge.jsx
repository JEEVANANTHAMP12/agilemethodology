import React from 'react';
import { cx } from '../utils/cx';

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
  style,
  ...props
}) {
  return (
    <span
      className={cx(
        'ui-badge',
        `ui-badge--${variant}`,
        `ui-badge--${size}`,
        pulse && 'ui-badge--pulse',
        className
      )}
      style={style}
      {...props}
    >
      {dot && <span className="ui-badge__dot" />}
      {children}
    </span>
  );
}
