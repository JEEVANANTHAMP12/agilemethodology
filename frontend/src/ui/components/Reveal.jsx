import React, { useEffect, useRef, useState } from 'react';
import { cx } from '../utils/cx';

/**
 * Reveal content when it enters the viewport.
 * Motion is skipped entirely when the user prefers reduced motion.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
  once = true,
  threshold = 0.14,
  style,
  ...props
}) {
  const nodeRef = useRef(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReduced || typeof IntersectionObserver === 'undefined';
  });

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    // Above-the-fold content must never wait on an observer tick. This also
    // keeps the dashboard usable when the tab is backgrounded or unrendered.
    const bounds = node.getBoundingClientRect();
    const inInitialView = bounds.top < (window.innerHeight || 0) && bounds.bottom > 0;
    if (inInitialView) {
      const timer = window.setTimeout(() => setVisible(true), 80);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    // Fallback for environments where observer ticks are throttled while the
    // page is occluded. Keeps scroll reveals from leaving content invisible.
    const revealIfInView = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 0;
      const inView = rect.top < viewportHeight && rect.bottom > 0;
      if (inView) {
        setVisible(true);
        if (once) {
          window.removeEventListener('scroll', revealIfInView);
          window.removeEventListener('resize', revealIfInView);
        }
      } else if (!once) {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', revealIfInView, { passive: true });
    window.addEventListener('resize', revealIfInView);
    observer.observe(node);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', revealIfInView);
      window.removeEventListener('resize', revealIfInView);
    };
  }, [once, threshold]);

  return (
    <Tag
      ref={nodeRef}
      className={cx('ui-reveal', visible && 'is-visible', className)}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}
