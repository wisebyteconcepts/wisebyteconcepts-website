import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productSchema } from '@/utils/schemas';
import { Product, Service } from '@/types';
import { FormField, Input, Textarea, Select } from './FormControls';
import { Plus } from 'lucide-react';

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Product Name" error={errors.name?.message} id="name" required>
          <Input {...register('name')} id="name" placeholder="e.g. E-commerce Platform" disabled={isLoading} />
        </FormField>

        <FormField label="Mapping / Node Assignment" error={errors.serviceId?.message} id="serviceId" required>
          <Select {...register('serviceId')} id="serviceId" disabled={isLoading}>
            <option value="">Select associated service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Product Specification" error={errors.description?.message} id="description" required>
        <Textarea 
          {...register('description')} 
          id="description" 
          placeholder="Brief technical showcase summary of the product..." 
          disabled={isLoading} 
          className="min-h-[120px]"
        />
      </FormField>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2">External Links & Assets</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <FormField label="Showcase Thumbnail URL" error={errors.imageUrl?.message} id="imageUrl">
            <Input {...register('imageUrl')} id="imageUrl" placeholder="https://..." disabled={isLoading} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Deployment / Demo URL" error={errors.demoUrl?.message} id="demoUrl">
            <Input {...register('demoUrl')} id="demoUrl" placeholder="https://wisebyte.link/demo" disabled={isLoading} />
          </FormField>

          <FormField label="Source Repository URL" error={errors.repoUrl?.message} id="repoUrl">
            <Input {...register('repoUrl')} id="repoUrl" placeholder="https://github.com/..." disabled={isLoading} />
          </FormField>
        </div>

        <FormField label="Taxonomy Tags (Comma Separated)" error={errors.tags?.message} id="tags">
          <Input 
            placeholder="e.g. react, typescript, cloud-native" 
            defaultValue={tagsValue?.join(', ')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value;
              const tagArray = val.split(',').map(t => t.trim()).filter(Boolean);
              setValue('tags', tagArray);
            }}
            disabled={isLoading}
          />
        </FormField>
      </div>

      <div className="pt-6 sticky bottom-0 bg-card/80 backdrop-blur-md pb-2 -mx-2 px-2 border-t border-border mt-12">
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
          {initialData ? 'Sync Product Node' : 'Register Product Instance'}
        </button>
      </div>
    </form>
  );
};
