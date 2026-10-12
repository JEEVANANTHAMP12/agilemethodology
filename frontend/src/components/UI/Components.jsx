import React from 'react';
import { DesignTokens } from '../../tokens';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  style = {},
  className = '',
  type = 'button'
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: DesignTokens.typography.sans,
    fontSize: size === 'sm' ? '12px' : (size === 'lg' ? '15px' : '13px'),
    fontWeight: 500,
    borderRadius: '6px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : 'auto',
    border: '1px solid transparent',
    padding: size === 'sm' ? '6px 12px' : (size === 'lg' ? '12px 20px' : '8px 16px'),
    transition: 'all 0.15s ease',
  };

  const variants = {
    primary: {
      background: '#111111',
      color: '#FFFFFF',
      borderColor: '#111111',
    },
    secondary: {
      background: '#FFFFFF',
      color: '#111111',
      borderColor: '#EAEAEA',
    },
    outline: {
      background: 'transparent',
      color: '#111111',
      borderColor: '#EAEAEA',
    },
    ghost: {
      background: 'transparent',
      color: '#787774',
      borderColor: 'transparent',
    },
    danger: {
      background: DesignTokens.colors.pastelRed.bg,
      color: DesignTokens.colors.pastelRed.text,
      borderColor: DesignTokens.colors.pastelRed.border,
    }
  };

  const computedStyle = {
    ...baseStyle,
    ...(variants[variant] || variants.primary),
    ...style,
  };

  return (
    <button
      type={type}
      style={computedStyle}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? (
        <span className="spinner" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#111', borderRadius: '50%' }} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <span>{children}</span>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};

export const Card = ({
  children,
  title = null,
  subtitle = null,
  tag = null,
  style = {},
  className = '',
  onClick
}) => {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAEAEA',
        borderRadius: '10px',
        padding: '24px',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: DesignTokens.shadow.subtle,
        ...style
      }}
      className={className}
      onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = DesignTokens.shadow.hover; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = DesignTokens.shadow.subtle; }}
    >
      {(title || tag || subtitle) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #F0F0EE',
          paddingBottom: '14px',
          marginBottom: '18px'
        }}>
          <div>
            {title && (
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#111111',
                margin: 0,
                letterSpacing: '-0.01em'
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{
                fontSize: '12px',
                color: '#787774',
                marginTop: '3px',
                margin: '3px 0 0 0'
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {tag && (
            <div>{tag}</div>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  style = {}
}) => {
  const { pastelRed, pastelGreen, pastelYellow, pastelBlue } = DesignTokens.colors;

  const variants = {
    neutral: { bg: '#F7F6F3', text: '#787774', border: '#EAEAEA' },
    success: { bg: pastelGreen.bg, text: pastelGreen.text, border: pastelGreen.border },
    warning: { bg: pastelYellow.bg, text: pastelYellow.text, border: pastelYellow.border },
    danger: { bg: pastelRed.bg, text: pastelRed.text, border: pastelRed.border },
    info: { bg: pastelBlue.bg, text: pastelBlue.text, border: pastelBlue.border },
  };

  const current = variants[variant] || variants.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: DesignTokens.typography.sans,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontSize: size === 'sm' ? '10px' : '11px',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        borderRadius: DesignTokens.radius.pill,
        background: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        ...style
      }}
    >
      {children}
    </span>
  );
};

export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  style = {},
  disabled = false
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: '#111111' }}>
          {label} {required && <span style={{ color: '#9F2F2D' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '9px 12px',
          fontSize: '13px',
          fontFamily: DesignTokens.typography.sans,
          borderRadius: '6px',
          border: `1px solid ${error ? '#F8D2D5' : '#EAEAEA'}`,
          backgroundColor: '#FFFFFF',
          color: '#111111',
          transition: 'border-color 0.15s ease'
        }}
      />
      {error && <span style={{ fontSize: '11px', color: '#9F2F2D', fontWeight: 500 }}>{error}</span>}
      {helperText && !error && <span style={{ fontSize: '11px', color: '#787774' }}>{helperText}</span>}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '620px' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(17, 17, 17, 0.4)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '10px',
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid #EAEAEA',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid #EAEAEA',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111111', margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              fontSize: '18px',
              color: '#787774',
              lineHeight: 1,
              padding: '4px',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const FauxWindowHeader = ({ title }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 14px',
      background: '#FBFBFA',
      borderBottom: '1px solid #EAEAEA',
      fontSize: '11px',
      color: '#787774',
      fontWeight: 500
    }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EAEAEA' }} />
        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EAEAEA' }} />
        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EAEAEA' }} />
      </div>
      <span style={{ flex: 1, textAlign: 'center', color: '#111111' }}>{title}</span>
    </div>
  );
};
