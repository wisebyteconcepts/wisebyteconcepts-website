import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import * as RiIcons from 'react-icons/ri';
import * as HiIcons from 'react-icons/hi2';
import { X, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/Label';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</Label>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 px-3 text-[10px] uppercase font-bold", mode === 'library' && "bg-muted text-primary")}
            onClick={() => setMode('library')}
          >
            Library
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-7 px-3 text-[10px] uppercase font-bold", mode === 'url' && "bg-muted text-primary")}
            onClick={() => setMode('url')}
          >
            Custom
          </Button>
        </div>
      </div>

      <div className={cn(
        "p-4 rounded-2xl border transition-all relative overflow-hidden group/picker",
        mode === 'library' ? "bg-white/5 border-white/10" : "bg-muted/30 border-dashed border-border"
      )}>
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/picker:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-primary shadow-glow-sm">
            {value ? renderPreview(value, "w-7 h-7") : <div className="w-7 h-7 rounded-md border border-dashed border-white/20" />}
          </div>
          <div className="flex-grow">
            <p className="text-xs font-bold truncate max-w-[200px] text-foreground">
              {value && !isUrl ? value : isUrl ? "Custom Artifact" : "No icon selected"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
              {isUrl ? "External Resource" : "System Node Library"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {value && (
              <Button variant="ghost" size="icon" onClick={() => onChange('')} className="shrink-0 h-8 w-8 hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            )}
            {mode === 'library' && (
              <Button 
                onClick={() => setIsPickerOpen(true)}
                className="h-9 px-4 rounded-xl gap-2 font-bold text-xs uppercase"
              >
                <Grid3x3 className="w-4 h-4" />
                Browse
              </Button>
            )}
          </div>
        </div>

        {mode === 'url' && (
          <div className="mt-6 pt-6 border-t border-white/5">
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
