import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { ImageInput } from './ImageInput';
import { 
  parseIconIdentifier, 
  formatIconIdentifier, 
  renderIcon,
  LUCIDE_ICONS,
  HEROICON_SOLID_ICONS,
  HEROICON_OUTLINE_ICONS,
  IconLibrary 
} from '@/lib/iconLibrary';

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label = "Select Icon" }) => {
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'library' | 'url'>('library');
  const [selectedLibrary, setSelectedLibrary] = useState<IconLibrary>('lucide');

  // Get icon list based on selected library
  const getIconList = (): string[] => {
    switch (selectedLibrary) {
      case 'lucide':
        return LUCIDE_ICONS;
      case 'heroicon':
        return HEROICON_SOLID_ICONS;
      case 'heroicon-outline':
        return HEROICON_OUTLINE_ICONS;
      default:
        return LUCIDE_ICONS;
    }
  };

  const allIcons = getIconList();

  const filteredIcons = useMemo(() => {
    if (!search) return allIcons.slice(0, 100);
    return allIcons.filter(name => 
      name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 100);
  }, [search, allIcons]);

  // Parse current value to get library and name
  const currentReference = value ? parseIconIdentifier(value) : null;
  const isUrl = currentReference?.library === 'custom';

  // Current icon preview
  const renderPreview = (iconString: string | null, className = "w-4 h-4") => {
    if (!iconString) return null;
    return renderIcon(parseIconIdentifier(iconString) || { library: 'lucide', name: '' }, className);
  };

  // Helper function to render icon based on library
  const renderLibraryIcon = (name: string) => {
    const ref = { library: selectedLibrary, name };
    return renderIcon(ref);
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
            {value ? renderPreview(value, "w-6 h-6") : <div className="w-6 h-6 rounded-md border border-dashed border-white/20" />}
          </div>
          <div className="flex-grow">
            <p className="text-xs font-bold truncate max-w-[200px] text-foreground">{value || "No icon selected"}</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
              {isUrl ? "Custom data source" : `${currentReference?.library || 'lucide'} registry node`}
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
            {/* Library Selection */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 text-xs font-bold rounded-lg transition-all",
                  selectedLibrary === 'lucide' 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
                onClick={() => setSelectedLibrary('lucide')}
              >
                Lucide
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 text-xs font-bold rounded-lg transition-all",
                  selectedLibrary === 'heroicon' 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
                onClick={() => setSelectedLibrary('heroicon')}
              >
                HeroIcon (Solid)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 text-xs font-bold rounded-lg transition-all",
                  selectedLibrary === 'heroicon-outline' 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
                onClick={() => setSelectedLibrary('heroicon-outline')}
              >
                HeroIcon (Outline)
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${selectedLibrary} icons...`}
                className="pl-10 h-10 bg-white/5 border-white/10 text-xs"
              />
            </div>
            
            {/* Icon Grid */}
            <div className="grid grid-cols-6 gap-2 max-h-[220px] overflow-y-auto pr-2 hide-scrollbar">
              {filteredIcons.map((name) => {
                const iconIdentifier = formatIconIdentifier(selectedLibrary, name);
                const active = value === iconIdentifier;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => onChange(iconIdentifier)}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center transition-all border text-lg",
                      active 
                        ? "bg-primary text-primary-foreground shadow-glow border-primary scale-105 z-10" 
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20 hover:scale-105"
                    )}
                  >
                    <div className="w-5 h-5">
                      {renderLibraryIcon(name)}
                    </div>
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
