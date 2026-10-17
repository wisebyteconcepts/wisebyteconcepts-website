import React from 'react';
import { Briefcase, ShoppingBag } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { IconValue } from '@/types/icon';
import { cn } from '@/lib/utils';

export interface CardIconTileProps {
  icon?: IconValue | string | null;
  fallback?: React.ComponentType<{ className?: string }>;
  isSelected: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * Shared Icon Tile for Quote page selection cards:
 * - 'md' (Services, Step 1): Fixed 40px, rounded-12px, 20px icon.
 * - 'sm' (Projects, Step 2): Fixed 32px, rounded-10px, 16px icon.
 * 
 * Styling:
 * - Unselected: Accent-tinted background (bg-accent/10) with accent icon color (text-accent).
 * - Selected: Solid accent background (bg-accent) with crisp white icon (text-white).
 * - No images or pictures rendered.
 */
export const CardIconTile: React.FC<CardIconTileProps> = ({
  icon,
  fallback,
  isSelected,
  size = 'md',
  className,
}) => {
  const isSm = size === 'sm';
  const defaultFallback = isSm ? ShoppingBag : Briefcase;
  const ActiveFallback = fallback || defaultFallback;

  return (
    <div
      className={cn(
        'shrink-0 flex items-center justify-center transition-colors duration-150',
        isSm
          ? 'w-8 h-8 rounded-[10px]' // Fixed 32px, rounded-10px
          : 'w-10 h-10 rounded-[12px]', // Fixed 40px, rounded-12px
        isSelected
          ? 'bg-accent text-white shadow-2xs'
          : 'bg-accent/10 text-accent group-hover:bg-accent/15',
        className
      )}
      aria-hidden="true"
    >
      <Icon
        value={icon}
        fallback={ActiveFallback}
        className={cn(
          'transition-colors duration-150',
          isSm ? 'w-4 h-4' : 'w-5 h-5',
          isSelected ? 'text-white' : 'text-accent'
        )}
      />
    </div>
  );
};

export default CardIconTile;
