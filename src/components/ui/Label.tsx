import React from 'react';
import { cn } from '@/lib/utils';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      "text-[10px] font-mono font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase tracking-widest text-muted-foreground mb-2 block",
      className
    )}
    {...props}
  />
);
