import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, children }: DialogProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, mounted]);

  if (!open || !mounted || typeof document === 'undefined') return null;
  return createPortal(<>{children}</>, document.body);
};

export const DialogContent = ({ children, className, onOpenChange }: { children: React.ReactNode, className?: string, onOpenChange?: (v: boolean) => void }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => onOpenChange?.(false)}
          onWheel={(e) => e.preventDefault()}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className={cn(
            'relative z-50 w-full max-w-4xl h-[calc(100vh-4rem)] overflow-hidden rounded-[2rem] border border-border/30 bg-background/95 shadow-2xl shadow-black/30',
            className
          )}
        >
          <button
            onClick={() => onOpenChange?.(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted transition-all z-50"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="h-full overflow-hidden">
            <div className="h-full overflow-y-auto p-6 sm:p-8 custom-scrollbar" onWheel={(e) => e.stopPropagation()}>
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-6", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-8", className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-2xl font-bold tracking-tight text-foreground", className)} {...props} />
);
