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
    primary: 'bg-gradient-brand text-primary-foreground hover:brightness-110 active:brightness-95 transition-all duration-500 transform-gpu relative overflow-hidden after:absolute after:inset-0 after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500',
    secondary: 'bg-secondary text-foreground hover:bg-secondary/80 transform-gpu',
    ghost: 'bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground transform-gpu',
    glass: 'glass text-foreground hover:bg-muted/50 border-border/50 hover:border-primary/40 transition-all transform-gpu',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-glow-destructive transform-gpu',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base font-semibold',
    icon: 'p-2',
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
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
