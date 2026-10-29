import React from 'react';
import { cx } from '../utils/cx';

export function Tooltip({ label, children, position = 'top', className = '' }) {
  return (
    <span className={cx('ui-tooltip', className)}>
      {children}
      {label && (
        <span role="tooltip" className={cx('ui-tooltip__bubble', `ui-tooltip__bubble--${position}`)}>
          {label}
        </span>
      )}
    </span>
  );
}
