import React, { createContext, useContext } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs = ({ defaultValue, children, className }: { defaultValue: string, children: React.ReactNode, className?: string }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={cn("inline-flex h-12 items-center justify-center rounded-xl bg-white/5 p-1 text-muted-foreground", className)}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext)!;
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "text-foreground" : "hover:text-foreground/80",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-lg bg-primary shadow-glow"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const TabsContent = ({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) => {
  const { activeTab } = useContext(TabsContext)!;
  if (activeTab !== value) return null;
  return (
    <div className={cn("mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  );
};
