import React from 'react';
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
  return <AnimatePresence>{open && children}</AnimatePresence>;
};

export const DialogContent = ({ children, className, onOpenChange }: { children: React.ReactNode, className?: string, onOpenChange?: (v: boolean) => void }) => {
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-3xl border border-border bg-background shadow-2xl overflow-hidden",
          className
        )}
      >
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-[14px] rounded-full p-2 text-muted-foreground hover:bg-muted transition-all z-50"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </motion.div>
    </div>,
    document.body
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
