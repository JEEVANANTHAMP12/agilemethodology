import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export const TOAST_EVENT = 'agile:toast';

let toastSequence = 0;

export function nextToastId() {
  toastSequence += 1;
  return `toast-${Date.now()}-${toastSequence}`;
}

export function notify(variant, message, options = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        id: options.id || nextToastId(),
        variant,
        message,
        title: options.title,
        duration: options.duration,
      },
    })
  );
}

notify.success = (message, options) => notify('success', message, options);
notify.error = (message, options) => notify('danger', message, options);
notify.warning = (message, options) => notify('warning', message, options);
notify.info = (message, options) => notify('info', message, options);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: (toast) => notify(toast.variant || 'info', toast.message, toast),
      success: notify.success,
      error: notify.error,
      warning: notify.warning,
      info: notify.info,
      dismiss: () => {},
    };
  }
  return context;
}
