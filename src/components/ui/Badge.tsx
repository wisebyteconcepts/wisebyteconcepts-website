import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'accent' | 'destructive' | 'outline';
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: "bg-accent-strong text-on-accent border border-transparent",
    secondary: "bg-surface-4 text-text-secondary border border-border hover:bg-[var(--hover-overlay)] hover:text-text-primary",
    accent: "bg-accent-soft text-accent-soft-text border border-accent/20",
    destructive: "bg-destructive text-destructive-foreground border border-transparent",
    outline: "border border-border text-text-secondary bg-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:border-accent focus-ring-accent",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
