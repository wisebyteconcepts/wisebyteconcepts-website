import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Switch = ({
  checked,
  onCheckedChange,
  disabled,
  className,
  onClick,
}: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (!disabled) {
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:border-accent focus-ring-accent disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent border-accent" : "bg-surface-4 border-border",
        className
      )}
    >
      <motion.span
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-surface-2 shadow-sm transition-transform"
        )}
      />
    </button>
  );
};
