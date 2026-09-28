import { useState } from 'react';
import { Plus, X, Image as ImageIcon, Sparkles, Layers } from 'lucide-react';
import { FormLabel } from '@/components/forms/FormControls';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/Button';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { useMediaStore } from '@/store/mediaStore';

interface ImagesInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  description?: string;
  required?: boolean;
}

export const ImagesInput = ({
  label,
  value = [],
  onChange,
  description,
  required,
}: ImagesInputProps) => {
  const [current, setCurrent] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const { collections, items } = useMediaStore();

  const add = () => {
    if (current.trim()) {
      onChange([...value, current.trim()]);
      setCurrent('');
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleInsertCollection = (collId: string) => {
    const coll = collections.find((c) => c.id === collId);
    if (!coll || !coll.mediaIds) return;

    const urlsToAdd = coll.mediaIds
      .map((id) => items.find((i) => i.id === id)?.url)
      .filter(Boolean) as string[];

    const combined = Array.from(new Set([...value, ...urlsToAdd]));
    onChange(combined);
    setCollectionPickerOpen(false);
  };

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FormLabel required={required} className="text-xs font-semibold mb-0">
            {label}
          </FormLabel>
          {value.length > 0 && (
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
              {value.length} {value.length === 1 ? 'image' : 'images'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {collections.length > 0 && (
            <button
              type="button"
              onClick={() => setCollectionPickerOpen(!collectionPickerOpen)}
              className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Layers className="w-3 h-3" /> Insert Collection
            </button>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Sparkles className="w-3 h-3" /> Browse Gallery
          </button>
        </div>
      </div>

      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}

      {/* Collection Quick Pick Dropdown */}
      {collectionPickerOpen && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2 animate-in fade-in">
          <div className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Insert Collection Photos:</span>
            <button
              type="button"
              onClick={() => setCollectionPickerOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleInsertCollection(c.id)}
                className="px-2.5 py-1 rounded-lg bg-black/40 border border-purple-500/30 text-xs text-foreground hover:bg-purple-500/20 transition-colors cursor-pointer"
              >
                + {c.name} ({c.mediaIds?.length || 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Input bar with Gallery button */}
      <div className="flex gap-2">
        <Input
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Add Image URL or browse gallery..."
          className="text-xs h-9"
          startIcon={<ImageIcon className="w-4 h-4 text-muted-foreground" />}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          disabled={!current.trim()}
          variant="secondary"
          className="shrink-0 rounded-xl text-xs h-9 px-3 shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => setPickerOpen(true)}
          className="shrink-0 rounded-xl text-xs h-9 gap-1 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" /> Select Media
        </Button>
      </div>

      {/* Grid of selected images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
        {value.map((url, i) => (
          <div
            key={i}
            className="relative group aspect-square rounded-xl overflow-hidden border border-input bg-muted/20 shadow-xs"
          >
            <img
              src={url}
              alt={`Gallery ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1.5 bg-destructive text-white rounded-lg transition-transform hover:scale-110 shadow-md cursor-pointer"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-mono text-white/90 border border-white/10">
              #{i + 1}
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <div
            onClick={() => setPickerOpen(true)}
            className="col-span-full py-7 border-2 border-dashed border-input/60 rounded-xl flex flex-col items-center justify-center text-xs text-muted-foreground gap-1.5 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all bg-muted/10"
          >
            <ImageIcon className="w-5 h-5 opacity-50 text-primary" />
            <span className="font-semibold text-foreground">No showcase images selected</span>
            <span className="text-[10px] font-mono">Click to select from Unified Media Gallery</span>
          </div>
        )}
      </div>

      {/* Picker Modal for multi-select */}
      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        allowedTypes={['image']}
        multiSelect={true}
        title={`Select images for ${label}`}
        onSelect={(item) => {
          if (!value.includes(item.url)) {
            onChange([...value, item.url]);
          }
        }}
        onSelectMultiple={(itemsList) => {
          const newUrls = itemsList.map((i) => i.url);
          const merged = Array.from(new Set([...value, ...newUrls]));
          onChange(merged);
        }}
      />
    </div>
  );
};
