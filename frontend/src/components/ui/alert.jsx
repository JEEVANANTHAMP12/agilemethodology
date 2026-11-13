import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-xs [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg+div]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
        warning: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export const Alert = ({ className, variant, ...props }) => (
  <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);

export const AlertTitle = ({ className, ...props }) => (
  <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
);

export const AlertDescription = ({ className, ...props }) => (
  <div className={cn('text-xs opacity-90 [&_p]:leading-relaxed', className)} {...props} />
);

