import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileUp, 
  Film, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { InputBlock, TextareaBlock } from '@/components/forms/FormControls';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useMediaStore } from '@/store/mediaStore';
import { useToastStore } from '@/store/toastStore';
import { formatBytes, parseVideoEmbed } from '@/utils/mediaOptimizer';
import { MediaItem } from '@/types';

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId?: string | null;
  onSuccess?: (items: MediaItem[]) => void;
}

interface UploadQueueItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  name: string;
  altText: string;
  caption: string;
  tags: string[];
  uploadedItem?: MediaItem;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  open,
  onOpenChange,
  defaultFolderId = null,
  onSuccess,
}) => {
  const { uploadFile, addEmbedVideo, folders } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(defaultFolderId);
  const [autoWebp, setAutoWebp] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Embed video state
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedAlt, setEmbedAlt] = useState('');
  const [embedCaption, setEmbedCaption] = useState('');
  const [embedTags, setEmbedTags] = useState('video, overview');

  const handleFilesAdded = (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = Array.from(files).map((f) => ({
      file: f,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      progress: 0,
      status: 'pending',
      name: f.name.replace(/\.[^/.]+$/, ''),
      altText: f.name.replace(/\.[^/.]+$/, ''),
      caption: '',
      tags: [],
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const updateQueueItem = (id: string, updates: Partial<UploadQueueItem>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleStartUpload = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    const uploadedList: MediaItem[] = [];

    for (const item of queue) {
      if (item.status === 'completed') continue;

      updateQueueItem(item.id, { status: 'uploading', progress: 20 });
      try {
        updateQueueItem(item.id, { progress: 60 });
        const uploaded = await uploadFile(item.file, {
          name: item.name,
          altText: item.altText,
          caption: item.caption,
          folderId: targetFolderId,
          tags: item.tags,
          autoWebp,
        });

        updateQueueItem(item.id, {
          status: 'completed',
          progress: 100,
          uploadedItem: uploaded,
        });
        uploadedList.push(uploaded);
      } catch (err: any) {
        updateQueueItem(item.id, {
          status: 'error',
          errorMessage: err.message || 'Upload failed',
        });
      }
    }

    setIsProcessing(false);
    if (uploadedList.length > 0) {
      addToast(`Successfully uploaded ${uploadedList.length} file(s)`, 'success');
      if (onSuccess) onSuccess(uploadedList);
    }
  };

  const handleAddEmbed = async () => {
    if (!embedUrl.trim()) {
      addToast('Please enter a video URL', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const tags = embedTags.split(',').map((t) => t.trim()).filter(Boolean);
      const saved = await addEmbedVideo({
        url: embedUrl.trim(),
        name: embedTitle.trim() || undefined,
        altText: embedAlt.trim() || undefined,
        caption: embedCaption.trim() || undefined,
        folderId: targetFolderId,
        tags,
      });

      addToast('Embedded video registered in Media Gallery', 'success');
      if (onSuccess) onSuccess([saved]);
      setEmbedUrl('');
      setEmbedTitle('');
      onOpenChange(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to embed video', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const allCompleted = queue.length > 0 && queue.every((q) => q.status === 'completed');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-accent">
            <Upload className="w-5 h-5" />
            <DialogTitle className="text-xl font-bold">Upload to Media Gallery</DialogTitle>
          </div>
          <p className="text-xs text-text-muted">
            Add images, video files or embeds, and documents. Automatically optimizes and indexes for site-wide use.
          </p>
        </DialogHeader>

        {/* Destination folder & settings bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-surface-1 border border-border text-xs">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-text-muted">Destination Folder:</Label>
            <Select
              value={targetFolderId || 'root'}
              onValueChange={(v) => setTargetFolderId(v === 'root' ? null : v)}
            >
              <SelectTrigger className="h-8 w-48 bg-surface-3 hover:bg-[var(--hover-overlay)] border-border-strong text-xs">
                <SelectValue placeholder="All Media (Root)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">📁 All Media (Root)</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    📁 {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={autoWebp}
              onCheckedChange={setAutoWebp}
            />
            <span
              onClick={() => setAutoWebp(!autoWebp)}
              className="text-xs cursor-pointer flex items-center gap-1 select-none text-text-primary"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Auto-convert to WebP
            </span>
          </div>
        </div>

        <Tabs defaultValue="upload">
          <TabsList className="inline-flex max-w-full gap-1">
            <TabsTrigger value="upload" className="text-xs gap-2">
              <FileUp className="w-3.5 h-3.5" /> Upload Local Files
            </TabsTrigger>
            <TabsTrigger value="embed" className="text-xs gap-2">
              <Film className="w-3.5 h-3.5" /> Embed Video (YouTube / Vimeo)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-2">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                isDragging
                  ? 'border-accent bg-accent-soft scale-[1.01]'
                  : 'border-border hover:border-accent hover:bg-[var(--hover-overlay)] bg-surface-1'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.zip,.txt"
                onChange={(e) => {
                  if (e.target.files) handleFilesAdded(e.target.files);
                }}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Drag and drop files here, or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Supports Images (PNG, JPG, WebP), Videos (MP4, WebM up to 100MB), Documents (PDF, DOC, ZIP)
                </p>
              </div>
            </div>

            {/* Queue List with editable metadata */}
            {queue.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Selected Files ({queue.length})</span>
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="text-muted-foreground hover:text-destructive underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-border bg-surface-2 space-y-2 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          {item.file.type.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4 text-accent shrink-0" />
                          ) : item.file.type.startsWith('video/') ? (
                            <Film className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span className="font-mono truncate font-semibold text-text-primary">{item.file.name}</span>
                          <span className="text-[10px] text-text-muted">
                            ({formatBytes(item.file.size)})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.status === 'completed' && (
                            <span className="flex items-center gap-1 text-green-500 font-mono text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="flex items-center gap-1 text-destructive font-mono text-[10px]">
                              <AlertCircle className="w-3.5 h-3.5" /> {item.errorMessage}
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => removeQueueItem(item.id)}
                              className="p-1 text-text-muted hover:text-destructive"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {item.status === 'uploading' && (
                        <div className="w-full bg-surface-4 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-accent-strong h-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {/* Metadata fields (Name, Alt Text, Caption) */}
                      {item.status !== 'completed' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <div>
                            <Input
                              value={item.name}
                              onChange={(e) => updateQueueItem(item.id, { name: e.target.value })}
                              placeholder="Title / Name"
                              className="h-8 text-xs bg-muted/30 border-input"
                            />
                          </div>
                          <div>
                            <Input
                              value={item.altText}
                              onChange={(e) => updateQueueItem(item.id, { altText: e.target.value })}
                              placeholder="Alt Text (SEO/A11y)"
                              className="h-8 text-xs bg-muted/30 border-input"
                            />
                          </div>
                          <div>
                            <Input
                              value={item.caption}
                              onChange={(e) => updateQueueItem(item.id, { caption: e.target.value })}
                              placeholder="Caption"
                              className="h-8 text-xs bg-muted/30 border-input"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="embed" className="space-y-4 pt-2">
            <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-input/60">
              <InputBlock
                label="Video Embed URL"
                description="Embedding external links avoids expensive bandwidth costs while generating auto-thumbnails."
                value={embedUrl}
                onChange={(e) => {
                  setEmbedUrl(e.target.value);
                  const parsed = parseVideoEmbed(e.target.value);
                  if (parsed.isValid && parsed.titleSuggestion && !embedTitle) {
                    setEmbedTitle(parsed.titleSuggestion);
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                startIcon={<LinkIcon className="w-4 h-4 text-muted-foreground" />}
                className="text-xs h-9"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <InputBlock
                  label="Display Title"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  placeholder="E.g. Platform Demo 2026"
                  className="text-xs h-9"
                />
                <InputBlock
                  label="Alt Text"
                  value={embedAlt}
                  onChange={(e) => setEmbedAlt(e.target.value)}
                  placeholder="Description of video"
                  className="text-xs h-9"
                />
              </div>

              <TextareaBlock
                label="Caption / Summary"
                rows={2}
                value={embedCaption}
                onChange={(e) => setEmbedCaption(e.target.value)}
                placeholder="Key takeaways or summary..."
                className="text-xs min-h-[70px]"
              />

              <InputBlock
                label="Tags (comma-separated)"
                value={embedTags}
                onChange={(e) => setEmbedTags(e.target.value)}
                placeholder="video, tutorial, product"
                className="text-xs h-9"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {allCompleted ? 'Close' : 'Cancel'}
          </Button>

          <div className="flex gap-2">
            {allCompleted ? (
              <Button onClick={() => onOpenChange(false)} className="rounded-xl shadow-glow-primary">
                Done
              </Button>
            ) : (
              <Button
                onClick={handleStartUpload}
                disabled={queue.length === 0 || isProcessing}
                className="rounded-xl shadow-glow-primary gap-2"
              >
                <Upload className="w-4 h-4" />
                {isProcessing ? 'Processing & Optimizing...' : `Upload ${queue.length} File(s)`}
              </Button>
            )}
            <Button
              onClick={handleAddEmbed}
              disabled={!embedUrl || isProcessing}
              className="rounded-xl shadow-glow-primary"
            >
              Add Video Embed
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
