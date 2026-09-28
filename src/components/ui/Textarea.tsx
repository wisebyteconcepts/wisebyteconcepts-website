import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  containerClassName?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, containerClassName, showCount, maxLength, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn("relative group/textarea w-full", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[90px] w-full rounded-xl border border-input bg-background/80 dark:bg-zinc-950/70 px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all duration-200 ring-offset-background placeholder:text-muted-foreground/60 hover:border-border dark:hover:border-white/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 font-sans",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within/textarea:opacity-100 pointer-events-none transition-opacity duration-300" />
        {showCount && maxLength && (
          <div className="flex justify-end mt-1 text-[10px] font-mono text-muted-foreground">
            <span>
              {currentLength} / {maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
