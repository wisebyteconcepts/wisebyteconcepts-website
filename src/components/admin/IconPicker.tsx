import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import * as RiIcons from 'react-icons/ri';
import * as HiIcons from 'react-icons/hi2';
import { X, Grid3x3, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { FormLabel } from '@/components/forms/FormControls';
import { cn } from '@/lib/utils';
import { ImageInput } from './ImageInput';
import { IconPicker as UniversalIconPicker } from '@/components/IconPicker';

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label = "Select Icon" }) => {
  const [mode, setMode] = useState<'library' | 'url'>('library');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isUrl = value?.startsWith('http') || value?.startsWith('data:') || value?.includes('/');

  // Current icon preview
  const renderPreview = (iconName: string, className = "w-4 h-4") => {
    if (!iconName) return null;
    
    // Check Lucide
    const LucideIcon = (LucideIcons as any)[iconName];
    if (LucideIcon) return <LucideIcon className={className} />;
    
    // Check Remix
    const RiIcon = (RiIcons as any)[iconName];
    if (RiIcon) return <RiIcon className={className} />;
    
    // Check Heroicons
    const HiIcon = (HiIcons as any)[iconName];
    if (HiIcon) return <HiIcon className={className} />;

    if (iconName.startsWith('http') || iconName.startsWith('data:') || iconName.includes('/')) {
      return <img src={iconName} alt="icon" className={cn("object-contain", className)} referrerPolicy="no-referrer" />;
    }
    return null;
  };

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs font-semibold">{label}</FormLabel>
        <div className="flex gap-1.5 p-0.5 rounded-lg bg-muted/50 border border-border/50">
          <button 
            type="button"
            className={cn(
              "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              mode === 'library' ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode('library')}
          >
            Library
          </button>
          <button 
            type="button"
            className={cn(
              "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              mode === 'url' ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode('url')}
          >
            Custom
          </button>
        </div>
      </div>

      <div className={cn(
        "p-3.5 rounded-xl border transition-all relative overflow-hidden group/picker shadow-xs",
        mode === 'library' ? "bg-background/80 dark:bg-zinc-950/70 border-input" : "bg-muted/20 border-dashed border-input"
      )}>
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/picker:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 text-primary shadow-xs">
            {value ? renderPreview(value, "w-6 h-6") : <Sparkles className="w-5 h-5 text-muted-foreground/40" />}
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs font-semibold truncate text-foreground">
              {value && !isUrl ? value : isUrl ? "Custom Asset Vector" : "No icon selected"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {isUrl ? "External Resource URL" : "Built-in System Icons"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {value && (
              <Button variant="ghost" size="icon" onClick={() => onChange('')} className="shrink-0 h-8 w-8 hover:text-destructive rounded-lg">
                <X className="h-4 w-4" />
              </Button>
            )}
            {mode === 'library' && (
              <Button 
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="h-8 px-3 rounded-lg gap-1.5 font-semibold text-xs shadow-xs"
              >
                <Grid3x3 className="w-3.5 h-3.5" />
                Browse
              </Button>
            )}
          </div>
        </div>

        {mode === 'url' && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <ImageInput 
              label="Icon URL or Data URI"
              value={isUrl ? (value || null) : null}
              onChange={(val) => onChange(val || "")}
            />
          </div>
        )}
      </div>

      <UniversalIconPicker 
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        onSelect={(icon) => {
          onChange(icon);
          setMode('library');
        }}
        selectedIcon={!isUrl ? value : undefined}
      />
    </div>
  );
};
