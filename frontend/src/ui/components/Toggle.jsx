import React, { useId } from 'react';
import { cx } from '../utils/cx';

export function Checkbox({ label, checked, onChange, disabled = false, className = '', id, ...props }) {
  const autoId = useId();
  const inputId = id || `ui-check-${autoId}`;

  return (
    <label className={cx('ui-check', className)} htmlFor={inputId}>
      <input id={inputId} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} {...props} />
      <span className="ui-check__box" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {label && <span className="ui-check__label">{label}</span>}
    </label>
  );
}

export function Switch({ label, checked, onChange, disabled = false, className = '', id, ...props }) {
  const autoId = useId();
  const inputId = id || `ui-switch-${autoId}`;

  return (
    <label className={cx('ui-switch', className)} htmlFor={inputId}>
      <input id={inputId} type="checkbox" role="switch" checked={checked} onChange={onChange} disabled={disabled} {...props} />
      <span className="ui-switch__track" aria-hidden="true" />
      {label && <span className="ui-switch__label">{label}</span>}
    </label>
  );
}
