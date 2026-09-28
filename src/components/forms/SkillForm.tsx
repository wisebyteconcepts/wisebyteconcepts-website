import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { skillSchema } from '@/utils/schemas';
import { Skill, SkillCategory } from '@/types';
import { InputBlock, SelectBlock, FormField } from './FormControls';
import { Plus, Code2, Sparkles } from 'lucide-react';

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      category: initialData.category,
      level: initialData.level,
      icon: initialData.icon,
    } : {
      level: 80,
      category: SkillCategory.FRONTEND,
    },
  });

  const levelValue = watch('level') ?? 80;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-1">
            Skill Profile Mapping
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <InputBlock
          label="Capability / Skill Name"
          error={errors.name?.message}
          required
          startIcon={<Code2 />}
          placeholder="e.g. React.js, TypeScript, Docker"
          disabled={isLoading}
          {...register('name')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SelectBlock
            label="Skill Category"
            error={errors.category?.message}
            required
            disabled={isLoading}
            {...register('category')}
          >
            {Object.values(SkillCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
              </option>
            ))}
          </SelectBlock>

          <FormField
            label="Proficiency Level"
            badge={`${levelValue}%`}
            error={errors.level?.message}
            description="Adjust proficiency rating on the capability matrix."
          >
            <div className="space-y-3 pt-1">
              <input
                type="range"
                min="0"
                max="100"
                value={levelValue}
                onChange={(e) => setValue('level', Number(e.target.value))}
                disabled={isLoading}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>0% Beginner</span>
                <span>50% Intermediate</span>
                <span>100% Expert</span>
              </div>
            </div>
          </FormField>
        </div>

        <InputBlock
          label="Vector Icon Identifier or URL"
          description='Accepts Lucide icon name (e.g. "code", "database", "palette") or direct image URL.'
          error={errors.icon?.message}
          startIcon={<Sparkles />}
          placeholder="e.g. Code, Database, or https://..."
          disabled={isLoading}
          {...register('icon')}
        />
      </div>

      <div className="pt-5 border-t border-border mt-8">
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
          <span>{initialData ? 'Sync Capability Profile' : 'Commit Skill Profile'}</span>
        </button>
      </div>
    </form>
  );
};
