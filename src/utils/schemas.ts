import { z } from 'zod';
import { ServiceCategory, SkillCategory } from '@/types';

export const serviceSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be url-friendly'),
  caption: z.string().min(5, 'Caption is required'),
  header: z.string().min(5, 'Header is required'),
  shortDescription: z.string().min(10, 'Short description is required'),
  fullDescription: z.string().min(20, 'Full description is required'),
  thumbnail: z.string().url('Must be a valid URL'),
  bannerImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  category: z.nativeEnum(ServiceCategory),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  technologies: z.array(z.string()).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean().optional(),
  order: z.number().optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().min(10, 'Description is required'),
  serviceId: z.string().min(1, 'Service category is required'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  demoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  repoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.nativeEnum(SkillCategory),
  level: z.number().min(0).max(100, 'Level must be between 0 and 100'),
  icon: z.string().optional().or(z.literal('')),
});
