import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  X, 
  Check 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/Label';
import { InputBlock, TextareaBlock } from '@/components/forms/FormControls';
import { useMediaStore } from '@/store/mediaStore';
import { useToastStore } from '@/store/toastStore';

interface CollectionManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelectedMediaIds?: string[];
}

export const CollectionManagerModal: React.FC<CollectionManagerModalProps> = ({
  open,
  onOpenChange,
  initialSelectedMediaIds = [],
}) => {
  const { collections, createCollection, updateCollection, deleteCollection, items } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedMediaIds);

  React.useEffect(() => {
    if (initialSelectedMediaIds.length > 0 && open) {
      setSelectedIds(initialSelectedMediaIds);
      setIsCreating(true);
    }
  }, [initialSelectedMediaIds, open]);

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  const handleCreate = async () => {
    if (!name.trim()) {
      addToast('Collection name is required', 'error');
      return;
    }
    try {
      await createCollection(name.trim(), description.trim(), selectedIds);
      addToast('Collection created successfully', 'success');
      setName('');
      setDescription('');
      setSelectedIds([]);
      setIsCreating(false);
    } catch (e: any) {
      addToast(e.message || 'Failed to create collection', 'error');
    }
  };

  const handleRemoveItemFromCollection = async (collectionId: string, mediaId: string) => {
    const coll = collections.find((c) => c.id === collectionId);
    if (!coll) return;
    try {
      await updateCollection(collectionId, {
        mediaIds: coll.mediaIds.filter((id) => id !== mediaId),
      });
      addToast('Item removed from collection', 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to update collection', 'error');
    }
  };

  const handleDelete = async (id: string, collName: string) => {
    try {
      await deleteCollection(id);
      if (activeCollectionId === id) setActiveCollectionId(null);
      addToast(`Collection "${collName}" deleted`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to delete collection', 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pr-12 sm:pr-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-accent min-w-0">
              <Layers className="w-5 h-5 shrink-0" />
              <DialogTitle className="text-lg font-bold truncate text-text-primary">Media Collections</DialogTitle>
            </div>
            {!isCreating && (
              <Button size="sm" onClick={() => setIsCreating(true)} className="rounded-xl gap-1 text-xs shrink-0">
                <Plus className="w-3.5 h-3.5" /> New Collection
              </Button>
            )}
          </div>
          <p className="text-xs text-text-muted">
            Named bundles of media assets for quick insertion into showcases, courses, and homepage blocks.
          </p>
        </DialogHeader>

        {isCreating ? (
          <div className="p-4 rounded-xl border border-input/60 bg-muted/20 space-y-4 my-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Create New Collection</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                &larr; Back to list
              </button>
            </div>

            <InputBlock
              label="Collection Title"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Homepage Hero Carousel"
              className="text-xs h-9"
            />

            <TextareaBlock
              label="Description (Optional)"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection used for?"
              className="text-xs min-h-[70px]"
            />

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <Label>Included Media ({selectedIds.length})</Label>
                <span className="text-[10px] text-muted-foreground">Click items to toggle</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-border rounded-xl bg-surface-3">
                {items.map((item) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedIds((prev) =>
                          isChecked ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-accent ring-2 ring-accent/40'
                          : 'border-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {isChecked && (
                        <div className="absolute top-1 right-1 p-0.5 rounded-full bg-accent-strong text-on-accent">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim()} className="shadow-sm">
                Save Collection
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-2">
            {/* Collection list */}
            <div className="md:col-span-5 space-y-2 max-h-80 overflow-y-auto pr-1">
              {collections.map((c) => {
                const isActive = activeCollectionId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveCollectionId(c.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'border-accent bg-accent-soft text-accent-soft-text font-semibold'
                        : 'border-border bg-surface-2 hover:bg-[var(--hover-overlay)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-text-primary truncate">{c.name}</div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-4 text-text-muted shrink-0">
                        {c.mediaIds?.length || 0} items
                      </span>
                    </div>
                    {c.description && (
                      <div className="text-[11px] text-text-muted truncate mt-1">
                        {c.description}
                      </div>
                    )}
                  </div>
                );
              })}
              {collections.length === 0 && (
                <div className="text-center py-8 text-xs text-text-muted italic">
                  No collections created yet.
                </div>
              )}
            </div>

            {/* Collection detail preview */}
            <div className="md:col-span-7 p-4 rounded-xl border border-border bg-surface-1 flex flex-col justify-between min-h-[220px]">
              {activeCollection ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-foreground">{activeCollection.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {activeCollection.description || 'No description provided'}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(activeCollection.id, activeCollection.name)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs">
                      Media in Collection ({activeCollection.mediaIds?.length || 0})
                    </Label>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {activeCollection.mediaIds?.map((mId) => {
                        const mItem = items.find((i) => i.id === mId);
                        if (!mItem) return null;
                        return (
                          <div
                            key={mId}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-white/10"
                          >
                            <img
                              src={mItem.thumbnailUrl || mItem.url}
                              alt={mItem.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveItemFromCollection(activeCollection.id, mId);
                                }}
                                className="p-1.5 bg-destructive text-white rounded-full"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(!activeCollection.mediaIds || activeCollection.mediaIds.length === 0) && (
                        <div className="col-span-4 py-6 text-center text-xs text-muted-foreground italic">
                          Collection is empty.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-xs text-muted-foreground text-center py-10">
                  <Layers className="w-8 h-8 opacity-30 mb-2" />
                  Select a collection on the left to inspect its items.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
