import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serviceSchema } from '@/utils/schemas';
import { Service, ServiceCategory } from '@/types';
import { InputBlock, TextareaBlock, SelectBlock, SwitchBlock, Input } from './FormControls';
import { Plus, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  initialData?: Service;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const ServiceForm = ({ initialData, onSubmit, isLoading }: ServiceFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      slug: initialData.slug,
      caption: initialData.caption,
      header: initialData.header,
      shortDescription: initialData.shortDescription,
      fullDescription: initialData.fullDescription,
      thumbnail: initialData.thumbnail,
      bannerImage: initialData.bannerImage || '',
      category: initialData.category,
      features: initialData.features,
      isActive: initialData.isActive ?? true,
      isFeatured: initialData.isFeatured || false,
      order: initialData.order || 0,
    } : {
      isActive: true,
      isFeatured: false,
      category: ServiceCategory.DEVELOPMENT,
      features: [''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features' as never,
  });

  const isActive = watch('isActive');
  const isFeatured = watch('isFeatured');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      {/* Basic Registry Info */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-1">
            Registry Configuration
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputBlock
            label="Service Name"
            error={errors.name?.message}
            required
            placeholder="e.g. Web Development"
            disabled={isLoading}
            {...register('name')}
          />

          <InputBlock
            label="Slug (URL Segment)"
            error={errors.slug?.message}
            required
            placeholder="e.g. web-development"
            disabled={isLoading}
            {...register('slug')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SelectBlock
            label="Category Classification"
            error={errors.category?.message}
            required
            disabled={isLoading}
            {...register('category')}
          >
            {Object.values(ServiceCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </option>
            ))}
          </SelectBlock>

          <InputBlock
            label="Display Header"
            error={errors.header?.message}
            required
            placeholder="Main landing headline"
            disabled={isLoading}
            {...register('header')}
          />

          <InputBlock
            label="Tagline / Hero Hook"
            error={errors.caption?.message}
            required
            placeholder="Short thematic tagline"
            disabled={isLoading}
            {...register('caption')}
          />
        </div>
      </section>

      {/* Content Specification */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-1">
            Content Specification
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <InputBlock
          label="Short Description"
          description="Concise 1-2 line summary displayed in registry cards and search results."
          error={errors.shortDescription?.message}
          required
          placeholder="1-2 line module summary..."
          disabled={isLoading}
          {...register('shortDescription')}
        />

        <TextareaBlock
          label="Full Technical Description"
          description="Comprehensive engineering specification, methodologies, and technical stack details."
          error={errors.fullDescription?.message}
          required
          placeholder="Detailed engineering specification and process explanation..."
          className="min-h-[140px]"
          disabled={isLoading}
          {...register('fullDescription')}
        />
      </section>

      {/* Visual Assets */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-1">
            Visual Mapping
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputBlock
            label="Thumbnail Asset URL"
            error={errors.thumbnail?.message}
            required
            placeholder="https://..."
            disabled={isLoading}
            {...register('thumbnail')}
          />

          <InputBlock
            label="Hero Banner Asset URL"
            error={errors.bannerImage?.message}
            placeholder="https://..."
            disabled={isLoading}
            {...register('bannerImage')}
          />
        </div>
      </section>

      {/* Capabilities Array */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-foreground/90 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Core Capabilities List
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Key deliverable items and skill milestones included.</p>
          </div>
          <button
            type="button"
            onClick={() => append('')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Capability
          </button>
        </div>

        <div className="space-y-2.5">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Input
                {...register(`features.${index}` as const)}
                placeholder={`Capability node #${index + 1}...`}
                disabled={isLoading}
                className="bg-muted/30"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all shrink-0"
                disabled={isLoading || fields.length === 1}
                title="Remove node"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {errors.features && (
            <p className="text-[11px] text-destructive font-medium">{errors.features.message}</p>
          )}
        </div>
      </section>

      {/* Status Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SwitchBlock
          label="Production Visibility"
          description="Make service node accessible on public facing registry."
          checked={Boolean(isActive)}
          onCheckedChange={(val) => setValue('isActive', val)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          disabled={isLoading}
        />

        <SwitchBlock
          label="Featured Promotion"
          description="Highlight this service on the home hero and top lists."
          checked={Boolean(isFeatured)}
          onCheckedChange={(val) => setValue('isFeatured', val)}
          icon={<Sparkles className="w-4 h-4" />}
          disabled={isLoading}
        />
      </div>

      <div className="pt-5 sticky bottom-0 bg-background/95 backdrop-blur-md pb-2 -mx-2 px-2 border-t border-border mt-8 z-20">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl shadow-elegant hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{initialData ? 'Update Technical Service' : 'Initialize Service Module'}</span>
        </button>
      </div>
    </form>
  );
};
