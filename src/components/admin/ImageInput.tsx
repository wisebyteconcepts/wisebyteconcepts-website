import { useState } from 'react';
import { Image as ImageIcon, X, Sparkles, RefreshCw } from 'lucide-react';
import { FormLabel } from '@/components/forms/FormControls';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/Button';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';

interface ImageInputProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  description?: string;
  required?: boolean;
}

export const ImageInput = ({ label, value, onChange, description, required }: ImageInputProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex justify-between items-center">
        <FormLabel required={required} className="text-xs font-semibold">
          {label}
        </FormLabel>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="h-6 text-[11px] text-primary hover:underline gap-1 p-0"
          >
            <RefreshCw className="w-3 h-3" /> Change via Gallery
          </Button>
        )}
      </div>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-input bg-muted/20 aspect-video max-h-52 shadow-xs">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 bg-destructive text-white rounded-lg transition-transform hover:scale-110 shadow-md"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] text-white/90 font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
            {value}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Paste Image URL (https://...)"
              value={value || ''}
              onChange={(e) => onChange(e.target.value || null)}
              startIcon={<ImageIcon className="w-4 h-4 text-muted-foreground" />}
              className="text-xs h-9"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPickerOpen(true)}
              className="rounded-xl shrink-0 gap-1.5 text-xs h-9 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Browse Gallery
            </Button>
          </div>

          <div
            onClick={() => setPickerOpen(true)}
            className="p-5 border-2 border-dashed border-input/60 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group bg-muted/10"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">Select from Unified Media Gallery</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              Or paste direct image URL in the input above
            </p>
          </div>
        </div>
      )}

      {/* Picker Modal */}
      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        allowedTypes={['image']}
        title={`Select ${label}`}
        onSelect={(item) => {
          onChange(item.url);
        }}
      />
    </div>
  );
};
