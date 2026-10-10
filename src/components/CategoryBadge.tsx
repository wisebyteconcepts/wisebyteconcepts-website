import React from 'react';
import { cn } from '@/lib/utils';

export interface CategoryBadgeProps {
  text: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ text, className }) => {
  if (!text) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-display font-semibold uppercase tracking-wider",
        className
      )}
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {text}
    </span>
  );
};
