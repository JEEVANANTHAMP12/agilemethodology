import React from 'react';
import { cn } from '../../lib/utils';

export const Table = ({ className, ...props }) => (
  <div className="relative w-full overflow-auto">
    <table className={cn('w-full caption-bottom text-xs', className)} {...props} />
  </div>
);

export const TableHeader = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
);

export const TableBody = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }) => (
  <tr
    className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
    {...props}
  />
);

export const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      'h-9 px-3 text-left align-middle text-[11px] font-medium uppercase tracking-wider text-muted-foreground',
      className
    )}
    {...props}
  />
);

export const TableCell = ({ className, ...props }) => (
  <td className={cn('px-3 py-2.5 align-middle', className)} {...props} />
);

