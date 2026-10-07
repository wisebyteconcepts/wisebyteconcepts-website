import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Search, 
  Image as ImageIcon, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Monitor, 
  Smartphone, 
  Share2, 
  Code, 
  Copy, 
  Check, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Sliders,
  ChevronDown,
  Info
} from 'lucide-react';
import { InputBlock, TextareaBlock, FormLabel } from '@/components/forms/FormControls';
import { ImageInput } from '@/components/admin/ImageInput';
import { TagInput } from '@/components/ui/TagInput';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { slugify, isValidUrl } from '@/utils/serviceMigration';
import { normalizeCurrencyCode, formatCurrency } from '@/utils/currency';

export interface SeoFieldsProps {
  type?: 'Service' | 'Product';
  
  // Live Source Fields for Autofill
  sourceTitle?: string;
  sourceShortDescription?: string;
  sourceDisplayPicture?: string;
  sourceTags?: string[];
  sourceCategory?: string;
  sourceAmount?: number;
  sourceCurrency?: string;
  sourceLiveLink?: string;
  
  // Controlled SEO state
  metaTitle: string;
  onMetaTitleChange: (val: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (val: string) => void;
  slug: string;
  onSlugChange: (val: string) => void;
  pathPrefix?: string; // e.g. "services" or "products"
  focusKeyword?: string;
  onFocusKeywordChange?: (val: string) => void;
  keywords?: string[];
  onKeywordsChange?: (val: string[]) => void;
  
  ogImage?: string;
  onOgImageChange?: (val: string | null) => void;
  ogImageAlt?: string;
  onOgImageAltChange?: (val: string) => void;
  
  canonicalUrl?: string;
  onCanonicalUrlChange?: (val: string) => void;
  noIndex?: boolean;
  onNoIndexChange?: (val: boolean) => void;
  noFollow?: boolean;
  onNoFollowChange?: (val: boolean) => void;
  
  twitterCardType?: 'summary' | 'summary_large_image';
  onTwitterCardTypeChange?: (val: 'summary' | 'summary_large_image') => void;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  onTwitterTitleChange?: (val: string) => void;
  onTwitterDescriptionChange?: (val: string) => void;
  onTwitterImageChange?: (val: string | null) => void;
  
  enableStructuredData?: boolean;
  onEnableStructuredDataChange?: (val: boolean) => void;

  defaultTitlePlaceholder?: string;
  defaultDescriptionPlaceholder?: string;
  className?: string;
}

const BRAND_NAME = 'Wise Byte Concepts';
const BASE_DOMAIN = 'https://wisebyteconcepts.com';

export const SeoFields: React.FC<SeoFieldsProps> = ({
  type = 'Service',
  sourceTitle = '',
  sourceShortDescription = '',
  sourceDisplayPicture = '',
  sourceTags = [],
  sourceCategory = '',
  sourceAmount,
  sourceCurrency = 'USD',
  sourceLiveLink = '',

  metaTitle = '',
  onMetaTitleChange,
  metaDescription = '',
  onMetaDescriptionChange,
  slug = '',
  onSlugChange,
  pathPrefix = 'services',
  focusKeyword = '',
  onFocusKeywordChange,
  keywords = [],
  onKeywordsChange,

  ogImage,
  onOgImageChange,
  ogImageAlt = '',
  onOgImageAltChange,

  canonicalUrl = '',
  onCanonicalUrlChange,
  noIndex = false,
  onNoIndexChange,
  noFollow = false,
  onNoFollowChange,

  twitterCardType = 'summary_large_image',
  onTwitterCardTypeChange,
  twitterTitle = '',
  twitterDescription = '',
  twitterImage = '',
  onTwitterTitleChange,
  onTwitterDescriptionChange,
  onTwitterImageChange,

  enableStructuredData = true,
  onEnableStructuredDataChange,

  defaultTitlePlaceholder,
  defaultDescriptionPlaceholder,
  className,
}) => {
  // Device toggle for Google preview
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  // Social share preview tab
  const [socialPreviewTab, setSocialPreviewTab] = useState<'og' | 'twitter'>('og');
  // Twitter custom overrides expander
  const [showTwitterOverrides, setShowTwitterOverrides] = useState(false);
  // Structured Data copy feedback
  const [copiedJson, setCopiedJson] = useState(false);
  // Health checklist collapse
  const [showChecklistDetails, setShowChecklistDetails] = useState(true);

  // Manual customization tracking
  const [customized, setCustomized] = useState<Record<string, boolean>>({
    metaTitle: Boolean(metaTitle && metaTitle !== `${sourceTitle.trim()} | ${BRAND_NAME}` && metaTitle !== sourceTitle.trim()),
    metaDescription: Boolean(metaDescription && metaDescription !== sourceShortDescription.trim()),
    slug: Boolean(slug && slug !== slugify(sourceTitle)),
    focusKeyword: Boolean(focusKeyword),
    keywords: Boolean(keywords && keywords.length > 0 && JSON.stringify(keywords) !== JSON.stringify(sourceTags)),
    ogImage: Boolean(ogImage && ogImage !== sourceDisplayPicture),
    ogImageAlt: Boolean(ogImageAlt),
    canonicalUrl: Boolean(canonicalUrl && canonicalUrl !== `${BASE_DOMAIN}/${pathPrefix}/${slug || slugify(sourceTitle)}`),
    twitterTitle: Boolean(twitterTitle),
    twitterDescription: Boolean(twitterDescription),
    twitterImage: Boolean(twitterImage),
  });

  // Calculate default auto values
  const autoMetaTitle = useMemo(() => {
    const raw = sourceTitle.trim();
    if (!raw) return '';
    return raw.toLowerCase().includes(BRAND_NAME.toLowerCase()) ? raw : `${raw} | ${BRAND_NAME}`;
  }, [sourceTitle]);

  const autoMetaDescription = useMemo(() => {
    return sourceShortDescription.trim();
  }, [sourceShortDescription]);

  const autoSlug = useMemo(() => {
    return slugify(sourceTitle);
  }, [sourceTitle]);

  const autoFocusKeyword = useMemo(() => {
    if (sourceTags && sourceTags.length > 0) {
      return sourceTags[0].toLowerCase();
    }
    const words = sourceTitle.trim().split(/\s+/).filter(w => w.length > 3);
    return words.slice(0, 2).join(' ').toLowerCase();
  }, [sourceTags, sourceTitle]);

  const autoKeywords = useMemo(() => {
    return Array.isArray(sourceTags) ? sourceTags : [];
  }, [sourceTags]);

  const autoOgImage = useMemo(() => {
    return sourceDisplayPicture.trim();
  }, [sourceDisplayPicture]);

  const autoOgImageAlt = useMemo(() => {
    return sourceTitle.trim() ? `${sourceTitle.trim()} preview visual` : 'Preview social image';
  }, [sourceTitle]);

  const autoCanonicalUrl = useMemo(() => {
    const activeSlug = slug.trim() || autoSlug;
    return activeSlug ? `${BASE_DOMAIN}/${pathPrefix}/${activeSlug}` : `${BASE_DOMAIN}/${pathPrefix}`;
  }, [slug, autoSlug, pathPrefix]);

  // Autofill sync: keeps following source fields until user manually edits them
  useEffect(() => {
    if (!customized.metaTitle && autoMetaTitle && onMetaTitleChange) {
      onMetaTitleChange(autoMetaTitle);
    }
  }, [autoMetaTitle, customized.metaTitle]);

  useEffect(() => {
    if (!customized.metaDescription && autoMetaDescription && onMetaDescriptionChange) {
      onMetaDescriptionChange(autoMetaDescription);
    }
  }, [autoMetaDescription, customized.metaDescription]);

  useEffect(() => {
    if (!customized.slug && autoSlug && onSlugChange) {
      onSlugChange(autoSlug);
    }
  }, [autoSlug, customized.slug]);

  useEffect(() => {
    if (!customized.focusKeyword && autoFocusKeyword && onFocusKeywordChange && !focusKeyword) {
      onFocusKeywordChange(autoFocusKeyword);
    }
  }, [autoFocusKeyword, customized.focusKeyword]);

  useEffect(() => {
    if (!customized.keywords && autoKeywords.length > 0 && onKeywordsChange) {
      onKeywordsChange(autoKeywords);
    }
  }, [autoKeywords, customized.keywords]);

  useEffect(() => {
    if (!customized.ogImage && autoOgImage && onOgImageChange) {
      onOgImageChange(autoOgImage);
    }
  }, [autoOgImage, customized.ogImage]);

  useEffect(() => {
    if (!customized.ogImageAlt && autoOgImageAlt && onOgImageAltChange) {
      onOgImageAltChange(autoOgImageAlt);
    }
  }, [autoOgImageAlt, customized.ogImageAlt]);

  useEffect(() => {
    if (!customized.canonicalUrl && autoCanonicalUrl && onCanonicalUrlChange) {
      onCanonicalUrlChange(autoCanonicalUrl);
    }
  }, [autoCanonicalUrl, customized.canonicalUrl]);

  // Handle single field reset to auto
  const handleResetField = (field: string) => {
    setCustomized(prev => ({ ...prev, [field]: false }));
    switch (field) {
      case 'metaTitle':
        onMetaTitleChange(autoMetaTitle);
        break;
      case 'metaDescription':
        onMetaDescriptionChange(autoMetaDescription);
        break;
      case 'slug':
        onSlugChange(autoSlug);
        break;
      case 'focusKeyword':
        if (onFocusKeywordChange) onFocusKeywordChange(autoFocusKeyword);
        break;
      case 'keywords':
        if (onKeywordsChange) onKeywordsChange(autoKeywords);
        break;
      case 'ogImage':
        if (onOgImageChange) onOgImageChange(autoOgImage);
        break;
      case 'ogImageAlt':
        if (onOgImageAltChange) onOgImageAltChange(autoOgImageAlt);
        break;
      case 'canonicalUrl':
        if (onCanonicalUrlChange) onCanonicalUrlChange(autoCanonicalUrl);
        break;
      case 'twitterTitle':
        if (onTwitterTitleChange) onTwitterTitleChange('');
        break;
      case 'twitterDescription':
        if (onTwitterDescriptionChange) onTwitterDescriptionChange('');
        break;
      case 'twitterImage':
        if (onTwitterImageChange) onTwitterImageChange(null);
        break;
      default:
        break;
    }
  };

  // Reset all fields to auto
  const handleResetAllToAuto = () => {
    setCustomized({
      metaTitle: false,
      metaDescription: false,
      slug: false,
      focusKeyword: false,
      keywords: false,
      ogImage: false,
      ogImageAlt: false,
      canonicalUrl: false,
      twitterTitle: false,
      twitterDescription: false,
      twitterImage: false,
    });
    onMetaTitleChange(autoMetaTitle);
    onMetaDescriptionChange(autoMetaDescription);
    onSlugChange(autoSlug);
    if (onFocusKeywordChange) onFocusKeywordChange(autoFocusKeyword);
    if (onKeywordsChange) onKeywordsChange(autoKeywords);
    if (onOgImageChange) onOgImageChange(autoOgImage);
    if (onOgImageAltChange) onOgImageAltChange(autoOgImageAlt);
    if (onCanonicalUrlChange) onCanonicalUrlChange(autoCanonicalUrl);
    if (onTwitterTitleChange) onTwitterTitleChange('');
    if (onTwitterDescriptionChange) onTwitterDescriptionChange('');
    if (onTwitterImageChange) onTwitterImageChange(null);
  };

  // Effective values for previews and validations
  const effectiveTitle = metaTitle || autoMetaTitle || defaultTitlePlaceholder || sourceTitle || 'Page Title | Wise Byte Concepts';
  const effectiveDescription = metaDescription || autoMetaDescription || defaultDescriptionPlaceholder || sourceShortDescription || 'High-performance digital engineering solutions with architectural reliability.';
  const effectiveSlug = slug || autoSlug || 'sample-slug';
  const effectiveCanonical = canonicalUrl || autoCanonicalUrl || `${BASE_DOMAIN}/${pathPrefix}/${effectiveSlug}`;
  const effectiveOgImage = ogImage || autoOgImage || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
  const effectiveFocusKeyword = focusKeyword || autoFocusKeyword || '';

  // Twitter inheritance with optional overrides
  const effectiveTwitterTitle = twitterTitle?.trim() ? twitterTitle : effectiveTitle;
  const effectiveTwitterDescription = twitterDescription?.trim() ? twitterDescription : effectiveDescription;
  const effectiveTwitterImage = twitterImage?.trim() ? twitterImage : effectiveOgImage;

  // Validation Checks & Health Score Calculation
  const checks = useMemo(() => {
    const list: Array<{
      id: string;
      label: string;
      passed: boolean;
      warningMessage: string;
      successMessage: string;
    }> = [];

    // 1. Meta Title Check (30-60 chars, contains focus keyword)
    const titleLen = effectiveTitle.length;
    const titleHasKeyword = effectiveFocusKeyword 
      ? effectiveTitle.toLowerCase().includes(effectiveFocusKeyword.toLowerCase().trim())
      : true;
    const titleLengthValid = titleLen >= 30 && titleLen <= 60;
    const titlePassed = titleLengthValid && titleHasKeyword;
    let titleWarn = '';
    if (titleLen < 30) titleWarn = `Title is too short (${titleLen}/60 chars, recommended 30–60)`;
    else if (titleLen > 60) titleWarn = `Title is too long (${titleLen}/60 chars, may truncate in search snippets)`;
    else if (!titleHasKeyword) titleWarn = `Title should include target focus keyword "${effectiveFocusKeyword}"`;

    list.push({
      id: 'title',
      label: 'Meta Title Length & Keyword',
      passed: titlePassed,
      warningMessage: titleWarn,
      successMessage: `Optimal title length (${titleLen}/60 chars)${effectiveFocusKeyword ? ' with focus keyword' : ''}`,
    });

    // 2. Meta Description Check (120-160 chars, contains focus keyword)
    const descLen = effectiveDescription.length;
    const descHasKeyword = effectiveFocusKeyword 
      ? effectiveDescription.toLowerCase().includes(effectiveFocusKeyword.toLowerCase().trim())
      : true;
    const descLengthValid = descLen >= 120 && descLen <= 160;
    const descPassed = descLengthValid && descHasKeyword;
    let descWarn = '';
    if (descLen < 120) descWarn = `Description is short (${descLen}/160 chars, recommended 120–160)`;
    else if (descLen > 160) descWarn = `Description may be truncated (${descLen}/160 chars)`;
    else if (!descHasKeyword) descWarn = `Description should include target focus keyword "${effectiveFocusKeyword}"`;

    list.push({
      id: 'description',
      label: 'Meta Description Length & Keyword',
      passed: descPassed,
      warningMessage: descWarn,
      successMessage: `Optimal snippet length (${descLen}/160 chars)${effectiveFocusKeyword ? ' with focus keyword' : ''}`,
    });

    // 3. Focus Keyword Set & Present in Title, Description, and Slug
    const kw = effectiveFocusKeyword.trim().toLowerCase();
    const kwSet = kw.length > 0;
    const kwInTitle = kwSet && effectiveTitle.toLowerCase().includes(kw);
    const kwInDesc = kwSet && effectiveDescription.toLowerCase().includes(kw);
    const cleanKwForSlug = kw.replace(/[^a-z0-9]/g, '');
    const cleanSlug = effectiveSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const kwInSlug = kwSet && (cleanSlug.includes(cleanKwForSlug) || kw.split(/\s+/).some(part => part.length > 3 && cleanSlug.includes(part)));
    const kwPassed = kwSet && kwInTitle && kwInDesc && kwInSlug;

    const missingLocations: string[] = [];
    if (!kwInTitle) missingLocations.push('title');
    if (!kwInDesc) missingLocations.push('description');
    if (!kwInSlug) missingLocations.push('slug');

    list.push({
      id: 'keyword',
      label: 'Focus Keyword Coverage',
      passed: kwPassed,
      warningMessage: !kwSet 
        ? 'No focus keyword defined' 
        : `Focus keyword missing in: ${missingLocations.join(', ')}`,
      successMessage: `Focus keyword "${effectiveFocusKeyword}" matches title, description, and slug`,
    });

    // 4. URL Slug Format (short, clean, lowercase-hyphen, no special chars)
    const isCleanSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(effectiveSlug);
    const slugLengthOk = effectiveSlug.length > 0 && effectiveSlug.length <= 60;
    const slugPassed = isCleanSlug && slugLengthOk;
    let slugWarn = '';
    if (!effectiveSlug) slugWarn = 'Slug cannot be empty';
    else if (!isCleanSlug) slugWarn = 'Slug must only contain lowercase alphanumeric characters and single hyphens';
    else if (effectiveSlug.length > 60) slugWarn = `Slug is longer than recommended 60 chars (${effectiveSlug.length})`;

    list.push({
      id: 'slug',
      label: 'Clean URL Slug',
      passed: slugPassed,
      warningMessage: slugWarn,
      successMessage: `Clean URL slug: /${pathPrefix}/${effectiveSlug}`,
    });

    // 5. OG Image & Alt Text (present, 1200x630 recommended, has alt text)
    const hasOgImg = Boolean(ogImage?.trim() || autoOgImage);
    const hasAlt = Boolean(ogImageAlt?.trim() || autoOgImageAlt);
    const ogPassed = hasOgImg && hasAlt;
    let ogWarn = '';
    if (!hasOgImg) ogWarn = 'Missing Open Graph image (1200x630px recommended for social share previews)';
    else if (!hasAlt) ogWarn = 'OG image is set, but descriptive accessibility alt text is missing';

    list.push({
      id: 'ogImage',
      label: 'Social Share Image & Alt Text',
      passed: ogPassed,
      warningMessage: ogWarn,
      successMessage: 'OG image configured with alt text (1200x630 recommended)',
    });

    // 6. Canonical URL & Robots Indexing Check
    const hasValidCanonical = Boolean(effectiveCanonical && isValidUrl(effectiveCanonical));
    const isIndexed = !noIndex;
    const canonicalPassed = hasValidCanonical && isIndexed;
    let canonicalWarn = '';
    if (noIndex) canonicalWarn = 'Page is set to noindex - search engines will not index this page in organic results';
    else if (!hasValidCanonical) canonicalWarn = 'Canonical URL is invalid or malformed';

    list.push({
      id: 'canonical',
      label: 'Canonical URL & Index Directive',
      passed: canonicalPassed,
      warningMessage: canonicalWarn,
      successMessage: `Valid canonical URL configured and search engine indexing active`,
    });

    return list;
  }, [
    effectiveTitle, 
    effectiveDescription, 
    effectiveFocusKeyword, 
    effectiveSlug, 
    pathPrefix, 
    ogImage, 
    autoOgImage, 
    ogImageAlt, 
    autoOgImageAlt, 
    effectiveCanonical, 
    noIndex
  ]);

  const passedChecksCount = checks.filter(c => c.passed).length;
  const seoScore = Math.round((passedChecksCount / checks.length) * 100);

  // Generate Structured Data (JSON-LD)
  const structuredDataJson = useMemo(() => {
    if (type === 'Product') {
      const prodData: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: effectiveTitle,
        description: effectiveDescription,
        url: effectiveCanonical,
        sku: effectiveSlug,
        brand: {
          '@type': 'Brand',
          name: BRAND_NAME,
        },
        offers: {
          '@type': 'Offer',
          price: sourceAmount !== undefined ? String(sourceAmount) : '0',
          priceCurrency: normalizeCurrencyCode(sourceCurrency),
          availability: 'https://schema.org/InStock',
          url: sourceLiveLink || effectiveCanonical,
        },
      };
      if (effectiveOgImage) {
        prodData.image = effectiveOgImage;
      }
      return JSON.stringify(prodData, null, 2);
    } else {
      // Service JSON-LD
      const servData: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: effectiveTitle,
        description: effectiveDescription,
        url: effectiveCanonical,
        serviceType: sourceCategory || 'Engineering & Software Architecture',
        provider: {
          '@type': 'Organization',
          name: BRAND_NAME,
          url: BASE_DOMAIN,
        },
        areaServed: 'Global',
      };
      if (effectiveOgImage) {
        servData.image = effectiveOgImage;
      }
      if (sourceAmount !== undefined) {
        servData.offers = {
          '@type': 'Offer',
          price: String(sourceAmount),
          priceCurrency: normalizeCurrencyCode(sourceCurrency),
        };
      }
      return JSON.stringify(servData, null, 2);
    }
  }, [type, effectiveTitle, effectiveDescription, effectiveCanonical, effectiveSlug, effectiveOgImage, sourceAmount, sourceCurrency, sourceLiveLink, sourceCategory]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(structuredDataJson);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // fallback
    }
  };

  const titleLen = (metaTitle || '').length;
  const descLen = (metaDescription || '').length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header bar */}
      <div className="pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Search Engine Optimization & Social Sharing (SEO)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optimize metadata, Google search appearance, OpenGraph social cards, and Schema.org structured data.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleResetAllToAuto}
          className="h-8 text-xs gap-1.5 border-border bg-surface-2 hover:bg-surface-3 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span>Reset All to Auto</span>
        </Button>
      </div>

      {/* Main Grid: Left Edit Fields, Right Live Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: EDIT FIELDS & CHECKLISTS (lg:col-span-7)       */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 space-y-6">
          {/* SEO Score & Interactive Health Checklist Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-border shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-2xs",
                  seoScore >= 80 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : seoScore >= 50
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                )}>
                  {seoScore}%
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">SEO Optimization Score</span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-mono",
                      seoScore >= 80 ? "text-emerald-400 border-emerald-500/40" : "text-amber-400 border-amber-500/40"
                    )}>
                      {passedChecksCount}/{checks.length} Passed
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {seoScore === 100 
                      ? 'All best-practice search optimization guidelines fulfilled.'
                      : 'Non-blocking recommendations to maximize search snippet click-through rate.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowChecklistDetails(!showChecklistDetails)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
                title={showChecklistDetails ? "Collapse checklist" : "Expand checklist"}
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", showChecklistDetails && "rotate-180")} />
              </button>
            </div>

            {/* Checklist details list */}
            {showChecklistDetails && (
              <div className="pt-2 border-t border-border/40 space-y-2 animate-in fade-in duration-200">
                {checks.map((c) => (
                  <div 
                    key={c.id} 
                    className={cn(
                      "flex items-start gap-2.5 p-2 rounded-lg text-xs transition-colors",
                      c.passed ? "bg-emerald-500/5 text-emerald-400/90" : "bg-amber-500/5 text-amber-400/90"
                    )}
                  >
                    {c.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground flex items-center justify-between gap-1">
                        <span>{c.label}</span>
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.2 rounded uppercase",
                          c.passed ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        )}>
                          {c.passed ? 'Pass' : 'Notice'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 text-muted-foreground">
                        {c.passed ? c.successMessage : c.warningMessage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FIELD 1: Meta Title */}
          <div className="space-y-1.5 p-4 rounded-xl border border-border/60 bg-surface-2/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FormLabel className="text-xs font-semibold mb-0">Meta Title</FormLabel>
                {customized.metaTitle ? (
                  <button
                    type="button"
                    onClick={() => handleResetField('metaTitle')}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    title="Reset to title autofill"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Reset to auto
                  </button>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Auto-following title
                  </span>
                )}
              </div>

              {/* Character Counter */}
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-[10px] font-mono font-bold",
                  titleLen >= 30 && titleLen <= 60 
                    ? "text-emerald-400" 
                    : titleLen > 60 
                      ? "text-amber-500" 
                      : "text-muted-foreground"
                )}>
                  {titleLen} / 60 chars
                </span>
                <div className="w-14 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      titleLen >= 30 && titleLen <= 60 
                        ? "bg-emerald-400" 
                        : titleLen > 60 
                          ? "bg-amber-500" 
                          : "bg-primary"
                    )}
                    style={{ width: `${Math.min(100, (titleLen / 60) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <InputBlock
              value={metaTitle}
              onChange={(e) => {
                setCustomized(prev => ({ ...prev, metaTitle: true }));
                onMetaTitleChange(e.target.value);
              }}
              placeholder={autoMetaTitle || "Primary Search Result Title | Wise Byte Concepts"}
              description="Primary headline displayed in search engine results and browser tabs (30–60 characters recommended)."
            />
          </div>

          {/* FIELD 2: Meta Description */}
          <div className="space-y-1.5 p-4 rounded-xl border border-border/60 bg-surface-2/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FormLabel className="text-xs font-semibold mb-0">Meta Description</FormLabel>
                {customized.metaDescription ? (
                  <button
                    type="button"
                    onClick={() => handleResetField('metaDescription')}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    title="Reset to short description autofill"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Reset to auto
                  </button>
                ) : (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Auto-following description
                  </span>
                )}
              </div>

              {/* Character Counter */}
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "text-[10px] font-mono font-bold",
                  descLen >= 120 && descLen <= 160 
                    ? "text-emerald-400" 
                    : descLen > 160 
                      ? "text-amber-500" 
                      : "text-muted-foreground"
                )}>
                  {descLen} / 160 chars
                </span>
                <div className="w-14 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      descLen >= 120 && descLen <= 160 
                        ? "bg-emerald-400" 
                        : descLen > 160 
                          ? "bg-amber-500" 
                          : "bg-primary"
                    )}
                    style={{ width: `${Math.min(100, (descLen / 160) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <TextareaBlock
              value={metaDescription}
              onChange={(e) => {
                setCustomized(prev => ({ ...prev, metaDescription: true }));
                onMetaDescriptionChange(e.target.value);
              }}
              rows={3}
              placeholder={autoMetaDescription || "Concise descriptive summary for algorithmic indexing and rich search previews..."}
              description="Summarize value proposition in 1–2 compelling sentences shown in search snippets (120–160 chars recommended)."
            />
          </div>

          {/* FIELD 3 & 4: Focus Keyword, SEO Keywords, URL Slug */}
          <div className="p-4 rounded-xl border border-border/60 bg-surface-2/30 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Focus Keyword */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold mb-0">Focus Keyword</FormLabel>
                  {customized.focusKeyword ? (
                    <button
                      type="button"
                      onClick={() => handleResetField('focusKeyword')}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Auto
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-muted-foreground">Auto</span>
                  )}
                </div>
                <InputBlock
                  value={focusKeyword}
                  onChange={(e) => {
                    setCustomized(prev => ({ ...prev, focusKeyword: true }));
                    if (onFocusKeywordChange) onFocusKeywordChange(e.target.value);
                  }}
                  placeholder={autoFocusKeyword || "e.g. cloud architecture"}
                  description="Primary search term targeted across title, description, and slug."
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold mb-0">URL Slug</FormLabel>
                  {customized.slug ? (
                    <button
                      type="button"
                      onClick={() => handleResetField('slug')}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Auto
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-muted-foreground">Auto</span>
                  )}
                </div>
                <InputBlock
                  value={slug}
                  onChange={(e) => {
                    setCustomized(prev => ({ ...prev, slug: true }));
                    onSlugChange(slugify(e.target.value));
                  }}
                  placeholder={autoSlug || "entry-slug"}
                  description={`Endpoint: /${pathPrefix}/${slug || '...'}`}
                />
              </div>
            </div>

            {/* SEO Keywords TagInput */}
            {onKeywordsChange && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold mb-0">SEO Keywords & Meta Tags</FormLabel>
                  {customized.keywords ? (
                    <button
                      type="button"
                      onClick={() => handleResetField('keywords')}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Auto
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-muted-foreground">Auto</span>
                  )}
                </div>
                <TagInput
                  value={keywords}
                  onChange={(tags) => {
                    setCustomized(prev => ({ ...prev, keywords: true }));
                    onKeywordsChange(tags);
                  }}
                  placeholder="Type keyword and press Enter or comma..."
                  description="Secondary keywords, technologies, and indexing taxonomy tags."
                />
              </div>
            )}
          </div>

          {/* FIELD 5: Canonical URL & Robots Directives */}
          <div className="p-4 rounded-xl border border-border/60 bg-surface-2/30 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-semibold mb-0">Canonical URL</FormLabel>
                {customized.canonicalUrl ? (
                  <button
                    type="button"
                    onClick={() => handleResetField('canonicalUrl')}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Auto
                  </button>
                ) : (
                  <span className="text-[9px] font-mono text-muted-foreground">Auto</span>
                )}
              </div>
              <InputBlock
                value={canonicalUrl}
                onChange={(e) => {
                  setCustomized(prev => ({ ...prev, canonicalUrl: true }));
                  if (onCanonicalUrlChange) onCanonicalUrlChange(e.target.value);
                }}
                placeholder={autoCanonicalUrl}
                description="Authoritative master URL preventing duplicate content penalties."
              />
            </div>

            {/* Robots Toggles (Index/Noindex, Follow/Nofollow) */}
            <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-1 border border-border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    {noIndex ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Robots: {noIndex ? 'noindex' : 'index'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {noIndex ? 'Hidden from search engines' : 'Allow search engine indexing'}
                  </p>
                </div>
                {onNoIndexChange && (
                  <Switch
                    checked={!noIndex}
                    onCheckedChange={(checked) => onNoIndexChange(!checked)}
                    aria-label="Toggle indexing"
                  />
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-1 border border-border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Robots: {noFollow ? 'nofollow' : 'follow'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {noFollow ? 'Do not follow links on page' : 'Allow crawlers to follow links'}
                  </p>
                </div>
                {onNoFollowChange && (
                  <Switch
                    checked={!noFollow}
                    onCheckedChange={(checked) => onNoFollowChange(!checked)}
                    aria-label="Toggle link following"
                  />
                )}
              </div>
            </div>
          </div>

          {/* FIELD 6: Open Graph Social Card Image & Alt Text */}
          {onOgImageChange && (
            <div className="p-4 rounded-xl border border-border/60 bg-surface-2/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-xs font-semibold flex items-center gap-1.5 mb-0">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" /> Open Graph Social Card Image (OG Image)
                  </FormLabel>
                  {customized.ogImage ? (
                    <button
                      type="button"
                      onClick={() => handleResetField('ogImage')}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Auto
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-muted-foreground">Auto</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">1200x630 recommended</span>
              </div>

              <ImageInput
                value={ogImage || null}
                onChange={(val) => {
                  setCustomized(prev => ({ ...prev, ogImage: true }));
                  onOgImageChange(val);
                }}
                description="Visual preview when shared on LinkedIn, Facebook, Slack, and Discord."
              />

              {/* Alt Text for OG Image */}
              {onOgImageAltChange && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold mb-0">OG Image Alt Text</FormLabel>
                    {customized.ogImageAlt ? (
                      <button
                        type="button"
                        onClick={() => handleResetField('ogImageAlt')}
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Auto
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono text-muted-foreground">Auto</span>
                    )}
                  </div>
                  <InputBlock
                    value={ogImageAlt}
                    onChange={(e) => {
                      setCustomized(prev => ({ ...prev, ogImageAlt: true }));
                      onOgImageAltChange(e.target.value);
                    }}
                    placeholder={autoOgImageAlt || "Descriptive visual alt text"}
                    description="Screen reader and crawler text describing the social share image."
                  />
                </div>
              )}
            </div>
          )}

          {/* FIELD 7: Twitter / X Card Configuration */}
          <div className="p-4 rounded-xl border border-border/60 bg-surface-2/30 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FormLabel className="text-xs font-semibold flex items-center gap-1.5 mb-0">
                  <Share2 className="w-3.5 h-3.5 text-primary" /> Twitter / X Card Settings
                </FormLabel>
              </div>

              {/* Card Type Selection */}
              {onTwitterCardTypeChange && (
                <div className="inline-flex p-0.5 rounded-lg bg-surface-1 border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => onTwitterCardTypeChange('summary_large_image')}
                    className={cn(
                      "px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors text-[11px]",
                      twitterCardType === 'summary_large_image' 
                        ? "bg-primary text-primary-foreground shadow-2xs" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Large Image
                  </button>
                  <button
                    type="button"
                    onClick={() => onTwitterCardTypeChange('summary')}
                    className={cn(
                      "px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors text-[11px]",
                      twitterCardType === 'summary' 
                        ? "bg-primary text-primary-foreground shadow-2xs" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Summary
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              By default, Twitter / X cards inherit title, description, and image from Open Graph metadata.
            </p>

            {/* Overrides Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTwitterOverrides(!showTwitterOverrides)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>{showTwitterOverrides ? 'Hide Twitter Card Overrides' : 'Customize Twitter Card Overrides (Optional)'}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", showTwitterOverrides && "rotate-180")} />
              </button>

              {showTwitterOverrides && (
                <div className="space-y-3 pt-3 mt-2 border-t border-border/40 animate-in fade-in duration-150">
                  {onTwitterTitleChange && (
                    <InputBlock
                      label="Twitter Card Title Override"
                      value={twitterTitle}
                      onChange={(e) => {
                        setCustomized(prev => ({ ...prev, twitterTitle: true }));
                        onTwitterTitleChange(e.target.value);
                      }}
                      placeholder={effectiveTitle}
                      description="Leave blank to inherit primary Meta Title."
                    />
                  )}

                  {onTwitterDescriptionChange && (
                    <TextareaBlock
                      label="Twitter Card Description Override"
                      value={twitterDescription}
                      onChange={(e) => {
                        setCustomized(prev => ({ ...prev, twitterDescription: true }));
                        onTwitterDescriptionChange(e.target.value);
                      }}
                      rows={2}
                      placeholder={effectiveDescription}
                      description="Leave blank to inherit primary Meta Description."
                    />
                  )}

                  {onTwitterImageChange && (
                    <div className="space-y-1">
                      <FormLabel className="text-xs font-semibold">Twitter Card Image Override</FormLabel>
                      <ImageInput
                        value={twitterImage || null}
                        onChange={(val) => {
                          setCustomized(prev => ({ ...prev, twitterImage: true }));
                          onTwitterImageChange(val);
                        }}
                        description="Leave blank to inherit primary Open Graph image."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* FIELD 8: Schema.org Structured Data (JSON-LD) Toggle */}
          {onEnableStructuredDataChange && (
            <div className="p-4 rounded-xl border border-border/60 bg-surface-2/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Code className="w-3.5 h-3.5 text-primary" />
                  <span>Schema.org Structured Data (JSON-LD)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Auto-generate rich search engine snippets as Schema.org {type} model.
                </p>
              </div>

              <Switch
                checked={enableStructuredData}
                onCheckedChange={onEnableStructuredDataChange}
                aria-label="Toggle structured data"
              />
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: LIVE PREVIEWS (lg:col-span-5)                  */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
          {/* 1. Google Search Result Snippet Preview Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-border shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Search className="w-3.5 h-3.5 text-primary" />
                <span>Google Search Snippet Preview</span>
              </div>

              {/* Desktop / Mobile Toggle */}
              <div className="inline-flex p-0.5 rounded-lg bg-surface-2 border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setDevicePreview('desktop')}
                  className={cn(
                    "p-1 rounded font-semibold cursor-pointer transition-colors flex items-center gap-1 text-[11px]",
                    devicePreview === 'desktop' 
                      ? "bg-primary text-primary-foreground shadow-2xs" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevicePreview('mobile')}
                  className={cn(
                    "p-1 rounded font-semibold cursor-pointer transition-colors flex items-center gap-1 text-[11px]",
                    devicePreview === 'mobile' 
                      ? "bg-primary text-primary-foreground shadow-2xs" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Snippet Frame */}
            {devicePreview === 'desktop' ? (
              // DESKTOP VIEW
              <div className="p-4 rounded-xl bg-background border border-border/80 space-y-1.5 font-sans text-left shadow-2xs">
                {/* Breadcrumb URL line */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                  <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                    W
                  </span>
                  <span className="truncate">wisebyteconcepts.com &rsaquo; {pathPrefix} &rsaquo; {effectiveSlug}</span>
                </div>

                {/* Clickable Blue Headline */}
                <h4 className="text-base font-semibold text-blue-500 hover:underline cursor-pointer truncate leading-snug">
                  {effectiveTitle}
                </h4>

                {/* Description snippet */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {effectiveDescription}
                </p>

                {noIndex && (
                  <div className="pt-1.5 text-[10px] text-amber-500 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Notice: Page has noindex directive enabled
                  </div>
                )}
              </div>
            ) : (
              // MOBILE VIEW
              <div className="p-3.5 rounded-2xl bg-background border border-border/80 space-y-2 font-sans text-left shadow-2xs max-w-sm mx-auto">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                    W
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-foreground truncate">{BRAND_NAME}</div>
                    <div className="text-[10px] text-muted-foreground truncate">https://wisebyteconcepts.com &rsaquo; {pathPrefix}</div>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-blue-500 line-clamp-2 leading-snug">
                  {effectiveTitle}
                </h4>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {effectiveDescription}
                </p>
              </div>
            )}
          </div>

          {/* 2. Social Share Card Preview (Facebook/LinkedIn OG vs Twitter/X) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-border shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Share2 className="w-3.5 h-3.5 text-primary" />
                <span>Social Share Card Preview</span>
              </div>

              {/* Sub-tab: OpenGraph vs Twitter */}
              <div className="inline-flex p-0.5 rounded-lg bg-surface-2 border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setSocialPreviewTab('og')}
                  className={cn(
                    "px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors text-[11px]",
                    socialPreviewTab === 'og' 
                      ? "bg-primary text-primary-foreground shadow-2xs" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Open Graph
                </button>
                <button
                  type="button"
                  onClick={() => setSocialPreviewTab('twitter')}
                  className={cn(
                    "px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors text-[11px]",
                    socialPreviewTab === 'twitter' 
                      ? "bg-primary text-primary-foreground shadow-2xs" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Twitter / X
                </button>
              </div>
            </div>

            {/* Social Card Frame */}
            {socialPreviewTab === 'og' ? (
              // OPEN GRAPH CARD (Facebook / LinkedIn / Slack)
              <div className="rounded-xl overflow-hidden bg-background border border-border shadow-2xs">
                <div className="aspect-[1.91/1] w-full bg-surface-3 relative overflow-hidden flex items-center justify-center">
                  {effectiveOgImage ? (
                    <img 
                      src={effectiveOgImage} 
                      alt={ogImageAlt || effectiveTitle} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
                      <ImageIcon className="w-6 h-6 opacity-40" />
                      <span>1200 x 630 Social Image Placeholder</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white/90">
                    1200 &times; 630
                  </span>
                </div>

                <div className="p-3.5 space-y-1 bg-surface-2/60 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                      WISEBYTECONCEPTS.COM
                    </span>
                    {sourceAmount !== undefined && sourceAmount > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {formatCurrency(sourceAmount, sourceCurrency)}
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-foreground line-clamp-1 leading-snug">
                    {effectiveTitle}
                  </h5>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {effectiveDescription}
                  </p>
                </div>
              </div>
            ) : (
              // TWITTER / X CARD
              <div className="space-y-1.5">
                {twitterCardType === 'summary_large_image' ? (
                  <div className="rounded-2xl overflow-hidden bg-background border border-border shadow-2xs">
                    <div className="aspect-[16/9] w-full bg-surface-3 relative overflow-hidden flex items-center justify-center">
                      {effectiveTwitterImage ? (
                        <img 
                          src={effectiveTwitterImage} 
                          alt="Twitter Preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
                          <ImageIcon className="w-6 h-6 opacity-40" />
                          <span>Summary Large Image</span>
                        </div>
                      )}
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white/90">
                        summary_large_image
                      </span>
                    </div>

                    <div className="p-3 space-y-1 bg-surface-2/40 border-t border-border/60">
                      <h5 className="text-xs font-bold text-foreground line-clamp-1">
                        {effectiveTwitterTitle}
                      </h5>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {effectiveTwitterDescription}
                      </p>
                      <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> wisebyteconcepts.com
                        </span>
                        {sourceAmount !== undefined && sourceAmount > 0 && (
                          <span className="font-mono font-bold text-emerald-400">
                            {formatCurrency(sourceAmount, sourceCurrency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Summary Small Thumbnail
                  <div className="p-2.5 rounded-2xl bg-background border border-border shadow-2xs flex items-center gap-3">
                    <div className="w-20 h-20 rounded-xl bg-surface-3 shrink-0 overflow-hidden relative flex items-center justify-center">
                      {effectiveTwitterImage ? (
                        <img 
                          src={effectiveTwitterImage} 
                          alt="Twitter Thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground opacity-50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span className="text-[9px] text-muted-foreground block truncate">wisebyteconcepts.com</span>
                      <h5 className="text-xs font-bold text-foreground line-clamp-1">{effectiveTwitterTitle}</h5>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{effectiveTwitterDescription}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Schema.org Structured Data (JSON-LD) Preview */}
          {enableStructuredData && (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-border shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Code className="w-3.5 h-3.5 text-primary" />
                  <span>Structured Data JSON-LD ({type})</span>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyJson}
                  className="h-7 text-xs gap-1 border-border bg-surface-2"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <pre className="p-3 text-[11px] font-mono text-foreground/90 bg-background rounded-xl border border-border overflow-x-auto max-h-48 leading-relaxed custom-scrollbar">
                {structuredDataJson}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeoFields;
