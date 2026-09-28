import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productSchema } from '@/utils/schemas';
import { Product, Service } from '@/types';
import { InputBlock, TextareaBlock, SelectBlock } from './FormControls';
import { Plus, Globe, Github, Image as ImageIcon, Tag, Package } from 'lucide-react';

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  services: Service[];
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

export const ProductForm = ({ initialData, services, onSubmit, isLoading }: ProductFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      serviceId: initialData.serviceId,
      imageUrl: initialData.imageUrl,
      demoUrl: initialData.demoUrl,
      repoUrl: initialData.repoUrl,
      tags: initialData.tags || [],
    } : {
      tags: [],
    },
  });

  const tagsValue = watch('tags');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputBlock
          label="Product Name"
          error={errors.name?.message}
          required
          startIcon={<Package />}
          placeholder="e.g. E-commerce Platform"
          disabled={isLoading}
          {...register('name')}
        />

        <SelectBlock
          label="Associated Service Architecture"
          error={errors.serviceId?.message}
          required
          disabled={isLoading}
          {...register('serviceId')}
        >
          <option value="">Select associated service...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectBlock>
      </div>

      <TextareaBlock
        label="Product Specification"
        description="Detailed technical showcase summary describing the product capabilities."
        error={errors.description?.message}
        required
        placeholder="Brief technical showcase summary of the product..."
        disabled={isLoading}
        className="min-h-[110px]"
        {...register('description')}
      />

      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-1">
            External Links & Assets
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <InputBlock
          label="Showcase Thumbnail URL"
          description="Direct HTTPS URL or media asset link for the showcase card."
          error={errors.imageUrl?.message}
          startIcon={<ImageIcon />}
          placeholder="https://..."
          disabled={isLoading}
          {...register('imageUrl')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputBlock
            label="Deployment / Demo URL"
            error={errors.demoUrl?.message}
            startIcon={<Globe />}
            placeholder="https://wisebyte.link/demo"
            disabled={isLoading}
            {...register('demoUrl')}
          />

          <InputBlock
            label="Source Repository URL"
            error={errors.repoUrl?.message}
            startIcon={<Github />}
            placeholder="https://github.com/..."
            disabled={isLoading}
            {...register('repoUrl')}
          />
        </div>

        <InputBlock
          label="Taxonomy Tags"
          description="Comma-separated keywords for filtering and search categorization."
          error={errors.tags?.message}
          startIcon={<Tag />}
          placeholder="e.g. react, typescript, cloud-native"
          defaultValue={tagsValue?.join(', ')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            const tagArray = val.split(',').map((t) => t.trim()).filter(Boolean);
            setValue('tags', tagArray);
          }}
          disabled={isLoading}
        />
      </div>

      <div className="pt-5 sticky bottom-0 bg-background/95 backdrop-blur-md pb-2 -mx-2 px-2 border-t border-border mt-8">
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
          <span>{initialData ? 'Sync Product Node' : 'Register Product Instance'}</span>
        </button>
      </div>
    </form>
  );
};
