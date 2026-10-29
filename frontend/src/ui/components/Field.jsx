import React, { forwardRef, useId } from 'react';
import { cx } from '../utils/cx';

const Chevron = () => (
  <svg className="ui-field__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    helperText,
    error,
    required = false,
    id,
    icon,
    prefix,
    suffix,
    className = '',
    containerStyle,
    style,
    ...props
  },
  ref
) {
  const autoId = useId();
  const inputId = id || `ui-input-${autoId}`;

  return (
    <div className={cx('ui-field', className)} style={containerStyle}>
      {label && (
        <label className="ui-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="ui-field__required">*</span>}
        </label>
      )}
      <div className={cx('ui-field__control', error && 'is-invalid')}>
        {icon && <span className="ui-field__icon">{icon}</span>}
        {prefix && <span className="ui-field__affix">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          className="ui-input"
          aria-invalid={Boolean(error)}
          style={style}
          {...props}
        />
        {suffix && <span className="ui-field__affix">{suffix}</span>}
      </div>
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint || helperText ? (
        <span className="ui-field__hint">{hint || helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = forwardRef(function Select(
  {
    label,
    hint,
    helperText,
    error,
    required = false,
    id,
    options = [],
    children,
    className = '',
    containerStyle,
    ...props
  },
  ref
) {
  const autoId = useId();
  const selectId = id || `ui-select-${autoId}`;

  return (
    <div className={cx('ui-field', className)} style={containerStyle}>
      {label && (
        <label className="ui-field__label" htmlFor={selectId}>
          {label}
          {required && <span className="ui-field__required">*</span>}
        </label>
      )}
      <div className={cx('ui-field__control', error && 'is-invalid')}>
        <select ref={ref} id={selectId} className="ui-select" aria-invalid={Boolean(error)} {...props}>
          {options.map((option) =>
            typeof option === 'string' ? (
              <option key={option} value={option}>{option}</option>
            ) : (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            )
          )}
          {children}
        </select>
        <Chevron />
      </div>
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint || helperText ? (
        <span className="ui-field__hint">{hint || helperText}</span>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

export const Textarea = forwardRef(function Textarea(
  { label, hint, helperText, error, required = false, id, className = '', containerStyle, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const textareaId = id || `ui-textarea-${autoId}`;

  return (
    <div className={cx('ui-field', className)} style={containerStyle}>
      {label && (
        <label className="ui-field__label" htmlFor={textareaId}>
          {label}
          {required && <span className="ui-field__required">*</span>}
        </label>
      )}
      <div className={cx('ui-field__control', error && 'is-invalid')}>
        <textarea ref={ref} id={textareaId} className="ui-textarea" rows={rows} aria-invalid={Boolean(error)} {...props} />
      </div>
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint || helperText ? (
        <span className="ui-field__hint">{hint || helperText}</span>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
