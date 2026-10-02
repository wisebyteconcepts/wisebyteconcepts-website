import React, { useState, useRef } from 'react';
import { X, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/Button';
import { FormLabel } from '@/components/forms/FormControls';
import { cn } from '@/lib/utils';
import { ImageInput } from './ImageInput';
import { IconPicker as UniversalIconPicker } from '@/components/IconPicker';
import { Icon } from '@/components/ui/Icon';
import { IconValue, normalizeIcon, formatIconLabel } from '@/types/icon';

export interface IconPickerProps {
  value?: IconValue | string | null;
  onChange: (value: any) => void;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = "Select Icon",
  className,
  compact = false,
}) => {
  const [mode, setMode] = useState<'library' | 'url'>('library');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const normalized = normalizeIcon(value);
  const isUrl = typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:') || value.includes('/'));
  const hasIcon = Boolean(normalized || isUrl);

  const handleSelectIcon = (icon: IconValue) => {
    onChange(icon);
    setMode('library');
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
  };

  if (compact) {
    return (
      <div className={cn("space-y-1.5 w-full", className)}>
        {label && (
          <div className="flex items-center justify-between">
            <FormLabel className="text-xs font-semibold">{label}</FormLabel>
            {isUrl && (
              <span className="text-[10px] font-mono text-muted-foreground uppercase">URL</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          <button
            ref={triggerButtonRef}
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="flex-1 h-10 px-3 rounded-xl border border-border-strong bg-surface-3 hover:bg-surface-4 text-text-primary shadow-xs transition-all duration-200 flex items-center justify-between gap-2.5 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary group/picker-btn"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0 text-primary shadow-2xs">
                {hasIcon ? (
                  <Icon value={value} className="w-3.5 h-3.5" fallback={Sparkles} />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-muted-foreground/40" />
                )}
              </div>
              <span className="text-xs font-semibold truncate text-foreground">
                {formatIconLabel(value) || "Select Icon..."}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-muted-foreground group-hover/picker-btn:text-foreground">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
          </button>

          {hasIcon && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={handleClear}
              title="Clear icon"
              className="shrink-0 h-10 w-10 border border-border-strong rounded-xl hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <UniversalIconPicker 
          isOpen={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          onSelect={handleSelectIcon}
          selectedIcon={value}
          triggerRef={triggerButtonRef}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5 w-full", className)}>
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs font-semibold">{label}</FormLabel>
        <div className="flex gap-1.5 p-0.5 rounded-lg bg-surface-2 border border-border/60">
          <button 
            type="button"
            className={cn(
              "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              mode === 'library' ? "bg-primary text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode('library')}
          >
            Library
          </button>
          <button 
            type="button"
            className={cn(
              "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              mode === 'url' ? "bg-primary text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode('url')}
          >
            Custom
          </button>
        </div>
      </div>

      <div className={cn(
        "p-3.5 rounded-xl border transition-all relative overflow-hidden group/picker shadow-xs",
        mode === 'library' ? "bg-surface-3 border-border-strong" : "bg-surface-1 border-dashed border-border-strong"
      )}>
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/picker:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="flex items-center gap-3.5 relative z-10">
          {/* Icon Preview */}
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border/80 flex items-center justify-center shrink-0 text-primary shadow-xs">
            {hasIcon ? (
              <Icon value={value} className="w-6 h-6" fallback={Sparkles} />
            ) : (
              <Sparkles className="w-5 h-5 text-muted-foreground/40" />
            )}
          </div>

          {/* Details */}
          <div className="flex-grow min-w-0">
            <p className="text-xs font-bold truncate text-foreground">
              {formatIconLabel(value)}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              {isUrl ? "External Resource Vector" : normalized ? `Standardized ${normalized.library} node` : "No icon specified"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasIcon && (
              <Button 
                variant="ghost" 
                size="icon" 
                type="button"
                onClick={handleClear} 
                title="Remove Icon"
                className="shrink-0 h-8 w-8 hover:text-destructive rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {mode === 'library' && (
              <Button 
                ref={triggerButtonRef}
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="h-8.5 px-3.5 rounded-xl gap-1.5 font-semibold text-xs shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {hasIcon ? "Change Icon" : "Select Icon"}
              </Button>
            )}
          </div>
        </div>

        {mode === 'url' && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <ImageInput 
              label="Icon URL or Data URI"
              value={isUrl ? (typeof value === 'string' ? value : null) : null}
              onChange={(val) => onChange(val || "")}
            />
          </div>
        )}
      </div>

      <UniversalIconPicker 
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={handleSelectIcon}
        selectedIcon={value}
        triggerRef={triggerButtonRef}
      />
    </div>
  );
};

export default IconPicker;
