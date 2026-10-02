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
            "flex min-h-[90px] w-full rounded-xl border border-border-strong bg-surface-3 px-3.5 py-2.5 text-sm text-text-primary shadow-xs transition-all duration-200 placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent focus-ring-accent disabled:cursor-not-allowed disabled:opacity-50 font-sans",
            error && "border-destructive focus-visible:border-destructive",
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showCount && maxLength && (
          <div className="flex justify-end mt-1 text-[10px] font-mono text-text-muted">
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
