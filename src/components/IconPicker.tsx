import { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import * as RiIcons from 'react-icons/ri';
import * as HiIcons from 'react-icons/hi2';
import { Search, X, Check, Zap, Sparkles, Shield } from 'lucide-react';
import { 
  Dialog, 
  DialogContent 
} from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Library registries
const REGISTRIES: Record<string, any> = {
  lucide: LucideIcons,
  remix: RiIcons,
  hero: HiIcons,
};

const LIBRARIES = [
  { id: 'lucide', name: 'Lucide Icons', icon: Zap, count: '1,200+', prefix: '' },
  { id: 'remix', name: 'Remix Icons', icon: Sparkles, count: '2,500+', prefix: 'Ri' },
  { id: 'hero', name: 'Heroicons', icon: Shield, count: '280+', prefix: 'Hi' },
];

// Helper to get icon names for a library
const getIconNames = (libraryId: string) => {
  const registry = REGISTRIES[libraryId];
  if (!registry) return [];
  
  return Object.keys(registry).filter(
    (key) => 
      (typeof registry[key] === 'function' || typeof registry[key] === 'object') && 
      !key.includes('createLucideIcon') &&
      key !== 'LucideIcon' &&
      key !== 'default' &&
      key !== 'IconContext' &&
      /^[A-Z]/.test(key)
  ).sort();
};

interface IconPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (iconName: string) => void;
  selectedIcon?: string;
  className?: string;
}

const CONSTANT_CATEGORIES: Record<string, string[]> = {
  'Arrows': ['Arrow', 'Chevron', 'Move', 'Expand', 'Shrink'],
  'Status': ['Check', 'Circle', 'Alert', 'Info', 'Help', 'Warning', 'X'],
  'Development': ['Code', 'Terminal', 'Cpu', 'Database', 'Git', 'Variable', 'Binary', 'Bug'],
  'Business': ['Dollar', 'Credit', 'Wallet', 'Bank', 'Trending', 'Pie', 'Bar', 'Coins', 'Building'],
  'Media': ['Image', 'Video', 'Music', 'Play', 'Pause', 'Film', 'Camera', 'Mic'],
  'Utility': ['Settings', 'Menu', 'Search', 'Filter', 'Plus', 'Minus', 'Trash', 'Edit', 'Save', 'Copy'],
  'Devices': ['Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Watch', 'Tv', 'HardDrive'],
  'Environment': ['Cloud', 'Sun', 'Moon', 'Wind', 'Leaf', 'Tree', 'Flame', 'Droplet', 'Zap'],
  'Security': ['User', 'Users', 'LogIn', 'LogOut', 'Lock', 'Shield', 'Key', 'Fingerprint'],
  'Shopping': ['Shopping', 'Bag', 'Cart', 'Tag', 'Package', 'Gift', 'CreditCard']
};

export const IconPicker = ({
  isOpen,
  onOpenChange,
  onSelect,
  selectedIcon,
  className
}: IconPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLibrary, setActiveLibrary] = useState('lucide');
  const [displayCount, setDisplayCount] = useState(72);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ startX: 0, scrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Memoize icon names for active library
  const allLibraryIcons = useMemo(() => getIconNames(activeLibrary), [activeLibrary]);

  const [localSelected, setLocalSelected] = useState(selectedIcon || '');

  // Update local selection when prop changes
  useEffect(() => {
    setLocalSelected(selectedIcon || '');
  }, [selectedIcon]);

  // Reset pagination when search or state changes
  useEffect(() => {
    setDisplayCount(72);
  }, [searchTerm, activeCategory, activeLibrary]);

  const filteredIcons = useMemo(() => {
    let result = allLibraryIcons;
    
    if (activeCategory) {
      const keywords = CONSTANT_CATEGORIES[activeCategory] || [];
      result = result.filter(name => 
        keywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()))
      );
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(name => name.toLowerCase().includes(lowerSearch));
    }
    
    return result;
  }, [searchTerm, activeCategory, allLibraryIcons]);

  const displayedIcons = useMemo(() => {
    return filteredIcons.slice(0, displayCount);
  }, [filteredIcons, displayCount]);

  const handleSelect = (name: string) => {
    if (isDragging) return;
    setLocalSelected(name);
  };

  const handleSave = () => {
    if (localSelected) {
      onSelect(localSelected);
      onOpenChange(false);
    }
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 72);
  };

  // Drag to scroll logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const startXValue = e.pageX - scrollContainerRef.current.offsetLeft;
    const scrollLeftValue = scrollContainerRef.current.scrollLeft;
    
    dragInfo.current = { startX: startXValue, scrollLeft: scrollLeftValue };
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.pageX - scrollContainerRef.current!.offsetLeft;
      const walk = (x - dragInfo.current.startX) * 2;
      
      // If we've moved more than 5px, we consider it a drag
      if (Math.abs(x - dragInfo.current.startX) > 5) {
        setIsDragging(true);
        scrollContainerRef.current!.scrollLeft = dragInfo.current.scrollLeft - walk;
      }
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      // Small delay to prevent clicks immediately after drag
      setTimeout(() => setIsDragging(false), 50);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Wheel to horizontal scroll for categories
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      el.scrollLeft += delta;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn("max-w-md w-full h-[min(600px,90vh)] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl", className)}
        onOpenChange={onOpenChange}
      >
        {/* Minimal Header - Aligned at 52px height */}
        <div className="px-5 h-[52px] border-b border-border/5 bg-muted/20 flex items-center shrink-0">
          <h2 className="text-xs font-bold tracking-tight text-foreground uppercase opacity-80">Select Icon</h2>
        </div>

        {/* Tab Switcher - Single Line, Minimal Padding */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="flex gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/40">
            {LIBRARIES.map((lib) => {
              const isActive = activeLibrary === lib.id;
              return (
                <button
                  key={lib.id}
                  onClick={() => {
                    setActiveLibrary(lib.id);
                    setActiveCategory(null);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[9px] font-bold transition-all",
                    isActive 
                      ? "bg-primary text-white shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <lib.icon className={cn("w-3 h-3", isActive ? "text-white" : "text-primary")} />
                  <span className="whitespace-nowrap">{lib.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search - Improved Borders */}
        <div className="px-4 py-2 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              autoFocus
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-muted/10 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-[11px] font-medium transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Categories (Horizontal Scroll) */}
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          className={cn(
            "px-4 flex gap-1 overflow-x-auto hide-scrollbar pb-3 pt-1 shrink-0 select-none cursor-grab active:cursor-grabbing scroll-smooth",
            isDragging && "cursor-grabbing"
          )}
        >
          <button
            onClick={() => { if(!isDragging) setActiveCategory(null); }}
            className={cn(
              "px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
              activeCategory === null 
                ? "bg-primary text-white border-primary shadow-sm" 
                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
            )}
          >
            All
          </button>
          {Object.keys(CONSTANT_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => { if(!isDragging) setActiveCategory(cat); }}
              className={cn(
                "px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
                activeCategory === cat 
                  ? "bg-primary text-white border-primary shadow-sm" 
                  : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery - Standardized grid with fixed icon sizes */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar bg-card/10">
          <AnimatePresence mode="popLayout">
            <div className="flex flex-wrap gap-2 pt-2 justify-center">
              {displayedIcons.map((name) => {
                const registry = REGISTRIES[activeLibrary];
                const Icon = registry[name];
                const isSelected = localSelected === name;
                
                if (!Icon) return null;

                return (
                  <motion.button
                    key={`${activeLibrary}-${name}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleSelect(name)}
                    className={cn(
                      "group relative w-[55px] h-[55px] flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 shrink-0",
                      isSelected 
                        ? "bg-primary text-white border-primary shadow-md z-10" 
                        : "bg-background border-border/30 hover:border-primary/50 hover:bg-muted/20"
                    )}
                    title={name}
                  >
                    <Icon className={cn(
                      "w-6 h-6 transition-transform group-hover:scale-110 transform-gpu [backface-visibility:hidden]",
                      isSelected ? "text-white" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-white text-primary rounded-full p-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5 stroke-[4]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </AnimatePresence>

          {filteredIcons.length > displayCount && (
            <div className="flex justify-center mt-4">
              <Button 
                variant="glass" 
                size="sm"
                onClick={handleLoadMore}
                className="h-8 rounded-full px-6 text-[9px] font-bold uppercase tracking-widest"
              >
                Load More
              </Button>
            </div>
          )}

          {filteredIcons.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[10px] font-bold text-muted-foreground">No icons found.</p>
            </div>
          )}
        </div>

        {/* Minimal Footer with Selection Status and Save */}
        <div className="p-3 border-t border-border/10 bg-muted/10 flex justify-between items-center px-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Current Matrix</span>
            <span className="text-[10px] font-bold truncate max-w-[120px]">{localSelected || 'None'}</span>
          </div>
          <Button 
            disabled={!localSelected}
            onClick={handleSave}
            className="h-9 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-glow-sm"
          >
            Save Node
          </Button>
        </div>
      </DialogContent>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary), 0.15);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary), 0.3);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Dialog>
  );
};

export default IconPicker;
