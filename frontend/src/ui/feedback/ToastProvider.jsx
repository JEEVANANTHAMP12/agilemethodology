import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ToastContext, TOAST_EVENT, nextToastId } from './ToastContext';

const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  danger: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  ),
};

const tones = {
  success: 'var(--accent-emerald)',
  danger: 'var(--accent-red)',
  warning: 'var(--accent-amber)',
  info: 'var(--accent-cyan)',
};

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast.duration) return undefined;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className={`ui-toast ui-toast--${toast.variant}`} role="status" aria-live="polite">
      <span className="ui-toast__icon" style={{ color: tones[toast.variant] || tones.info }}>
        {icons[toast.variant] || icons.info}
      </span>
      <div className="ui-toast__content">
        {toast.title && <div className="ui-toast__title">{toast.title}</div>}
        <div className="ui-toast__message">{toast.message}</div>
      </div>
      <button type="button" className="ui-toast__close" aria-label="Dismiss notification" onClick={() => onDismiss(toast.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast) => {
    setToasts((current) => [
      ...current.slice(-3),
      {
        duration: 4500,
        ...toast,
        id: toast.id || nextToastId(),
      },
    ]);
  }, []);

  useEffect(() => {
    const handler = (event) => push(event.detail);
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, [push]);

  const api = useMemo(
    () => ({
      toast: push,
      success: (message, options) => push({ variant: 'success', message, ...options }),
      error: (message, options) => push({ variant: 'danger', message, ...options }),
      warning: (message, options) => push({ variant: 'warning', message, ...options }),
      info: (message, options) => push({ variant: 'info', message, ...options }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toast-viewport">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
