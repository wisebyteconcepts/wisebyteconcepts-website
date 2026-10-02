import React from 'react';
import { TechStackForm, TechStackFormData } from './TechStackForm';
import { Skill } from '@/types';

export type SkillFormData = TechStackFormData;

export interface SkillFormProps {
  initialData?: Skill;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const SkillForm: React.FC<SkillFormProps> = ({ initialData, onSubmit, isLoading }) => {
  return (
    <TechStackForm
      initialData={initialData}
      onSubmit={onSubmit}
      isLoading={isLoading}
    />
  );
};

export default SkillForm;
