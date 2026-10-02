import React, { createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = () => useContext(DialogContext);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <AnimatePresence>{open && children}</AnimatePresence>
    </DialogContext.Provider>
  );
};

export const DialogContent = ({
  children,
  className,
  onOpenChange: propOnOpenChange,
}: {
  children: React.ReactNode;
  className?: string;
  onOpenChange?: (v: boolean) => void;
}) => {
  const context = useDialog();

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (propOnOpenChange) {
      propOnOpenChange(false);
    } else if (context?.onOpenChange) {
      context.onOpenChange(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (propOnOpenChange) {
          propOnOpenChange(false);
        } else if (context?.onOpenChange) {
          context.onOpenChange(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [propOnOpenChange, context?.onOpenChange]);

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={cn(
          "relative z-50 w-full max-w-lg rounded-3xl border border-border bg-surface-5 text-text-primary shadow-popover p-6 sm:p-8 max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <button
          type="button"
          aria-label="Close modal"
          onClick={handleClose}
          className="absolute right-4 top-4 sm:right-6 sm:top-6 h-8 w-8 inline-flex items-center justify-center rounded-xl bg-surface-4 hover:bg-[var(--hover-overlay)] border border-border text-text-muted hover:text-text-primary transition-colors z-50 cursor-pointer shadow-xs"
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
  <div className={cn("flex flex-col space-y-1.5 text-left mb-6 pr-12 sm:pr-14", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-8", className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn("text-xl sm:text-2xl font-bold tracking-tight text-text-primary break-words min-w-0", className)} {...props} />
);
