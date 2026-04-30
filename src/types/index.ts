export enum ServiceCategory {
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  CONSULTING = 'consulting',
  MARKETING = 'marketing',
  SYSTEMS = 'systems',
}

export type PricingType = 'fixed' | 'starting_from' | 'custom';
export type PricingUnit = 'project' | 'month' | 'hour';
export type CtaAction = 'contact' | 'quote' | 'external';

export interface Service {
  id: string;
  slug: string;
  
  // Basic Display
  name: string;
  caption: string;
  header: string;
  shortDescription: string;
  fullDescription: string;

  // Media
  thumbnail: string;
  bannerImage?: string;
  gallery?: string[];

  // Categorization
  category: ServiceCategory;
  tags?: string[];

  // Features & Deliverables
  features: string[];
  deliverables?: string[];

  // Pricing
  pricing?: {
    type: PricingType;
    amount?: number;
    currency?: string;
    unit?: PricingUnit;
  };

  // Timeline
  estimatedDuration?: string;

  // Tech Stack
  technologies?: string[];

  // Portfolio Mapping
  relatedProjects?: string[];

  // CTA
  cta?: {
    label: string;
    action: CtaAction;
    link?: string;
  };

  // SEO
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };

  // Status & Control
  isActive: boolean;
  isFeatured?: boolean;
  order?: number;

  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;

  // Core Info
  name: string;
  description: string;

  // Relationship
  serviceId: string; // FK → Service.id

  // Media
  imageUrl?: string;

  // Optional Enhancements
  demoUrl?: string;
  repoUrl?: string;
  tags?: string[];

  // System
  createdAt: string;
  updatedAt: string;
}

export enum SkillCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  TOOLS = 'tools',
  DATABASE = 'database',
  OTHER = 'other',
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: number; // 0–100
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
}
