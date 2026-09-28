import React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
  badge?: string;
  hint?: string;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, optional, badge, hint, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-xs font-semibold tracking-wide text-foreground/90 flex items-center justify-between gap-1.5 mb-1.5 select-none",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-1.5">
        {children}
        {required && (
          <span className="text-destructive font-bold text-xs" title="Required">
            *
          </span>
        )}
        {optional && (
          <span className="text-[10px] font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </span>
      {(badge || hint) && (
        <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
          {badge || hint}
        </span>
      )}
    </label>
  )
);
Label.displayName = "Label";
