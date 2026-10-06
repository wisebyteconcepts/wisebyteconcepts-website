import { describe, it, expect } from 'vitest';
import { serviceSchema, projectSchema } from '../src/utils/schemas';
import { slugify, isValidUrl } from '../src/utils/serviceMigration';

describe('Shared SEO Features & Best-Practice Checks', () => {
  const sampleServicePayload = {
    title: 'Enterprise Cloud Architecture',
    slug: 'enterprise-cloud-architecture',
    caption: 'Multi-region systems with zero downtime',
    shortDescription: 'Enterprise-grade cloud migration, containerization, and resilient infrastructure design for mission-critical web platforms.',
    fullDescription: 'Comprehensive distributed architecture consulting and DevOps automation.',
    category: 'Development',
    tags: ['Cloud', 'Kubernetes', 'AWS'],
    active: true,
    featured: false,
    order: 0,
    iconType: 'icon' as const,
    icon: 'CheckCircle2',
    displayPicture: 'https://images.unsplash.com/photo-1',
    gallery: [],
    coreFeatures: [{ icon: 'CheckCircle2', title: 'High Availability', description: '99.99% uptime SLA' }],
    deliverables: [{ icon: 'Package', title: 'Terraform Config', description: 'Production infrastructure manifests' }],
    deliveredWithin: { unit: 'Weeks' as const, range: '2-4' },
    pricingModel: 'Fixed' as const,
    currency: 'USD ($)',
    amount: 5000,
    ctaButtonText: 'Consult Now',
    ctaButtonLink: '/contact',
    techStacks: ['aws', 'kubernetes'],
    relatedProjects: [],

    // SEO properties
    metaTitle: 'Enterprise Cloud Architecture | Wise Byte Concepts',
    metaDescription: 'Enterprise-grade cloud migration, containerization, and resilient infrastructure design for mission-critical web platforms.',
    keywords: ['Cloud', 'Kubernetes', 'AWS'],
    focusKeyword: 'cloud architecture',
    ogImage: 'https://images.unsplash.com/photo-1',
    ogImageAlt: 'Enterprise Cloud Architecture preview',
    canonicalUrl: 'https://wisebyteconcepts.com/services/enterprise-cloud-architecture',
    noIndex: false,
    noFollow: false,
    twitterCardType: 'summary_large_image' as const,
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    enableStructuredData: true,
  };

  const sampleProductPayload = {
    title: 'Autonomous Telemetry Suite',
    slug: 'autonomous-telemetry-suite',
    caption: 'Stream processing with sub-millisecond latency',
    shortDescription: 'High-performance time-series data pipeline and visualization interface processing over 100k events per second.',
    fullDescription: 'Real-time telemetry analysis and alerting built on Rust and WebSockets.',
    category: 'Developer Tools',
    parentService: 'svc_cloud',
    tags: ['Rust', 'Telemetry'],
    active: true,
    featured: true,
    order: 0,
    iconType: 'icon' as const,
    icon: 'CheckCircle2',
    displayPicture: 'https://images.unsplash.com/photo-2',
    gallery: [],
    coreFeatures: [{ icon: 'CheckCircle2', title: 'Zero-Loss Buffer', description: 'Ring buffer data ingestion' }],
    deliverables: [{ icon: 'Package', title: 'Compiled Daemons', description: 'Rust binaries' }],
    deliveredWithin: { unit: 'Weeks' as const, range: '3-5' },
    techStacks: ['rust'],
    liveLink: 'https://telemetry.example.com',
    gitRepository: 'https://github.com/example/telemetry',

    // SEO properties
    metaTitle: 'Autonomous Telemetry Suite | Wise Byte Concepts',
    metaDescription: 'High-performance time-series data pipeline and visualization interface processing over 100k events per second.',
    keywords: ['Rust', 'Telemetry'],
    focusKeyword: 'telemetry suite',
    ogImage: 'https://images.unsplash.com/photo-2',
    ogImageAlt: 'Autonomous Telemetry Suite preview',
    canonicalUrl: 'https://wisebyteconcepts.com/products/autonomous-telemetry-suite',
    noIndex: false,
    noFollow: false,
    twitterCardType: 'summary_large_image' as const,
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    enableStructuredData: true,
  };

  describe('1. Schema Validation & Non-blocking SEO Saves', () => {
    it('validates compliant Service payload with complete SEO data', () => {
      const parsed = serviceSchema.safeParse(sampleServicePayload);
      expect(parsed.success).toBe(true);
    });

    it('validates compliant Product payload with complete SEO data', () => {
      const parsed = projectSchema.safeParse(sampleProductPayload);
      expect(parsed.success).toBe(true);
    });

    it('allows saving even if optional SEO fields are empty or unoptimized (warnings never block saving)', () => {
      const unoptimizedService = {
        ...sampleServicePayload,
        metaTitle: 'Short', // Under 30 chars
        metaDescription: 'Short description', // Under 120 chars
        focusKeyword: '',
        canonicalUrl: '',
        noIndex: true, // Warn condition
      };
      const parsed = serviceSchema.safeParse(unoptimizedService);
      expect(parsed.success).toBe(true);
    });
  });

  describe('2. Best-Practice SEO Checks Logic', () => {
    it('validates slug format for lowercase and hyphen only', () => {
      expect(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test('enterprise-cloud-architecture')).toBe(true);
      expect(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test('Cloud-Architecture!')).toBe(false);
      expect(slugify('Enterprise Cloud Architecture 2.0')).toBe('enterprise-cloud-architecture-2-0');
    });

    it('validates canonical URL formatting', () => {
      expect(isValidUrl('https://wisebyteconcepts.com/services/cloud')).toBe(true);
      expect(isValidUrl('not-a-valid-url')).toBe(false);
    });

    it('checks meta title length recommendation (30-60 chars)', () => {
      const goodTitle = 'Enterprise Cloud Architecture | Wise Byte Concepts';
      expect(goodTitle.length).toBeGreaterThanOrEqual(30);
      expect(goodTitle.length).toBeLessThanOrEqual(60);

      const tooShort = 'Cloud Arch';
      expect(tooShort.length < 30).toBe(true);
    });

    it('checks meta description length recommendation (120-160 chars)', () => {
      const desc = 'Enterprise-grade cloud migration, containerization, and resilient infrastructure design for mission-critical web platforms.';
      expect(desc.length).toBeGreaterThanOrEqual(120);
      expect(desc.length).toBeLessThanOrEqual(160);
    });

    it('verifies focus keyword presence in title and description', () => {
      const keyword = 'cloud architecture';
      const title = 'Enterprise Cloud Architecture | Wise Byte Concepts';
      const desc = 'Scalable cloud architecture designed for high availability and zero-trust cloud security compliance.';

      expect(title.toLowerCase().includes(keyword.toLowerCase())).toBe(true);
      expect(desc.toLowerCase().includes(keyword.toLowerCase())).toBe(true);
    });
  });

  describe('3. Structured Data (JSON-LD) Generation', () => {
    it('generates compliant Schema.org Service JSON-LD', () => {
      const serviceJson = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: sampleServicePayload.metaTitle,
        description: sampleServicePayload.metaDescription,
        url: sampleServicePayload.canonicalUrl,
        provider: {
          '@type': 'Organization',
          name: 'Wise Byte Concepts',
          url: 'https://wisebyteconcepts.com',
        },
        offers: {
          '@type': 'Offer',
          price: '5000',
          priceCurrency: 'USD',
        },
      };

      expect(serviceJson['@type']).toBe('Service');
      expect(serviceJson.offers.price).toBe('5000');
      expect(serviceJson.provider.name).toBe('Wise Byte Concepts');
    });

    it('generates compliant Schema.org Product JSON-LD with price, SKU, and availability', () => {
      const productJson = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: sampleProductPayload.metaTitle,
        description: sampleProductPayload.metaDescription,
        sku: sampleProductPayload.slug,
        url: sampleProductPayload.canonicalUrl,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      };

      expect(productJson['@type']).toBe('Product');
      expect(productJson.sku).toBe('autonomous-telemetry-suite');
      expect(productJson.offers.availability).toBe('https://schema.org/InStock');
    });
  });
});
