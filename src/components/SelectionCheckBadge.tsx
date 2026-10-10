import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCheckBadgeProps {
  isSelected: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Shared Selection Check Badge for Service and Project cards.
 * Features:
 * - Constant container dimensions (no layout shift/wobble)
 * - Selected state: filled accent circle with crisp white check
 * - Unselected state: empty circle matching neutral surface border
 * - Smooth opacity transition on check icon
 */
export const SelectionCheckBadge: React.FC<SelectionCheckBadgeProps> = ({
  isSelected,
  className,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const containerSize = isSm ? 'w-4 h-4' : 'w-5 h-5';
  const iconSize = isSm ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  return (
    <div
      className={cn(
        containerSize,
        'rounded-full flex items-center justify-center shrink-0 transition-[border-color,background-color] duration-200',
        isSelected
          ? 'bg-accent text-white shadow-2xs border border-accent'
          : 'border border-border/80 bg-surface-2/60 group-hover:border-accent/50',
        className
      )}
      aria-hidden="true"
    >
      <Check
        className={cn(
          iconSize,
          'stroke-[3] text-white transition-opacity duration-200',
          isSelected ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};
