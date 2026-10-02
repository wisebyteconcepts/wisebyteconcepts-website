import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  ExternalLink, 
  FileText, 
  History 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { InputBlock, TextareaBlock, FormField } from '@/components/forms/FormControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { MediaItem } from '@/types';
import { formatBytes } from '@/utils/mediaOptimizer';
import { useMediaStore } from '@/store/mediaStore';
import { useToastStore } from '@/store/toastStore';

interface MediaDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
  onOpenOptimizer?: (item: MediaItem) => void;
  onOpenReplace?: (item: MediaItem) => void;
  onDeleteRequest?: (item: MediaItem) => void;
}

export const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
  open,
  onOpenChange,
  item,
  onOpenOptimizer,
  onOpenReplace,
  onDeleteRequest,
}) => {
  const { deleteItem, updateItem, restoreVersion, getUsage, folders } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  const [name, setName] = useState(item?.name || '');
  const [altText, setAltText] = useState(item?.altText || '');
  const [caption, setCaption] = useState(item?.caption || '');
  const [folderId, setFolderId] = useState<string | null>(item?.folderId || null);
  const [tagsInput, setTagsInput] = useState((item?.tags || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setAltText(item.altText);
      setCaption(item.caption || '');
      setFolderId(item.folderId || null);
      setTagsInput((item.tags || []).join(', '));
    }
  }, [item]);

  if (!item) return null;

  const usages = getUsage(item.url);

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await updateItem(item.id, {
        name: name.trim() || item.name,
        altText: altText.trim(),
        caption: caption.trim(),
        folderId,
        tags,
      });

      addToast('Metadata saved successfully', 'success');
      onOpenChange(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to save metadata', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await restoreVersion(item.id, versionId);
      addToast('Previous version restored', 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to restore version', 'error');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-12 sm:pr-14 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="text-xl font-bold truncate max-w-sm sm:max-w-md text-text-primary">{item.name}</DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              {item.type === 'image' && onOpenOptimizer && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenOptimizer(item);
                  }}
                  className="rounded-xl gap-1 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Resize & Optimize
                </Button>
              )}
              {onOpenReplace && (
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenReplace(item);
                  }}
                  className="rounded-xl gap-1 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Replace File
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={handleDownload} title="Download file">
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  onOpenChange(false);
                  if (onDeleteRequest) {
                    onDeleteRequest(item);
                  } else {
                    deleteItem(item.id);
                    addToast(`"${item.name}" deleted`, 'success');
                  }
                }}
                className="text-destructive hover:bg-destructive/10"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
          {/* Media Preview Column */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="p-3 rounded-2xl bg-surface-1 border border-border flex items-center justify-center min-h-[260px] overflow-hidden relative group">
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.altText || item.name}
                  className="max-h-[340px] max-w-full rounded-xl object-contain shadow-card-raised"
                  referrerPolicy="no-referrer"
                />
              ) : item.type === 'video' ? (
                item.embedUrl ? (
                  <iframe
                    src={item.embedUrl}
                    title={item.name}
                    className="w-full aspect-video rounded-xl border border-border"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    className="w-full max-h-[340px] rounded-xl border border-border"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{item.name}</div>
                    <div className="text-xs text-text-muted mt-1 font-mono">
                      {item.mimeType || 'Document'} • {formatBytes(item.size)}
                    </div>
                  </div>
                  <Button size="sm" onClick={handleDownload} className="rounded-xl mt-2 gap-2">
                    <Download className="w-4 h-4" /> Download Document
                  </Button>
                </div>
              )}
            </div>

            {/* Technical Specifications */}
            <div className="p-4 rounded-xl border border-border bg-surface-1 space-y-2 text-xs">
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                Technical Specifications
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-text-muted">Dimensions:</span>{' '}
                  <span className="font-mono text-text-primary">
                    {item.dimensions ? `${item.dimensions.width} × ${item.dimensions.height} px` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">File Size:</span>{' '}
                  <span className="font-mono text-foreground">{formatBytes(item.size)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Format:</span>{' '}
                  <span className="font-mono uppercase text-primary font-bold">
                    {item.optimizedFormat || item.mimeType?.split('/')[1] || 'FILE'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Uploaded By:</span>{' '}
                  <span className="font-mono truncate text-foreground block max-w-[140px]">{item.uploadedBy}</span>
                </div>
              </div>
            </div>

            {/* "Used in X places" Tracking */}
            <div className="p-4 rounded-xl border border-border bg-surface-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                  Used In Website ({usages.length})
                </span>
                {usages.length > 0 ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold">
                    Active Reference
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-4 text-text-muted">
                    Orphaned / Unused
                  </span>
                )}
              </div>

              {usages.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {usages.map((u, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-border"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-text-primary">{u.locationTitle}</span>
                        <span className="text-[10px] text-text-muted ml-1.5 font-mono">
                          [{u.field}]
                        </span>
                      </div>
                      <a
                        href={u.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-accent hover:underline flex items-center gap-1 font-mono shrink-0"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  This media file is currently not referenced by any service or product page. Safe to archive or delete.
                </p>
              )}
            </div>
          </div>

          {/* Form & Version History Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-4 p-4 rounded-xl border border-input/60 bg-muted/20">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Metadata & Details
              </div>

              <InputBlock
                label="File Name / Title"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Title"
                className="h-9 text-xs"
              />

              <InputBlock
                label="Alt Text (Accessibility & SEO)"
                description="Describes what appears in this media asset"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive alt text for accessibility..."
                className="h-9 text-xs"
              />

              <TextareaBlock
                label="Caption / Narrative"
                description="Optional narrative shown beneath enlarged media"
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional caption displayed under image"
                className="text-xs min-h-[70px]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField label="Folder">
                  <Select
                    value={folderId || 'root'}
                    onValueChange={(v) => setFolderId(v === 'root' ? null : v)}
                  >
                    <SelectTrigger className="h-9 text-xs border-input">
                      <SelectValue placeholder="All Media" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">📁 Root / Unorganized</SelectItem>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          📁 {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <InputBlock
                  label="Tags (comma-separated)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="web, hero, blog"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Version History */}
            <div className="p-4 rounded-xl border border-border bg-surface-1 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                <History className="w-3.5 h-3.5" /> Version History ({item.versionHistory?.length || 0})
              </div>

              {item.versionHistory && item.versionHistory.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {item.versionHistory.map((ver) => (
                    <div
                      key={ver.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-border text-[11px]"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-text-primary font-mono">v{ver.version}</span>
                        <span className="text-text-muted ml-2">
                          {new Date(ver.replacedAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-text-muted ml-2 font-mono">
                          ({formatBytes(ver.size)})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRestoreVersion(ver.id)}
                        className="h-6 text-[10px] font-mono hover:text-accent"
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-text-muted italic">
                  No previous versions. When you replace this file, previous versions are archived here.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              if (onDeleteRequest) {
                onDeleteRequest(item);
              } else {
                deleteItem(item.id);
                addToast(`"${item.name}" deleted`, 'success');
              }
            }}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 text-xs self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete File
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={handleSaveMetadata}
              disabled={isSaving}
              className="rounded-xl shadow-glow-primary"
            >
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
