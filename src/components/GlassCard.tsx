import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  hoverGlow?: boolean;
}

export const GlassCard = ({ children, className, hoverGlow = true, ...props }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      className={cn(
        'bg-surface-2 border border-border shadow-sm text-text-primary rounded-2xl p-6 transition-all duration-300 will-change-[transform,opacity]',
        hoverGlow && 'hover:shadow-md hover:border-accent/40',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
