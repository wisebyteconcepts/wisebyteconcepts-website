import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/Label';
import { InputBlock, FormField } from '@/components/forms/FormControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { MediaItem } from '@/types';
import { optimizeImage, formatBytes } from '@/utils/mediaOptimizer';
import { useMediaStore } from '@/store/mediaStore';
import { useToastStore } from '@/store/toastStore';

interface ImageOptimizerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MediaItem | null;
}

const PRESETS = [
  { label: 'Original Ratio', ratio: undefined, desc: 'Keep original aspect' },
  { label: '16:9 Landscape', ratio: 16 / 9, desc: 'Hero banners & video thumbnails' },
  { label: '1:1 Square', ratio: 1, desc: 'Avatars & product thumbnails' },
  { label: '4:5 Portrait', ratio: 4 / 5, desc: 'Coach portraits & team cards' },
  { label: '4:3 Classic', ratio: 4 / 3, desc: 'Standard showcase cards' },
  { label: '21:9 Ultra-Wide', ratio: 21 / 9, desc: 'Panoramic headers' },
];

export const ImageOptimizerModal: React.FC<ImageOptimizerModalProps> = ({
  open,
  onOpenChange,
  item,
}) => {
  const { uploadFile, replaceFile } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [targetWidth, setTargetWidth] = useState(1200);
  const [targetHeight, setTargetHeight] = useState(800);
  const [quality, setQuality] = useState(85);
  const [format, setFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [optimizedSize, setOptimizedSize] = useState<number>(0);
  const [optimizedDims, setOptimizedDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (item && open) {
      const origW = item.dimensions?.width || 1200;
      const origH = item.dimensions?.height || 800;
      setTargetWidth(origW);
      setTargetHeight(origH);
      setSelectedPresetIndex(0);
      runOptimizationPreview(origW, origH, 85, 'image/webp', undefined);
    }
  }, [item, open]);

  const runOptimizationPreview = async (
    w: number,
    h: number,
    q: number,
    fmt: 'image/webp' | 'image/jpeg' | 'image/png',
    ratio?: number
  ) => {
    if (!item?.url) return;
    setIsProcessing(true);
    try {
      const result = await optimizeImage(item.url, {
        maxWidth: w,
        maxHeight: h,
        quality: q / 100,
        format: fmt,
        aspectRatio: ratio,
      });
      setPreviewDataUrl(result.dataUrl);
      setOptimizedSize(result.size);
      setOptimizedDims({ width: result.width, height: result.height });
    } catch (e) {
      console.error('Optimization failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetChange = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = PRESETS[index];
    let newH = targetHeight;
    if (preset.ratio) {
      newH = Math.round(targetWidth / preset.ratio);
      setTargetHeight(newH);
    }
    runOptimizationPreview(targetWidth, newH, quality, format, preset.ratio);
  };

  const handleWidthChange = (w: number) => {
    setTargetWidth(w);
    const preset = PRESETS[selectedPresetIndex];
    let newH = targetHeight;
    if (preset.ratio) {
      newH = Math.round(w / preset.ratio);
      setTargetHeight(newH);
    }
    runOptimizationPreview(w, newH, quality, format, preset.ratio);
  };

  const handleQualityChange = (q: number) => {
    setQuality(q);
    const preset = PRESETS[selectedPresetIndex];
    runOptimizationPreview(targetWidth, targetHeight, q, format, preset.ratio);
  };

  const handleFormatChange = (fmt: 'image/webp' | 'image/jpeg' | 'image/png') => {
    setFormat(fmt);
    const preset = PRESETS[selectedPresetIndex];
    runOptimizationPreview(targetWidth, targetHeight, quality, fmt, preset.ratio);
  };

  const handleSaveAsCopy = async () => {
    if (!item || !previewDataUrl) return;
    setIsProcessing(true);
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      const ext = format.replace('image/', '');
      const file = new File([blob], `${item.name}-optimized.${ext}`, { type: format });

      await uploadFile(file, {
        name: `${item.name} (${optimizedDims.width}x${optimizedDims.height})`,
        altText: item.altText,
        caption: item.caption,
        folderId: item.folderId,
        tags: [...(item.tags || []), 'optimized', ext],
      });

      addToast('Optimized image saved as new copy', 'success');
      onOpenChange(false);
    } catch (error: any) {
      addToast(error.message || 'Failed to save copy', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReplaceCurrent = async () => {
    if (!item || !previewDataUrl) return;

    setIsProcessing(true);
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      const ext = format.replace('image/', '');
      const file = new File([blob], `${item.name}.${ext}`, { type: format });

      await replaceFile(item.id, file);

      addToast('Image updated and replaced across all active pages', 'success');
      onOpenChange(false);
    } catch (error: any) {
      addToast(error.message || 'Failed to replace file', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!item) return null;

  const originalSize = item.size || 1;
  const savingsPct = Math.round(((originalSize - optimizedSize) / originalSize) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-white/10">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <DialogTitle className="text-xl font-bold">Image Optimization & Resizer</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Resize, crop to standard web aspect ratios, and convert to high-efficiency WebP with real-time compression preview.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Aspect Ratio Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePresetChange(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedPresetIndex === idx
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-[10px] opacity-70 truncate">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions */}
            <div className="grid grid-cols-2 gap-3.5">
              <InputBlock
                label="Max Width"
                type="number"
                value={targetWidth}
                onChange={(e) => handleWidthChange(Number(e.target.value) || 100)}
                min={100}
                max={4000}
                addonRight="px"
                className="font-mono text-xs h-9"
              />
              <InputBlock
                label="Max Height"
                type="number"
                value={targetHeight}
                onChange={(e) => {
                  const h = Number(e.target.value) || 100;
                  setTargetHeight(h);
                  runOptimizationPreview(targetWidth, h, quality, format);
                }}
                min={100}
                max={4000}
                addonRight="px"
                className="font-mono text-xs h-9"
              />
            </div>

            {/* Quality Slider */}
            <FormField
              label="Compression Quality"
              badge={`${quality}%`}
              description="Lower quality yields significantly smaller download sizes."
            >
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={5}
                  value={quality}
                  onChange={(e) => handleQualityChange(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Smaller size</span>
                  <span>Balanced (85%)</span>
                  <span>Max quality</span>
                </div>
              </div>
            </FormField>

            {/* Target Format */}
            <FormField label="Target Format" description="Modern formats offer better compression and smaller footprints.">
              <Select value={format} onValueChange={(v: any) => handleFormatChange(v)}>
                <SelectTrigger className="w-full border-input text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/webp">WebP (Modern, highly compressed)</SelectItem>
                  <SelectItem value="image/jpeg">JPEG (Universal compatibility)</SelectItem>
                  <SelectItem value="image/png">PNG (Lossless, with transparency)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {/* Stats Comparison Card */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Compression Analysis
              </div>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="text-muted-foreground">Original</div>
                  <div className="font-mono font-semibold">{formatBytes(originalSize)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Optimized</div>
                  <div className="font-mono font-semibold text-primary">{formatBytes(optimizedSize)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Savings</div>
                  <div className={`font-mono font-bold ${savingsPct > 0 ? 'text-green-500' : 'text-amber-500'}`}>
                    {savingsPct > 0 ? `-${savingsPct}%` : '0%'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 bg-black/40 min-h-[320px] relative overflow-hidden">
            {previewDataUrl ? (
              <div className="relative max-h-[380px] w-full flex items-center justify-center">
                <img
                  src={previewDataUrl}
                  alt="Optimized preview"
                  className="max-h-[360px] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
                />
                <div className="absolute bottom-2 left-2 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono text-white border border-white/10 flex items-center gap-2">
                  <span>{optimizedDims.width} × {optimizedDims.height} px</span>
                  <span>•</span>
                  <span>{format.replace('image/', '').toUpperCase()}</span>
                  <span>•</span>
                  <span>{formatBytes(optimizedSize)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Generating preview...
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleSaveAsCopy}
            disabled={isProcessing}
            className="rounded-xl"
          >
            Save as New Copy
          </Button>
          <Button
            onClick={handleReplaceCurrent}
            disabled={isProcessing}
            className="rounded-xl shadow-glow-primary"
          >
            Replace Current File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
