import React from 'react';
import { 
  Image as ImageIcon, 
  Clock 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { MediaItem, MediaType } from '@/types';
import { useMediaStore } from '@/store/mediaStore';
import { MediaGallery } from './MediaGallery';

interface MediaPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  onSelectMultiple?: (items: MediaItem[]) => void;
  allowedTypes?: MediaType[];
  title?: string;
  multiSelect?: boolean;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  onOpenChange,
  onSelect,
  onSelectMultiple,
  allowedTypes = ['image'],
  title = 'Select Media Asset',
  multiSelect = false,
}) => {
  const { items, recentlyUsedIds, recordRecentlyUsed } = useMediaStore();

  // Recently used media items
  const recentItems = recentlyUsedIds
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean)
    .filter((i) => !allowedTypes || allowedTypes.includes(i!.type)) as MediaItem[];

  const handleChooseItem = (item: MediaItem) => {
    recordRecentlyUsed(item.id);
    if (!multiSelect) {
      onSelect(item);
      onOpenChange(false);
    }
  };

  const handleMultipleChosen = (selectedList: MediaItem[]) => {
    selectedList.forEach((i) => recordRecentlyUsed(i.id));
    if (onSelectMultiple) {
      onSelectMultiple(selectedList);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-white/10 p-6">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-primary">
            <ImageIcon className="w-5 h-5" />
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Select an optimized image or file from the unified media library, or upload a new one directly.
          </p>

          {/* Quick-Access: Recently Used Shelf */}
          {recentItems.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                <Clock className="w-3.5 h-3.5 text-primary" /> Recently Used Media
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {recentItems.slice(0, 8).map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleChooseItem(rec)}
                    className="relative group shrink-0 w-24 h-16 rounded-xl overflow-hidden border border-white/10 hover:border-primary/60 transition-all text-left bg-black/40"
                    title={rec.name}
                  >
                    <img
                      src={rec.thumbnailUrl || rec.url}
                      alt={rec.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-black/80 backdrop-blur-sm text-[9px] truncate text-white">
                      {rec.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Embedded Gallery in Picker Mode */}
        <div className="pt-2">
          <MediaGallery
            isPickerMode={true}
            allowedTypes={allowedTypes}
            onSelectMedia={handleChooseItem}
            onSelectMultiple={handleMultipleChosen}
            title="Browse Media Library"
            subtitle="Click any asset to immediately insert it into your form"
          />
        </div>

        <DialogFooter className="border-t border-white/10 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
