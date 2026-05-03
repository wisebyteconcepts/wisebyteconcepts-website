import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { ImageInput } from './ImageInput';

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

// Extract valid icon names, filtering out non-components
const ICON_NAMES = Object.keys(LucideIcons).filter(
  (name) => typeof (LucideIcons as any)[name] === 'function' || typeof (LucideIcons as any)[name] === 'object'
);

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label = "Select Icon" }) => {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'library' | 'url'>('library');

  const filteredIcons = useMemo(() => {
    if (!search) return ICON_NAMES.slice(0, 100);
    return ICON_NAMES.filter(name => 
      name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 100);
  }, [search]);

  const isUrl = value?.startsWith('http') || value?.startsWith('data:') || value?.includes('/');

  // Current icon preview
  const renderPreview = (name: string, className = "w-4 h-4") => {
    if (!name) return null;
    const Icon = (LucideIcons as any)[name] as LucideIcons.LucideIcon;
    if (Icon) return <Icon className={className} />;
    if (name.startsWith('http') || name.startsWith('data:') || name.includes('/')) {
      return <img src={name} alt="icon" className={cn("object-contain", className)} referrerPolicy="no-referrer" />;
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

      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group/picker">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/picker:opacity-100 transition-opacity pointer-events-none" />
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-primary shadow-glow-sm">
            {value ? renderPreview(name, "w-6 h-6") : <div className="w-6 h-6 rounded-md border border-dashed border-white/20" />}
          </div>
          <div className="flex-grow">
            <p className="text-xs font-bold truncate max-w-[200px] text-foreground">{value || "No icon selected"}</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
              {isUrl ? "Custom data source" : "Lucide registry node"}
            </p>
          </div>
          {value && (
            <Button variant="ghost" size="icon" onClick={() => onChange('')} className="shrink-0 h-8 w-8 hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {mode === 'library' ? (
          <div className="space-y-4 relative z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Lucide icons..."
                className="pl-10 h-10 bg-white/5 border-white/10 text-xs"
              />
            </div>
            
            <div className="grid grid-cols-6 gap-2 max-h-[220px] overflow-y-auto pr-2 hide-scrollbar">
              {filteredIcons.map((name) => {
                const Icon = (LucideIcons as any)[name] as typeof LucideIcons.Zap;
                const active = value === name;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => onChange(name)}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center transition-all border",
                      active 
                        ? "bg-primary text-primary-foreground shadow-glow border-primary scale-105 z-10" 
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageInput 
              label="Icon URL or Data URI"
              value={isUrl ? (value || null) : null}
              onChange={(val) => onChange(val || "")}
            />
          </div>
        )}
      </div>
    </div>
  );
};
