import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Package, 
  X, 
  Sparkles,
  DollarSign,
  Maximize2,
  ShoppingBag
} from 'lucide-react';
import { useAppStore } from '@/store';
import { 
  formatServicePrice, 
  formatServicePricingDetails, 
  normalizeCurrencyCode 
} from '@/utils/currency';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MarkdownContent } from '@/components/ui/MarkdownEditor';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const services = useAppStore((state) => state.services);
  const products = useAppStore((state) => state.products);
  const isLoaded = useAppStore((state) => state.isLoaded);
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = Boolean(isAuthenticated && user);

  // Match service by ID or Slug (case-insensitive)
  const service = useMemo(() => {
    if (!id) return undefined;
    const cleanId = id.trim().toLowerCase();
    return services.find(
      (s) => s.id === id || s.slug === id || (s.slug && s.slug.toLowerCase() === cleanId)
    );
  }, [services, id]);

  const isVisible = Boolean(service && (service.active !== false || isAdmin));

  // State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Gallery items (clean list)
  const galleryImages = useMemo(() => {
    if (!service || !Array.isArray(service.gallery)) return [];
    return service.gallery.filter((img) => typeof img === 'string' && img.trim().length > 0);
  }, [service]);

  // Related projects (linked directly or sharing category, only if any exist)
  const relatedProjects = useMemo(() => {
    if (!service) return [];
    const serviceId = service.id;
    const serviceCat = service.category ? service.category.trim().toLowerCase() : '';
    const directLinkedIds = new Set(Array.isArray(service.relatedProjects) ? service.relatedProjects : []);

    return products
      .filter((p) => {
        if (p.active === false && !isAdmin) return false;
        if (p.isActive === false && !isAdmin) return false;

        if (directLinkedIds.has(p.id)) return true;
        if (p.parentService === serviceId || p.serviceId === serviceId) return true;
        if (serviceCat && p.category && p.category.trim().toLowerCase() === serviceCat) return true;

        return false;
      })
      .slice(0, 3);
  }, [service, products, isAdmin]);

  // Related services (same category, only if any exist)
  const relatedServices = useMemo(() => {
    if (!service || !service.category) return [];
    const cat = service.category.trim().toLowerCase();
    return services
      .filter(
        (s) =>
          s.id !== service.id &&
          s.category &&
          s.category.trim().toLowerCase() === cat &&
          (s.active !== false || isAdmin)
      )
      .slice(0, 3);
  }, [services, service, isAdmin]);

  // Hero assets
  const title = service?.title || service?.name || 'Untitled Service';
  const bannerImg = service?.bannerPicture || service?.displayPicture || service?.bannerImage || service?.thumbnail;
  const shortDesc = service?.shortDescription || service?.caption || '';
  const fullDesc = service?.fullDescription || service?.description || shortDesc;

  // Pricing formatting helper
  const pricingInfo = useMemo(() => {
    return formatServicePricingDetails(service);
  }, [service]);

  // Duration formatting helper
  const durationInfo = useMemo(() => {
    if (!service?.deliveredWithin) return null;
    if (service.deliveredWithin.unit === 'Depends Upon Project') {
      return 'Depends on project scope';
    }
    const range = service.deliveredWithin.range ? `${service.deliveredWithin.range} ` : '';
    const unit = service.deliveredWithin.unit || '';
    if (!range && !unit) return null;
    return `${range}${unit}`.trim();
  }, [service]);

  // Primary CTA details
  const ctaButtonText = service?.ctaButtonText || 'Get this service';
  const ctaButtonLink = service?.ctaButtonLink || '/contact';

  const handleCtaClick = () => {
    if (ctaButtonLink.startsWith('http://') || ctaButtonLink.startsWith('https://')) {
      window.open(ctaButtonLink, '_blank', 'noopener,noreferrer');
    } else {
      navigate(ctaButtonLink);
    }
  };

  // Bottom CTA details (Heading and Button)
  const serviceAny = service as any;
  const bottomCtaHeading = (serviceAny?.ctaHeading || service?.ctaText || '').trim();
  const bottomCtaSubtext = (serviceAny?.ctaHeading && service?.ctaText && serviceAny.ctaHeading.trim() !== service.ctaText.trim())
    ? service.ctaText.trim()
    : '';
  const bottomCtaButtonText = (service?.ctaButtonText || '').trim();
  const bottomCtaButtonLink = (service?.ctaButtonLink || '').trim();

  const handleBottomCtaClick = () => {
    if (!bottomCtaButtonLink) return;
    if (bottomCtaButtonLink.startsWith('http://') || bottomCtaButtonLink.startsWith('https://')) {
      window.open(bottomCtaButtonLink, '_blank', 'noopener,noreferrer');
    } else {
      navigate(bottomCtaButtonLink);
    }
  };

  const hasBottomCta = Boolean(bottomCtaHeading || bottomCtaButtonText);

  // SEO & Head Metadata Dynamic Wiring
  useEffect(() => {
    if (!service) return;

    const brandName = 'Wise Byte Concepts';
    const baseUrl = window.location.origin;
    const pageUrl = service.canonicalUrl || `${baseUrl}/services/${service.slug || service.id}`;

    // 1. Page Title
    const metaTitle = service.metaTitle || `${title} | ${brandName}`;
    const prevTitle = document.title;
    document.title = metaTitle;

    // Helper to safely set meta tag
    const setMetaTag = (attrName: string, attrVal: string, contentVal: string) => {
      let tag = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attrName, attrVal);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', contentVal);
    };

    // 2. Meta Description
    const metaDesc = service.metaDescription || shortDesc || '';
    if (metaDesc) {
      setMetaTag('name', 'description', metaDesc);
    }

    // 3. Robots Directives
    const robotsContent = `${service.noIndex ? 'noindex' : 'index'}, ${service.noFollow ? 'nofollow' : 'follow'}`;
    setMetaTag('name', 'robots', robotsContent);

    // 4. OpenGraph Tags
    setMetaTag('property', 'og:title', metaTitle);
    if (metaDesc) setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:url', pageUrl);
    setMetaTag('property', 'og:type', 'website');
    const ogImg = service.ogImage || service.displayPicture || bannerImg;
    if (ogImg) setMetaTag('property', 'og:image', ogImg);

    // 5. Twitter Tags
    setMetaTag('name', 'twitter:card', service.twitterCardType || 'summary_large_image');
    setMetaTag('name', 'twitter:title', service.twitterTitle || metaTitle);
    if (service.twitterDescription || metaDesc) {
      setMetaTag('name', 'twitter:description', service.twitterDescription || metaDesc);
    }
    const twImg = service.twitterImage || ogImg;
    if (twImg) setMetaTag('name', 'twitter:image', twImg);

    // 6. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', pageUrl);

    // 7. Schema.org Structured Data (JSON-LD)
    let jsonLdScript = document.getElementById('service-structured-data') as HTMLScriptElement | null;
    if (service.enableStructuredData !== false) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'service-structured-data';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      const structuredData: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: metaTitle,
        description: metaDesc,
        url: pageUrl,
        provider: {
          '@type': 'Organization',
          name: brandName,
          url: baseUrl,
        },
      };
      if (service.category) structuredData.serviceType = service.category;
      if (ogImg) structuredData.image = ogImg;
      if (service.amount !== undefined) {
        structuredData.offers = {
          '@type': 'Offer',
          price: String(service.amount),
          priceCurrency: normalizeCurrencyCode(service.currency),
        };
      }
      jsonLdScript.text = JSON.stringify(structuredData);
    }

    return () => {
      document.title = prevTitle;
      const script = document.getElementById('service-structured-data');
      if (script) script.remove();
    };
  }, [service, title, shortDesc, bannerImg]);

  // Lightbox keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % galleryImages.length : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0
        );
      }
    },
    [lightboxIndex, galleryImages.length]
  );

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, handleKeyDown]);

  // Loading skeleton state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-muted/40 rounded-lg" />
        <div className="h-72 w-full bg-muted/30 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-muted/20 rounded-2xl" />
          <div className="h-28 bg-muted/20 rounded-2xl" />
          <div className="h-28 bg-muted/20 rounded-2xl" />
        </div>
        <div className="h-96 w-full bg-muted/20 rounded-3xl" />
      </div>
    );
  }

  // Service Not Found state
  if (!service || !isVisible) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-glow-sm">
          <Briefcase className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
          Service Not Found
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
          The requested service is currently unavailable or has been archived. Explore our current catalog of technical solutions.
        </p>
        <Button 
          variant="primary" 
          onClick={() => navigate('/services')}
          className="gap-2 px-6 h-11 rounded-xl shadow-xs cursor-pointer font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Services</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-20">
      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="relative pt-24 pb-14 md:pt-28 md:pb-20 overflow-hidden border-b border-border/50 bg-gradient-to-b from-surface-1/80 via-background to-background">
        {/* Ambient Banner Backdrop */}
        {bannerImg && (
          <div className="absolute inset-0 -z-10 opacity-15 overflow-hidden">
            <img 
              src={bannerImg} 
              alt={title} 
              className="w-full h-full object-cover blur-md scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <Link
            to="/services"
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" />
            <span>All Services</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl space-y-5">
              {/* Badges: Category & Status */}
              <div className="flex flex-wrap items-center gap-2.5">
                {service.category && (
                  <Badge 
                    variant="outline" 
                    className="px-3 py-1 text-xs font-bold tracking-wide uppercase rounded-full bg-primary/10 text-primary border-primary/20"
                  >
                    {service.category}
                  </Badge>
                )}

                {!service.active && (
                  <Badge 
                    variant="outline" 
                    className="px-2.5 py-0.5 text-[11px] font-mono rounded-md bg-amber-500/10 text-amber-400 border-amber-500/30"
                  >
                    Admin Preview (Inactive)
                  </Badge>
                )}

                {service.featured && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> Featured
                  </span>
                )}
              </div>

              {/* Title & Short Description */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                  {title}
                </h1>
                {shortDesc && (
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal">
                    {shortDesc}
                  </p>
                )}
              </div>

              {/* Hero CTA Button */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  onClick={handleCtaClick}
                  className="rounded-xl px-7 h-12 text-sm font-bold shadow-glow-primary gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span>{ctaButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Display Picture Preview Asset */}
            {bannerImg && (
              <div className="lg:w-96 shrink-0">
                <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-surface-2 shadow-xl aspect-video lg:aspect-[4/3] group">
                  <img
                    src={bannerImg}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs text-white/90 font-medium">{title}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. KEY INFO BAR                                              */}
      {/* ============================================================ */}
      {(pricingInfo || durationInfo || service.category) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* 1. Price Card */}
            {pricingInfo && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-1/95 backdrop-blur-md border border-border shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                    {pricingInfo.typeLabel}
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-foreground truncate mt-0.5">
                    {pricingInfo.price}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Duration Card */}
            {durationInfo && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-1/95 backdrop-blur-md border border-border shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                    Delivery Timeline
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-foreground truncate mt-0.5">
                    {durationInfo}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Category Card */}
            {service.category && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-1/95 backdrop-blur-md border border-border shadow-lg flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                    Category Domain
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-foreground truncate mt-0.5">
                    {service.category}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* MAIN TWO-COLUMN BODY (Content on Left, Sticky Sidebar Right)  */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* LEFT COLUMN: OVERVIEW, FEATURES, DELIVERABLES, GALLERY (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-12">
            {/* ============================================================ */}
            {/* 3. OVERVIEW SECTION (Always Full Description, Line Breaks)    */}
            {/* ============================================================ */}
            {fullDesc.trim().length > 0 && (
              <section className="space-y-4">
                <div className="pb-2 border-b border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
                    <span>Service Overview</span>
                  </h2>
                </div>

                <div className="rounded-2xl bg-surface-1 border border-border p-6 sm:p-8 shadow-xs leading-relaxed">
                  <MarkdownContent content={fullDesc} />
                </div>
              </section>
            )}

            {/* ============================================================ */}
            {/* 4. CORE FEATURES SECTION (2-Column Grid Cards)                */}
            {/* ============================================================ */}
            {Array.isArray(service.coreFeatures) && service.coreFeatures.length > 0 && (
              <section className="space-y-4">
                <div className="pb-2 border-b border-border/50 flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
                    <span>Core Features</span>
                  </h2>
                  <span className="text-xs font-mono text-muted-foreground">
                    {service.coreFeatures.length} {service.coreFeatures.length === 1 ? 'feature' : 'features'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.coreFeatures.map((feat, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-surface-1/90 p-5 sm:p-6 shadow-2xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-start space-y-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                          <Icon 
                            value={feat.icon} 
                            fallback={CheckCircle2} 
                            className="w-5 h-5 text-primary" 
                          />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                          {feat.title}
                        </h3>
                      </div>

                      {feat.description && (
                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                          <MarkdownContent content={feat.description} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ============================================================ */}
            {/* 5. DELIVERABLES SECTION (2-Column Grid Cards)                 */}
            {/* ============================================================ */}
            {Array.isArray(service.deliverables) && service.deliverables.length > 0 && (
              <section className="space-y-4">
                <div className="pb-2 border-b border-border/50 flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
                    <span>What You Receive (Deliverables)</span>
                  </h2>
                  <span className="text-xs font-mono text-muted-foreground">
                    {service.deliverables.length} {service.deliverables.length === 1 ? 'deliverable' : 'deliverables'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.deliverables.map((deliv, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-surface-1/90 p-5 sm:p-6 shadow-2xs hover:border-accent/40 hover:shadow-md transition-all flex flex-col justify-start space-y-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-2xs">
                          <Icon 
                            value={deliv.icon} 
                            fallback={Package} 
                            className="w-5 h-5 text-accent" 
                          />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                          {deliv.title}
                        </h3>
                      </div>

                      {deliv.description && (
                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                          <MarkdownContent content={deliv.description} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ============================================================ */}
            {/* 6. GALLERY & LIGHTBOX SECTION                                */}
            {/* ============================================================ */}
            {galleryImages.length > 0 && (
              <section className="space-y-4">
                <div className="pb-2 border-b border-border/50 flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
                    <span>Service Visual Gallery</span>
                  </h2>
                  <span className="text-xs font-mono text-muted-foreground">
                    {galleryImages.length} {galleryImages.length === 1 ? 'image' : 'images'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-surface-2 border border-border cursor-pointer shadow-xs hover:border-primary/50 transition-all"
                    >
                      <img
                        src={imgUrl}
                        alt={`${title} gallery photo ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 scale-75 group-hover:scale-100 transition-transform">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ============================================================ */}
          {/* 7. STICKY SIDEBAR (DESKTOP: lg:col-span-4)                    */}
          {/* ============================================================ */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 self-start">
            <div className="rounded-3xl border border-border bg-surface-1/90 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6">
              {/* Header inside card */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-primary">
                  Ready to Start?
                </span>
                <h3 className="text-xl font-extrabold text-foreground leading-snug">
                  {title}
                </h3>
              </div>

              {/* Price Row */}
              {pricingInfo && (
                <div className="p-4 rounded-2xl bg-surface-2/80 border border-border/70 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {pricingInfo.typeLabel}
                  </span>
                  <div className="text-2xl font-black text-foreground">
                    {pricingInfo.price}
                  </div>
                </div>
              )}

              {/* Delivery timeline row */}
              {durationInfo && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Estimated delivery: <strong className="text-foreground">{durationInfo}</strong>
                  </span>
                </div>
              )}

              {/* Primary CTA */}
              <Button
                size="lg"
                onClick={handleCtaClick}
                className="w-full h-12 rounded-xl text-sm font-bold shadow-glow-primary gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <span>{ctaButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Service Assurance Badges */}
              <div className="pt-4 border-t border-border/40 space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Engineered with production-grade architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct architectural review & dedicated kickoff</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* ============================================================ */}
        {/* 8. RELATED PROJECTS SECTION (Only if any exist)               */}
        {/* ============================================================ */}
        {relatedProjects.length > 0 && (
          <section className="mt-20 pt-14 border-t border-border/60 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Related Projects & Case Studies
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Production systems, deliverables, and case studies aligned with this service.
                </p>
              </div>

              <Link
                to="/products"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>View all projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.map((proj) => {
                const projImg = proj.displayPicture || proj.bannerPicture || proj.imageUrl || (proj as any).thumbnail;
                const projTitle = proj.title || proj.name || 'Untitled Project';
                const projDesc = proj.shortDescription || proj.description || proj.caption || '';
                const projLink = `/products/${proj.slug || proj.id}`;

                return (
                  <Link
                    key={proj.id}
                    to={projLink}
                    className="group rounded-3xl border border-border bg-surface-1/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/40 transition-all flex flex-col cursor-pointer"
                  >
                    {/* Image Header */}
                    <div className="aspect-video relative overflow-hidden bg-surface-2">
                      {projImg ? (
                        <img
                          src={projImg}
                          alt={projTitle}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-3 text-muted-foreground">
                          <ShoppingBag className="w-10 h-10 opacity-30" />
                        </div>
                      )}
                      {proj.category && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/90 backdrop-blur-md text-foreground border border-border">
                          {proj.category}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {projTitle}
                        </h3>
                        {projDesc && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {projDesc}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                        <span className="text-primary font-semibold group-hover:underline inline-flex items-center gap-1 ml-auto">
                          View project <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 9. RELATED SERVICES SECTION (Only if any exist)               */}
        {/* ============================================================ */}
        {relatedServices.length > 0 && (
          <section className="mt-20 pt-14 border-t border-border/60 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Related Services in {service.category}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Complementary technical capabilities designed to scale your technical infrastructure.
                </p>
              </div>

              <Link
                to="/services"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>View all services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedServices.map((relSvc) => {
                const relImg = relSvc.bannerPicture || relSvc.displayPicture || relSvc.thumbnail;
                const relPrice = formatServicePrice(relSvc);

                return (
                  <Link
                    key={relSvc.id}
                    to={`/services/${relSvc.slug || relSvc.id}`}
                    className="group rounded-3xl border border-border bg-surface-1/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/40 transition-all flex flex-col cursor-pointer"
                  >
                    {/* Image Header */}
                    <div className="aspect-video relative overflow-hidden bg-surface-2">
                      {relImg ? (
                        <img
                          src={relImg}
                          alt={relSvc.title || relSvc.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-3 text-muted-foreground">
                          <Briefcase className="w-10 h-10 opacity-30" />
                        </div>
                      )}
                      {relSvc.category && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/90 backdrop-blur-md text-foreground border border-border">
                          {relSvc.category}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {relSvc.title || relSvc.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {relSvc.shortDescription || relSvc.caption}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                        {relPrice && (
                          <span className="font-extrabold text-foreground">
                            {relPrice}
                          </span>
                        )}
                        <span className="text-primary font-semibold group-hover:underline inline-flex items-center gap-1 ml-auto">
                          Learn more <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 10. BOTTOM CALL TO ACTION SECTION (Only if fields entered)   */}
        {/* ============================================================ */}
        {hasBottomCta && (
          <section className="mt-20 pt-10 border-t border-border/50">
            <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-surface-1 via-surface-2 to-primary/5 p-8 sm:p-12 md:p-16 text-center shadow-xl relative overflow-hidden">
              <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                {bottomCtaHeading && (
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                    {bottomCtaHeading}
                  </h2>
                )}
                {bottomCtaSubtext && (
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {bottomCtaSubtext}
                  </p>
                )}
                {bottomCtaButtonText && (
                  <div className="pt-2 flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleBottomCtaClick}
                      className="rounded-xl px-8 h-12 text-sm font-bold shadow-glow-primary gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <span>{bottomCtaButtonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            </div>
          </section>
        )}
      </div>

      {/* ============================================================ */}
      {/* 7b. STICKY MOBILE BOTTOM BAR (Always visible on mobile)      */}
      {/* ============================================================ */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-1/95 backdrop-blur-xl border-t border-border p-3.5 sm:p-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
        <div className="min-w-0 flex-1">
          {pricingInfo ? (
            <div className="truncate">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block leading-none">
                {pricingInfo.typeLabel}
              </span>
              <span className="text-base font-black text-foreground truncate block mt-0.5">
                {pricingInfo.price}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-foreground truncate block">
              {title}
            </span>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleCtaClick}
          className="rounded-xl px-5 h-10 text-xs font-bold shadow-glow-primary gap-1.5 shrink-0 cursor-pointer"
        >
          <span>{ctaButtonText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ============================================================ */}
      {/* LIGHTBOX MODAL DIALOG                                        */}
      {/* ============================================================ */}
      {lightboxIndex !== null && galleryImages[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close image lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Prev Button */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex(
                  (prev) => (prev !== null ? prev - 1 + galleryImages.length : 0) % galleryImages.length
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Lightbox Center Image */}
          <div className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center">
            <img
              src={galleryImages[lightboxIndex]}
              alt={`${title} gallery photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-3 text-center text-xs text-white/70 font-mono">
              {lightboxIndex + 1} of {galleryImages.length}
            </div>
          </div>

          {/* Navigation Next Button */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null ? (prev + 1) % galleryImages.length : 0))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceDetailPage;
