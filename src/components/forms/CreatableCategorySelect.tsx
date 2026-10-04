import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Loader2, Search } from 'lucide-react';
import { FormLabel, FormDescription } from '@/components/forms/FormControls';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/utils';

export interface CreatableCategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  onCreateCategory: (newCategory: string) => Promise<string>;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

export const CreatableCategorySelect: React.FC<CreatableCategorySelectProps> = ({
  value,
  onChange,
  categories = [],
  onCreateCategory,
  label = "Category",
  description = "Select an existing category taxonomy or type to register a new one.",
  required = true,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToast = useToastStore((state) => state.addToast);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const cleanQuery = query.trim();
  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(cleanQuery.toLowerCase())
  );

  const exactMatchExists = categories.some(
    (c) => c.toLowerCase() === cleanQuery.toLowerCase()
  );

  const handleSelect = (cat: string) => {
    onChange(cat);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!cleanQuery || isCreating) return;
    setIsCreating(true);
    try {
      const created = await onCreateCategory(cleanQuery);
      onChange(created);
      addToast(`Category "${created}" created and selected`, 'success');
      setOpen(false);
      setQuery('');
    } catch (err: any) {
      addToast(err.message || 'Failed to create category', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!exactMatchExists && cleanQuery) {
        handleCreate();
      } else if (filteredCategories.length > 0) {
        handleSelect(filteredCategories[0]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={cn("space-y-1.5 w-full relative", className)} ref={containerRef}>
      {label && (
        <FormLabel required={required} className="text-xs font-semibold">
          {label}
        </FormLabel>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-1.5 text-xs sm:text-sm text-foreground shadow-xs hover:border-primary/50 focus:outline-none focus-visible:border-accent focus-ring-accent transition-all cursor-pointer select-none"
      >
        <span className="truncate font-medium">{value || 'Select a Category'}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-2", open && "rotate-180")} />
      </button>

      {description && <FormDescription>{description}</FormDescription>}

      {/* Creatable Dropdown Menu */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-surface-3 p-1.5 shadow-popover space-y-1 animate-in fade-in duration-150">
          {/* Filter/Create Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type new category..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-surface-1 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Creatable Action Button if not an exact match */}
          {!exactMatchExists && cleanQuery.length > 0 && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer text-left"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Plus className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">Create &quot;{cleanQuery}&quot;</span>
            </button>
          )}

          {/* Categories List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
            {filteredCategories.length === 0 && exactMatchExists && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No matching categories
              </div>
            )}

            {filteredCategories.map((cat) => {
              const isSelected = cat.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-surface-1"
                  )}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatableCategorySelect;
