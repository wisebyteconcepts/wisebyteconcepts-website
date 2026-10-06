import { describe, it, expect } from 'vitest';
import { isSlugUnique, cleanPricingData, normalizeService, slugify } from '@/utils/serviceMigration';
import { serviceSchema } from '@/utils/schemas';

describe('Service Model Unit Tests', () => {
  describe('1. Slug Validation & Uniqueness', () => {
    const existingServices = [
      { id: 'srv_1', slug: 'web-engineering' },
      { id: 'srv_2', slug: 'cloud-infrastructure' },
      { id: 'srv_3', slug: 'ai-solutions' },
    ];

    it('should generate a valid URL slug from title', () => {
      expect(slugify('Full-Stack Web Development & Engineering!')).toBe('full-stack-web-development-engineering');
      expect(slugify('   Cloud  Ops 2026   ')).toBe('cloud-ops-2026');
    });

    it('should allow a new unique slug on create', () => {
      const isUnique = isSlugUnique('mobile-app-development', 'srv_new', existingServices);
      expect(isUnique).toBe(true);
    });

    it('should reject a duplicate slug on create', () => {
      const isUnique = isSlugUnique('cloud-infrastructure', 'srv_new', existingServices);
      expect(isUnique).toBe(false);
    });

    it('should allow the existing service to keep its own slug on edit', () => {
      const isUnique = isSlugUnique('cloud-infrastructure', 'srv_2', existingServices);
      expect(isUnique).toBe(true);
    });

    it('should reject if an edit attempts to take another service slug', () => {
      const isUnique = isSlugUnique('ai-solutions', 'srv_1', existingServices);
      expect(isUnique).toBe(false);
    });
  });

  describe('2. Pricing-Model Conditional Logic', () => {
    it('should clean and clear currency and amount for Custom Quote', () => {
      const cleaned = cleanPricingData('Custom Quote', {
        currency: 'USD ($)',
        amount: 2500,
        minAmount: 1000,
        maxAmount: 5000,
      });

      expect(cleaned.pricingModel).toBe('Custom Quote');
      expect(cleaned.currency).toBeUndefined();
      expect(cleaned.amount).toBeUndefined();
      expect(cleaned.minAmount).toBeUndefined();
      expect(cleaned.maxAmount).toBeUndefined();
    });

    it('should preserve single amount and currency for Fixed / Starting At and clear range amounts', () => {
      const cleaned = cleanPricingData('Starting At', {
        currency: 'EUR (€)',
        amount: 1800,
        minAmount: 1000,
        maxAmount: 5000,
      });

      expect(cleaned.pricingModel).toBe('Starting At');
      expect(cleaned.currency).toBe('EUR (€)');
      expect(cleaned.amount).toBe(1800);
      expect(cleaned.minAmount).toBeUndefined();
      expect(cleaned.maxAmount).toBeUndefined();
    });

    it('should preserve minAmount and maxAmount for Range and clear single amount', () => {
      const cleaned = cleanPricingData('Range', {
        currency: 'USD ($)',
        amount: 3000,
        minAmount: 2000,
        maxAmount: 6000,
      });

      expect(cleaned.pricingModel).toBe('Range');
      expect(cleaned.currency).toBe('USD ($)');
      expect(cleaned.amount).toBeUndefined();
      expect(cleaned.minAmount).toBe(2000);
      expect(cleaned.maxAmount).toBe(6000);
    });

    it('should validate schemas correctly via Zod schema', () => {
      // Valid Custom Quote without amount
      const customQuoteValid = serviceSchema.safeParse({
        title: 'Bespoke Advisory',
        slug: 'bespoke-advisory',
        shortDescription: 'Advisory services',
        fullDescription: '# Comprehensive Details',
        category: 'Consulting',
        displayPicture: 'https://example.com/pic.jpg',
        iconType: 'icon',
        icon: 'Briefcase',
        deliveredWithin: { unit: 'Depends Upon Project' },
        pricingModel: 'Custom Quote',
      });
      expect(customQuoteValid.success).toBe(true);

      // Invalid Fixed model missing amount
      const fixedInvalid = serviceSchema.safeParse({
        title: 'Fixed Advisory',
        slug: 'fixed-advisory',
        shortDescription: 'Fixed services',
        fullDescription: '# Comprehensive Details',
        category: 'Consulting',
        displayPicture: 'https://example.com/pic.jpg',
        iconType: 'icon',
        icon: 'Briefcase',
        deliveredWithin: { unit: 'Weeks', range: '2–4' },
        pricingModel: 'Fixed',
        currency: 'USD ($)',
        // missing amount
      });
      expect(fixedInvalid.success).toBe(false);

      // Invalid Range where min > max
      const rangeInvalid = serviceSchema.safeParse({
        title: 'Range Advisory',
        slug: 'range-advisory',
        shortDescription: 'Range services',
        fullDescription: '# Comprehensive Details',
        category: 'Consulting',
        displayPicture: 'https://example.com/pic.jpg',
        iconType: 'icon',
        icon: 'Briefcase',
        deliveredWithin: { unit: 'Weeks', range: '2–4' },
        pricingModel: 'Range',
        currency: 'USD ($)',
        minAmount: 5000,
        maxAmount: 2000,
      });
      expect(rangeInvalid.success).toBe(false);
    });
  });

  describe('3. Migration Mapping (normalizeService)', () => {
    it('should safely normalize a legacy service with missing fields and old names', () => {
      const legacyService = {
        name: 'Legacy Cloud Systems',
        header: 'Legacy Cloud Systems Header',
        thumbnail: 'https://example.com/thumb.jpg',
        isActive: true,
        isFeatured: true,
        features: ['Multi-region redundancy', '24/7 Monitoring'],
        technologies: ['AWS', 'Docker', 'Terraform'],
        estimatedDuration: '4–6 Weeks',
        pricing: {
          type: 'starting_from',
          amount: 2500,
          currency: '$',
        },
        cta: {
          label: 'Book Discovery',
          link: '/contact',
        },
      };

      const normalized = normalizeService(legacyService);

      expect(normalized.title).toBe('Legacy Cloud Systems');
      expect(normalized.slug).toBe('legacy-cloud-systems');
      expect(normalized.displayPicture).toBe('https://example.com/thumb.jpg');
      expect(normalized.bannerPicture).toBeUndefined(); // optional, falls back in UI
      expect(normalized.active).toBe(true);
      expect(normalized.featured).toBe(true);
      expect(normalized.pricingModel).toBe('Starting At');
      expect(normalized.amount).toBe(2500);
      expect(normalized.deliveredWithin.unit).toBe('Weeks');
      expect(normalized.deliveredWithin.range).toBe('4–6');
      expect(normalized.coreFeatures.length).toBe(2);
      expect(normalized.coreFeatures[0].title).toBe('Multi-region redundancy');
      expect(normalized.techStacks).toEqual(['AWS', 'Docker', 'Terraform']);
      expect(normalized.ctaButtonText).toBe('Book Discovery');
      expect(normalized.ctaButtonLink).toBe('/contact');
    });

    it('should map custom pricing to Custom Quote and clear numerical amounts', () => {
      const customLegacy = {
        name: 'Enterprise Consulting',
        pricing: {
          type: 'custom',
          amount: 9999,
        },
      };

      const normalized = normalizeService(customLegacy);
      expect(normalized.pricingModel).toBe('Custom Quote');
      expect(normalized.amount).toBeUndefined();
      expect(normalized.currency).toBeUndefined();
    });

    it('should handle completely empty raw record without crashing', () => {
      const normalized = normalizeService({});
      expect(normalized.title).toBe('Untitled Service');
      expect(normalized.slug).toBeDefined();
      expect(normalized.active).toBe(true);
      expect(normalized.featured).toBe(false);
      expect(normalized.coreFeatures.length).toBeGreaterThan(0);
      expect(normalized.deliveredWithin.unit).toBe('Weeks');
    });

    it('should normalize and preserve SEO fields for the public service details page', () => {
      const rawWithSeo = {
        title: 'Cloud DevOps Consulting',
        shortDescription: 'Expert infrastructure optimization',
        category: 'Cloud & DevOps',
        metaTitle: 'Cloud DevOps Consulting | Custom Meta Title',
        metaDescription: 'Custom meta description for Google snippets',
        canonicalUrl: 'https://wisebyteconcepts.com/services/cloud-devops-consulting',
        noIndex: false,
        noFollow: false,
        twitterCardType: 'summary_large_image',
        enableStructuredData: true,
      };

      const normalized = normalizeService(rawWithSeo);
      expect(normalized.metaTitle).toBe('Cloud DevOps Consulting | Custom Meta Title');
      expect(normalized.metaDescription).toBe('Custom meta description for Google snippets');
      expect(normalized.canonicalUrl).toBe('https://wisebyteconcepts.com/services/cloud-devops-consulting');
      expect(normalized.noIndex).toBe(false);
      expect(normalized.enableStructuredData).toBe(true);
    });
  });
});
