import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface GlowOrbProps {
  className?: string;
  size?: string;
  color?: string;
  delay?: number;
}

export const GlowOrb = ({ className, size = '400px', color = 'rgba(59, 130, 246, 0.1)', delay = 0 }: GlowOrbProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: [0.2, 0.4, 0.2],
        scale: [1, 1.05, 1],
      }}
      transition={{ 
        duration: 8, 
        repeat: Infinity, 
        delay,
        ease: "easeInOut" 
      }}
      className={cn('fixed rounded-full pointer-events-none blur-[140px] will-change-transform z-0', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
    />
  );
};
