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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={hoverGlow ? { scale: 1.02, y: -5 } : {}}
      className={cn(
        'glass rounded-2xl p-6 transition-all duration-300',
        hoverGlow && 'glass-hover',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
