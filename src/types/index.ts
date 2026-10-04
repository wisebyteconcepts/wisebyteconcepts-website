import { IconValue } from './icon';

export enum ServiceCategory {
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  CONSULTING = 'consulting',
  MARKETING = 'marketing',
  SYSTEMS = 'systems',
}

export type ServiceIconType = 'icon' | 'image';

export type ServiceDeliveredUnit = 'Days' | 'Weeks' | 'Month' | 'Depends Upon Project';

export interface ServiceDeliveredWithin {
  unit: ServiceDeliveredUnit;
  range?: string | number;
}

export type ServicePricingModel = 'Fixed' | 'Starting At' | 'Range' | 'Custom Quote';

export interface ServiceValueItem {
  icon: IconValue | string;
  title: string;
  description: string;
}

export interface ServiceCtaVisual {
  type: 'icon' | 'image';
  value: IconValue | string;
}

export interface Service {
  id: string;
  
  // Content Tab
  title: string;
  slug: string;
  caption?: string;
  shortDescription: string;
  fullDescription: string;
  category: string; // From Service Category lookup
  tags: string[];
  active: boolean; // false = hidden from public site
  featured: boolean; // shown on homepage
  order: number;

  // Media Tab
  iconType: ServiceIconType;
  icon?: IconValue | string;
  iconImage?: string;
  displayPicture: string; // required media picker
  bannerPicture?: string; // optional (falls back to displayPicture)
  gallery?: string[]; // media picker collection

  // Value Tab
  coreFeatures: ServiceValueItem[];
  deliverables: ServiceValueItem[];
  deliveredWithin: ServiceDeliveredWithin;

  // Pricing Tab
  pricingModel: ServicePricingModel;
  currency?: string;
  amount?: number;
  minAmount?: number;
  maxAmount?: number;

  // Call to Action Tab
  ctaVisual?: ServiceCtaVisual;
  ctaText?: string;
  ctaButtonText: string;
  ctaButtonLink: string;

  // Tech Used Tab
  techStacks: string[]; // multi-select from Tech Stack model
  relatedProjects: string[]; // multi-select from Project model

  // SEO Tab
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];

  // Backward compatibility aliases for legacy access
  name?: string;
  header?: string;
  thumbnail?: string;
  bannerImage?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  features?: string[];
  technologies?: string[];
  description?: string;
  pricing?: any;
  cta?: any;
  seo?: any;
  estimatedDuration?: string;

  createdAt: string;
  updatedAt: string;
}

export type ProjectDeliveredUnit = 'Days' | 'Weeks' | 'Month' | 'Depends Upon Project';

export interface ProjectDeliveredWithin {
  unit: ProjectDeliveredUnit;
  range?: string | number;
}

export interface ProjectValueItem {
  icon: IconValue | string;
  title: string;
  description: string;
}

export type ProjectIconType = 'icon' | 'image';

export interface Project {
  id: string;

  // Basic Details Tab
  title: string;
  slug: string;
  caption?: string;
  shortDescription: string;
  fullDescription: string;
  category: string; // Select from "Project Category" lookup
  parentService: string; // Select from Service model (FK → Service.id)
  tags: string[];
  active: boolean; // false = hidden from public site
  featured: boolean; // shown on homepage
  order: number; // used for sorting

  // Media Tab
  iconType: ProjectIconType;
  icon?: IconValue | string;
  iconImage?: string;
  displayPicture: string; // media picker
  bannerPicture?: string; // optional (falls back to displayPicture)
  gallery: string[]; // media picker, collection

  // Value Tab
  coreFeatures: ProjectValueItem[];
  deliverables: ProjectValueItem[];
  deliveredWithin: ProjectDeliveredWithin;

  // Tech Used Tab
  techStacks: string[]; // multi-select from Tech Stack model

  // Deployment Tab
  liveLink: string; // validated url (live website or download link)
  gitRepository?: string; // validated optional url (public repos only)

  // Call to Action Tab
  ctaHeading?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  ctaSecondaryButtonText?: string;
  ctaSecondaryButtonLink?: string;
  ctaVisual?: ServiceCtaVisual;

  // SEO Tab
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  focusKeyword?: string;
  ogImage?: string;

  // Backward compatibility aliases for existing components and queries
  name?: string;
  description?: string;
  serviceId?: string;
  imageUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  technologies?: string[];
  features?: string[];

  createdAt: string;
  updatedAt: string;
}

// In-place model alias: Product is Project to prevent duplicate module or parallel model
export type Product = Project;

export enum SkillCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  TOOLS = 'tools',
  DATABASE = 'database',
  OTHER = 'other',
}

export type TechStackIconType = 'icon' | 'link' | 'image';

export interface TechStack {
  id: string;
  name: string;
  classification: string; // e.g. Frontend, Backend, Tools, Database, etc.
  iconType: TechStackIconType;
  icon?: IconValue | string;
  iconLink?: string;
  imageUrl?: string;
  order: number;
  // Backward compatibility fields for legacy views
  category?: SkillCategory | string;
  createdAt: string;
  updatedAt: string;
}

export type Skill = TechStack;

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

export * from './media';
export * from './icon';
