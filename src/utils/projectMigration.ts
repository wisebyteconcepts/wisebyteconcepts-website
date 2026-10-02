import { Project, ProjectIconType, ProjectDeliveredUnit } from '@/types';
import { normalizeIcon } from '@/types/icon';

export const DEFAULT_PROJECT_CATEGORIES = [
  'Web Application',
  'Mobile App',
  'Cloud Infrastructure',
  'API & Microservices',
  'Enterprise System',
  'AI / ML Solution',
  'Design System',
];

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Validates whether a string is a well-formed HTTP/HTTPS URL.
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validates whether a project slug is unique among all existing projects.
 */
export function isProjectSlugUnique(
  slug: string,
  currentProjectId: string,
  projects: Array<{ id: string; slug?: string }>
): boolean {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return false;
  return !projects.some(
    (p) => p.id !== currentProjectId && (p.slug || '').toLowerCase() === cleanSlug
  );
}

/**
 * Normalizes any legacy or partially populated Project record into the target specification.
 * Preserves legacy aliases in the background so old references don't crash while mapping all data
 * to target fields.
 */
export function normalizeProject(raw: any, defaultParentService: string = ''): Project {
  const title = (raw.title || raw.name || 'Untitled Project').trim();
  const slug = (raw.slug || slugify(title) || `project-${Math.random().toString(36).substring(2, 7)}`).trim();

  // Category mapping
  let category = raw.category || 'Web Application';
  if (typeof category === 'string') {
    category = category.trim();
    if (!category) category = 'Web Application';
  }

  // Parent Service mapping
  const parentService = (raw.parentService || raw.serviceId || defaultParentService || '').trim();

  // Active & Featured & Order
  const active = raw.active !== undefined ? Boolean(raw.active) : (raw.isActive !== undefined ? Boolean(raw.isActive) : true);
  const featured = raw.featured !== undefined ? Boolean(raw.featured) : Boolean(raw.isFeatured);
  const order = typeof raw.order === 'number' ? raw.order : 0;

  // Media
  const iconType: ProjectIconType = raw.iconType === 'image' ? 'image' : 'icon';
  const icon = raw.icon ? normalizeIcon(raw.icon) || raw.icon : 'ShoppingBag';
  const iconImage = raw.iconImage || (iconType === 'image' && typeof raw.icon === 'string' ? raw.icon : undefined);
  const displayPicture = (raw.displayPicture || raw.imageUrl || '').trim();
  const bannerPicture = raw.bannerPicture ? String(raw.bannerPicture).trim() : undefined;
  const gallery = Array.isArray(raw.gallery) ? raw.gallery : [];

  // Short and Full Description
  const shortDescription = (raw.shortDescription || raw.description || '').trim();
  const fullDescription = (raw.fullDescription || raw.description || shortDescription).trim();
  const caption = (raw.caption || '').trim();

  // Value: Core Features
  let coreFeatures = Array.isArray(raw.coreFeatures)
    ? raw.coreFeatures.map((f: any) => ({
        icon: f.icon ? normalizeIcon(f.icon) || f.icon : 'CheckCircle2',
        title: typeof f === 'string' ? f : (f.title || 'Core Capability'),
        description: f.description || '',
      }))
    : Array.isArray(raw.features)
    ? raw.features.map((f: any) => ({
        icon: 'CheckCircle2',
        title: typeof f === 'string' ? f : (f.title || 'Core Capability'),
        description: '',
      }))
    : [];

  if (coreFeatures.length === 0) {
    coreFeatures = [
      { icon: 'CheckCircle2', title: 'High Availability Architecture', description: 'Production-ready deployment with responsive design and fault tolerance.' }
    ];
  }

  // Value: Deliverables
  let deliverables = Array.isArray(raw.deliverables)
    ? raw.deliverables.map((d: any) => ({
        icon: d.icon ? normalizeIcon(d.icon) || d.icon : 'CheckCircle2',
        title: typeof d === 'string' ? d : (d.title || 'Deliverable Item'),
        description: d.description || '',
      }))
    : [
        { icon: 'CheckCircle2', title: 'Source Code Repository', description: 'Full repository access with CI/CD build scripts.' },
        { icon: 'CheckCircle2', title: 'Production Deployment', description: 'Optimized cloud deployment with automated domain routing.' }
      ];

  // Value: Delivered Within
  let deliveredWithinUnit: ProjectDeliveredUnit = 'Weeks';
  let deliveredWithinRange: string | number | undefined = '3–6';

  if (raw.deliveredWithin && typeof raw.deliveredWithin === 'object') {
    deliveredWithinUnit = raw.deliveredWithin.unit || 'Weeks';
    deliveredWithinRange = raw.deliveredWithin.range;
  } else if (typeof raw.estimatedDuration === 'string' && raw.estimatedDuration.trim()) {
    const dur = raw.estimatedDuration.toLowerCase();
    if (dur.includes('day')) {
      deliveredWithinUnit = 'Days';
      deliveredWithinRange = raw.estimatedDuration.replace(/[^0-9–-]/g, '').trim() || '7–14';
    } else if (dur.includes('month')) {
      deliveredWithinUnit = 'Month';
      deliveredWithinRange = raw.estimatedDuration.replace(/[^0-9–-]/g, '').trim() || '1–3';
    } else if (dur.includes('depend')) {
      deliveredWithinUnit = 'Depends Upon Project';
      deliveredWithinRange = undefined;
    } else {
      deliveredWithinUnit = 'Weeks';
      deliveredWithinRange = raw.estimatedDuration.replace(/[^0-9–-]/g, '').trim() || '3–6';
    }
  }

  // Tech Used
  const techStacks: string[] = Array.isArray(raw.techStacks)
    ? raw.techStacks
    : (Array.isArray(raw.technologies) ? raw.technologies : []);

  // Deployment
  const liveLink = (raw.liveLink || raw.demoUrl || '').trim();
  const gitRepository = (raw.gitRepository || raw.repoUrl || '').trim() || undefined;

  const tags = Array.isArray(raw.tags) ? raw.tags : [];

  return {
    id: raw.id || `prj_${Math.random().toString(36).substring(2, 9)}`,
    title,
    slug,
    caption,
    shortDescription,
    fullDescription,
    category,
    parentService,
    tags,
    active,
    featured,
    order,

    iconType,
    icon: iconType === 'icon' ? icon : undefined,
    iconImage: iconType === 'image' ? iconImage : undefined,
    displayPicture,
    bannerPicture,
    gallery,

    coreFeatures,
    deliverables,
    deliveredWithin: {
      unit: deliveredWithinUnit,
      range: deliveredWithinUnit === 'Depends Upon Project' ? undefined : deliveredWithinRange,
    },

    techStacks,

    liveLink,
    gitRepository,

    // Backward compatibility aliases
    name: title,
    description: shortDescription,
    serviceId: parentService,
    imageUrl: displayPicture,
    demoUrl: liveLink,
    repoUrl: gitRepository,
    isActive: active,
    isFeatured: featured,

    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}
