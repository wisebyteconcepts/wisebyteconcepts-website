import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs = ({ 
  defaultValue = "content", 
  value, 
  onValueChange, 
  children, 
  className 
}: { 
  defaultValue?: string; 
  value?: string; 
  onValueChange?: (val: string) => void; 
  children: React.ReactNode; 
  className?: string; 
}) => {
  const [internalTab, setInternalTab] = React.useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = (val: string) => {
    if (value === undefined) {
      setInternalTab(val);
    }
    onValueChange?.(val);
  };
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div
    role="tablist"
    className={cn(
      "inline-flex h-10 max-h-10 items-center justify-start rounded-xl bg-muted/80 p-1 text-muted-foreground border border-border/40 shadow-inner overflow-x-auto overflow-y-hidden scrollbar-none shrink-0",
      className
    )}
  >
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext)!;
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setActiveTab(value)}
      className={cn(
        "relative inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none shrink-0",
        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
        className
      )}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
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
