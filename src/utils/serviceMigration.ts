import { Service, ServiceIconType, ServicePricingModel, ServiceDeliveredUnit } from '@/types';
import { normalizeIcon } from '@/types/icon';

export const DEFAULT_SERVICE_CATEGORIES = [
  'Development',
  'Design',
  'Consulting',
  'Marketing',
  'Systems',
  'Cloud & DevOps',
];

export const DEFAULT_CURRENCIES = [
  'USD ($)',
  'EUR (€)',
  'GBP (£)',
  'CAD ($)',
  'AUD ($)',
  'JPY (¥)',
  'CHF (CHF)',
  'INR (₹)',
];

export const AVAILABLE_PAGES = [
  { label: 'Contact Us', value: '/contact' },
  { label: 'Services', value: '/services' },
  { label: 'Projects Showcase', value: '/products' },
  { label: 'Tech Stack', value: '/tech-stacks' },
  { label: 'Homepage', value: '/' },
];

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Normalizes any legacy or partially populated Service record into the target specification.
 * Preserves legacy fields in the background so old references don't crash while mapping all data
 * to target fields.
 */
export function normalizeService(raw: any): Service {
  const title = (raw.title || raw.name || 'Untitled Service').trim();
  const slug = (raw.slug || slugify(title) || `service-${Math.random().toString(36).substring(2, 7)}`).trim();

  // Category mapping
  let category = raw.category || 'Development';
  if (typeof category === 'string') {
    category = category.trim();
    if (category) {
      category = category.charAt(0).toUpperCase() + category.slice(1);
    } else {
      category = 'Development';
    }
  }

  // Active & Featured
  const active = raw.active !== undefined ? Boolean(raw.active) : (raw.isActive !== undefined ? Boolean(raw.isActive) : true);
  const featured = raw.featured !== undefined ? Boolean(raw.featured) : Boolean(raw.isFeatured);
  const order = typeof raw.order === 'number' ? raw.order : 0;

  // Media
  const iconType: ServiceIconType = raw.iconType === 'image' ? 'image' : 'icon';
  const icon = raw.icon ? normalizeIcon(raw.icon) || raw.icon : 'Briefcase';
  const iconImage = raw.iconImage || (iconType === 'image' && typeof raw.icon === 'string' ? raw.icon : undefined);
  const displayPicture = raw.displayPicture || raw.thumbnail || '';
  const bannerPicture = raw.bannerPicture || raw.bannerImage || undefined;
  const gallery = Array.isArray(raw.gallery) ? raw.gallery : [];

  // Value: Core Features
  let coreFeatures = Array.isArray(raw.coreFeatures)
    ? raw.coreFeatures.map((f: any) => ({
        icon: f.icon ? normalizeIcon(f.icon) || f.icon : 'CheckCircle2',
        title: typeof f === 'string' ? f : (f.title || 'Core Feature'),
        description: f.description || '',
      }))
    : Array.isArray(raw.features)
    ? raw.features.map((f: any) => ({
        icon: 'CheckCircle2',
        title: typeof f === 'string' ? f : (f.title || 'Core Feature'),
        description: '',
      }))
    : [];

  if (coreFeatures.length === 0) {
    coreFeatures = [
      { icon: 'CheckCircle2', title: 'End-to-End Execution', description: 'Comprehensive delivery from concept to deployment' }
    ];
  }

  // Value: Deliverables
  let deliverables = Array.isArray(raw.deliverables)
    ? raw.deliverables.map((d: any) => ({
        icon: d.icon ? normalizeIcon(d.icon) || d.icon : 'CheckCircle2',
        title: typeof d === 'string' ? d : (d.title || 'Deliverable Item'),
        description: d.description || '',
      }))
    : [];

  // Value: Delivered Within
  let deliveredWithinUnit: ServiceDeliveredUnit = 'Weeks';
  let deliveredWithinRange: string | number | undefined = '2–4';

  if (raw.deliveredWithin && typeof raw.deliveredWithin === 'object') {
    deliveredWithinUnit = raw.deliveredWithin.unit || 'Weeks';
    deliveredWithinRange = raw.deliveredWithin.range;
  } else if (typeof raw.estimatedDuration === 'string' && raw.estimatedDuration.trim()) {
    const dur = raw.estimatedDuration.toLowerCase();
    if (dur.includes('day')) {
      deliveredWithinUnit = 'Days';
      deliveredWithinRange = raw.estimatedDuration.replace(/[^0-9–-]/g, '').trim() || '3–7';
    } else if (dur.includes('month')) {
      deliveredWithinUnit = 'Month';
      deliveredWithinRange = raw.estimatedDuration.replace(/[^0-9–-]/g, '').trim() || '1–2';
    } else if (dur.includes('depend')) {
      deliveredWithinUnit = 'Depends Upon Project';
      deliveredWithinRange = undefined;
    } else {
      deliveredWithinUnit = 'Weeks';
      deliveredWithinRange = raw.estimatedDuration.replace(/[^0-9–-]/g, '').trim() || '2–4';
    }
  }

  // Pricing
  let pricingModel: ServicePricingModel = 'Starting At';
  let currency: string | undefined = 'USD ($)';
  let amount: number | undefined = 1500;
  let minAmount: number | undefined = undefined;
  let maxAmount: number | undefined = undefined;

  if (raw.pricingModel) {
    pricingModel = raw.pricingModel;
    currency = raw.currency || 'USD ($)';
    amount = raw.amount;
    minAmount = raw.minAmount;
    maxAmount = raw.maxAmount;
  } else if (raw.pricing && typeof raw.pricing === 'object') {
    const oldType = raw.pricing.type;
    if (oldType === 'fixed') pricingModel = 'Fixed';
    else if (oldType === 'starting_from') pricingModel = 'Starting At';
    else if (oldType === 'custom') pricingModel = 'Custom Quote';

    currency = raw.pricing.currency ? `${raw.pricing.currency}` : 'USD ($)';
    amount = raw.pricing.amount;
  }

  // If Custom Quote, clear pricing fields
  if (pricingModel === 'Custom Quote') {
    currency = undefined;
    amount = undefined;
    minAmount = undefined;
    maxAmount = undefined;
  }

  // Call to Action
  let ctaButtonText = raw.ctaButtonText || raw.cta?.label || 'Contact Us';
  let ctaButtonLink = raw.ctaButtonLink || raw.cta?.link || '/contact';
  let ctaText = raw.ctaText || '';
  let ctaVisual = raw.ctaVisual;

  // Tech Used
  let techStacks: string[] = Array.isArray(raw.techStacks)
    ? raw.techStacks
    : (Array.isArray(raw.technologies) ? raw.technologies : []);
  let relatedProjects: string[] = Array.isArray(raw.relatedProjects) ? raw.relatedProjects : [];

  // SEO
  let metaTitle = raw.metaTitle || raw.seo?.metaTitle || `${title} | Wise Byte Concepts`;
  let metaDescription = raw.metaDescription || raw.seo?.metaDescription || raw.shortDescription || '';
  let keywords = Array.isArray(raw.keywords) ? raw.keywords : (Array.isArray(raw.seo?.keywords) ? raw.seo.keywords : []);

  return {
    id: raw.id || `srv_${Math.random().toString(36).substring(2, 9)}`,
    title,
    slug,
    caption: raw.caption || '',
    shortDescription: raw.shortDescription || '',
    fullDescription: raw.fullDescription || raw.shortDescription || '',
    category,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
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

    pricingModel,
    currency,
    amount,
    minAmount,
    maxAmount,

    ctaVisual,
    ctaText,
    ctaButtonText,
    ctaButtonLink,

    techStacks,
    relatedProjects,

    metaTitle,
    metaDescription,
    keywords,

    // Legacy backwards compatibility aliases
    name: title,
    header: raw.header || title,
    thumbnail: displayPicture,
    bannerImage: bannerPicture || displayPicture,
    isActive: active,
    isFeatured: featured,
    features: coreFeatures.map((f: any) => f.title),
    technologies: Array.isArray(raw.technologies) ? raw.technologies : techStacks,
    pricing: {
      type: pricingModel === 'Fixed' ? 'fixed' : pricingModel === 'Starting At' ? 'starting_from' : 'custom',
      amount,
      currency,
    },
    cta: {
      label: ctaButtonText,
      link: ctaButtonLink,
    },
    seo: {
      metaTitle,
      metaDescription,
      keywords,
    },
    estimatedDuration: deliveredWithinRange ? `${deliveredWithinRange} ${deliveredWithinUnit}` : deliveredWithinUnit,

    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Validates whether a slug is unique among all existing services.
 */
export function isSlugUnique(
  slug: string,
  currentServiceId: string,
  services: Array<{ id: string; slug?: string }>
): boolean {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return false;
  return !services.some(
    (s) => s.id !== currentServiceId && (s.slug || '').toLowerCase() === cleanSlug
  );
}

/**
 * Normalizes pricing fields based on the selected pricing model:
 * - If Custom Quote: clears currency, amount, minAmount, maxAmount
 * - If Fixed / Starting At: preserves single amount and currency, clears minAmount & maxAmount
 * - If Range: preserves minAmount, maxAmount, and currency, clears single amount
 */
export function cleanPricingData(
  pricingModel: ServicePricingModel,
  data: {
    currency?: string;
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
  }
) {
  if (pricingModel === 'Custom Quote') {
    return {
      pricingModel,
      currency: undefined,
      amount: undefined,
      minAmount: undefined,
      maxAmount: undefined,
    };
  }
  if (pricingModel === 'Fixed' || pricingModel === 'Starting At') {
    return {
      pricingModel,
      currency: data.currency || 'USD ($)',
      amount: typeof data.amount === 'number' && !isNaN(data.amount) ? data.amount : undefined,
      minAmount: undefined,
      maxAmount: undefined,
    };
  }
  if (pricingModel === 'Range') {
    return {
      pricingModel,
      currency: data.currency || 'USD ($)',
      amount: undefined,
      minAmount: typeof data.minAmount === 'number' && !isNaN(data.minAmount) ? data.minAmount : undefined,
      maxAmount: typeof data.maxAmount === 'number' && !isNaN(data.maxAmount) ? data.maxAmount : undefined,
    };
  }
  return { pricingModel, ...data };
}

