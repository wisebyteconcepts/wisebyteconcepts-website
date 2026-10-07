import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon, 
  DollarSign, 
  FileText, 
  Plus, 
  Layers, 
  Globe, 
  Target, 
  Eye
} from 'lucide-react';
import { Button } from '@/components/Button';
import { 
  InputBlock, 
  TextareaBlock, 
  SwitchBlock, 
  FormLabel 
} from '@/components/forms/FormControls';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { IconPicker } from '@/components/admin/IconPicker';
import { ImageInput } from '@/components/admin/ImageInput';
import { ImagesInput } from '@/components/admin/ImagesInput';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { TagInput } from '@/components/ui/TagInput';
import { TechStackForm } from '@/components/forms/TechStackForm';
import { TechStackIcon } from '@/components/TechStackIcon';
import { ReorderableCardList } from '@/components/forms/ReorderableCardList';
import { SeoFields } from '@/components/forms/SeoFields';
import { CtaSection } from '@/components/forms/CtaSection';
import { CreatableCategorySelect } from '@/components/forms/CreatableCategorySelect';
import { ImportTextModal } from '@/components/forms/ImportTextModal';
import { useAppStore } from '@/store';
import { useToastStore } from '@/store/toastStore';
import { 
  Service, 
  ServicePricingModel, 
  ServiceDeliveredUnit, 
  TechStack
} from '@/types';
import { 
  slugify, 
  DEFAULT_CURRENCIES, 
  normalizeService 
} from '@/utils/serviceMigration';
import { formatServicePrice } from '@/utils/currency';
import { cn } from '@/lib/utils';

const DELIVERED_UNITS: ServiceDeliveredUnit[] = ['Days', 'Weeks', 'Month', 'Depends Upon Project'];
const PRICING_MODELS: ServicePricingModel[] = ['Fixed', 'Starting At', 'Range', 'Custom Quote'];

const emptyService = (): Service => ({
  id: "",
  title: "",
  slug: "",
  caption: "",
  shortDescription: "",
  fullDescription: "",
  category: "Development",
  tags: [],
  active: true,
  featured: false,
  order: 0,

  iconType: "icon",
  icon: "Briefcase",
  iconImage: "",
  displayPicture: "",
  bannerPicture: "",
  gallery: [],

  coreFeatures: [
    { icon: "CheckCircle2", title: "Enterprise Architecture", description: "Engineered for high resilience, security, and scale" },
    { icon: "Sparkles", title: "Modern Technology Stack", description: "Built with industry-standard frameworks and reactive patterns" }
  ],
  deliverables: [
    { icon: "Package", title: "Production Deployment", description: "Fully deployed and optimized cloud infrastructure" },
    { icon: "Package", title: "Documentation & Codebase", description: "Comprehensive architectural handover and repository access" }
  ],
  deliveredWithin: {
    unit: "Weeks",
    range: "2–4"
  },

  pricingModel: "Starting At",
  currency: "USD ($)",
  amount: 1500,
  minAmount: undefined,
  maxAmount: undefined,

  ctaVisual: undefined,
  ctaText: "Ready to scale your technical infrastructure? Connect with our team to initiate your consultation.",
  ctaButtonText: "Schedule Consultation",
  ctaButtonLink: "/contact",

  techStacks: [],
  relatedProjects: [],

  metaTitle: "",
  metaDescription: "",
  keywords: [],
  focusKeyword: "",
  ogImage: "",
  ogImageAlt: "",
  canonicalUrl: "",
  noIndex: false,
  noFollow: false,
  twitterCardType: "summary_large_image",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  enableStructuredData: true,

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminServiceEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { 
    services, 
    products, 
    techStacks, 
    serviceCategories, 
    addService, 
    updateService, 
    updateProduct,
    addServiceCategory,
    addTechStack
  } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);

  const [form, setForm] = useState<Service>(emptyService());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modal "Add Tech Stack" state
  const [isAddTechStackOpen, setIsAddTechStackOpen] = useState(false);
  const [isSavingTechStack, setIsSavingTechStack] = useState(false);

  const handleApplyServiceImport = (imported: Partial<Service>) => {
    setForm((prev) => ({
      ...prev,
      ...imported,
      deliveredWithin: {
        ...prev.deliveredWithin,
        ...(imported.deliveredWithin || {}),
      },
      coreFeatures: imported.coreFeatures || prev.coreFeatures,
      deliverables: imported.deliverables || prev.deliverables,
    }));
    if (imported.slug) {
      setSlugCustomized(true);
    }
  };

  useEffect(() => {
    if (isEditing && id) {
      const existing = services.find((s) => s.id === id || s.slug === id);
      if (existing) {
        const linkedProjectIds = products
          .filter(p => (p.parentService || p.serviceId) === (existing.id || id))
          .map(p => p.id);
        const mergedProjects = Array.from(new Set([...(existing.relatedProjects || []), ...linkedProjectIds]));

        const normalized = normalizeService({
          ...existing,
          relatedProjects: mergedProjects,
        });
        setForm(normalized);
        setSlugCustomized(true);
      } else if (services.length > 0) {
        addToast("Service not found", "error");
        navigate("/admin/services");
      }
    }
  }, [id, isEditing, services, products, navigate, addToast]);

  const update = <K extends keyof Service>(key: K, val: Service[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => {
      const updated: Partial<Service> = { title: newTitle };
      if (!slugCustomized) {
        updated.slug = slugify(newTitle);
      }
      return { ...prev, ...updated };
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.title.trim()) {
      addToast("Title is required", "error");
      setActiveTab("content");
      return;
    }

    if (!form.displayPicture) {
      addToast("Display Picture is required under the Media tab", "error");
      setActiveTab("media");
      return;
    }

    const cleanSlug = form.slug.trim() || slugify(form.title) || `service-${Date.now()}`;
    const slugConflict = services.some(
      (s) => s.slug === cleanSlug && s.id !== (isEditing ? id : "")
    );
    if (slugConflict) {
      addToast(`Slug "${cleanSlug}" is already in use by another service. Please customize the slug.`, "error");
      setActiveTab("content");
      return;
    }

    const finalAmount = (form.pricingModel === 'Fixed' || form.pricingModel === 'Starting At') ? Number(form.amount) || 0 : undefined;
    const finalMinAmount = form.pricingModel === 'Range' ? Number(form.minAmount) || 0 : undefined;
    const finalMaxAmount = form.pricingModel === 'Range' ? Number(form.maxAmount) || 0 : undefined;
    const finalCurrency = form.pricingModel !== 'Custom Quote' ? (form.currency || "USD ($)") : undefined;

    const finalDeliveredWithin = {
      unit: form.deliveredWithin.unit,
      range: form.deliveredWithin.unit === 'Depends Upon Project' ? undefined : (form.deliveredWithin.range || "2–4")
    };

    const finalIcon = form.iconType === 'icon' ? (form.icon || 'Briefcase') : undefined;
    const finalIconImage = form.iconType === 'image' ? form.iconImage : undefined;

    const payload: Service = {
      ...form,
      id: isEditing ? (id as string) : `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: form.title.trim(),
      slug: cleanSlug,
      caption: form.caption?.trim() || "",
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      category: form.category.trim() || "Development",
      tags: form.tags || [],
      active: form.active,
      featured: form.featured,
      order: Number(form.order) || 0,

      iconType: form.iconType,
      icon: finalIcon,
      iconImage: finalIconImage,
      displayPicture: form.displayPicture,
      bannerPicture: form.bannerPicture || undefined,
      gallery: form.gallery || [],

      coreFeatures: form.coreFeatures || [],
      deliverables: form.deliverables || [],
      deliveredWithin: finalDeliveredWithin,

      pricingModel: form.pricingModel,
      currency: finalCurrency,
      amount: finalAmount,
      minAmount: finalMinAmount,
      maxAmount: finalMaxAmount,

      ctaVisual: form.ctaVisual,
      ctaText: form.ctaText?.trim() || "",
      ctaButtonText: form.ctaButtonText.trim() || "Contact Us",
      ctaButtonLink: form.ctaButtonLink.trim() || "/contact",

      techStacks: form.techStacks || [],
      relatedProjects: form.relatedProjects || [],

      metaTitle: form.metaTitle?.trim() || `${form.title.trim()} | Wise Byte Concepts`,
      metaDescription: form.metaDescription?.trim() || form.shortDescription.trim(),
      keywords: form.keywords || [],
      focusKeyword: form.focusKeyword?.trim() || undefined,
      ogImage: form.ogImage?.trim() || form.displayPicture || undefined,
      ogImageAlt: form.ogImageAlt?.trim() || undefined,
      canonicalUrl: form.canonicalUrl?.trim() || undefined,
      noIndex: Boolean(form.noIndex),
      noFollow: Boolean(form.noFollow),
      twitterCardType: form.twitterCardType || 'summary_large_image',
      twitterTitle: form.twitterTitle?.trim() || undefined,
      twitterDescription: form.twitterDescription?.trim() || undefined,
      twitterImage: form.twitterImage?.trim() || undefined,
      enableStructuredData: form.enableStructuredData !== false,

      name: form.title.trim(),
      header: form.title.trim(),
      thumbnail: form.displayPicture,
      bannerImage: form.bannerPicture || form.displayPicture,
      isActive: form.active,
      isFeatured: form.featured,
      features: (form.coreFeatures || []).map(f => f.title),
      technologies: form.techStacks || [],

      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateService(payload);
        const targetProjectIds = payload.relatedProjects || [];
        for (const p of products) {
          const isCurrentlyLinked = (p.parentService || p.serviceId) === payload.id;
          const shouldBeLinked = targetProjectIds.includes(p.id);
          if (shouldBeLinked && !isCurrentlyLinked) {
            await updateProduct({ ...p, parentService: payload.id, serviceId: payload.id });
          } else if (!shouldBeLinked && isCurrentlyLinked) {
            await updateProduct({ ...p, parentService: '', serviceId: '' });
          }
        }
        addToast("Service updated successfully", "success");
      } else {
        await addService(payload);
        const targetProjectIds = payload.relatedProjects || [];
        for (const p of products) {
          if (targetProjectIds.includes(p.id)) {
            await updateProduct({ ...p, parentService: payload.id, serviceId: payload.id });
          }
        }
        addToast("Service created successfully", "success");
      }
      navigate("/admin/services");
    } catch (error: any) {
      addToast(error.message || "Failed to save service", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/admin/services" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Services</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">
              {isEditing ? "Edit Service" : "New Service"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-primary" />
            {isEditing ? form.title || "Edit Service" : "Register New Service"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
          <Link to="/admin/services">
            <Button variant="ghost" size="sm" type="button" className="rounded-xl cursor-pointer">
              Cancel
            </Button>
          </Link>
          {isEditing ? (
            <a 
              href={`/services/${(form.slug || id || '').toLowerCase()}`} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Open live Service Details page in another tab"
            >
              <Button variant="secondary" size="sm" type="button" className="rounded-xl gap-1.5 cursor-pointer hover:border-primary/50 text-foreground">
                <Eye className="w-3.5 h-3.5 text-primary" /> View Live Page
              </Button>
            </a>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              type="button" 
              disabled 
              title="Save service first to preview live page" 
              className="rounded-xl gap-1.5 opacity-50 cursor-not-allowed"
            >
              <Eye className="w-3.5 h-3.5" /> View Live Page
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-xl shadow-glow-primary gap-2 min-w-[130px] font-bold cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEditing ? "Save Changes" : "Create Service"}</span>
          </Button>
        </div>
      </div>

      {/* Main 7 Form Tabs (Entry Preview removed per Requirement 3) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="w-full overflow-x-auto py-0.5 hide-scrollbar">
          <TabsList className="bg-surface-2 p-1 rounded-2xl border border-border inline-flex h-auto max-h-none gap-1">
            <TabsTrigger value="content" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <FileText className="w-3.5 h-3.5" /> Content
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <ImageIcon className="w-3.5 h-3.5" /> Media
            </TabsTrigger>
            <TabsTrigger value="value" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Sparkles className="w-3.5 h-3.5" /> Features & Deliverables
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <DollarSign className="w-3.5 h-3.5" /> Pricing
            </TabsTrigger>
            <TabsTrigger value="cta" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Target className="w-3.5 h-3.5" /> Call to Action
            </TabsTrigger>
            <TabsTrigger value="tech" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Layers className="w-3.5 h-3.5" /> Tech Used
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Globe className="w-3.5 h-3.5" /> SEO
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: CONTENT */}
        <TabsContent value="content" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Service Content & Identity</h2>
              <p className="text-xs text-muted-foreground">Define title, unique slug, descriptive text, taxonomy, and visibility status.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="gap-1.5 self-start sm:self-auto shrink-0 h-8 px-3 rounded-xl border-border bg-surface-2 hover:bg-surface-3 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Import from text</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputBlock
              label="Title"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Enterprise Full-Stack Engineering"
              required
              description="Primary name displayed across public service catalogs."
            />

            <InputBlock
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugCustomized(true);
                update("slug", slugify(e.target.value));
              }}
              placeholder="e.g. enterprise-fullstack-engineering"
              required
              description={`URL: /services/${form.slug || '...'}`}
            />
          </div>

          <InputBlock
            label="Caption (Short Sub-heading)"
            value={form.caption || ""}
            onChange={(e) => update("caption", e.target.value)}
            placeholder="e.g. High-throughput distributed web systems with resilient architecture"
            description="One-sentence impact tagline displayed beneath the title."
          />

          <TextareaBlock
            label="Short Description"
            value={form.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            rows={2}
            placeholder="Concise overview for service cards and catalog preview listings..."
            required
            description="Used on catalog cards, preview summaries, and search snippets."
          />

          <div className="space-y-2">
            <FormLabel required className="text-xs font-semibold">Full Description & Technical Architecture</FormLabel>
            <MarkdownEditor
              value={form.fullDescription}
              onChange={(val) => update("fullDescription", val)}
              placeholder="Comprehensive architectural write-up with Markdown headers, bullet points, checklists, and code snippets..."
              minHeight="240px"
            />
            <p className="text-[11px] text-muted-foreground">Supports full Markdown syntax.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Creatable Category Select (Requirement 7) */}
            <CreatableCategorySelect
              value={form.category}
              onChange={(cat) => update("category", cat)}
              categories={serviceCategories}
              onCreateCategory={addServiceCategory}
              label="Service Category"
              required
            />

            <TagInput
              label="Tags"
              description="Search tags and capability keywords. Type and press comma or enter."
              value={form.tags}
              onChange={(tags) => update("tags", tags)}
              placeholder="web, enterprise, react, scaling..."
            />
          </div>

          {/* Status (Display Order removed per Requirement 2) */}
          <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SwitchBlock
              label="Active Status"
              description="Make visible on public site (inactive services are hidden)."
              checked={form.active}
              onCheckedChange={(val) => update("active", val)}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />

            <SwitchBlock
              label="Featured on Homepage"
              description="Highlight this service in the homepage spotlight section."
              checked={form.featured}
              onCheckedChange={(val) => update("featured", val)}
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            />
          </div>
        </TabsContent>

        {/* TAB 2: MEDIA */}
        <TabsContent value="media" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Media Assets & Visual Identity</h2>
            <p className="text-xs text-muted-foreground">Configure the visual symbol (Icon or Image badge), display picture, hero banner, and showcase gallery.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-text-primary block">
              Icon Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 max-w-xs gap-2 p-1 bg-surface-2 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => update("iconType", "icon")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  form.iconType === 'icon'
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Icon Picker</span>
              </button>

              <button
                type="button"
                onClick={() => update("iconType", "image")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  form.iconType === 'image'
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
                )}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Custom Image</span>
              </button>
            </div>

            {form.iconType === 'icon' ? (
              <div className="p-4 rounded-xl bg-surface-1 border border-border">
                <IconPicker
                  label="Service Icon"
                  value={form.icon || "Briefcase"}
                  onChange={(val) => update("icon", val)}
                  required
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-1 border border-border">
                <ImageInput
                  label="Service Badge Image"
                  value={form.iconImage || null}
                  onChange={(val) => update("iconImage", val || "")}
                  required
                  description="Optimized square badge icon (SVG, PNG, or WebP recommended)."
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <FormLabel required className="text-xs font-semibold">Display Picture (Hero Thumbnail)</FormLabel>
            <ImageInput
              value={form.displayPicture}
              onChange={(val) => update("displayPicture", val || "")}
              required
              description="Primary image used on service cards, index showcases, and preview grids."
            />
          </div>

          <div className="space-y-2">
            <FormLabel className="text-xs font-semibold">Hero Banner (Optional Header Panorama)</FormLabel>
            <ImageInput
              value={form.bannerPicture || null}
              onChange={(val) => update("bannerPicture", val || "")}
              description="High-resolution panoramic banner displayed on top of the dedicated service detail page."
            />
          </div>

          <div className="space-y-2">
            <FormLabel className="text-xs font-semibold">Service Showcase Gallery (Optional)</FormLabel>
            <ImagesInput
              value={form.gallery || []}
              onChange={(imgs) => update("gallery", imgs)}
              description="Multi-asset visual gallery highlighting screenshots, workflow diagrams, or deliverables."
            />
          </div>
        </TabsContent>

        {/* TAB 3: FEATURES & DELIVERABLES (Requirement 1: Two cards side by side, quick-add, drag-drop) */}
        <TabsContent value="value" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Features & Deliverables</h2>
            <p className="text-xs text-muted-foreground">Define key capabilities, technical deliverables, and project turnaround timeframe.</p>
          </div>

          {/* Two cards side by side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ReorderableCardList
              title="Core Features"
              helperText="Key capabilities and architectural strengths included in this service."
              items={form.coreFeatures}
              onChange={(features) => update("coreFeatures", features)}
              defaultIcon="CheckCircle2"
              quickAddPlaceholder="Add a feature and press Enter (or paste multiple)..."
            />

            <ReorderableCardList
              title="Tangible Deliverables"
              helperText="Tangible artifacts, documentation, and assets handed over to the client."
              items={form.deliverables}
              onChange={(delivs) => update("deliverables", delivs)}
              defaultIcon="Package"
              quickAddPlaceholder="Add a deliverable and press Enter (or paste multiple)..."
            />
          </div>

          {/* Delivery Timeframe */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-border space-y-4">
            <div className="pb-2 border-b border-border/30">
              <FormLabel className="text-sm font-semibold">Delivery Timeframe (Delivered Within)</FormLabel>
              <p className="text-xs text-muted-foreground">Select unit and turnaround duration.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1.5">Timeframe Unit</label>
                <div className="relative">
                  <select
                    value={form.deliveredWithin.unit}
                    onChange={(e) => {
                      const newUnit = e.target.value as ServiceDeliveredUnit;
                      update('deliveredWithin', {
                        unit: newUnit,
                        range: newUnit === 'Depends Upon Project' ? undefined : (form.deliveredWithin.range || '2–4')
                      });
                    }}
                    className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  >
                    {DELIVERED_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.deliveredWithin.unit !== 'Depends Upon Project' && (
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">Estimated Duration / Range</label>
                  <input
                    type="text"
                    value={form.deliveredWithin.range || ''}
                    onChange={(e) => update('deliveredWithin', { ...form.deliveredWithin, range: e.target.value })}
                    placeholder="e.g. 2–4, 4–8, 10–15"
                    className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                    Estimated turnaround: {form.deliveredWithin.range || 'N/A'} {form.deliveredWithin.unit}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: PRICING */}
        <TabsContent value="pricing" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Pricing & Commercial Model</h2>
            <p className="text-xs text-muted-foreground">Select pricing structure (Fixed, Starting At, Range, or Custom Quote) and configure amounts.</p>
          </div>

          <div>
            <FormLabel required className="text-xs font-semibold">Pricing Model</FormLabel>
            <div className="relative mt-1.5 max-w-sm">
              <select
                value={form.pricingModel}
                onChange={(e) => update("pricingModel", e.target.value as ServicePricingModel)}
                className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
              >
                {PRICING_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {form.pricingModel === 'Custom Quote' ? (
            <div className="p-5 rounded-2xl bg-surface-2 border border-primary/20 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-primary mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Custom Proposal / Tailored Quote</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No fixed numeric rate will be published. Visitors are invited to request a tailored commercial proposal.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-surface-1 border border-border space-y-4">
              <div className="max-w-xs">
                <FormLabel required className="text-xs font-semibold">Currency</FormLabel>
                <div className="relative mt-1.5">
                  <select
                    value={form.currency || "USD ($)"}
                    onChange={(e) => update("currency", e.target.value)}
                    className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  >
                    {DEFAULT_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(form.pricingModel === 'Fixed' || form.pricingModel === 'Starting At') && (
                <div className="max-w-xs">
                  <InputBlock
                    label={form.pricingModel === 'Fixed' ? "Fixed Amount" : "Starting Amount"}
                    type="number"
                    value={form.amount || 0}
                    onChange={(e) => update("amount", Number(e.target.value) || 0)}
                    required
                    placeholder="1500"
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {form.pricingModel === 'Range' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <InputBlock
                    label="Minimum Amount"
                    type="number"
                    value={form.minAmount || 0}
                    onChange={(e) => update("minAmount", Number(e.target.value) || 0)}
                    required
                    placeholder="1000"
                    className="font-mono text-sm"
                  />
                  <InputBlock
                    label="Maximum Amount"
                    type="number"
                    value={form.maxAmount || 0}
                    onChange={(e) => update("maxAmount", Number(e.target.value) || 0)}
                    required
                    placeholder="5000"
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {/* Display Format Preview */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Public Display Preview:</span>
                <span className="font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {formatServicePrice(form) || 'No price set'}
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 5: CALL TO ACTION (Requirement 5: Shared CtaSection) */}
        <TabsContent value="cta" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <CtaSection
            description={form.ctaText || ''}
            onDescriptionChange={(val) => update('ctaText', val)}
            buttonText={form.ctaButtonText}
            onButtonTextChange={(val) => update('ctaButtonText', val)}
            buttonLink={form.ctaButtonLink}
            onButtonLinkChange={(val) => update('ctaButtonLink', val)}
            visual={form.ctaVisual}
            onVisualChange={(val) => update('ctaVisual', val)}
          />
        </TabsContent>

        {/* TAB 6: TECH USED & RELATED PROJECTS */}
        <TabsContent value="tech" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Associated Tech Stacks & Case Studies</h2>
            <p className="text-xs text-muted-foreground">Attach skills, frameworks, and linked showcase projects to highlight real-world implementation.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-xs font-semibold">Associated Tech Stacks</FormLabel>
                <p className="text-xs text-muted-foreground">Select technologies used to deliver this capability.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsAddTechStackOpen(true)}
                className="gap-1.5 text-xs rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>New Tech Stack</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {techStacks.map((stk) => {
                const selected = form.techStacks?.includes(stk.id);
                return (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => {
                      const current = form.techStacks || [];
                      update(
                        "techStacks",
                        selected ? current.filter((id) => id !== stk.id) : [...current, stk.id]
                      );
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer shadow-xs",
                      selected
                        ? "bg-primary/10 border-primary text-foreground shadow-glow-sm"
                        : "bg-surface-1 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-4 border border-border flex items-center justify-center shrink-0">
                      <TechStackIcon tech={stk} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{stk.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize truncate">{stk.classification}</p>
                    </div>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                        selected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}
                    >
                      {selected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
              {techStacks.length === 0 && (
                <div className="col-span-full p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                  No tech stacks defined yet. Click &quot;New Tech Stack&quot; above to add.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-border/40">
            <div>
              <FormLabel className="text-xs font-semibold">Related Projects / Case Studies</FormLabel>
              <p className="text-xs text-muted-foreground">Select portfolio items demonstrating this service.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {products.map((p) => {
                const selected = form.relatedProjects?.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const current = form.relatedProjects || [];
                      update(
                        "relatedProjects",
                        selected ? current.filter((id) => id !== p.id) : [...current, p.id]
                      );
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer shadow-xs",
                      selected
                        ? "bg-primary/10 border-primary text-foreground shadow-glow-sm"
                        : "bg-surface-1 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-4 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {p.displayPicture ? (
                        <img src={p.displayPicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{p.title || p.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.category || 'Project'}</p>
                    </div>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                        selected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}
                    >
                      {selected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                  No projects available. Register projects under the Projects console.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 7: SEO */}
        <TabsContent value="seo" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <SeoFields
            type="Service"
            sourceTitle={form.title}
            sourceShortDescription={form.shortDescription}
            sourceDisplayPicture={form.displayPicture}
            sourceTags={form.tags}
            sourceCategory={form.category}
            sourceAmount={form.amount}
            sourceCurrency={form.currency}
            metaTitle={form.metaTitle || ''}
            onMetaTitleChange={(val) => update('metaTitle', val)}
            metaDescription={form.metaDescription || ''}
            onMetaDescriptionChange={(val) => update('metaDescription', val)}
            slug={form.slug}
            onSlugChange={(val) => update('slug', slugify(val))}
            pathPrefix="services"
            focusKeyword={form.focusKeyword || ''}
            onFocusKeywordChange={(val) => update('focusKeyword', val)}
            keywords={form.keywords || []}
            onKeywordsChange={(tags) => update('keywords', tags)}
            ogImage={form.ogImage}
            onOgImageChange={(val) => update('ogImage', val || undefined)}
            ogImageAlt={form.ogImageAlt || ''}
            onOgImageAltChange={(val) => update('ogImageAlt', val)}
            canonicalUrl={form.canonicalUrl || ''}
            onCanonicalUrlChange={(val) => update('canonicalUrl', val)}
            noIndex={form.noIndex || false}
            onNoIndexChange={(val) => update('noIndex', val)}
            noFollow={form.noFollow || false}
            onNoFollowChange={(val) => update('noFollow', val)}
            twitterCardType={form.twitterCardType || 'summary_large_image'}
            onTwitterCardTypeChange={(val) => update('twitterCardType', val)}
            twitterTitle={form.twitterTitle || ''}
            onTwitterTitleChange={(val) => update('twitterTitle', val)}
            twitterDescription={form.twitterDescription || ''}
            onTwitterDescriptionChange={(val) => update('twitterDescription', val)}
            twitterImage={form.twitterImage || ''}
            onTwitterImageChange={(val) => update('twitterImage', val || undefined)}
            enableStructuredData={form.enableStructuredData !== false}
            onEnableStructuredDataChange={(val) => update('enableStructuredData', val)}
            defaultTitlePlaceholder={form.title}
            defaultDescriptionPlaceholder={form.shortDescription}
          />
        </TabsContent>
      </Tabs>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-6 z-30 p-4 rounded-2xl bg-background/80 backdrop-blur-md border border-border/60 shadow-glass flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Editing: <strong className="text-foreground">{form.title || "Untitled Service"}</strong>
          </span>
          {form.active ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              Hidden
            </span>
          )}
          {form.featured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/services">
            <Button variant="ghost" size="sm" type="button" className="rounded-xl">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-xl shadow-glow-primary gap-2 min-w-[140px] font-bold"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? "Saving..." : isEditing ? "Save Service" : "Deploy Service"}</span>
          </Button>
        </div>
      </div>

      {/* Inline Modal: Add Tech Stack */}
      <Dialog open={isAddTechStackOpen} onOpenChange={setIsAddTechStackOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" onOpenChange={setIsAddTechStackOpen}>
          <DialogHeader>
            <DialogTitle>Add Tech Stack</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <TechStackForm
              onSubmit={async (newStack: TechStack) => {
                setIsSavingTechStack(true);
                try {
                  await addTechStack(newStack);
                  update("techStacks", [...(form.techStacks || []), newStack.id]);
                  setIsAddTechStackOpen(false);
                  addToast(`Tech stack "${newStack.name}" created and attached`, "success");
                } catch (err: any) {
                  addToast(err?.message || "Failed to create tech stack", "error");
                } finally {
                  setIsSavingTechStack(false);
                }
              }}
              onCancel={() => setIsAddTechStackOpen(false)}
              isLoading={isSavingTechStack}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Import from text Modal */}
      <ImportTextModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetType="Service"
        existingCategories={serviceCategories}
        onApplyService={handleApplyServiceImport}
      />
    </div>
  );
};

export default AdminServiceEditPage;
