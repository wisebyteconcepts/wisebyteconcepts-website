import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export const SystemInitializer = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Establishing connection...');

  const steps = [
    { threshold: 0, message: 'Initialising kernel...' },
    { threshold: 20, message: 'Syncing capability registry...' },
    { threshold: 45, message: 'Loading engineering stack...' },
    { threshold: 70, message: 'Verifying industry standards...' },
    { threshold: 90, message: 'Booting user interface...' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentStep = [...steps].reverse().find(s => progress >= s.threshold);
    if (currentStep) setStatus(currentStep.message);
  }, [progress]);

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
          <div className="w-16 h-16 bg-muted/30 border border-border/50 rounded-2xl flex items-center justify-center relative overflow-hidden group">
            {/* Minimal Technical Spinner */}
            <div className="relative w-8 h-8">
              {/* Outer Track */}
              <div className="absolute inset-0 border border-primary/10 rounded-full" />
              
              {/* Spinning Segment */}
              <motion.div
                className="absolute inset-0 border-t border-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Center Accent */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]" 
                />
              </div>
            </div>

            {/* Subtle inner depth */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/5 pointer-events-none" />
          </div>
            {/* Pulsing rings */}
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-primary/20 rounded-2xl -z-10" 
            />
          </motion.div>
        </div>

        {/* Status Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-border/50 pb-2">
            <motion.div 
              key={status}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-display uppercase tracking-[0.3em] text-primary font-bold"
            >
              {status}
            </motion.div>
            <div className="text-[10px] font-sans text-muted-foreground tabular-nums">
              {progress}%
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="h-[2px] w-full bg-muted/30 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-brand h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          {/* Sub-status terminal */}
          <div className="pt-2">
            <div className="space-y-1">
              <div className="h-1 w-8 bg-primary/20 rounded-full" />
              <div className="text-[8px] font-sans text-muted-foreground uppercase tracking-widest">
                Nodes: Active
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
