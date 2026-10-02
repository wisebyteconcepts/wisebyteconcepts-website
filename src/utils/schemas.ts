import { z } from 'zod';

export const serviceValueItemSchema = z.object({
  icon: z.any(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
});

export const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  caption: z.string().optional().default(''),
  shortDescription: z.string().min(1, 'Short description is required'),
  fullDescription: z.string().min(1, 'Full description is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),

  // Media
  iconType: z.enum(['icon', 'image']).default('icon'),
  icon: z.any().optional(),
  iconImage: z.string().optional(),
  displayPicture: z.string().min(1, 'Display picture is required from media gallery or URL'),
  bannerPicture: z.string().optional(),
  gallery: z.array(z.string()).default([]),

  // Value
  coreFeatures: z.array(serviceValueItemSchema).default([]),
  deliverables: z.array(serviceValueItemSchema).default([]),
  deliveredWithin: z.object({
    unit: z.enum(['Days', 'Weeks', 'Month', 'Depends Upon Project']),
    range: z.union([z.string(), z.number()]).optional(),
  }),

  // Pricing
  pricingModel: z.enum(['Fixed', 'Starting At', 'Range', 'Custom Quote']),
  currency: z.string().optional(),
  amount: z.number().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),

  // Call to Action
  ctaVisual: z
    .object({
      type: z.enum(['icon', 'image']),
      value: z.any(),
    })
    .optional(),
  ctaText: z.string().optional(),
  ctaButtonText: z.string().default('Contact Us'),
  ctaButtonLink: z.string().default('/contact'),

  // Tech Used
  techStacks: z.array(z.string()).default([]),
  relatedProjects: z.array(z.string()).default([]),

  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  if (data.iconType === 'icon' && !data.icon) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['icon'],
      message: 'Icon is required when icon type is Icon',
    });
  }
  if (data.iconType === 'image' && (!data.iconImage || data.iconImage.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['iconImage'],
      message: 'Image is required when icon type is Image',
    });
  }

  if (data.pricingModel === 'Fixed' || data.pricingModel === 'Starting At') {
    if (data.amount === undefined || isNaN(data.amount) || data.amount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amount'],
        message: 'Amount is required for Fixed / Starting At pricing',
      });
    }
    if (!data.currency || data.currency.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currency'],
        message: 'Currency is required',
      });
    }
  } else if (data.pricingModel === 'Range') {
    if (data.minAmount === undefined || isNaN(data.minAmount) || data.minAmount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minAmount'],
        message: 'Minimum amount is required for Range pricing',
      });
    }
    if (data.maxAmount === undefined || isNaN(data.maxAmount) || data.maxAmount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxAmount'],
        message: 'Maximum amount is required for Range pricing',
      });
    }
    if (
      data.minAmount !== undefined &&
      data.maxAmount !== undefined &&
      data.minAmount > data.maxAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxAmount'],
        message: 'Maximum amount must be greater than or equal to minimum amount',
      });
    }
  }
});

export const projectValueItemSchema = z.object({
  icon: z.any(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  caption: z.string().optional().default(''),
  shortDescription: z.string().min(1, 'Short description is required'),
  fullDescription: z.string().min(1, 'Full description is required'),
  category: z.string().min(1, 'Category is required'),
  parentService: z.string().min(1, 'Parent service association is required'),
  tags: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),

  // Media
  iconType: z.enum(['icon', 'image']).default('icon'),
  icon: z.any().optional(),
  iconImage: z.string().optional(),
  displayPicture: z.string().min(1, 'Display picture is required from media gallery or URL'),
  bannerPicture: z.string().optional(),
  gallery: z.array(z.string()).default([]),

  // Value
  coreFeatures: z.array(projectValueItemSchema).default([]),
  deliverables: z.array(projectValueItemSchema).default([]),
  deliveredWithin: z.object({
    unit: z.enum(['Days', 'Weeks', 'Month', 'Depends Upon Project']),
    range: z.union([z.string(), z.number()]).optional(),
  }),

  // Tech Used
  techStacks: z.array(z.string()).default([]),

  // Deployment
  liveLink: z
    .string()
    .min(1, 'Live URL is required')
    .url('Live link must be a valid URL (http:// or https://)'),
  gitRepository: z
    .string()
    .url('Git repository must be a valid URL')
    .optional()
    .or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.iconType === 'icon' && !data.icon) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['icon'],
      message: 'Icon is required when icon type is Icon',
    });
  }
  if (data.iconType === 'image' && (!data.iconImage || data.iconImage.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['iconImage'],
      message: 'Image badge is required when icon type is Image',
    });
  }
});

// Product schema alias for in-place backward compatibility
export const productSchema = projectSchema;

export const techStackSchema = z.object({
  name: z.string().min(1, 'Tech stack name is required'),
  classification: z.string().min(1, 'Classification is required'),
  iconType: z.enum(['icon', 'link', 'image']),
  icon: z.union([
    z.string(),
    z.object({
      library: z.enum(['lucide', 'remix', 'hero']),
      name: z.string(),
      variant: z.enum(['outline', 'solid', 'line', 'fill']).optional(),
    }),
  ]).optional().or(z.literal('')),
  iconLink: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  order: z.number().int(),
  category: z.any().optional(),
}).superRefine((data, ctx) => {
  if (data.iconType === 'icon') {
    if (!data.icon || (typeof data.icon === 'string' && data.icon.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['icon'],
        message: 'Please choose an icon from the library',
      });
    }
  } else if (data.iconType === 'link') {
    if (!data.iconLink || data.iconLink.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['iconLink'],
        message: 'Custom icon URL is required',
      });
    } else {
      try {
        const parsed = new URL(data.iconLink);
        if (!parsed.protocol.startsWith('http')) {
          throw new Error('Must use http/https');
        }
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['iconLink'],
          message: 'Must be a valid URL (e.g. https://example.com/icon.svg)',
        });
      }
    }
  } else if (data.iconType === 'image') {
    if (!data.imageUrl || data.imageUrl.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['imageUrl'],
        message: 'Image from media gallery or URL is required',
      });
    }
  }
});

export const skillSchema = techStackSchema;
