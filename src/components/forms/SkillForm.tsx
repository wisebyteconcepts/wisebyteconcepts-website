import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { skillSchema } from '@/utils/schemas';
import { Skill, SkillCategory } from '@/types';
import { FormField, Input, Select } from './FormControls';
import { Plus } from 'lucide-react';

type SkillFormData = z.infer<typeof skillSchema>;

interface SkillFormProps {
  initialData?: Skill;
  onSubmit: (data: SkillFormData) => void;
  isLoading?: boolean;
}

export const SkillForm = ({ initialData, onSubmit, isLoading }: SkillFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      category: initialData.category,
      level: initialData.level,
      icon: initialData.icon,
    } : {
      level: 0,
      category: SkillCategory.FRONTEND,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-2">Skill Profile Mapping</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <FormField label="Capability Name" error={errors.name?.message} id="name" required>
          <Input {...register('name')} id="name" placeholder="e.g. React.js" disabled={isLoading} />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Skill Matrix Category" error={errors.category?.message} id="category" required>
            <Select {...register('category')} id="category" disabled={isLoading}>
              {Object.values(SkillCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Proficiency Level (0-100)" error={errors.level?.message} id="level" required>
            <div className="relative">
              <Input 
                {...register('level', { valueAsNumber: true })} 
                id="level" 
                type="number" 
                min="0" 
                max="100" 
                disabled={isLoading} 
                className="pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
            </div>
          </FormField>
        </div>

        <FormField label="Asset Vector / Icon Identifier" error={errors.icon?.message} id="icon">
          <Input 
            {...register('icon')} 
            id="icon" 
            placeholder="Lucide class identifier or artifact URL..." 
            disabled={isLoading} 
          />
          <p className="text-[9px] font-mono text-muted-foreground mt-1 uppercase tracking-tighter opacity-70">
            Accepts: Lucide identifier (e.g. "code") or direct URL.
          </p>
        </FormField>
      </div>

      <div className="pt-6 border-t border-border mt-8">
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
          {initialData ? 'Sync Capability Profile' : 'Commit Skill Profile'}
        </button>
      </div>
    </form>
  );
};
