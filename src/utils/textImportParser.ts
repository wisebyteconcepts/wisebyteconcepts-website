import * as LucideIcons from 'lucide-react';
import { slugify } from '@/utils/serviceMigration';
import { Service, Product, ServiceDeliveredUnit, ServicePricingModel } from '@/types';

export interface ParseIssue {
  line: number;
  type: 'error' | 'warning';
  message: string;
}

export interface ParsedItem {
  icon: string;
  title: string;
  description: string;
}

export interface ParseResult<T = Partial<Service> | Partial<Product>> {
  type: 'Service' | 'Product' | null;
  data: T | null;
  errors: ParseIssue[];
  warnings: ParseIssue[];
  isValid: boolean;
  rawType?: string;
}

export const SERVICE_TEXT_TEMPLATE = `TYPE: Service
TITLE: Enterprise Cloud Architecture
SLUG: enterprise-cloud-architecture
CAPTION: Resilient multi-region cloud systems with high-throughput infrastructure
CATEGORY: Development
TAGS: Cloud, Kubernetes, AWS, DevOps, Microservices
ACTIVE: true
FEATURED: false
DELIVERED_WITHIN_UNIT: Weeks
DELIVERED_WITHIN_RANGE: 2-4
PRICING_MODEL: Fixed
CURRENCY: USD
AMOUNT: 5000
MIN_AMOUNT:
MAX_AMOUNT:
CTA_HEADING: Ready to build cloud-native systems?
CTA_DESCRIPTION: Schedule an architectural review with our engineering leads.
CTA_BUTTON_TEXT: Schedule Consultation
CTA_BUTTON_LINK: /contact
CTA_SECONDARY_BUTTON_TEXT: Explore Case Studies
CTA_SECONDARY_BUTTON_LINK: /products
META_TITLE: Enterprise Cloud Architecture Services | Studio
META_DESCRIPTION: High-throughput distributed web systems with resilient architecture and automated CI/CD.
KEYWORDS: cloud architecture, kubernetes, distributed systems
SHORT_DESCRIPTION:
Enterprise-grade cloud migration, containerization, and resilient infrastructure design for mission-critical web platforms.
FULL_DESCRIPTION:
### Architectural Overview
We architect, deploy, and harden production cloud infrastructure tailored for low latency and high availability.

#### Core Competencies
- Automated multi-region Kubernetes deployments
- Zero-trust network segmentation and encrypted data planes
- Automated continuous delivery pipelines with rollback automation
CORE_FEATURES:
- [icon: CheckCircle2] High Availability Clusters | Active-active multi-region failover with 99.99% uptime SLA
- [icon: Zap] Rapid Autoscaling | Horizontal pod autoscaling responding to real-time telemetry spikes
- [icon: Shield] Zero-Trust Security | Automated compliance auditing and encrypted transit pipelines
DELIVERABLES:
- [icon: Package] Infrastructure as Code | Production-ready Terraform and Helm configuration manifests
- [icon: FileText] Architecture Whitepaper | Detailed system design documentation and security audit checklist
- [icon: Globe] Live Production Cluster | Hardened Kubernetes cluster deployed to client cloud account
`;

export const PRODUCT_TEXT_TEMPLATE = `TYPE: Product
TITLE: Autonomous Telemetry Suite
SLUG: autonomous-telemetry-suite
CAPTION: Real-time distributed stream monitoring with sub-millisecond anomaly detection
CATEGORY: Developer Tools
PARENT_SERVICE:
TAGS: Rust, WebSockets, Grafana, Distributed Systems
ACTIVE: true
FEATURED: true
LIVE_URL: https://telemetry.example.com
GITHUB_URL: https://github.com/example/telemetry-suite
DELIVERED_WITHIN_UNIT: Weeks
DELIVERED_WITHIN_RANGE: 3-5
CTA_HEADING: Inspect live telemetry metrics in production
CTA_DESCRIPTION: Try the interactive demo or examine benchmark performance reports.
CTA_BUTTON_TEXT: View Live Demo
CTA_BUTTON_LINK: https://telemetry.example.com
CTA_SECONDARY_BUTTON_TEXT: Read Documentation
CTA_SECONDARY_BUTTON_LINK: /contact
META_TITLE: Autonomous Telemetry Suite | Case Study
META_DESCRIPTION: Real-time distributed stream monitoring engine built with Rust and WebSockets.
KEYWORDS: telemetry, monitoring, rust, websockets, metrics
SHORT_DESCRIPTION:
High-performance time-series data pipeline and visualization interface processing over 100k events per second.
FULL_DESCRIPTION:
### Project Overview
Built to solve massive observability bottlenecks across distributed container fleets, this engine aggregates streaming metrics with zero-loss buffering.

#### Key Engineering Achievements
- Vectorized query engine with in-memory ring buffers
- Sub-5ms p99 latency under 200,000 requests per second
- Native Grafana plugin integration
CORE_FEATURES:
- [icon: CheckCircle2] Zero-Loss Ingestion | In-memory ring buffering preventing message drop during network partitions
- [icon: Cpu] Vectorized Querying | SIMD-accelerated aggregation filters over streaming metrics
- [icon: Globe] Observability Dashboards | Interactive dashboards with sub-second real-time charts
DELIVERABLES:
- [icon: Package] Production Binaries | Self-contained compiled Rust daemon and Docker containers
- [icon: FileText] Benchmark Report | Rigorous throughput and latency analysis under synthetic load
- [icon: Layers] Deployment Manifests | Kubernetes Helm charts and Docker Compose stacks
`;

const VALID_DELIVERED_UNITS: ServiceDeliveredUnit[] = ['Days', 'Weeks', 'Month', 'Depends Upon Project'];
const VALID_PRICING_MODELS: ServicePricingModel[] = ['Fixed', 'Starting At', 'Range', 'Custom Quote'];

/**
 * Checks if icon name is supported in Lucide or Hugeicons stroke set
 */
export function isSupportedIcon(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim();
  if (!clean) return false;

  // Direct Lucide export match (e.g. CheckCircle2, Zap, Package, Shield)
  if (clean in LucideIcons) return true;

  // PascalCase normalization for Lucide (e.g. check-circle-2 -> CheckCircle2)
  const pascal = clean
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  if (pascal in LucideIcons) return true;

  // Common kebab-case Hugeicons (e.g. home-01, cpu, layers-01)
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) return true;

  return false;
}

const KNOWN_TOP_KEYS = new Set([
  'TYPE',
  'TITLE',
  'SLUG',
  'CAPTION',
  'CATEGORY',
  'PARENT_SERVICE',
  'TAGS',
  'ACTIVE',
  'FEATURED',
  'STATUS',
  'CLIENT',
  'DURATION',
  'LIVE_URL',
  'GITHUB_URL',
  'DELIVERED_WITHIN_UNIT',
  'DELIVERED_WITHIN_RANGE',
  'PRICING_MODEL',
  'CURRENCY',
  'AMOUNT',
  'MIN_AMOUNT',
  'MAX_AMOUNT',
  'CTA_HEADING',
  'CTA_DESCRIPTION',
  'CTA_BUTTON_TEXT',
  'CTA_BUTTON_LINK',
  'CTA_SECONDARY_BUTTON_TEXT',
  'CTA_SECONDARY_BUTTON_LINK',
  'META_TITLE',
  'META_DESCRIPTION',
  'KEYWORDS',
  'SHORT_DESCRIPTION',
  'FULL_DESCRIPTION',
  'CORE_FEATURES',
  'DELIVERABLES',
]);

/**
 * Parses structured plain-text for Service or Product and returns validation report + parsed data
 */
export function parseImportText(
  rawText: string,
  expectedType: 'Service' | 'Product',
  existingCategories: string[] = [],
  defaultIcon: string = 'CheckCircle2'
): ParseResult {
  const errors: ParseIssue[] = [];
  const warnings: ParseIssue[] = [];

  if (!rawText.trim()) {
    return {
      type: null,
      data: null,
      errors: [{ line: 1, type: 'error', message: 'Input text is empty. Please paste your structured template text.' }],
      warnings: [],
      isValid: false,
    };
  }

  const lines = rawText.split('\n');

  // Find TYPE line
  let detectedType: 'Service' | 'Product' | null = null;
  let rawTypeString = '';
  let typeLineNum = 1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('#')) continue;
    const typeMatch = trimmed.match(/^TYPE\s*:\s*(.+)$/i);
    if (typeMatch) {
      typeLineNum = i + 1;
      rawTypeString = typeMatch[1].trim();
      const lower = rawTypeString.toLowerCase();
      if (lower === 'service') {
        detectedType = 'Service';
      } else if (lower === 'product' || lower === 'project') {
        detectedType = 'Product';
      }
      break;
    }
  }

  if (!detectedType) {
    if (rawTypeString) {
      errors.push({
        line: typeLineNum,
        type: 'error',
        message: `Unknown TYPE "${rawTypeString}". TYPE must be "Service" or "Product".`,
      });
    } else {
      errors.push({
        line: 1,
        type: 'error',
        message: 'Missing "TYPE:" declaration. First line should be "TYPE: Service" or "TYPE: Product".',
      });
    }
  } else if (detectedType !== expectedType) {
    errors.push({
      line: typeLineNum,
      type: 'error',
      message: `Pasted template TYPE "${detectedType}" does not match the active ${expectedType} form editor. Please use "TYPE: ${expectedType}".`,
    });
  }

  // Parse fields
  const singleValues: Record<string, { val: string; line: number }> = {};
  const multiLineValues: Record<string, { lines: string[]; line: number }> = {
    SHORT_DESCRIPTION: { lines: [], line: 0 },
    FULL_DESCRIPTION: { lines: [], line: 0 },
  };
  const listItems: {
    CORE_FEATURES: ParsedItem[];
    DELIVERABLES: ParsedItem[];
  } = {
    CORE_FEATURES: [],
    DELIVERABLES: [],
  };

  let currentBlock: 'NONE' | 'SHORT_DESCRIPTION' | 'FULL_DESCRIPTION' | 'CORE_FEATURES' | 'DELIVERABLES' = 'NONE';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    const lineNum = i + 1;

    // Ignore comment lines
    if (trimmed.startsWith('#')) continue;

    // Check if line starts with a known KEY:
    const keyMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (keyMatch && KNOWN_TOP_KEYS.has(keyMatch[1].toUpperCase())) {
      const keyName = keyMatch[1].toUpperCase();
      const restValue = keyMatch[2].trim();

      if (keyName === 'SHORT_DESCRIPTION' || keyName === 'FULL_DESCRIPTION') {
        currentBlock = keyName;
        multiLineValues[keyName] = {
          lines: restValue ? [restValue] : [],
          line: lineNum,
        };
        continue;
      }

      if (keyName === 'CORE_FEATURES' || keyName === 'DELIVERABLES') {
        currentBlock = keyName;
        continue;
      }

      // It's a single value key
      currentBlock = 'NONE';
      singleValues[keyName] = { val: restValue, line: lineNum };
      continue;
    }

    // Inside CORE_FEATURES or DELIVERABLES
    if (currentBlock === 'CORE_FEATURES' || currentBlock === 'DELIVERABLES') {
      if (!trimmed) continue;

      if (trimmed.startsWith('-')) {
        // Parse list line: "- [icon: name] Title | Description"
        const itemMatch = trimmed.match(/^-\s*(?:\[icon:\s*([^\]]+)\]\s*)?([^|]+)(?:\|\s*(.*))?$/);
        if (itemMatch) {
          const rawIcon = itemMatch[1]?.trim() || '';
          const title = itemMatch[2]?.trim() || '';
          const description = itemMatch[3]?.trim() || '';

          if (!title) {
            errors.push({
              line: lineNum,
              type: 'error',
              message: `Malformed item line in ${currentBlock}. Item title cannot be empty.`,
            });
            continue;
          }

          let icon = defaultIcon;
          if (rawIcon) {
            if (isSupportedIcon(rawIcon)) {
              icon = rawIcon;
            } else {
              warnings.push({
                line: lineNum,
                type: 'warning',
                message: `Icon "${rawIcon}" not recognized. Default icon "${defaultIcon}" will be used instead.`,
              });
            }
          }

          listItems[currentBlock].push({ icon, title, description });
        } else {
          errors.push({
            line: lineNum,
            type: 'error',
            message: `Malformed list line in ${currentBlock}. Expected format: "- [icon: name] Title | Description"`,
          });
        }
        continue;
      }
    }

    // Inside SHORT_DESCRIPTION or FULL_DESCRIPTION
    if (currentBlock === 'SHORT_DESCRIPTION' || currentBlock === 'FULL_DESCRIPTION') {
      multiLineValues[currentBlock].lines.push(rawLine);
      continue;
    }
  }

  // Extract common fields
  const title = singleValues.TITLE?.val?.trim() || '';
  if (!title) {
    errors.push({
      line: singleValues.TITLE?.line || 1,
      type: 'error',
      message: 'Missing required field "TITLE:". Please specify a title.',
    });
  }

  const slug = singleValues.SLUG?.val?.trim() ? slugify(singleValues.SLUG.val.trim()) : slugify(title);
  const caption = singleValues.CAPTION?.val?.trim() || '';

  // Category matching
  let category = '';
  const rawCategory = singleValues.CATEGORY?.val?.trim() || '';
  const categoryLine = singleValues.CATEGORY?.line || 1;

  if (rawCategory) {
    const matched = existingCategories.find(
      (c) => c.trim().toLowerCase() === rawCategory.toLowerCase()
    );
    if (matched) {
      category = matched;
    } else {
      category = '';
      warnings.push({
        line: categoryLine,
        type: 'warning',
        message: `Category "${rawCategory}" not found in existing categories. Left empty for manual selection.`,
      });
    }
  } else {
    warnings.push({
      line: categoryLine,
      type: 'warning',
      message: 'Category is empty. Please select one manually after import.',
    });
  }

  // Tags
  const rawTags = singleValues.TAGS?.val?.trim() || '';
  const tags = rawTags
    ? rawTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0)
    : [];

  // Active & Featured booleans
  const parseBool = (raw?: string, defaultVal: boolean = true) => {
    if (!raw) return defaultVal;
    const lower = raw.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  };

  const active = parseBool(singleValues.ACTIVE?.val, true);
  const featured = parseBool(singleValues.FEATURED?.val, false);

  // Timeframe Unit & Range
  const rawUnit = singleValues.DELIVERED_WITHIN_UNIT?.val?.trim();
  let deliveredUnit: ServiceDeliveredUnit = 'Weeks';
  if (rawUnit) {
    const matchedUnit = VALID_DELIVERED_UNITS.find(
      (u) => u.toLowerCase() === rawUnit.toLowerCase()
    );
    if (matchedUnit) {
      deliveredUnit = matchedUnit;
    } else {
      errors.push({
        line: singleValues.DELIVERED_WITHIN_UNIT.line,
        type: 'error',
        message: `Invalid DELIVERED_WITHIN_UNIT "${rawUnit}". Allowed values: ${VALID_DELIVERED_UNITS.join(', ')}`,
      });
    }
  }
  const deliveredRange = singleValues.DELIVERED_WITHIN_RANGE?.val?.trim() || '2-4';

  // Descriptions
  const shortDescription = multiLineValues.SHORT_DESCRIPTION.lines.join('\n').trim();
  if (!shortDescription) {
    errors.push({
      line: multiLineValues.SHORT_DESCRIPTION.line || 1,
      type: 'error',
      message: 'Missing required field "SHORT_DESCRIPTION:". Please provide a short summary description.',
    });
  }

  const fullDescription = multiLineValues.FULL_DESCRIPTION.lines.join('\n').trim();

  // Features & Deliverables validation
  if (listItems.CORE_FEATURES.length === 0) {
    errors.push({
      line: lines.length,
      type: 'error',
      message: 'Missing required "CORE_FEATURES:". Add at least one feature line starting with "- [icon: name] Title | Description"',
    });
  }

  if (listItems.DELIVERABLES.length === 0) {
    errors.push({
      line: lines.length,
      type: 'error',
      message: 'Missing required "DELIVERABLES:". Add at least one deliverable line starting with "- [icon: name] Title | Description"',
    });
  }

  // CTA fields
  const ctaHeading = singleValues.CTA_HEADING?.val?.trim() || '';
  const ctaDescription = singleValues.CTA_DESCRIPTION?.val?.trim() || '';
  const ctaButtonText = singleValues.CTA_BUTTON_TEXT?.val?.trim() || 'Get In Touch';
  const ctaButtonLink = singleValues.CTA_BUTTON_LINK?.val?.trim() || '/contact';
  const ctaSecondaryButtonText = singleValues.CTA_SECONDARY_BUTTON_TEXT?.val?.trim() || '';
  const ctaSecondaryButtonLink = singleValues.CTA_SECONDARY_BUTTON_LINK?.val?.trim() || '';

  // SEO fields
  const metaTitle = singleValues.META_TITLE?.val?.trim() || '';
  const metaDescription = singleValues.META_DESCRIPTION?.val?.trim() || '';
  const rawKeywords = singleValues.KEYWORDS?.val?.trim() || '';
  const keywords = rawKeywords
    ? rawKeywords.split(',').map((k) => k.trim()).filter((k) => k.length > 0)
    : [];

  let resultData: any = null;

  if (expectedType === 'Service') {
    // Pricing Model
    const rawPricingModel = singleValues.PRICING_MODEL?.val?.trim();
    let pricingModel: ServicePricingModel = 'Fixed';
    if (rawPricingModel) {
      const matchedModel = VALID_PRICING_MODELS.find(
        (m) => m.toLowerCase() === rawPricingModel.toLowerCase()
      );
      if (matchedModel) {
        pricingModel = matchedModel;
      } else {
        errors.push({
          line: singleValues.PRICING_MODEL.line,
          type: 'error',
          message: `Invalid PRICING_MODEL "${rawPricingModel}". Allowed values: ${VALID_PRICING_MODELS.join(', ')}`,
        });
      }
    }

    const currency = singleValues.CURRENCY?.val?.trim() || 'USD';

    // Parse amounts
    const parseNumber = (key: string) => {
      const item = singleValues[key];
      if (!item || !item.val.trim()) return undefined;
      const num = Number(item.val.trim());
      if (isNaN(num) || num < 0) {
        errors.push({
          line: item.line,
          type: 'error',
          message: `Invalid numeric value for ${key}: "${item.val}"`,
        });
        return undefined;
      }
      return num;
    };

    const amount = parseNumber('AMOUNT');
    const minAmount = parseNumber('MIN_AMOUNT');
    const maxAmount = parseNumber('MAX_AMOUNT');

    resultData = {
      title,
      slug,
      caption,
      shortDescription,
      fullDescription,
      category,
      tags,
      active,
      featured,
      pricingModel,
      currency,
      amount,
      minAmount,
      maxAmount,
      deliveredWithin: {
        unit: deliveredUnit,
        range: deliveredRange,
      },
      coreFeatures: listItems.CORE_FEATURES,
      deliverables: listItems.DELIVERABLES,
      ctaText: ctaDescription,
      ctaButtonText,
      ctaButtonLink,
      metaTitle,
      metaDescription,
      keywords,
    };
  } else {
    // Product specific
    const liveLink = singleValues.LIVE_URL?.val?.trim() || '';
    const gitRepository = singleValues.GITHUB_URL?.val?.trim() || '';
    const parentService = singleValues.PARENT_SERVICE?.val?.trim() || '';

    resultData = {
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
      liveLink,
      gitRepository,
      deliveredWithin: {
        unit: deliveredUnit,
        range: deliveredRange,
      },
      coreFeatures: listItems.CORE_FEATURES,
      deliverables: listItems.DELIVERABLES,
      ctaHeading,
      ctaText: ctaDescription,
      ctaButtonText,
      ctaButtonLink,
      ctaSecondaryButtonText,
      ctaSecondaryButtonLink,
      metaTitle,
      metaDescription,
      keywords,
    };
  }

  // Sort errors and warnings by line number
  errors.sort((a, b) => a.line - b.line);
  warnings.sort((a, b) => a.line - b.line);

  return {
    type: detectedType,
    rawType: rawTypeString,
    data: errors.length === 0 ? resultData : null,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
