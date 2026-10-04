import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  FileUp, 
  Film, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Globe, 
  Loader2, 
  Folder,
  FolderPlus
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useMediaStore } from '@/store/mediaStore';
import { useToastStore } from '@/store/toastStore';
import { 
  formatBytes, 
  parseVideoEmbed, 
  isValidHttpUrl, 
  extractFilenameFromUrl, 
  validateImageUrl 
} from '@/utils/mediaOptimizer';
import { MediaItem } from '@/types';
import { cn } from '@/lib/utils';

export interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId?: string | null;
  onSuccess?: (items: MediaItem[]) => void;
}

interface UploadQueueItem {
  file: File;
  id: string;
  previewUrl?: string;
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
  const { uploadFile, addEmbedVideo, addWebImage, createFolder, folders } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  // Active Tab state: 'upload' | 'embed' | 'web-image'
  const [activeTab, setActiveTab] = useState('upload');

  // Shared Destination Folder & WebP State
  const [targetFolderId, setTargetFolderId] = useState<string | null>(defaultFolderId);
  const [autoWebp, setAutoWebp] = useState(true);

  // Inline "Add Folder" state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSavingFolder, setIsSavingFolder] = useState(false);

  // Shared Processing State for Footer Save Button
  const [isProcessing, setIsProcessing] = useState(false);

  // Background scroll lock while open
  useEffect(() => {
    if (open) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  // Sync default folder when prop updates
  useEffect(() => {
    setTargetFolderId(defaultFolderId);
  }, [defaultFolderId, open]);

  // --- TAB 1: UPLOAD STATE ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  // Clean up object URLs created for queue previews
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const handleFilesAdded = (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = Array.from(files).map((f) => {
      let previewUrl: string | undefined = undefined;
      if (f.type.startsWith('image/')) {
        try {
          previewUrl = URL.createObjectURL(f);
        } catch {
          // ignore
        }
      }

      return {
        file: f,
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        previewUrl,
        progress: 0,
        status: 'pending',
        name: f.name.replace(/\.[^/.]+$/, ''),
        altText: f.name.replace(/\.[^/.]+$/, ''),
        caption: '',
        tags: [],
      };
    });

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
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  };

  const clearQueue = () => {
    queue.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueue([]);
  };

  // --- TAB 2: EMBED VIDEO STATE ---
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoAlt, setVideoAlt] = useState('');

  const parsedVideo = useMemo(() => {
    if (!videoUrl.trim()) return null;
    return parseVideoEmbed(videoUrl);
  }, [videoUrl]);

  // --- TAB 3: WEB IMAGE STATE ---
  const [webImageUrl, setWebImageUrl] = useState('');
  const [webImageTitle, setWebImageTitle] = useState('');
  const [webImageAlt, setWebImageAlt] = useState('');
  const [webImageError, setWebImageError] = useState<string | null>(null);
  const [isValidatingWebImage, setIsValidatingWebImage] = useState(false);
  const [webImagePreview, setWebImagePreview] = useState<{ url: string; width?: number; height?: number } | null>(null);

  // Validate web image with debounce when URL changes
  useEffect(() => {
    const trimmed = webImageUrl.trim();
    if (!trimmed) {
      setWebImageError(null);
      setWebImagePreview(null);
      setIsValidatingWebImage(false);
      return;
    }

    if (!isValidHttpUrl(trimmed)) {
      setWebImageError('Invalid URL');
      setWebImagePreview(null);
      setIsValidatingWebImage(false);
      return;
    }

    let isMounted = true;
    setIsValidatingWebImage(true);
    setWebImageError(null);

    const timer = setTimeout(async () => {
      const result = await validateImageUrl(trimmed);
      if (!isMounted) return;

      setIsValidatingWebImage(false);
      if (result.isValid) {
        setWebImagePreview({ url: trimmed, width: result.width, height: result.height });
        setWebImageError(null);
        if (!webImageTitle) {
          setWebImageTitle(extractFilenameFromUrl(trimmed));
        }
      } else {
        setWebImagePreview(null);
        setWebImageError(result.error || "Couldn't load image");
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [webImageUrl]);

  // --- ADD FOLDER HANDLER ---
  const handleCreateFolderSubmit = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setIsSavingFolder(true);
    try {
      const created = await createFolder(trimmed);
      setTargetFolderId(created.id);
      setNewFolderName('');
      setIsCreatingFolder(false);
      addToast(`Folder "${created.name}" created and selected`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create folder', 'error');
    } finally {
      setIsSavingFolder(false);
    }
  };

  // --- UNIFIED SAVE PATH FOR ALL TABS (Requirement 4 & 5) ---
  const canSave = useMemo(() => {
    if (activeTab === 'upload') {
      return queue.length > 0 && queue.some((q) => q.status === 'pending');
    }
    if (activeTab === 'embed') {
      return Boolean(videoUrl.trim() && parsedVideo?.isValid);
    }
    if (activeTab === 'web-image') {
      return Boolean(webImageUrl.trim() && !webImageError && webImagePreview && !isValidatingWebImage);
    }
    return false;
  }, [activeTab, queue, videoUrl, parsedVideo, webImageUrl, webImageError, webImagePreview, isValidatingWebImage]);

  const saveButtonLabel = useMemo(() => {
    if (activeTab === 'upload') {
      const pendingCount = queue.filter((q) => q.status === 'pending').length;
      return pendingCount > 0 ? `Add Media (${pendingCount})` : 'Add Media';
    }
    if (activeTab === 'embed') {
      return 'Add Media';
    }
    if (activeTab === 'web-image') {
      return 'Add Media';
    }
    return 'Add Media';
  }, [activeTab, queue]);

  const handleSaveMedia = async () => {
    if (!canSave || isProcessing) return;

    setIsProcessing(true);
    const normalizedFolder = (!targetFolderId || targetFolderId === 'root') ? null : targetFolderId;
    const savedItems: MediaItem[] = [];

    try {
      if (activeTab === 'upload') {
        for (const item of queue) {
          if (item.status === 'completed') continue;

          updateQueueItem(item.id, { status: 'uploading', progress: 30 });
          try {
            updateQueueItem(item.id, { progress: 70 });
            const uploaded = await uploadFile(item.file, {
              name: item.name,
              altText: item.altText,
              caption: item.caption,
              folderId: normalizedFolder,
              tags: item.tags,
              autoWebp,
            });

            updateQueueItem(item.id, {
              status: 'completed',
              progress: 100,
              uploadedItem: uploaded,
            });
            savedItems.push(uploaded);
          } catch (err: any) {
            updateQueueItem(item.id, {
              status: 'error',
              errorMessage: err.message || 'Upload failed',
            });
          }
        }
      } else if (activeTab === 'embed') {
        if (!parsedVideo || !parsedVideo.isValid) {
          throw new Error('Please enter a valid YouTube, Vimeo, or direct MP4/WebM URL.');
        }

        const saved = await addEmbedVideo({
          url: videoUrl.trim(),
          name: videoTitle.trim() || parsedVideo.titleSuggestion || 'Embedded Video',
          altText: videoAlt.trim() || videoTitle.trim() || 'Video embed',
          folderId: normalizedFolder,
          tags: ['video', parsedVideo.provider],
        });
        savedItems.push(saved);
        setVideoUrl('');
        setVideoTitle('');
        setVideoAlt('');
      } else if (activeTab === 'web-image') {
        const trimmed = webImageUrl.trim();
        const check = await validateImageUrl(trimmed);
        if (!check.isValid) {
          setWebImageError(check.error || "Couldn't load image");
          throw new Error(check.error || "Couldn't load image");
        }

        const saved = await addWebImage({
          url: trimmed,
          name: webImageTitle.trim() || extractFilenameFromUrl(trimmed),
          altText: webImageAlt.trim() || webImageTitle.trim() || 'Web image asset',
          folderId: normalizedFolder,
          tags: ['web-image'],
        });
        savedItems.push(saved);
        setWebImageUrl('');
        setWebImageTitle('');
        setWebImageAlt('');
        setWebImagePreview(null);
        setWebImageError(null);
      }

      if (savedItems.length > 0) {
        addToast(
          savedItems.length === 1 
            ? `Added "${savedItems[0].name}" successfully` 
            : `Added ${savedItems.length} media items`, 
          'success'
        );

        if (onSuccess) onSuccess(savedItems);
        // Force refresh gallery store to ensure items appear immediately across all gallery views
        await useMediaStore.getState().init(true);
        onOpenChange(false);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to save media', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const targetFolderName = folders.find((f) => f.id === targetFolderId)?.name || 'All Media (Root)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full sm:max-w-[720px] h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-t-2xl sm:rounded-2xl transition-all"
        )}
      >
        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
          {/* Fixed Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-border/80 flex items-center justify-between shrink-0 bg-surface-1/90 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground truncate">
                  Add Media
                </h2>
                <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                  Upload local assets, embed streaming video, or link web images.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Control (Requirement 1: Equal padding, filled pill active state, hover/focus, no overflow, light/dark) */}
          <div className="px-5 sm:px-6 pt-3 pb-2.5 border-b border-border/50 bg-surface-1/50 shrink-0">
            <TabsList className="w-full grid grid-cols-3 h-10 bg-muted/50 p-1 rounded-xl border border-border/70 gap-1 overflow-hidden">
              <TabsTrigger 
                value="upload" 
                className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg justify-center transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border-border/80"
              >
                <FileUp className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">Upload</span>
                {queue.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono font-bold shrink-0">
                    {queue.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="embed" 
                className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg justify-center transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border-border/80"
              >
                <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Embed Video</span>
              </TabsTrigger>
              <TabsTrigger 
                value="web-image" 
                className="w-full text-xs font-semibold py-1.5 px-3 rounded-lg justify-center transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border-border/80"
              >
                <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">Web Image</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 custom-scrollbar bg-surface-0 min-h-[360px]">
            {/* Destination Dropdown & Add Folder Button (Requirement 2 & 3: Perfect vertical alignment, same height) */}
            <div className="space-y-2.5 p-3.5 rounded-xl bg-surface-1 border border-border text-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Destination Dropdown and Add Folder Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Label className="text-xs font-medium text-foreground whitespace-nowrap">
                      Destination:
                    </Label>
                  </div>

                  {/* Dropdown with same h-9 height */}
                  <Select
                    value={targetFolderId || 'root'}
                    onValueChange={(v) => setTargetFolderId(v === 'root' ? null : v)}
                  >
                    <SelectTrigger className="h-9 flex-1 sm:max-w-[220px] bg-surface-2 border-border text-xs font-medium">
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

                  {/* Add Folder button: folder-plus icon, same h-9 height, stacks on mobile */}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreatingFolder((prev) => !prev)}
                    className="h-9 px-3 text-xs font-semibold rounded-xl gap-1.5 border-border shrink-0 hover:bg-surface-2"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-primary" />
                    <span>Add Folder</span>
                  </Button>
                </div>

                {/* Auto-convert to WebP toggle (Upload tab only) */}
                {activeTab === 'upload' && (
                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <Switch checked={autoWebp} onCheckedChange={setAutoWebp} />
                    <span
                      onClick={() => setAutoWebp(!autoWebp)}
                      className="text-xs cursor-pointer flex items-center gap-1 select-none text-muted-foreground hover:text-foreground font-medium"
                    >
                      <Sparkles className="w-3 h-3 text-primary" /> Auto-convert to WebP
                    </span>
                  </div>
                )}
              </div>

              {/* Inline Create Folder Input when "Add Folder" is clicked */}
              {isCreatingFolder && (
                <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in duration-150">
                  <Input
                    autoFocus
                    placeholder="Enter new folder name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateFolderSubmit();
                      } else if (e.key === 'Escape') {
                        setIsCreatingFolder(false);
                      }
                    }}
                    className="h-9 text-xs bg-surface-2 border-border flex-1"
                  />
                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateFolderSubmit}
                      disabled={!newFolderName.trim() || isSavingFolder}
                      className="h-9 px-3 text-xs font-semibold rounded-xl"
                    >
                      {isSavingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                      }}
                      className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* TAB 1: UPLOAD LOCAL FILES */}
            <TabsContent value="upload" className="space-y-4 mt-0">
              {/* Drag & Drop Dropzone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload files dropzone. Drag and drop files here, or press Enter to browse files."
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={cn(
                  "p-6 sm:p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
                  isDragging
                    ? "border-primary bg-primary/10 scale-[1.005]"
                    : "border-border hover:border-primary/70 hover:bg-surface-1 bg-surface-1/40"
                )}
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
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">
                    Drag & drop files here, or <span className="text-primary underline">browse</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                    Images (PNG, JPG, WebP, SVG), Videos (MP4, WebM up to 100MB), Documents (PDF, DOC, ZIP)
                  </p>
                </div>
              </div>

              {/* Upload Queue Section (Duplicate button removed as per Requirement 4) */}
              {queue.length > 0 && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground px-1">
                    <span>Selected Files ({queue.length})</span>
                    <button
                      type="button"
                      onClick={clearQueue}
                      className="text-muted-foreground hover:text-destructive text-[11px] underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-border bg-surface-2 space-y-2 text-xs transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Thumbnail */}
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-surface-3 flex items-center justify-center shrink-0">
                              {item.previewUrl ? (
                                <img
                                  src={item.previewUrl}
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : item.file.type.startsWith('video/') ? (
                                <Film className="w-4 h-4 text-purple-400" />
                              ) : (
                                <FileText className="w-4 h-4 text-amber-500" />
                              )}
                            </div>

                            {/* Details with Truncation */}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs text-xs">
                                {item.file.name}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatBytes(item.file.size)}
                              </span>
                            </div>
                          </div>

                          {/* Status / Remove Action */}
                          <div className="flex items-center gap-2 shrink-0">
                            {item.status === 'completed' && (
                              <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="flex items-center gap-1 text-destructive font-semibold text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" /> {item.errorMessage}
                              </span>
                            )}
                            {item.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => removeQueueItem(item.id)}
                                title="Remove item"
                                className="p-1 text-muted-foreground hover:text-destructive rounded-md cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {item.status === 'uploading' && (
                          <div className="w-full bg-surface-4 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}

                        {/* Metadata inputs */}
                        {item.status !== 'completed' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                            <Input
                              value={item.name}
                              onChange={(e) => updateQueueItem(item.id, { name: e.target.value })}
                              placeholder="Title / Display Name"
                              className="h-7 text-xs bg-surface-1 border-border/80"
                            />
                            <Input
                              value={item.altText}
                              onChange={(e) => updateQueueItem(item.id, { altText: e.target.value })}
                              placeholder="Alt Text (SEO/Accessibility)"
                              className="h-7 text-xs bg-surface-1 border-border/80"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: EMBED VIDEO (Existing UI preserved without duplicate button) */}
            <TabsContent value="embed" className="space-y-4 mt-0">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Video Embed URL</h3>
                <p className="text-[11px] text-muted-foreground">
                  Embed YouTube, Vimeo, or direct MP4/WebM video links without consuming storage bandwidth.
                </p>
              </div>

              <div>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    const parsed = parseVideoEmbed(e.target.value);
                    if (parsed.isValid && parsed.titleSuggestion && !videoTitle) {
                      setVideoTitle(parsed.titleSuggestion);
                    }
                  }}
                  className="h-9 text-xs bg-surface-2 border-border"
                />
              </div>

              {/* Real-time Video Preview Card */}
              {parsedVideo?.isValid && (
                <div className="p-3 rounded-xl border border-border bg-surface-1 flex flex-col sm:flex-row gap-3 items-center animate-in fade-in duration-200">
                  {parsedVideo.thumbnailUrl ? (
                    <div className="relative w-28 h-18 rounded-lg overflow-hidden bg-black shrink-0 border border-border">
                      <img
                        src={parsedVideo.thumbnailUrl}
                        alt="video thumbnail"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Film className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : null}

                  <div className="flex-1 space-y-1.5 w-full min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                        {parsedVideo.provider}
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">
                        {parsedVideo.titleSuggestion}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="Title (optional)"
                        className="h-7 text-xs bg-surface-2 border-border"
                      />
                      <Input
                        value={videoAlt}
                        onChange={(e) => setVideoAlt(e.target.value)}
                        placeholder="Alt description (optional)"
                        className="h-7 text-xs bg-surface-2 border-border"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: WEB IMAGE (Existing UI preserved without duplicate button) */}
            <TabsContent value="web-image" className="space-y-4 mt-0">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">External Image Link</h3>
                <p className="text-[11px] text-muted-foreground">
                  Link any high-res external image directly by URL without downloading or re-uploading.
                </p>
              </div>

              <div className="space-y-1">
                <Input
                  type="url"
                  placeholder="Paste an image link, e.g. https://example.com/photo.jpg"
                  value={webImageUrl}
                  onChange={(e) => setWebImageUrl(e.target.value)}
                  className={cn(
                    "h-9 text-xs bg-surface-2 border-border",
                    webImageError && "border-destructive focus-visible:ring-destructive/30"
                  )}
                />
                {webImageError && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 font-medium pl-1">
                    <AlertCircle className="w-3 h-3" /> {webImageError}
                  </p>
                )}
              </div>

              {/* Loading State */}
              {isValidatingWebImage && (
                <div className="p-4 rounded-xl border border-border bg-surface-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Confirming image link...</span>
                </div>
              )}

              {/* Live Preview Card */}
              {webImagePreview && !isValidatingWebImage && (
                <div className="p-3 rounded-xl border border-border bg-surface-1 flex flex-col sm:flex-row gap-3 items-center animate-in fade-in duration-200">
                  <div className="relative w-28 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-border">
                    <img
                      src={webImagePreview.url}
                      alt="web preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono bg-sky-600 text-white font-bold">
                      WEB
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 w-full min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground truncate">
                        {webImageTitle || 'Web Image'}
                      </span>
                      {webImagePreview.width && webImagePreview.height && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {webImagePreview.width} &times; {webImagePreview.height} px
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={webImageTitle}
                        onChange={(e) => setWebImageTitle(e.target.value)}
                        placeholder="Title / Display Name"
                        className="h-7 text-xs bg-surface-2 border-border"
                      />
                      <Input
                        value={webImageAlt}
                        onChange={(e) => setWebImageAlt(e.target.value)}
                        placeholder="Alt text (SEO/Accessibility)"
                        className="h-7 text-xs bg-surface-2 border-border"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>

          {/* Fixed Footer (Requirement 4: Close secondary, Add Media primary, right-aligned, disabled until valid) */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-border/80 flex items-center justify-between shrink-0 bg-surface-1/90 backdrop-blur-md">
            {/* Left: Destination summary */}
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Destination: <strong className="text-foreground">{targetFolderName}</strong></span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 text-xs font-semibold rounded-xl"
              >
                Close
              </Button>

              <Button
                type="button"
                onClick={handleSaveMedia}
                disabled={!canSave || isProcessing}
                className="h-9 px-4 text-xs font-bold rounded-xl shadow-xs gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{saveButtonLabel}</span>
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadModal;
