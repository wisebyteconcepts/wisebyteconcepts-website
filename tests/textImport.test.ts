import { describe, it, expect } from 'vitest';
import { 
  parseImportText, 
  SERVICE_TEXT_TEMPLATE, 
  PRODUCT_TEXT_TEMPLATE,
  isSupportedIcon
} from '../src/utils/textImportParser';

describe('Text Import Parser & Templates', () => {
  const existingServiceCategories = ['Development', 'Design', 'Consulting', 'Marketing', 'Systems'];
  const existingProductCategories = ['Developer Tools', 'Infrastructure', 'Mobile Apps', 'Web Applications'];

  it('validates and parses the standard SERVICE_TEXT_TEMPLATE with 0 errors', () => {
    const result = parseImportText(SERVICE_TEXT_TEMPLATE, 'Service', existingServiceCategories);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.type).toBe('Service');
    expect(result.data).toBeDefined();

    const data = result.data as any;
    expect(data.title).toBe('Enterprise Cloud Architecture');
    expect(data.slug).toBe('enterprise-cloud-architecture');
    expect(data.category).toBe('Development');
    expect(data.pricingModel).toBe('Fixed');
    expect(data.amount).toBe(5000);
    expect(data.deliveredWithin.unit).toBe('Weeks');
    expect(data.deliveredWithin.range).toBe('2-4');
    expect(data.coreFeatures.length).toBe(3);
    expect(data.coreFeatures[0].title).toBe('High Availability Clusters');
    expect(data.coreFeatures[0].icon).toBe('CheckCircle2');
    expect(data.deliverables.length).toBe(3);
    expect(data.deliverables[0].title).toBe('Infrastructure as Code');
    expect(data.deliverables[0].icon).toBe('Package');
  });

  it('validates and parses the standard PRODUCT_TEXT_TEMPLATE with 0 errors', () => {
    const result = parseImportText(PRODUCT_TEXT_TEMPLATE, 'Product', existingProductCategories);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.type).toBe('Product');
    expect(result.data).toBeDefined();

    const data = result.data as any;
    expect(data.title).toBe('Autonomous Telemetry Suite');
    expect(data.slug).toBe('autonomous-telemetry-suite');
    expect(data.category).toBe('Developer Tools');
    expect(data.liveLink).toBe('https://telemetry.example.com');
    expect(data.gitRepository).toBe('https://github.com/example/telemetry-suite');
    expect(data.coreFeatures.length).toBe(3);
    expect(data.deliverables.length).toBe(3);
  });

  it('reports error when TYPE is missing or invalid', () => {
    const invalidText = `TITLE: Test Without Type\nSHORT_DESCRIPTION: Some summary\nCORE_FEATURES:\n- Feat\nDELIVERABLES:\n- Deliv`;
    const res = parseImportText(invalidText, 'Service', existingServiceCategories);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.message.includes('Missing "TYPE:"'))).toBe(true);

    const wrongTypeText = `TYPE: BlogPost\nTITLE: Test Post`;
    const res2 = parseImportText(wrongTypeText, 'Service', existingServiceCategories);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.some((e) => e.message.includes('Unknown TYPE'))).toBe(true);
  });

  it('reports error when template TYPE does not match target editor form', () => {
    const serviceText = `TYPE: Service\nTITLE: Cloud Engineering\nSHORT_DESCRIPTION: Summary\nCORE_FEATURES:\n- F1\nDELIVERABLES:\n- D1`;
    // Attempting to import Service text on a Product editor
    const res = parseImportText(serviceText, 'Product', existingProductCategories);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.message.includes('does not match the active Product form'))).toBe(true);
  });

  it('reports error with line numbers when required fields are missing', () => {
    const missingTitleText = `TYPE: Service\nCATEGORY: Development\nSHORT_DESCRIPTION: A short summary\nCORE_FEATURES:\n- [icon: Zap] Rapid Autoscaling | High throughput\nDELIVERABLES:\n- [icon: Package] Codebase | Full repo`;
    const res = parseImportText(missingTitleText, 'Service', existingServiceCategories);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.message.includes('Missing required field "TITLE:"'))).toBe(true);
  });

  it('matches category case-insensitively and issues warning when not found', () => {
    // lowercase 'development' matches 'Development'
    const matchingText = `TYPE: Service\nTITLE: Sample\nCATEGORY: development\nSHORT_DESCRIPTION: Summary\nCORE_FEATURES:\n- F1\nDELIVERABLES:\n- D1`;
    const res = parseImportText(matchingText, 'Service', existingServiceCategories);
    expect(res.isValid).toBe(true);
    expect(res.data?.category).toBe('Development');

    // Unknown category flags warning and leaves empty
    const unknownCatText = `TYPE: Service\nTITLE: Sample\nCATEGORY: Quantum Computing\nSHORT_DESCRIPTION: Summary\nCORE_FEATURES:\n- F1\nDELIVERABLES:\n- D1`;
    const res2 = parseImportText(unknownCatText, 'Service', existingServiceCategories);
    expect(res2.isValid).toBe(true);
    expect(res2.data?.category).toBe('');
    expect(res2.warnings.some((w) => w.message.includes('Quantum Computing') && w.message.includes('not found'))).toBe(true);
  });

  it('recognizes supported icons and falls back to default icon with warning when unknown', () => {
    expect(isSupportedIcon('CheckCircle2')).toBe(true);
    expect(isSupportedIcon('Package')).toBe(true);
    expect(isSupportedIcon('cpu')).toBe(true);

    const unknownIconText = `TYPE: Service\nTITLE: Sample\nCATEGORY: Development\nSHORT_DESCRIPTION: Summary\nCORE_FEATURES:\n- [icon: NonExistentFancyIcon] Feature One | Desc\nDELIVERABLES:\n- [icon: Package] Deliverable One | Desc`;
    const res = parseImportText(unknownIconText, 'Service', existingServiceCategories, 'CheckCircle2');
    expect(res.isValid).toBe(true);
    expect(res.warnings.some((w) => w.message.includes('NonExistentFancyIcon') && w.message.includes('not recognized'))).toBe(true);
    expect(res.data?.coreFeatures?.[0]?.icon).toBe('CheckCircle2');
  });

  it('detects invalid numeric amounts and invalid delivered within unit', () => {
    const invalidValuesText = `TYPE: Service\nTITLE: Sample\nAMOUNT: NotANumber\nDELIVERED_WITHIN_UNIT: Centuries\nSHORT_DESCRIPTION: Summary\nCORE_FEATURES:\n- F1\nDELIVERABLES:\n- D1`;
    const res = parseImportText(invalidValuesText, 'Service', existingServiceCategories);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.message.includes('Invalid numeric value for AMOUNT'))).toBe(true);
    expect(res.errors.some((e) => e.message.includes('Invalid DELIVERED_WITHIN_UNIT'))).toBe(true);
  });
});
