import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly animates a numeric value with requestAnimationFrame.
 * Returns a formatted string so it can be rendered directly.
 */
export function useAnimatedNumber(targetValue, duration = 1000, decimals = 1) {
  const targetNum = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue) || 0;
  const [displayValue, setDisplayValue] = useState(targetNum);
  const displayValueRef = useRef(displayValue);
  const rafIdRef = useRef(null);

  useEffect(() => {
    const end = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue) || 0;
    const start = displayValueRef.current;

    if (Math.abs(end - start) < 0.0001) return undefined;

    let startTime = null;
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = start + (end - start) * eased;

      displayValueRef.current = current;
      setDisplayValue(current);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(step);
      } else {
        displayValueRef.current = end;
        setDisplayValue(end);
      }
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [targetValue, duration]);

  return typeof decimals === 'number' ? displayValue.toFixed(decimals) : displayValue;
}
