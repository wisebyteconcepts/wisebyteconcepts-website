import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface GlowOrbProps {
  className?: string;
  size?: string;
  color?: string;
  delay?: number;
}

export const GlowOrb = ({ className, size = '400px', color = 'rgba(131, 48, 255, 0.1)', delay = 0 }: GlowOrbProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0.3, 0.6, 0.3], 
        scale: [1, 1.1, 1],
        x: [0, 30, 0],
        y: [0, -30, 0]
      }}
      transition={{ 
        duration: 10, 
        repeat: Infinity, 
        delay,
        ease: "easeInOut" 
      }}
      className={cn('fixed rounded-full pointer-events-none blur-[100px]', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
    />
  );
};
