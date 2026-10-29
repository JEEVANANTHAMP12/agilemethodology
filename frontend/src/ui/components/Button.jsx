import React, { forwardRef } from 'react';
import { cx } from '../utils/cx';

export const Spinner = ({ size = 'md', className = '', style }) => (
  <span
    className={cx('ui-spinner', `ui-spinner--${size}`, className)}
    role="status"
    aria-label="Loading"
    style={style}
  />
);

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon = null,
    iconRight = null,
    iconOnly = false,
    fullWidth = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'ui-btn',
        `ui-btn--${variant}`,
        `ui-btn--${size}`,
        iconOnly && 'ui-btn--icon',
        fullWidth && 'ui-btn--block',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : icon}
      {children != null && <span className="ui-btn__label">{children}</span>}
      {!loading && iconRight}
    </button>
  );
});

Button.displayName = 'Button';
