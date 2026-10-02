import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  X, 
  Check, 
  Star, 
  Copy, 
  CheckCheck, 
  Clock, 
  Zap, 
  Sparkles, 
  Shield, 
  Loader2 
} from 'lucide-react';
import { Dialog, DialogContent } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from '@/components/Button';
import { Icon, MissingIconPlaceholder } from './ui/Icon';
import type { IconLibrary, IconValue } from '@/types/icon';
import { normalizeIcon } from '@/types/icon';
import { cn } from '@/lib/utils';

export interface IconPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (icon: IconValue) => void;
  selectedIcon?: IconValue | string | null;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

// Session storage key for tab
const STORAGE_TAB_KEY = 'wbc_icon_picker_tab';
const STORAGE_RECENT_KEY = 'wbc_recent_icons';
const STORAGE_FAVORITES_KEY = 'wbc_favorite_icons';

// In-memory caches for lazy loaded registries
let lucideCache: Record<string, any> | null = null;
let remixCache: Record<string, any> | null = null;
let heroOutlineCache: Record<string, any> | null = null;
let heroSolidCache: Record<string, any> | null = null;

export const IconPicker: React.FC<IconPickerProps> = ({
  isOpen,
  onOpenChange,
  onSelect,
  selectedIcon,
  className,
  triggerRef,
}) => {
  // Normalize initial selection
  const initialNormalized = useMemo(() => normalizeIcon(selectedIcon), [selectedIcon]);

  // Tab state with session persistence
  const [activeTab, setActiveTab] = useState<IconLibrary>(() => {
    if (initialNormalized?.library) return initialNormalized.library;
    try {
      const saved = sessionStorage.getItem(STORAGE_TAB_KEY) as IconLibrary;
      if (saved && ['lucide', 'remix', 'hero'].includes(saved)) return saved;
    } catch {
      // sessionStorage might fail in strict iframe
    }
    return 'lucide';
  });

  // Style variant state (tab specific)
  const [remixVariant, setRemixVariant] = useState<'line' | 'fill'>('line');
  const [heroVariant, setHeroVariant] = useState<'outline' | 'solid'>('outline');

  // Search input state and debounced query (~200ms)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Loaded registries
  const [isLucideLoaded, setIsLucideLoaded] = useState(!!lucideCache);
  const [isRemixLoaded, setIsRemixLoaded] = useState(!!remixCache);
  const [isHeroLoaded, setIsHeroLoaded] = useState(!!(heroOutlineCache && heroSolidCache));
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Filter toggles
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Selected icon in picker
  const [localSelected, setLocalSelected] = useState<IconValue | null>(initialNormalized);

  // Recently used icons (stored in localStorage)
  const [recentIcons, setRecentIcons] = useState<IconValue[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_RECENT_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeIcon).filter(Boolean) as IconValue[];
        }
      }
    } catch (e) {
      console.warn('Failed to load recent icons', e);
    }
    return [];
  });

  // Favorite icons (stored in localStorage as Set of "library:name:variant")
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const data = localStorage.getItem(STORAGE_FAVORITES_KEY);
      if (data) {
        return new Set(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Failed to load favorite icons', e);
    }
    return new Set<string>();
  });

  // Copy status
  const [copiedName, setCopiedName] = useState<string | null>(null);

  // Footer Preview Size & Color
  const [previewSize, setPreviewSize] = useState<16 | 24 | 32>(24);
  const [previewOnPrimary, setPreviewOnPrimary] = useState(false);

  // Grid virtualization / pagination (batch 80 icons per scroll)
  const [visibleCount, setVisibleCount] = useState(80);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input by 200ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 200);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // When selectedIcon prop updates, synchronize localSelected
  useEffect(() => {
    setLocalSelected(normalizeIcon(selectedIcon));
  }, [selectedIcon]);

  // Save active tab to session
  const handleTabChange = (tab: IconLibrary) => {
    setActiveTab(tab);
    setSearchInput('');
    setDebouncedSearch('');
    setShowOnlyFavorites(false);
    setVisibleCount(80);
    setFocusedIndex(-1);
    try {
      sessionStorage.setItem(STORAGE_TAB_KEY, tab);
    } catch {
      // ignore
    }
  };

  // Lazy-load library when tab becomes active
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    if (activeTab === 'lucide' && !lucideCache) {
      setIsLoadingLibrary(true);
      import('lucide-react')
        .then((mod) => {
          if (!isMounted) return;
          lucideCache = mod;
          setIsLucideLoaded(true);
        })
        .finally(() => {
          if (isMounted) setIsLoadingLibrary(false);
        });
    } else if (activeTab === 'remix' && !remixCache) {
      setIsLoadingLibrary(true);
      import('@remixicon/react')
        .then((mod) => {
          if (!isMounted) return;
          remixCache = mod;
          setIsRemixLoaded(true);
        })
        .finally(() => {
          if (isMounted) setIsLoadingLibrary(false);
        });
    } else if (activeTab === 'hero' && (!heroOutlineCache || !heroSolidCache)) {
      setIsLoadingLibrary(true);
      Promise.all([
        import('@heroicons/react/24/outline'),
        import('@heroicons/react/24/solid'),
      ])
        .then(([outlineMod, solidMod]) => {
          if (!isMounted) return;
          heroOutlineCache = outlineMod;
          heroSolidCache = solidMod;
          setIsHeroLoaded(true);
        })
        .finally(() => {
          if (isMounted) setIsLoadingLibrary(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab, isOpen]);

  // Extract raw icon names for current tab
  const tabIcons = useMemo(() => {
    if (activeTab === 'lucide') {
      if (!lucideCache) return [];
      return Object.keys(lucideCache)
        .filter((k) => {
          const val = (lucideCache as any)[k];
          return (
            (typeof val === 'function' || typeof val === 'object') &&
            !k.includes('createLucideIcon') &&
            k !== 'LucideIcon' &&
            k !== 'default' &&
            k !== 'IconContext' &&
            /^[A-Z]/.test(k)
          );
        })
        .sort();
    }

    if (activeTab === 'remix') {
      if (!remixCache) return [];
      const suffix = remixVariant === 'fill' ? 'Fill' : 'Line';
      return Object.keys(remixCache)
        .filter((k) => k.startsWith('Ri') && k.endsWith(suffix))
        .sort();
    }

    if (activeTab === 'hero') {
      const cache = heroVariant === 'solid' ? heroSolidCache : heroOutlineCache;
      if (!cache) return [];
      return Object.keys(cache)
        .filter((k) => k.endsWith('Icon'))
        .sort();
    }

    return [];
  }, [activeTab, isLucideLoaded, isRemixLoaded, isHeroLoaded, remixVariant, heroVariant]);

  // Filter icons by debounced search and favorites
  const filteredIcons = useMemo(() => {
    let list = tabIcons;

    if (showOnlyFavorites) {
      list = list.filter((name) => {
        const key = `${activeTab}:${name}:${
          activeTab === 'remix' ? remixVariant : activeTab === 'hero' ? heroVariant : ''
        }`;
        return favorites.has(key);
      });
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((name) => {
        // Strip common prefixes/suffixes for human search
        const cleanName = name
          .replace(/^Ri/, '')
          .replace(/(Line|Fill)$/, '')
          .replace(/Icon$/, '')
          .toLowerCase();
        return cleanName.includes(q) || name.toLowerCase().includes(q);
      });
    }

    return list;
  }, [tabIcons, debouncedSearch, showOnlyFavorites, favorites, activeTab, remixVariant, heroVariant]);

  // Slice for infinite scrolling/batching
  const displayedIcons = useMemo(() => {
    return filteredIcons.slice(0, visibleCount);
  }, [filteredIcons, visibleCount]);

  // IntersectionObserver to load more as user scrolls down
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 60, filteredIcons.length));
        }
      },
      { root: gridContainerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredIcons.length]);

  // Reset visibleCount and focus on search change
  useEffect(() => {
    setVisibleCount(80);
    setFocusedIndex(-1);
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollTop = 0;
    }
  }, [debouncedSearch, activeTab, remixVariant, heroVariant, showOnlyFavorites]);

  // Toggle favorite
  const toggleFavorite = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const variant = activeTab === 'remix' ? remixVariant : activeTab === 'hero' ? heroVariant : undefined;
    const key = `${activeTab}:${name}:${variant || ''}`;
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      try {
        localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Failed to save favorites', err);
      }
      return next;
    });
  };

  // Copy icon name
  const handleCopyName = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanName = name
      .replace(/^Ri/, '')
      .replace(/(Line|Fill)$/, '')
      .replace(/Icon$/, '');
    navigator.clipboard.writeText(cleanName);
    setCopiedName(name);
    setTimeout(() => {
      setCopiedName((curr) => (curr === name ? null : curr));
    }, 1500);
  };

  // Select an icon cell
  const handleCellSelect = (name: string) => {
    const variant = activeTab === 'remix' ? remixVariant : activeTab === 'hero' ? heroVariant : undefined;
    const nextVal: IconValue = {
      library: activeTab,
      name,
    };
    if (variant) {
      nextVal.variant = variant;
    }
    setLocalSelected(nextVal);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!localSelected) return;

    // Update recently used list
    setRecentIcons((prev) => {
      const filtered = prev.filter(
        (item) => !(item.library === localSelected.library && item.name === localSelected.name && item.variant === localSelected.variant)
      );
      const next = [localSelected, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save recent icons', err);
      }
      return next;
    });

    onSelect(localSelected);
    onOpenChange(false);
  };

  // Close modal without saving and return focus to trigger
  const handleClose = () => {
    onOpenChange(false);
  };

  // Focus return to trigger on close
  useEffect(() => {
    if (!isOpen && triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, triggerRef]);

  // Compute responsive columns for keyboard navigation
  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return 8;
    const width = window.innerWidth;
    if (width < 640) return 4;
    if (width < 768) return 6;
    if (width < 1024) return 8;
    return 10;
  }, []);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      return;
    }

    if (displayedIcons.length === 0) return;

    const cols = getColumnCount();
    let nextIndex = focusedIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = focusedIndex < 0 ? 0 : Math.min(focusedIndex + 1, displayedIcons.length - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = focusedIndex <= 0 ? 0 : focusedIndex - 1;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (focusedIndex < 0) {
        nextIndex = 0;
      } else {
        nextIndex = Math.min(focusedIndex + cols, displayedIcons.length - 1);
        if (nextIndex >= visibleCount - 10) {
          setVisibleCount((prev) => Math.min(prev + 60, filteredIcons.length));
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = focusedIndex < 0 ? 0 : Math.max(focusedIndex - cols, 0);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (focusedIndex >= 0 && focusedIndex < displayedIcons.length) {
        e.preventDefault();
        handleCellSelect(displayedIcons[focusedIndex]);
      }
    }

    if (nextIndex !== focusedIndex && nextIndex >= 0 && nextIndex < displayedIcons.length) {
      setFocusedIndex(nextIndex);
      const targetBtn = gridContainerRef.current?.querySelector(`[data-grid-idx="${nextIndex}"]`) as HTMLElement;
      if (targetBtn) {
        targetBtn.focus();
      }
    }
  };

  const getCleanDisplayName = (raw: string) => {
    return raw
      .replace(/^Ri/, '')
      .replace(/(Line|Fill)$/, '')
      .replace(/Icon$/, '');
  };

  const isCurrentSelected = (name: string) => {
    if (!localSelected) return false;
    if (localSelected.library !== activeTab) return false;
    if (localSelected.name !== name) return false;
    if (activeTab === 'remix') {
      return (localSelected.variant || 'line') === remixVariant;
    }
    if (activeTab === 'hero') {
      return (localSelected.variant || 'outline') === heroVariant;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl w-full h-[min(680px,92vh)] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl",
          className
        )}
      >
        <div
          ref={modalContainerRef}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="icon-picker-title"
          tabIndex={-1}
          className="flex flex-col h-full w-full outline-hidden overflow-hidden"
        >
          {/* Header: Title "Select an Icon" and Close [X] Button */}
        <div className="px-5 h-14 border-b border-border/60 bg-surface-1 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h2 id="icon-picker-title" className="text-sm font-bold tracking-tight text-foreground">
              Select an Icon
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Library Tabs: Lucide | Remix Icon | Hero Icons */}
        <div className="px-5 pt-3.5 pb-2 bg-surface-1/50 border-b border-border/40 shrink-0">
          <div role="tablist" aria-label="Icon Libraries" className="flex gap-1.5 p-1 bg-surface-2 rounded-xl border border-border/60">
            <button
              type="button"
              role="tab"
              id="tab-lucide"
              aria-selected={activeTab === 'lucide'}
              aria-controls="tabpanel-icons"
              onClick={() => handleTabChange('lucide')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'lucide'
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Lucide</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-remix"
              aria-selected={activeTab === 'remix'}
              aria-controls="tabpanel-icons"
              onClick={() => handleTabChange('remix')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'remix'
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Remix Icon</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-hero"
              aria-selected={activeTab === 'hero'}
              aria-controls="tabpanel-icons"
              onClick={() => handleTabChange('hero')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === 'hero'
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Hero Icons</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-5 py-3 border-b border-border/40 bg-surface-0 shrink-0 space-y-2.5">
          <div className="flex items-center gap-2">
            {/* Live Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
              <Input
                autoFocus
                placeholder="Search icons... e.g. 'arrow', 'user', 'calendar'"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 h-9.5 bg-surface-2 border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl text-xs font-medium transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Conditional Style Filter: Hero Icons gets Outline/Solid, Remix gets Line/Fill, Lucide hidden */}
            {activeTab === 'hero' && (
              <div className="flex gap-1 p-0.5 rounded-lg bg-surface-2 border border-border/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setHeroVariant('outline')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                    heroVariant === 'outline' ? "bg-primary text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Outline
                </button>
                <button
                  type="button"
                  onClick={() => setHeroVariant('solid')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                    heroVariant === 'solid' ? "bg-primary text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Solid
                </button>
              </div>
            )}

            {activeTab === 'remix' && (
              <div className="flex gap-1 p-0.5 rounded-lg bg-surface-2 border border-border/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setRemixVariant('line')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                    remixVariant === 'line' ? "bg-primary text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Line
                </button>
                <button
                  type="button"
                  onClick={() => setRemixVariant('fill')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
                    remixVariant === 'fill' ? "bg-primary text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Fill
                </button>
              </div>
            )}

            {/* Favorites Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowOnlyFavorites((prev) => !prev)}
              title="Show Favorites"
              className={cn(
                "h-9 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer",
                showOnlyFavorites
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-xs"
                  : "bg-surface-2 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Star className={cn("w-3.5 h-3.5", showOnlyFavorites ? "fill-amber-500 text-amber-500" : "")} />
              <span className="hidden sm:inline">Favorites</span>
            </button>
          </div>

          {/* Result Count Text */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>
              {isLoadingLibrary
                ? "Loading library..."
                : `${filteredIcons.length} ${filteredIcons.length === 1 ? 'icon' : 'icons'} found`}
            </span>
            {showOnlyFavorites && (
              <span className="text-amber-500 font-medium">Filtering starred icons</span>
            )}
          </div>
        </div>

        {/* Scrollable Container with Grid */}
        <div
          ref={gridContainerRef}
          id="tabpanel-icons"
          role="region"
          aria-labelledby={`tab-${activeTab}`}
          className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar bg-surface-0 space-y-4"
        >
          {/* Recently Used Row (pinned at top if available) */}
          {recentIcons.length > 0 && !debouncedSearch && !showOnlyFavorites && (
            <div className="p-3 rounded-xl bg-surface-1 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-primary" />
                  Recently Used
                </span>
                <span className="text-[10px] font-normal lowercase opacity-70">click to select</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
                {recentIcons.map((rec, idx) => {
                  const isRecSelected =
                    localSelected &&
                    localSelected.library === rec.library &&
                    localSelected.name === rec.name &&
                    localSelected.variant === rec.variant;

                  return (
                    <button
                      key={`recent-${rec.library}-${rec.name}-${rec.variant || ''}-${idx}`}
                      type="button"
                      onClick={() => setLocalSelected(rec)}
                      title={`${rec.name} (${rec.library})`}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer relative group",
                        isRecSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-surface-2 border-border hover:border-primary/50 hover:bg-surface-3 text-foreground"
                      )}
                    >
                      <Icon
                        library={rec.library}
                        name={rec.name}
                        variant={rec.variant}
                        className={cn("w-5 h-5", isRecSelected ? "text-white" : "text-foreground")}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading state for lazy loading */}
          {isLoadingLibrary ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Loading {activeTab} icons set...</p>
            </div>
          ) : filteredIcons.length === 0 ? (
            /* Empty State */
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <MissingIconPlaceholder className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold text-foreground">
                No icons found for &quot;{searchInput}&quot;
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Try searching for broader terms like &quot;arrow&quot;, &quot;user&quot;, or switch libraries.
              </p>
            </div>
          ) : (
            /* Responsive Grid */
            <div
              role="grid"
              aria-label={`${activeTab} icon grid`}
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2"
            >
              {displayedIcons.map((name, index) => {
                const isSelected = isCurrentSelected(name);
                const isFocused = focusedIndex === index;
                const cleanName = getCleanDisplayName(name);
                const favKey = `${activeTab}:${name}:${
                  activeTab === 'remix' ? remixVariant : activeTab === 'hero' ? heroVariant : ''
                }`;
                const isFav = favorites.has(favKey);
                const isCopied = copiedName === name;

                return (
                  <div
                    key={`${activeTab}-${name}-${index}`}
                    role="gridcell"
                    aria-selected={isSelected}
                    className="relative group/cell"
                  >
                    <button
                      type="button"
                      data-grid-idx={index}
                      tabIndex={isFocused ? 0 : -1}
                      onClick={() => handleCellSelect(name)}
                      title={cleanName}
                      className={cn(
                        "w-full aspect-square rounded-xl border flex flex-col items-center justify-center p-1.5 transition-all duration-150 cursor-pointer relative",
                        isSelected
                          ? "bg-primary text-white border-primary shadow-md ring-2 ring-primary/30 z-10"
                          : "bg-surface-2 border-border/70 hover:border-primary/60 hover:bg-surface-3 text-muted-foreground hover:text-foreground",
                        isFocused && !isSelected && "ring-2 ring-primary/40 border-primary"
                      )}
                    >
                      {/* Live SVG uniform ~28-32px */}
                      <Icon
                        library={activeTab}
                        name={name}
                        variant={activeTab === 'remix' ? remixVariant : activeTab === 'hero' ? heroVariant : undefined}
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover/cell:scale-110",
                          isSelected ? "text-white" : "text-foreground"
                        )}
                      />

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-white text-primary rounded-full p-0.5 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                        </div>
                      )}
                    </button>

                    {/* Cell Actions on Hover: Favorite & Copy */}
                    <div className="absolute top-1 left-1 opacity-0 group-hover/cell:opacity-100 transition-opacity z-20 flex gap-0.5 pointer-events-auto">
                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(name, e)}
                        title={isFav ? "Remove Favorite" : "Add to Favorites"}
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center bg-background/90 shadow-xs border border-border/60 hover:scale-110 transition-transform cursor-pointer",
                          isFav ? "text-amber-500 fill-amber-500 opacity-100" : "text-muted-foreground hover:text-amber-500"
                        )}
                      >
                        <Star className={cn("w-3 h-3", isFav ? "fill-amber-500" : "")} />
                      </button>

                      {/* Copy Name Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyName(name, e)}
                        title={isCopied ? "Copied!" : "Copy icon name"}
                        className="w-5 h-5 rounded-md flex items-center justify-center bg-background/90 shadow-xs border border-border/60 hover:scale-110 transition-transform cursor-pointer text-muted-foreground hover:text-primary"
                      >
                        {isCopied ? (
                          <CheckCheck className="w-3 h-3 text-emerald-500 stroke-[3]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Copied tooltip bubble */}
                    {isCopied && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-md border border-border whitespace-nowrap z-30 font-medium">
                        Copied!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sentinel element for infinite scrolling */}
          <div ref={sentinelRef} className="h-4 w-full" />
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-border/60 bg-surface-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 shrink-0">
          {/* Left: Selected Icon Preview + Name + Size/Color Preview Toggle */}
          <div className="flex items-center gap-3 min-w-0">
            {localSelected ? (
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Live Preview Box */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all shadow-xs",
                    previewOnPrimary
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-2 border-border/80 text-foreground"
                  )}
                >
                  <Icon
                    library={localSelected.library}
                    name={localSelected.name}
                    variant={localSelected.variant}
                    style={{ width: `${previewSize}px`, height: `${previewSize}px` }}
                    className={previewOnPrimary ? "text-white" : "text-primary"}
                  />
                </div>

                {/* Name & Details */}
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-bold text-foreground truncate max-w-[180px]">
                    {getCleanDisplayName(localSelected.name)}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate uppercase font-mono">
                    {localSelected.library} {localSelected.variant ? `· ${localSelected.variant}` : ''}
                  </span>
                </div>

                {/* Size & Color preview controls */}
                <div className="hidden md:flex items-center gap-1.5 ml-2 pl-2 border-l border-border/60">
                  <div className="flex gap-0.5 bg-surface-2 p-0.5 rounded-lg border border-border/60">
                    {([16, 24, 32] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPreviewSize(sz)}
                        title={`Preview at ${sz}px`}
                        className={cn(
                          "px-1.5 py-0.5 text-[9px] font-mono font-bold rounded cursor-pointer transition-colors",
                          previewSize === sz
                            ? "bg-primary text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewOnPrimary((prev) => !prev)}
                    title="Toggle Primary Color Background"
                    className={cn(
                      "px-2 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer",
                      previewOnPrimary
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-2 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Primary BG
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-dashed border-border flex items-center justify-center">
                  <MissingIconPlaceholder className="w-5 h-5 opacity-40" />
                </div>
                <span className="text-xs italic">No icon selected</span>
              </div>
            )}
          </div>

          {/* Right: Cancel (secondary) and Select (primary) */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="h-9 px-4 text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!localSelected}
              onClick={handleConfirm}
              className="h-9 px-5 text-xs font-bold rounded-xl shadow-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Select
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconPicker;
