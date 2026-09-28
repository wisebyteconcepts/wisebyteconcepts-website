import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextType {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export const Select = ({ value, onValueChange, children }: { value?: string, onValueChange: (v: string) => void, children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ className, children }: { className?: string, children: React.ReactNode }) => {
  const { open, setOpen } = useContext(SelectContext)!;
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background/80 dark:bg-zinc-950/70 px-3.5 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground/60 hover:border-border dark:hover:border-white/25 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150 select-none cursor-pointer",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 opacity-60 text-muted-foreground transition-transform shrink-0 ml-2", open && "rotate-180")} />
    </button>
  );
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useContext(SelectContext)!;
  return <span className="truncate">{value || placeholder}</span>;
};

export const SelectContent = ({ className, children }: { className?: string, children: React.ReactNode }) => {
  const { open, setOpen } = useContext(SelectContext)!;
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-[60] mt-1.5 w-full min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card/95 text-card-foreground p-1 shadow-xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10",
              className
            )}
          >
            <div className="relative z-10 max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const SelectItem = ({ value, className, children }: { value: string, className?: string, children: React.ReactNode }) => {
  const { value: selectedValue, onValueChange, setOpen } = useContext(SelectContext)!;
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2.5 text-xs sm:text-sm font-medium outline-none transition-colors duration-150 text-foreground/90 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
      </span>
      <span className="truncate">{children}</span>
    </button>
  );
};
