import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative group/textarea">
        <textarea
          className={cn(
            "flex min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within/textarea:opacity-100 pointer-events-none transition-opacity duration-500" />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
