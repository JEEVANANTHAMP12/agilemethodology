import React from 'react';
import { cx } from '../utils/cx';

export function Skeleton({ width = '100%', height = 14, circle = false, className = '', style }) {
  return (
    <span
      className={cx('ui-skeleton', circle && 'ui-skeleton--circle', className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={cx('ui-stack', className)} style={{ gap: 8 }} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? '62%' : '100%'} height={10} />
      ))}
    </div>
  );
}
