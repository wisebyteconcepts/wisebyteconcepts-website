import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, children }: DialogProps) => {
  if (!open) return null;
  return <>{children}</>;
};

export const DialogContent = ({ children, className, onOpenChange }: { children: React.ReactNode, className?: string, onOpenChange?: (v: boolean) => void }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            "relative z-50 w-full max-w-lg rounded-[2rem] border border-border bg-background/80 p-8 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto hide-scrollbar overflow-hidden",
            className
          )}
        >
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/20 pointer-events-none" />
          
          <button
            onClick={() => onOpenChange?.(false)}
            className="absolute right-6 top-6 rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all z-10"
          >
            <X className="h-5 w-5" />
          </button>
          {children}
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
