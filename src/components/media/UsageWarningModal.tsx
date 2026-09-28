import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw, 
  Image as ImageIcon, 
  Trash2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { MediaItem, MediaUsage } from '@/types';
import { useMediaStore } from '@/store/mediaStore';

interface UsageWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  usages: MediaUsage[];
  onConfirmDelete: (options: { replaceWithUrl?: string; usePlaceholder?: boolean }) => void;
}

export const UsageWarningModal: React.FC<UsageWarningModalProps> = ({
  open,
  onOpenChange,
  item,
  usages,
  onConfirmDelete,
}) => {
  const { items } = useMediaStore();
  const [selectedReplacement, setSelectedReplacement] = useState<string>('');
  const [mode, setMode] = useState<'options' | 'pick_replacement'>('options');

  if (!item) return null;

  const handlePickReplacement = () => {
    if (!selectedReplacement) return;
    onConfirmDelete({ replaceWithUrl: selectedReplacement });
    onOpenChange(false);
  };

  const handleUsePlaceholder = () => {
    onConfirmDelete({ usePlaceholder: true });
    onOpenChange(false);
  };

  const handleForceDelete = () => {
    onConfirmDelete({});
    onOpenChange(false);
  };

  const otherImages = items.filter((i) => i.id !== item.id && i.type === item.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-amber-500/30 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 text-amber-500 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Media File Is In Active Use!
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">"{item.name}"</span> is currently referenced in{' '}
            <span className="font-bold text-amber-500">{usages.length}</span> location{usages.length > 1 ? 's' : ''} across your site. Deleting it directly may result in broken images on live pages.
          </p>
        </DialogHeader>

        {mode === 'options' ? (
          <div className="space-y-4 my-2">
            {/* List of locations */}
            <div className="border border-white/10 rounded-xl p-3 bg-white/5 max-h-48 overflow-y-auto space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Referenced In:
              </div>
              {usages.map((u, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/20 border border-white/5"
                >
                  <div>
                    <span className="font-semibold text-foreground">{u.locationTitle}</span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-2">
                      ({u.field})
                    </span>
                  </div>
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-mono"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            {/* Decision choices */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-semibold text-foreground mb-2">
                Choose an action:
              </div>

              <button
                type="button"
                onClick={() => setMode('pick_replacement')}
                className="w-full text-left p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      Replace with Another Image
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Substitute all current references with an alternative image from the gallery.
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-primary font-bold">Recommended</span>
              </button>

              <button
                type="button"
                onClick={handleUsePlaceholder}
                className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-white/10 text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Replace with Placeholder Image
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Replace references with a clean fallback placeholder image to avoid broken UI.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleForceDelete}
                className="w-full text-left p-3 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-destructive/20 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-destructive">
                    Force Remove File
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Delete the file immediately. References will become blank or empty.
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 my-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Select Replacement Media:</span>
              <button
                type="button"
                onClick={() => setMode('options')}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                &larr; Back to choices
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
              {otherImages.map((other) => {
                const isSelected = selectedReplacement === other.url;
                return (
                  <div
                    key={other.id}
                    onClick={() => setSelectedReplacement(other.url)}
                    className={`relative rounded-xl overflow-hidden aspect-video border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={other.thumbnailUrl || other.url}
                      alt={other.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-black/70 text-[10px] truncate text-white">
                      {other.name}
                    </div>
                  </div>
                );
              })}
              {otherImages.length === 0 && (
                <div className="col-span-3 py-8 text-center text-xs text-muted-foreground">
                  No other images available in gallery.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setMode('options')}>
                Cancel
              </Button>
              <Button
                disabled={!selectedReplacement}
                onClick={handlePickReplacement}
                className="shadow-glow-primary"
              >
                Apply Replacement & Delete
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {mode === 'options' && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel (Keep File)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
