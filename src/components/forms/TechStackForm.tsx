import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { techStackSchema } from '@/utils/schemas';
import { TechStack, TechStackIconType } from '@/types';
import { useAppStore } from '@/store';
import { InputBlock } from './FormControls';
import { IconPicker } from '@/components/admin/IconPicker';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { TechStackIcon } from '@/components/TechStackIcon';
import { Button } from '@/components/Button';
import { 
  Plus, 
  Layers, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw, 
  X, 
  Check, 
  Hash, 
  FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TechStackFormData = z.infer<typeof techStackSchema>;

interface TechStackFormProps {
  initialData?: Partial<TechStack>;
  onSubmit: (data: TechStack) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const TechStackForm: React.FC<TechStackFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { classifications, addClassification } = useAppStore();
  
  // Media picker modal state for 'image' source
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  
  // Inline "Add Classification" state
  const [isAddingClassification, setIsAddingClassification] = useState(false);
  const [newClassificationName, setNewClassificationName] = useState('');
  const [classificationError, setClassificationError] = useState('');

  // Initial source derivation
  const defaultIconType: TechStackIconType = 
    initialData?.iconType || 
    (initialData?.iconLink ? 'link' : initialData?.imageUrl ? 'image' : 'icon');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TechStackFormData>({
    resolver: zodResolver(techStackSchema),
    defaultValues: {
      name: initialData?.name || '',
      classification: initialData?.classification || (initialData as any)?.category || classifications[0] || 'Frontend',
      iconType: defaultIconType,
      icon: initialData?.icon || 'Code',
      iconLink: initialData?.iconLink || '',
      imageUrl: initialData?.imageUrl || '',
      order: typeof initialData?.order === 'number' ? initialData.order : 0,
    },
  });

  const activeIconType = watch('iconType');
  const watchedIcon = watch('icon');
  const watchedIconLink = watch('iconLink');
  const watchedImageUrl = watch('imageUrl');
  const watchedName = watch('name');
  const selectedClassification = watch('classification');

  // Handle switching icon source
  const handleSelectSource = (type: TechStackIconType) => {
    setValue('iconType', type, { shouldValidate: true, shouldDirty: true });
  };

  // Inline classification creation
  const handleCreateClassification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setClassificationError('');
    const trimmed = newClassificationName.trim();
    if (!trimmed) {
      setClassificationError('Name cannot be empty');
      return;
    }

    try {
      const created = await addClassification(trimmed);
      setValue('classification', created, { shouldValidate: true, shouldDirty: true });
      setNewClassificationName('');
      setIsAddingClassification(false);
    } catch (err: any) {
      setClassificationError(err?.message || 'Failed to add classification');
    }
  };

  const onFormSubmit = (data: TechStackFormData) => {
    // Clean up inactive source fields so stale data never persists
    const payload: TechStack = {
      id: initialData?.id || `ts_${Math.random().toString(36).substring(2, 9)}`,
      name: data.name.trim(),
      classification: data.classification.trim(),
      iconType: data.iconType,
      icon: data.iconType === 'icon' ? data.icon : undefined,
      iconLink: data.iconType === 'link' ? data.iconLink?.trim() : undefined,
      imageUrl: data.iconType === 'image' ? data.imageUrl?.trim() : undefined,
      order: Number(data.order) || 0,
      // Backward compatibility aliases
      category: data.classification.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Live Preview Card */}
      <div className="p-4 rounded-2xl bg-surface-2/60 border border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface-4 border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            <TechStackIcon
              iconType={activeIconType}
              icon={watchedIcon}
              iconLink={watchedIconLink}
              imageUrl={watchedImageUrl}
              name={watchedName}
              className="w-6 h-6 text-primary"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">
              {watchedName.trim() || 'New Tech Stack'}
            </div>
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              <span>{selectedClassification || 'Unclassified'}</span>
              <span>&bull;</span>
              <span className="text-primary font-medium">
                {activeIconType === 'icon' ? 'Library Icon' : activeIconType === 'link' ? 'Custom Link' : 'Media Image'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 py-1 rounded bg-surface-3 border border-border">
            Order #{watch('order')}
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Name Input */}
        <InputBlock
          label="Tech Stack Name"
          error={errors.name?.message}
          required
          startIcon={<Layers className="w-4 h-4" />}
          placeholder="e.g. Next.js, PostgreSQL, Tailwind CSS"
          disabled={isLoading}
          {...register('name')}
        />

        {/* Classification Selector + Inline Create */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
              <span>Classification</span>
              <span className="text-destructive">*</span>
            </label>
            {!isAddingClassification && (
              <button
                type="button"
                onClick={() => setIsAddingClassification(true)}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add Classification</span>
              </button>
            )}
          </div>

          {/* Inline Add Classification Box */}
          {isAddingClassification ? (
            <div className="p-3 rounded-xl bg-surface-2 border border-primary/30 space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-xs font-semibold text-text-primary flex items-center justify-between">
                <span>Create New Classification</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingClassification(false);
                    setClassificationError('');
                    setNewClassificationName('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClassificationName}
                  onChange={(e) => {
                    setNewClassificationName(e.target.value);
                    setClassificationError('');
                  }}
                  placeholder="e.g. Cloud & DevOps, AI / ML"
                  className="flex-1 h-9 px-3 text-xs bg-surface-0 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateClassification();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCreateClassification()}
                  className="h-9 px-3 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              {classificationError && (
                <p className="text-[11px] text-destructive">{classificationError}</p>
              )}
            </div>
          ) : (
            <div className="relative">
              <select
                {...register('classification')}
                disabled={isLoading}
                className={cn(
                  "w-full h-11 px-3.5 text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs",
                  errors.classification && "border-destructive focus:border-destructive focus:ring-destructive/20"
                )}
              >
                {classifications.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          )}
          {errors.classification && (
            <p className="text-[11px] text-destructive">{errors.classification.message}</p>
          )}
        </div>

        {/* Icon Source Segmented Control */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-text-primary block">
            Icon Source <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-surface-2 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => handleSelectSource('icon')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeIconType === 'icon'
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Icon Library</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSource('link')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeIconType === 'link'
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
              )}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Custom Link</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSource('image')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeIconType === 'image'
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Media Image</span>
            </button>
          </div>
        </div>

        {/* Active Source Inputs (Mutually Exclusive) */}
        <div className="p-4 rounded-2xl bg-surface-1 border border-border/80 space-y-4">
          {/* Source 1: Icon Library */}
          {activeIconType === 'icon' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <IconPicker
                label="Select Library Icon"
                value={watchedIcon}
                onChange={(val) => setValue('icon', val, { shouldDirty: true, shouldValidate: true })}
              />
              {errors.icon && (
                <p className="text-[11px] text-destructive">{errors.icon.message as string}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Choose from thousands of curated Hugeicons.
              </p>
            </div>
          )}

          {/* Source 2: Custom URL Link */}
          {activeIconType === 'link' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <InputBlock
                label="Custom Icon URL"
                required
                placeholder="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/..."
                error={errors.iconLink?.message}
                startIcon={<LinkIcon className="w-4 h-4" />}
                disabled={isLoading}
                {...register('iconLink')}
              />
              <p className="text-[11px] text-muted-foreground">
                Direct HTTPS URL to an SVG, PNG, or web icon asset.
              </p>
            </div>
          )}

          {/* Source 3: Media Gallery Image */}
          {activeIconType === 'image' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
                <span>Media Gallery Asset</span>
                {watchedImageUrl && (
                  <button
                    type="button"
                    onClick={() => setValue('imageUrl', '', { shouldDirty: true, shouldValidate: true })}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    Clear Image
                  </button>
                )}
              </label>

              {watchedImageUrl ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
                  <div className="w-16 h-16 rounded-lg bg-surface-4 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={watchedImageUrl}
                      alt="Selected asset"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{watchedImageUrl}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Asset chosen from unified gallery</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMediaPickerOpen(true)}
                    className="shrink-0 text-xs gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Replace
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => setMediaPickerOpen(true)}
                  className="p-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-surface-2/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-foreground">Select Image from Media Gallery</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Click to browse assets or upload a new tech stack badge
                  </div>
                </div>
              )}

              {errors.imageUrl && (
                <p className="text-[11px] text-destructive">{errors.imageUrl.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Display Order */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <InputBlock
            label="Display Order"
            type="number"
            placeholder="0"
            startIcon={<Hash className="w-4 h-4" />}
            description="Integer value to sort items in matrix and public views"
            error={errors.order?.message}
            disabled={isLoading}
            {...register('order', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Modal Actions */}
      <div className="pt-5 border-t border-border flex items-center justify-end gap-3 mt-8">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl px-5"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-xl px-8 shadow-glow-primary font-bold gap-2 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>{initialData?.id ? 'Save Tech Stack' : 'Add Tech Stack'}</span>
        </Button>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={(item) => {
          setValue('imageUrl', item.url, { shouldDirty: true, shouldValidate: true });
          setMediaPickerOpen(false);
        }}
        allowedTypes={['image']}
        title="Select Tech Stack Badge Image"
      />
    </form>
  );
};

export default TechStackForm;
