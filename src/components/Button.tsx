import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
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
    primary: 'bg-gradient-brand text-white shadow-glow hover:brightness-110 active:brightness-95',
    secondary: 'bg-secondary text-foreground hover:bg-secondary/80',
    ghost: 'bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground',
    glass: 'glass text-foreground dark:text-white hover:bg-white/20 dark:hover:bg-white/10 border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-white/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base font-semibold',
    icon: 'p-2',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed',
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
