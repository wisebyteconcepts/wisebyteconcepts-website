import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { serviceSchema } from '@/utils/schemas';
import { Service, ServiceCategory } from '@/types';
import { FormField, Input, Textarea, Select } from './FormControls';
import { Plus, Trash2 } from 'lucide-react';

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
      category: ServiceCategory.DEVELOPMENT,
      features: [''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features' as never,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Registry Info */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2">Registry Configuration</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Service Name" error={errors.name?.message} id="name" required>
            <Input {...register('name')} id="name" placeholder="e.g. Web Development" disabled={isLoading} />
          </FormField>

          <FormField label="Slug (URL Segment)" error={errors.slug?.message} id="slug" required>
            <Input {...register('slug')} id="slug" placeholder="e.g. web-development" disabled={isLoading} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Category" error={errors.category?.message} id="category" required>
            <Select {...register('category')} id="category" disabled={isLoading}>
              {Object.values(ServiceCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Display Header" error={errors.header?.message} id="header" required>
            <Input {...register('header')} id="header" placeholder="Main landing header" disabled={isLoading} />
          </FormField>

          <FormField label="Tagline" error={errors.caption?.message} id="caption" required>
            <Input {...register('caption')} id="caption" placeholder="Short thematic tagline" disabled={isLoading} />
          </FormField>
        </div>
      </section>

      {/* Content Specification */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2">Content Specification</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <FormField label="Short Description (Registry Card)" error={errors.shortDescription?.message} id="shortDescription" required>
          <Input {...register('shortDescription')} id="shortDescription" placeholder="1-2 line module summary" disabled={isLoading} />
        </FormField>

        <FormField label="Full Technical Description" error={errors.fullDescription?.message} id="fullDescription" required>
          <Textarea 
            {...register('fullDescription')} 
            id="fullDescription" 
            placeholder="Detailed engineering specification and process explanation..." 
            className="min-h-[150px]"
            disabled={isLoading} 
          />
        </FormField>
      </section>

      {/* Visual Assets */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2">Visual Mapping</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Thumbnail Artifact URL" error={errors.thumbnail?.message} id="thumbnail" required>
            <Input {...register('thumbnail')} id="thumbnail" placeholder="https://..." disabled={isLoading} />
          </FormField>
          
          <FormField label="Hero Banner Asset URL" error={errors.bannerImage?.message} id="bannerImage">
            <Input {...register('bannerImage')} id="bannerImage" placeholder="https://..." disabled={isLoading} />
          </FormField>
        </div>
      </section>

      {/* Capabilities Array */}
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
            Core Capabilities List
          </label>
          <button
            type="button"
            onClick={() => append('')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-full transition-all uppercase tracking-widest"
          >
            <Plus className="w-3 h-3" /> Add_Capability
          </button>
        </div>
        
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-3 animate-fade-in group">
              <div className="flex-1">
                <Input
                  {...register(`features.${index}` as const)}
                  placeholder="Capability descriptor..."
                  disabled={isLoading}
                  className="bg-white/[0.02] border-white/5 focus:bg-white/[0.05]"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                disabled={isLoading || fields.length === 1}
                title="Remove node"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {errors.features && <p className="text-[10px] text-destructive font-mono">{errors.features.message}</p>}
        </div>
      </section>

      {/* Status Matrix */}
      <div className="flex items-center gap-8 p-6 bg-white/[0.02] rounded-2xl border border-white/5">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input type="checkbox" {...register('isActive')} className="peer sr-only" />
            <div className="w-4 h-4 border border-border rounded transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Node_Active</span>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input type="checkbox" {...register('isFeatured')} className="peer sr-only" />
            <div className="w-4 h-4 border border-border rounded transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Promote_Featured</span>
        </label>
      </div>

      <div className="pt-4 sticky bottom-0 bg-card/80 backdrop-blur-md pb-2 -mx-2 px-2 border-t border-border mt-12">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-primary text-white font-bold rounded-xl shadow-elegant hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
          {initialData ? 'Update Technical Service' : 'Initialize Service Module'}
        </button>
      </div>
    </form>
  );
};
