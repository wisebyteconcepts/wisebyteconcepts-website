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
  Folder
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
  const { uploadFile, addEmbedVideo, addWebImage, folders } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  // Active Tab state: 'upload' | 'embed' | 'web-image'
  const [activeTab, setActiveTab] = useState('upload');

  // Shared Folder & WebP State
  const [targetFolderId, setTargetFolderId] = useState<string | null>(defaultFolderId);
  const [autoWebp, setAutoWebp] = useState(true);

  // Background scroll lock
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
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

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

  const handleStartUpload = async () => {
    if (queue.length === 0) return;
    setIsProcessingUpload(true);
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

    setIsProcessingUpload(false);
    if (uploadedList.length > 0) {
      addToast(`Successfully uploaded ${uploadedList.length} file(s)`, 'success');
      if (onSuccess) onSuccess(uploadedList);
    }
  };

  // --- TAB 2: EMBED VIDEO STATE ---
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoAlt, setVideoAlt] = useState('');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  const parsedVideo = useMemo(() => {
    if (!videoUrl.trim()) return null;
    return parseVideoEmbed(videoUrl);
  }, [videoUrl]);

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) {
      addToast('Please enter a video URL', 'error');
      return;
    }
    if (!parsedVideo || !parsedVideo.isValid) {
      addToast('Invalid video URL. Please provide a YouTube, Vimeo, or direct MP4/WebM URL.', 'error');
      return;
    }

    setIsProcessingVideo(true);
    try {
      const saved = await addEmbedVideo({
        url: videoUrl.trim(),
        name: videoTitle.trim() || parsedVideo.titleSuggestion || 'Embedded Video',
        altText: videoAlt.trim() || videoTitle.trim() || 'Video embed',
        folderId: targetFolderId,
        tags: ['video', parsedVideo.provider],
      });

      addToast('Embedded video registered in Media Gallery', 'success');
      if (onSuccess) onSuccess([saved]);
      setVideoUrl('');
      setVideoTitle('');
      setVideoAlt('');
    } catch (err: any) {
      addToast(err.message || 'Failed to embed video', 'error');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // --- TAB 3: WEB IMAGE STATE ---
  const [webImageUrl, setWebImageUrl] = useState('');
  const [webImageTitle, setWebImageTitle] = useState('');
  const [webImageAlt, setWebImageAlt] = useState('');
  const [webImageError, setWebImageError] = useState<string | null>(null);
  const [isValidatingWebImage, setIsValidatingWebImage] = useState(false);
  const [webImagePreview, setWebImagePreview] = useState<{ url: string; width?: number; height?: number } | null>(null);
  const [isProcessingWebImage, setIsProcessingWebImage] = useState(false);

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

  const handleAddWebImage = async () => {
    const trimmed = webImageUrl.trim();
    if (!trimmed) {
      setWebImageError('Invalid URL');
      return;
    }

    if (webImageError) {
      addToast(webImageError, 'error');
      return;
    }

    setIsProcessingWebImage(true);
    try {
      const result = await validateImageUrl(trimmed);
      if (!result.isValid) {
        setWebImageError(result.error || "Couldn't load image");
        addToast(result.error || "Couldn't load image", 'error');
        return;
      }

      const saved = await addWebImage({
        url: trimmed,
        name: webImageTitle.trim() || extractFilenameFromUrl(trimmed),
        altText: webImageAlt.trim() || webImageTitle.trim() || 'Web image asset',
        folderId: targetFolderId,
        tags: ['web-image'],
      });

      addToast('Web image linked successfully in Media Gallery', 'success');
      if (onSuccess) onSuccess([saved]);
      setWebImageUrl('');
      setWebImageTitle('');
      setWebImageAlt('');
      setWebImagePreview(null);
      setWebImageError(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to add web image', 'error');
    } finally {
      setIsProcessingWebImage(false);
    }
  };

  const pendingQueueCount = queue.filter((q) => q.status === 'pending' || q.status === 'uploading').length;
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
                  Add Media to Gallery
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

          {/* Tab Bar: Upload | Embed Video | Web Image */}
          <div className="px-5 sm:px-6 pt-3 pb-2.5 border-b border-border/50 bg-surface-1/50 shrink-0">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-9 bg-surface-2 p-0.5 rounded-xl border border-border/80">
              <TabsTrigger value="upload" className="text-xs font-semibold gap-1.5 justify-center">
                <FileUp className="w-3.5 h-3.5 text-primary" />
                <span>Upload</span>
                {queue.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono font-bold">
                    {queue.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="embed" className="text-xs font-semibold gap-1.5 justify-center">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>Embed Video</span>
              </TabsTrigger>
              <TabsTrigger value="web-image" className="text-xs font-semibold gap-1.5 justify-center">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>Web Image</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Content Body with stable min-height */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 custom-scrollbar bg-surface-0 min-h-[360px]">
            {/* Destination Folder & WebP Options Bar (Active for all tabs) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-1 border border-border text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Label className="text-xs text-muted-foreground shrink-0 font-medium">Destination:</Label>
                <Select
                  value={targetFolderId || 'root'}
                  onValueChange={(v) => setTargetFolderId(v === 'root' ? null : v)}
                >
                  <SelectTrigger className="h-8 flex-1 max-w-[240px] bg-surface-2 border-border text-xs font-medium">
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

              {activeTab === 'upload' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={autoWebp} onCheckedChange={setAutoWebp} />
                  <span
                    onClick={() => setAutoWebp(!autoWebp)}
                    className="text-xs cursor-pointer flex items-center gap-1 select-none text-foreground font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-primary" /> Auto-convert to WebP
                  </span>
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

              {/* Upload Queue Section */}
              {queue.length > 0 && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground px-1">
                    <span>Upload Queue ({queue.length})</span>
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

                          {/* Status / Remove Button */}
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

                  {pendingQueueCount > 0 && (
                    <Button
                      type="button"
                      onClick={handleStartUpload}
                      disabled={isProcessingUpload}
                      className="w-full h-9 text-xs font-bold rounded-xl shadow-xs gap-2"
                    >
                      {isProcessingUpload ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading & Optimizing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Upload {pendingQueueCount} File(s) to Gallery
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: EMBED VIDEO */}
            <TabsContent value="embed" className="space-y-4 mt-0">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Video Embed URL</h3>
                <p className="text-[11px] text-muted-foreground">
                  Embed YouTube, Vimeo, or direct MP4/WebM video links without consuming storage bandwidth.
                </p>
              </div>

              {/* Single row on desktop, stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-start">
                <div className="flex-1 relative">
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
                    className="h-9.5 text-xs bg-surface-2 border-border"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddVideo}
                  disabled={!parsedVideo?.isValid || isProcessingVideo}
                  className="h-9.5 px-4 text-xs font-bold rounded-xl shrink-0 sm:w-32 shadow-xs"
                >
                  {isProcessingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Embed Video'}
                </Button>
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

            {/* TAB 3: WEB IMAGE */}
            <TabsContent value="web-image" className="space-y-4 mt-0">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">External Image Link</h3>
                <p className="text-[11px] text-muted-foreground">
                  Link any high-res external image directly by URL without downloading or re-uploading.
                </p>
              </div>

              {/* Single row on desktop, stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-start">
                <div className="flex-1 space-y-1">
                  <Input
                    type="url"
                    placeholder="Paste an image link, e.g. https://example.com/photo.jpg"
                    value={webImageUrl}
                    onChange={(e) => setWebImageUrl(e.target.value)}
                    className={cn(
                      "h-9.5 text-xs bg-surface-2 border-border",
                      webImageError && "border-destructive focus-visible:ring-destructive/30"
                    )}
                  />
                  {webImageError && (
                    <p className="text-[11px] text-destructive flex items-center gap-1 font-medium pl-1">
                      <AlertCircle className="w-3 h-3" /> {webImageError}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleAddWebImage}
                  disabled={!webImageUrl.trim() || isValidatingWebImage || Boolean(webImageError) || isProcessingWebImage}
                  className="h-9.5 px-4 text-xs font-bold rounded-xl shrink-0 sm:w-32 shadow-xs"
                >
                  {isProcessingWebImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isValidatingWebImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Checking...
                    </>
                  ) : (
                    'Add Image'
                  )}
                </Button>
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

          {/* Fixed Footer */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-border/80 flex items-center justify-between shrink-0 bg-surface-1/90 backdrop-blur-md">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate">Folder: <strong className="text-foreground">{targetFolderName}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="h-8.5 px-4 text-xs font-semibold rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadModal;
