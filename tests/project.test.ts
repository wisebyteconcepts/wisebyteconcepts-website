import { describe, it, expect } from 'vitest';
import { 
  isProjectSlugUnique, 
  normalizeProject, 
  slugify, 
  isValidUrl 
} from '@/utils/projectMigration';
import { projectSchema } from '@/utils/schemas';

describe('Project Model Unit Tests', () => {
  describe('1. Slug Validation & Uniqueness', () => {
    const existingProjects = [
      { id: 'prj_1', slug: 'cloud-monitor-pro' },
      { id: 'prj_2', slug: 'enterprise-data-mesh' },
      { id: 'prj_3', slug: 'quantum-ai-pipeline' },
    ];

    it('should generate URL-friendly slug from title', () => {
      expect(slugify('Distributed Telemetry Suite 2.0 (High Perf!)')).toBe('distributed-telemetry-suite-2-0-high-perf');
      expect(slugify('   Real-time Streaming   Engine   ')).toBe('real-time-streaming-engine');
    });

    it('should confirm uniqueness for a new unused slug', () => {
      const isUnique = isProjectSlugUnique('edge-computing-hub', 'prj_new', existingProjects);
      expect(isUnique).toBe(true);
    });

    it('should reject a duplicate slug on create', () => {
      const isUnique = isProjectSlugUnique('cloud-monitor-pro', 'prj_new', existingProjects);
      expect(isUnique).toBe(false);
    });

    it('should allow the same project to keep its existing slug on edit', () => {
      const isUnique = isProjectSlugUnique('enterprise-data-mesh', 'prj_2', existingProjects);
      expect(isUnique).toBe(true);
    });

    it('should reject if an edit attempts to claim another project slug', () => {
      const isUnique = isProjectSlugUnique('quantum-ai-pipeline', 'prj_1', existingProjects);
      expect(isUnique).toBe(false);
    });
  });

  describe('2. URL Validation', () => {
    it('should accept valid HTTP and HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://subdomain.domain.org/path?query=val#hash')).toBe(true);
      expect(isValidUrl('https://github.com/organization/repo-name')).toBe(true);
    });

    it('should reject invalid or malformed URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://files.example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('3. Delivered Within Timeframe Handling', () => {
    it('should map legacy string duration to structured unit and range', () => {
      const resDays = normalizeProject({ title: 'App', estimatedDuration: '14 Days' });
      expect(resDays.deliveredWithin.unit).toBe('Days');
      expect(resDays.deliveredWithin.range).toBe('14');

      const resWeeks = normalizeProject({ title: 'App', estimatedDuration: '4–8 Weeks' });
      expect(resWeeks.deliveredWithin.unit).toBe('Weeks');
      expect(resWeeks.deliveredWithin.range).toBe('4–8');

      const resMonth = normalizeProject({ title: 'App', estimatedDuration: '2–3 Months' });
      expect(resMonth.deliveredWithin.unit).toBe('Month');
      expect(resMonth.deliveredWithin.range).toBe('2–3');

      const resDepends = normalizeProject({ title: 'App', estimatedDuration: 'Depends Upon Project Scope' });
      expect(resDepends.deliveredWithin.unit).toBe('Depends Upon Project');
      expect(resDepends.deliveredWithin.range).toBeUndefined();
    });

    it('should clear range when unit is "Depends Upon Project"', () => {
      const res = normalizeProject({
        title: 'Enterprise ERP',
        deliveredWithin: { unit: 'Depends Upon Project', range: '12' }
      });
      expect(res.deliveredWithin.unit).toBe('Depends Upon Project');
      expect(res.deliveredWithin.range).toBeUndefined();
    });
  });

  describe('4. Legacy Migration & Alias Mapping', () => {
    it('should map legacy name, description, serviceId, imageUrl, demoUrl, repoUrl', () => {
      const legacyRaw = {
        id: 'legacy_prod_1',
        name: 'Legacy Cloud Platform',
        description: 'Microservices container manager',
        serviceId: 'srv_devops',
        imageUrl: 'https://images.unsplash.com/photo-1',
        demoUrl: 'https://demo.example.com',
        repoUrl: 'https://github.com/org/repo',
        isActive: true,
        isFeatured: true,
        technologies: ['react', 'docker', 'kubernetes'],
        features: ['Automated scaling', 'Zero downtime deployment'],
      };

      const normalized = normalizeProject(legacyRaw);

      // Target field assertions
      expect(normalized.id).toBe('legacy_prod_1');
      expect(normalized.title).toBe('Legacy Cloud Platform');
      expect(normalized.slug).toBe('legacy-cloud-platform');
      expect(normalized.shortDescription).toBe('Microservices container manager');
      expect(normalized.parentService).toBe('srv_devops');
      expect(normalized.displayPicture).toBe('https://images.unsplash.com/photo-1');
      expect(normalized.liveLink).toBe('https://demo.example.com');
      expect(normalized.gitRepository).toBe('https://github.com/org/repo');
      expect(normalized.active).toBe(true);
      expect(normalized.featured).toBe(true);
      expect(normalized.techStacks).toEqual(['react', 'docker', 'kubernetes']);
      expect(normalized.coreFeatures.length).toBe(2);
      expect(normalized.coreFeatures[0].title).toBe('Automated scaling');

      // Backward compatibility aliases preserved
      expect(normalized.name).toBe('Legacy Cloud Platform');
      expect(normalized.description).toBe('Microservices container manager');
      expect(normalized.serviceId).toBe('srv_devops');
      expect(normalized.imageUrl).toBe('https://images.unsplash.com/photo-1');
      expect(normalized.demoUrl).toBe('https://demo.example.com');
      expect(normalized.repoUrl).toBe('https://github.com/org/repo');
    });

    it('should provide robust defaults for empty records without throwing', () => {
      const emptyRaw = {};
      const normalized = normalizeProject(emptyRaw, 'srv_default');

      expect(normalized.title).toBe('Untitled Project');
      expect(normalized.slug).toBeDefined();
      expect(normalized.category).toBe('Web Application');
      expect(normalized.parentService).toBe('srv_default');
      expect(normalized.active).toBe(true);
      expect(normalized.featured).toBe(false);
      expect(normalized.iconType).toBe('icon');
      expect(normalized.coreFeatures.length).toBeGreaterThan(0);
      expect(normalized.deliverables.length).toBeGreaterThan(0);
    });
  });

  describe('5. Media iconType Mutually Exclusive Handling', () => {
    it('should set icon and clear iconImage when iconType is "icon"', () => {
      const normalized = normalizeProject({
        title: 'Project Alpha',
        iconType: 'icon',
        icon: 'Sparkles',
        iconImage: 'https://example.com/badge.png',
      });
      expect(normalized.iconType).toBe('icon');
      expect(normalized.icon).toEqual({ library: 'lucide', name: 'Sparkles' });
      expect(normalized.iconImage).toBeUndefined();
    });

    it('should set iconImage and clear icon when iconType is "image"', () => {
      const normalized = normalizeProject({
        title: 'Project Beta',
        iconType: 'image',
        icon: 'Sparkles',
        iconImage: 'https://example.com/badge.png',
      });
      expect(normalized.iconType).toBe('image');
      expect(normalized.iconImage).toBe('https://example.com/badge.png');
      expect(normalized.icon).toBeUndefined();
    });
  });

  describe('6. Zod Schema Validation', () => {
    const validProjectPayload = {
      title: 'Distributed Telemetry Engine',
      slug: 'distributed-telemetry-engine',
      caption: 'Real-time monitoring',
      shortDescription: 'Enterprise telemetry pipeline',
      fullDescription: 'Comprehensive case study documentation',
      category: 'Cloud Infrastructure',
      parentService: 'srv_1',
      tags: ['telemetry', 'realtime'],
      active: true,
      featured: true,
      order: 1,

      iconType: 'icon' as const,
      icon: 'Activity',
      displayPicture: 'https://images.unsplash.com/photo-1',
      bannerPicture: 'https://images.unsplash.com/photo-2',
      gallery: ['https://images.unsplash.com/photo-3'],

      coreFeatures: [
        { icon: 'CheckCircle2', title: 'Stream Processing', description: '50k events/sec' }
      ],
      deliverables: [
        { icon: 'CheckCircle2', title: 'Cluster Config', description: 'Terraform scripts' }
      ],
      deliveredWithin: {
        unit: 'Weeks' as const,
        range: '4–6'
      },
      techStacks: ['react', 'node', 'kafka'],
      liveLink: 'https://telemetry.example.com',
      gitRepository: 'https://github.com/org/telemetry'
    };

    it('should validate a compliant project payload', () => {
      const parsed = projectSchema.safeParse(validProjectPayload);
      expect(parsed.success).toBe(true);
    });

    it('should reject when required fields are missing', () => {
      const invalid = { ...validProjectPayload, title: '', liveLink: 'invalid-url' };
      const parsed = projectSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('should enforce icon when iconType is "icon"', () => {
      const invalid = { ...validProjectPayload, iconType: 'icon', icon: null };
      const parsed = projectSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('should enforce iconImage when iconType is "image"', () => {
      const invalid = { ...validProjectPayload, iconType: 'image', iconImage: '' };
      const parsed = projectSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });
});
