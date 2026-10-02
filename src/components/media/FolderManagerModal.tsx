import React, { useState } from 'react';
import { 
  FolderPlus, 
  Folder,
  Pencil, 
  Trash2 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useMediaStore } from '@/store/mediaStore';
import { useToastStore } from '@/store/toastStore';
import { MediaFolder } from '@/types';

interface FolderManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { folders, createFolder, renameFolder, deleteFolder, items } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName.trim(), null, selectedColor);
      setNewFolderName('');
      addToast('Folder created', 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to create folder', 'error');
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await renameFolder(id, editingName.trim());
      setEditingFolderId(null);
      addToast('Folder renamed', 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to rename folder', 'error');
    }
  };

  const handleDelete = async (folder: MediaFolder) => {
    try {
      await deleteFolder(folder.id);
      addToast(`Folder "${folder.name}" deleted`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to delete folder', 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <FolderPlus className="w-5 h-5" />
            <DialogTitle className="text-lg font-bold">Manage Media Folders</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Group your media assets into organizational folders. Moving or deleting folders does not break file links.
          </p>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Create new folder bar */}
          <div className="p-3.5 rounded-xl border border-input/60 bg-muted/20 space-y-3">
            <Label className="text-xs font-semibold">Create New Folder</Label>
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Blog Assets)"
                startIcon={<Folder className="w-3.5 h-3.5 text-muted-foreground" />}
                clearable
                onClear={() => setNewFolderName('')}
                className="text-xs h-9 bg-muted/30 border-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
              <Button onClick={handleCreate} disabled={!newFolderName.trim()} size="sm" className="rounded-xl h-9 px-4">
                Add
              </Button>
            </div>
            {/* Color picker */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-muted-foreground">Color tag:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      selectedColor === c ? 'scale-125 ring-2 ring-primary' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Folder list */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <Label className="text-xs font-semibold">Existing Folders ({folders.length})</Label>
            {folders.map((f) => {
              const count = items.filter((i) => i.folderId === f.id).length;
              return (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-input/50 bg-background/50 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: f.color || '#3B82F6' }}
                    />
                    {editingFolderId === f.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-xs bg-muted/30 border-input w-48"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(f.id);
                        }}
                      />
                    ) : (
                      <span className="font-semibold text-foreground truncate">{f.name}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({count} file{count !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {editingFolderId === f.id ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleRename(f.id)} className="h-6 text-[10px]">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingFolderId(null)} className="h-6 text-[10px]">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFolderId(f.id);
                            setEditingName(f.name);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(f)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {folders.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground italic">
                No custom folders yet. All files are in root.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
