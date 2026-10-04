import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  isLoading,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'bg-accent-strong text-on-accent hover:bg-accent-strong-hover active:opacity-90 shadow-sm border border-transparent transition-colors duration-150',
    secondary: 'bg-surface-4 text-text-primary hover:bg-[var(--hover-overlay)] active:bg-[var(--active-overlay)] border border-border shadow-xs transition-colors duration-150',
    ghost: 'bg-transparent hover:bg-[var(--hover-overlay)] active:bg-[var(--active-overlay)] text-text-secondary hover:text-text-primary transition-colors duration-150',
    glass: 'bg-surface-2 text-text-primary hover:bg-[var(--hover-overlay)] border border-border shadow-sm hover:shadow-md hover:border-accent/40 transition-all duration-150',
    destructive: 'bg-destructive text-destructive-foreground hover:brightness-95 shadow-sm border border-transparent transition-all',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-xs sm:text-sm font-medium gap-2',
    lg: 'h-11 px-6 text-sm sm:text-base font-semibold gap-2.5',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus-visible:border-accent focus-ring-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </motion.button>
  );
};
