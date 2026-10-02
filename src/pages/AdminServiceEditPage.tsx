import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon, 
  FolderPlus, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  Globe, 
  Target, 
  X, 
  Check,
  Eye,
  Package,
  Clock 
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
import { MarkdownEditor, MarkdownContent } from '@/components/ui/MarkdownEditor';
import { TagInput } from '@/components/ui/TagInput';
import { TechStackForm } from '@/components/forms/TechStackForm';
import { TechStackIcon } from '@/components/TechStackIcon';
import { useAppStore } from '@/store';
import { useToastStore } from '@/store/toastStore';
import { 
  Service, 
  ServicePricingModel, 
  ServiceDeliveredUnit, 
  ServiceValueItem, 
  ServiceCtaVisual,
  TechStack
} from '@/types';
import { 
  slugify, 
  DEFAULT_CURRENCIES, 
  AVAILABLE_PAGES, 
  normalizeService 
} from '@/utils/serviceMigration';
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
    { icon: "CheckCircle2", title: "Production Deployment", description: "Fully deployed and optimized cloud infrastructure" },
    { icon: "CheckCircle2", title: "Documentation & Codebase", description: "Comprehensive architectural handover and repository access" }
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
  const [valueSubTab, setValueSubTab] = useState<'features' | 'deliverables' | 'timeline'>('features');
  const [slugCustomized, setSlugCustomized] = useState(false);

  // Inline "Add Category" state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // Modal "Add Tech Stack" state
  const [isAddTechStackOpen, setIsAddTechStackOpen] = useState(false);
  const [isSavingTechStack, setIsSavingTechStack] = useState(false);

  // CTA Visual mode: 'none' | 'icon' | 'image'
  const [ctaVisualMode, setCtaVisualMode] = useState<'none' | 'icon' | 'image'>(() => {
    if (form.ctaVisual?.type === 'icon') return 'icon';
    if (form.ctaVisual?.type === 'image') return 'image';
    return 'none';
  });

  useEffect(() => {
    if (isEditing && id) {
      const existing = services.find((s) => s.id === id || s.slug === id);
      if (existing) {
        // Derive relatedProjects from products model (single source of truth: parentService)
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
        if (normalized.ctaVisual?.type === 'icon') setCtaVisualMode('icon');
        else if (normalized.ctaVisual?.type === 'image') setCtaVisualMode('image');
        else setCtaVisualMode('none');
      } else if (services.length > 0) {
        addToast("Service not found", "error");
        navigate("/admin/services");
      }
    }
  }, [id, isEditing, services, products, navigate, addToast]);

  const update = <K extends keyof Service>(key: K, val: Service[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  // Auto-slug from title if not customized
  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => {
      const updated: Partial<Service> = { title: newTitle };
      if (!slugCustomized) {
        updated.slug = slugify(newTitle);
      }
      return { ...prev, ...updated };
    });
  };

  // Add Category Handler
  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCategoryError("");
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError("Category name cannot be empty");
      return;
    }
    try {
      const created = await addServiceCategory(trimmed);
      update("category", created);
      setNewCategoryName("");
      setIsAddingCategory(false);
      addToast(`Category "${created}" added`, "success");
    } catch (err: any) {
      setCategoryError(err?.message || "Failed to add category");
    }
  };

  // Save Service
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Validate Title
    if (!form.title.trim()) {
      addToast("Service title is required", "error");
      setActiveTab("content");
      return;
    }

    // 2. Validate Slug
    const cleanSlug = (form.slug || slugify(form.title)).trim();
    if (!cleanSlug) {
      addToast("Slug is required", "error");
      setActiveTab("content");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      addToast("Slug must only contain lowercase letters, numbers, and hyphens", "error");
      setActiveTab("content");
      return;
    }

    // 3. Slug Uniqueness check
    const currentId = form.id || id || `srv_${Math.random().toString(36).substring(2, 9)}`;
    const duplicate = services.find(
      (s) => s.slug === cleanSlug && s.id !== currentId
    );
    if (duplicate) {
      addToast(`A service with the slug "${cleanSlug}" already exists. Please choose a unique slug.`, "error");
      setActiveTab("content");
      return;
    }

    // 4. Validate Media
    if (!form.displayPicture) {
      addToast("Display picture is required in the Media tab", "error");
      setActiveTab("media");
      return;
    }

    if (form.iconType === 'icon' && !form.icon) {
      addToast("Please choose an icon in the Media tab", "error");
      setActiveTab("media");
      return;
    }

    if (form.iconType === 'image' && !form.iconImage) {
      addToast("Please choose an image badge in the Media tab", "error");
      setActiveTab("media");
      return;
    }

    // 5. Clean up inactive fields according to rules:
    // Media inactive fields
    const finalIcon = form.iconType === 'icon' ? form.icon : undefined;
    const finalIconImage = form.iconType === 'image' ? form.iconImage : undefined;

    // Pricing rules
    let finalCurrency: string | undefined = form.currency;
    let finalAmount: number | undefined = form.amount;
    let finalMinAmount: number | undefined = form.minAmount;
    let finalMaxAmount: number | undefined = form.maxAmount;

    if (form.pricingModel === 'Custom Quote') {
      finalCurrency = undefined;
      finalAmount = undefined;
      finalMinAmount = undefined;
      finalMaxAmount = undefined;
    } else if (form.pricingModel === 'Fixed' || form.pricingModel === 'Starting At') {
      finalMinAmount = undefined;
      finalMaxAmount = undefined;
      if (finalAmount === undefined || isNaN(finalAmount) || finalAmount < 0) {
        addToast("Valid amount is required for Fixed/Starting At pricing", "error");
        setActiveTab("pricing");
        return;
      }
    } else if (form.pricingModel === 'Range') {
      finalAmount = undefined;
      if (finalMinAmount === undefined || finalMaxAmount === undefined) {
        addToast("Both Min and Max amounts are required for Range pricing", "error");
        setActiveTab("pricing");
        return;
      }
      if (finalMinAmount > finalMaxAmount) {
        addToast("Max amount must be greater than or equal to Min amount", "error");
        setActiveTab("pricing");
        return;
      }
    }

    // Value deliveredWithin rules
    const finalDeliveredWithin = {
      unit: form.deliveredWithin.unit,
      range: form.deliveredWithin.unit === 'Depends Upon Project' ? undefined : form.deliveredWithin.range,
    };

    // CTA Visual rules
    let finalCtaVisual: ServiceCtaVisual | undefined = undefined;
    if (ctaVisualMode === 'icon' && form.ctaVisual?.value) {
      finalCtaVisual = { type: 'icon', value: form.ctaVisual.value };
    } else if (ctaVisualMode === 'image' && form.ctaVisual?.value) {
      finalCtaVisual = { type: 'image', value: form.ctaVisual.value };
    }

    const payload: Service = {
      ...form,
      id: currentId,
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

      ctaVisual: finalCtaVisual,
      ctaText: form.ctaText?.trim() || "",
      ctaButtonText: form.ctaButtonText.trim() || "Contact Us",
      ctaButtonLink: form.ctaButtonLink.trim() || "/contact",

      techStacks: form.techStacks || [],
      relatedProjects: form.relatedProjects || [],

      metaTitle: form.metaTitle?.trim() || `${form.title.trim()} | Wise Byte Concepts`,
      metaDescription: form.metaDescription?.trim() || form.shortDescription.trim(),
      keywords: form.keywords || [],

      // Legacy aliases for non-breaking backward compatibility
      name: form.title.trim(),
      header: form.title.trim(),
      thumbnail: form.displayPicture,
      bannerImage: form.bannerPicture || form.displayPicture,
      isActive: form.active,
      isFeatured: form.featured,
      features: (form.coreFeatures || []).map(f => f.title),
      technologies: form.techStacks || [],
      pricing: {
        type: form.pricingModel === 'Fixed' ? 'fixed' : form.pricingModel === 'Starting At' ? 'starting_from' : 'custom',
        amount: finalAmount,
        currency: finalCurrency,
      },
      cta: {
        label: form.ctaButtonText.trim() || "Contact Us",
        link: form.ctaButtonLink.trim() || "/contact",
      },
      seo: {
        metaTitle: form.metaTitle?.trim() || form.title.trim(),
        metaDescription: form.metaDescription?.trim() || form.shortDescription.trim(),
        keywords: form.keywords || [],
      },
      estimatedDuration: finalDeliveredWithin.range 
        ? `${finalDeliveredWithin.range} ${finalDeliveredWithin.unit}` 
        : finalDeliveredWithin.unit,

      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateService(payload);
        // Sync related projects so Project's parentService stays identical to Service's relatedProjects
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

  // Value Tab: Repeatable list handlers
  const addFeature = () => {
    const newItem: ServiceValueItem = {
      icon: "CheckCircle2",
      title: "",
      description: ""
    };
    update("coreFeatures", [...form.coreFeatures, newItem]);
  };

  const updateFeature = (index: number, patch: Partial<ServiceValueItem>) => {
    const list = [...form.coreFeatures];
    list[index] = { ...list[index], ...patch };
    update("coreFeatures", list);
  };

  const removeFeature = (index: number) => {
    update("coreFeatures", form.coreFeatures.filter((_, i) => i !== index));
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= form.coreFeatures.length) return;
    const list = [...form.coreFeatures];
    const [moved] = list.splice(index, 1);
    list.splice(target, 0, moved);
    update("coreFeatures", list);
  };

  const addDeliverable = () => {
    const newItem: ServiceValueItem = {
      icon: "CheckCircle2",
      title: "",
      description: ""
    };
    update("deliverables", [...form.deliverables, newItem]);
  };

  const updateDeliverable = (index: number, patch: Partial<ServiceValueItem>) => {
    const list = [...form.deliverables];
    list[index] = { ...list[index], ...patch };
    update("deliverables", list);
  };

  const removeDeliverable = (index: number) => {
    update("deliverables", form.deliverables.filter((_, i) => i !== index));
  };

  const moveDeliverable = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= form.deliverables.length) return;
    const list = [...form.deliverables];
    const [moved] = list.splice(index, 1);
    list.splice(target, 0, moved);
    update("deliverables", list);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Top Breadcrumb & Header Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Link to="/admin/services">
              <Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground hover:text-foreground -ml-2.5">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Services
              </Button>
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

      {/* Main 7 Form Tabs */}
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
              <Sparkles className="w-3.5 h-3.5" /> Value & Delivery
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
            <TabsTrigger value="preview" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Eye className="w-3.5 h-3.5" /> Entry Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CONTENT                                                           */}
        {/* ========================================================================= */}
        <TabsContent value="content" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Service Content & Identity</h2>
            <p className="text-xs text-muted-foreground">Define title, unique slug, descriptive text, taxonomy, and visibility status.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputBlock
              label="Title"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Full-Stack Web Application Engineering"
              required
              description="Primary name of the service displayed throughout the platform."
            />

            <InputBlock
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugCustomized(true);
                update("slug", slugify(e.target.value));
              }}
              placeholder="e.g. full-stack-web-engineering"
              required
              description="URL-friendly identifier. Must be unique across all services."
            />
          </div>

          <InputBlock
            label="Caption"
            value={form.caption || ""}
            onChange={(e) => update("caption", e.target.value)}
            placeholder="e.g. Scalable, enterprise-ready digital systems built for resilience"
            description="Short punchy tagline or hero hook."
          />

          <TextareaBlock
            label="Short Description"
            value={form.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            rows={2}
            placeholder="Brief summary for registry cards, previews, and listings..."
            required
            description="Displayed on service overview cards and index listings."
          />

          <MarkdownEditor
            label="Full Description"
            value={form.fullDescription}
            onChange={(v) => update("fullDescription", v)}
            rows={8}
            placeholder="Write comprehensive specifications, workflow methodologies, and deliverables in Markdown..."
            required
            description="Comprehensive service documentation. Supports full markdown syntax and live preview."
          />

          {/* Category Lookup with Inline Add Category */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <FormLabel required className="text-xs font-semibold">Service Category</FormLabel>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="p-3 rounded-xl bg-surface-2 border border-primary/30 space-y-2 animate-in fade-in duration-200">
                <div className="text-xs font-semibold text-text-primary flex items-center justify-between">
                  <span>Create New Service Category</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setCategoryError("");
                      setNewCategoryName("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setCategoryError("");
                    }}
                    placeholder="e.g. AI / Machine Learning, Cloud Architecture"
                    className="flex-1 h-9 px-3 text-xs bg-surface-0 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCreateCategory()}
                    className="h-9 px-3 text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
                {categoryError && (
                  <p className="text-[11px] text-destructive">{categoryError}</p>
                )}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="w-full h-11 px-3.5 text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                >
                  {serviceCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <TagInput
            label="Tags"
            description="Search tags and capability keywords. Type and press comma or enter."
            value={form.tags}
            onChange={(tags) => update("tags", tags)}
            placeholder="web, enterprise, react, scaling..."
          />

          {/* Status & Sorting */}
          <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-5">
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

            <InputBlock
              label="Display Order"
              type="number"
              value={form.order}
              onChange={(e) => update("order", Number(e.target.value) || 0)}
              description="Ascending sequence order for sorting (0, 1, 2...)"
              className="font-mono"
            />
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: MEDIA                                                             */}
        {/* ========================================================================= */}
        <TabsContent value="media" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Media Assets & Visual Identity</h2>
            <p className="text-xs text-muted-foreground">Configure the visual symbol (Icon or Image badge), display picture, hero banner, and showcase gallery.</p>
          </div>

          {/* Icon Type Segmented Control */}
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
                <span>Media Image</span>
              </button>
            </div>
          </div>

          {/* Conditional Icon / Image input */}
          <div className="p-4 rounded-2xl bg-surface-1 border border-border space-y-4">
            {form.iconType === 'icon' ? (
              <div className="space-y-2">
                <IconPicker
                  label="Select Service Icon"
                  value={form.icon || "Briefcase"}
                  onChange={(val) => update("icon", val)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Choose from thousands of curated Lucide, Remix Icon, and Heroicons.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageInput
                  label="Service Badge Image"
                  value={form.iconImage || null}
                  onChange={(val) => update("iconImage", val || "")}
                  required
                  description="Upload or choose an icon badge from the unified media gallery."
                />
              </div>
            )}
          </div>

          {/* Display Picture (Required) */}
          <ImageInput
            label="Display Picture"
            value={form.displayPicture || null}
            onChange={(val) => update("displayPicture", val || "")}
            required
            description="Primary image used on service cards, index showcases, and preview grids."
          />

          {/* Banner Picture (Optional, falls back to displayPicture) */}
          <ImageInput
            label="Banner Picture (Optional)"
            value={form.bannerPicture || null}
            onChange={(val) => update("bannerPicture", val || "")}
            description="Wide hero banner displayed at the top of the service details page. If omitted, falls back to Display Picture."
          />

          {/* Gallery Collection */}
          <ImagesInput
            label="Showcase Gallery"
            value={form.gallery || []}
            onChange={(val) => update("gallery", val)}
            description="Visual artifacts, architectural screenshots, or project deliverables from the unified media library."
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: VALUE                                                             */}
        {/* ========================================================================= */}
        <TabsContent value="value" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Value Proposition & Timeline</h2>
            <p className="text-xs text-muted-foreground">Enumerate concrete core features, tangible deliverables, and estimated project delivery timeframe.</p>
          </div>

          {/* Sub-tabs: Core Features, Tangible Deliverables, Delivery Timeframe */}
          <Tabs value={valueSubTab} onValueChange={(val) => setValueSubTab(val as any)} className="w-full space-y-4">
            <TabsList className="w-full sm:w-auto p-1 bg-surface-1/80 border border-border rounded-xl gap-1">
              <TabsTrigger value="features" className="gap-2 text-xs h-8 px-3.5 rounded-lg shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Core Features</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-mono font-semibold">
                  {form.coreFeatures.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="gap-2 text-xs h-8 px-3.5 rounded-lg shrink-0">
                <Package className="w-3.5 h-3.5 text-accent" />
                <span>Tangible Deliverables</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-mono font-semibold">
                  {form.deliverables.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2 text-xs h-8 px-3.5 rounded-lg shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Delivery Timeframe</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-mono">
                  {form.deliveredWithin.unit === 'Depends Upon Project' ? 'Flexible' : form.deliveredWithin.unit}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Sub-Tab 1: Core Features */}
            <TabsContent value="features" className="space-y-4 mt-2">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div>
                  <FormLabel className="text-sm font-semibold">Core Features</FormLabel>
                  <p className="text-xs text-muted-foreground">Repeatable key value items each with an icon, title, and description.</p>
                </div>
                <Button type="button" size="sm" onClick={addFeature} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </Button>
              </div>

              <div className="space-y-3">
                {form.coreFeatures.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                    No core features added yet. Click &quot;Add Feature&quot; to define capabilities.
                  </div>
                )}
                {form.coreFeatures.map((feat, index) => (
                  <div key={index} className="p-4 rounded-xl bg-surface-1 border border-border space-y-3 relative group">
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <span className="text-xs font-mono font-bold text-primary">Feature #{index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveFeature(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFeature(index, 'down')}
                          disabled={index === form.coreFeatures.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1"
                          title="Remove feature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      <div className="sm:col-span-4">
                        <IconPicker
                          compact
                          label="Icon"
                          value={feat.icon}
                          onChange={(iconVal) => updateFeature(index, { icon: iconVal })}
                        />
                      </div>
                      <div className="sm:col-span-8">
                        <InputBlock
                          label="Feature Title"
                          value={feat.title}
                          onChange={(e) => updateFeature(index, { title: e.target.value })}
                          placeholder="e.g. Distributed Caching Layer"
                          required
                        />
                      </div>
                    </div>

                    <TextareaBlock
                      label="Description"
                      value={feat.description}
                      onChange={(e) => updateFeature(index, { description: e.target.value })}
                      rows={2}
                      placeholder="Briefly describe what this capability delivers to the client..."
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Sub-Tab 2: Tangible Deliverables */}
            <TabsContent value="deliverables" className="space-y-4 mt-2">
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <div>
                  <FormLabel className="text-sm font-semibold">Tangible Deliverables</FormLabel>
                  <p className="text-xs text-muted-foreground">Repeatable deliverables received upon project completion.</p>
                </div>
                <Button type="button" size="sm" onClick={addDeliverable} className="gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Deliverable
                </Button>
              </div>

              <div className="space-y-3">
                {form.deliverables.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                    No deliverables added yet. Click &quot;Add Deliverable&quot; to specify outputs.
                  </div>
                )}
                {form.deliverables.map((deliv, index) => (
                  <div key={index} className="p-4 rounded-xl bg-surface-1 border border-border space-y-3 relative group">
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                      <span className="text-xs font-mono font-bold text-accent">Deliverable #{index + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveDeliverable(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDeliverable(index, 'down')}
                          disabled={index === form.deliverables.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDeliverable(index)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1"
                          title="Remove deliverable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      <div className="sm:col-span-4">
                        <IconPicker
                          compact
                          label="Icon"
                          value={deliv.icon}
                          onChange={(iconVal) => updateDeliverable(index, { icon: iconVal })}
                        />
                      </div>
                      <div className="sm:col-span-8">
                        <InputBlock
                          label="Deliverable Title"
                          value={deliv.title}
                          onChange={(e) => updateDeliverable(index, { title: e.target.value })}
                          placeholder="e.g. Source Repository with CI/CD"
                          required
                        />
                      </div>
                    </div>

                    <TextareaBlock
                      label="Description"
                      value={deliv.description}
                      onChange={(e) => updateDeliverable(index, { description: e.target.value })}
                      rows={2}
                      placeholder="Provide details on the handover or specifications..."
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Sub-Tab 3: Delivery Timeframe */}
            <TabsContent value="timeline" className="space-y-4 mt-2">
              <div className="pb-2 border-b border-border/30">
                <FormLabel className="text-sm font-semibold">Delivery Timeframe (Delivered Within)</FormLabel>
                <p className="text-xs text-muted-foreground">Select unit and expected delivery range duration.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-primary block mb-1.5">Timeframe Unit</label>
                  <div className="relative">
                    <select
                      value={form.deliveredWithin.unit}
                      onChange={(e) => {
                        const newUnit = e.target.value as ServiceDeliveredUnit;
                        update("deliveredWithin", {
                          unit: newUnit,
                          range: newUnit === 'Depends Upon Project' ? undefined : (form.deliveredWithin.range || "2–4")
                        });
                      }}
                      className="w-full h-11 px-3.5 text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                    >
                      {DELIVERED_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {form.deliveredWithin.unit !== 'Depends Upon Project' ? (
                  <InputBlock
                    label={`Duration Range (${form.deliveredWithin.unit})`}
                    value={form.deliveredWithin.range !== undefined ? String(form.deliveredWithin.range) : ""}
                    onChange={(e) => update("deliveredWithin", {
                      ...form.deliveredWithin,
                      range: e.target.value
                    })}
                    placeholder="e.g. 2–4 or 14"
                    description={`Specify expected number or range of ${form.deliveredWithin.unit.toLowerCase()}`}
                    required
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground flex items-center">
                    Range number is omitted when delivery depends upon project scope.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: PRICING                                                           */}
        {/* ========================================================================= */}
        <TabsContent value="pricing" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Commercial Pricing Model</h2>
            <p className="text-xs text-muted-foreground">Choose between Fixed, Starting At, Range, or Custom Quote. If Custom Quote, amounts are cleared and &quot;Contact Us&quot; is shown on the public site.</p>
          </div>

          <div className="space-y-2">
            <FormLabel required className="text-xs font-semibold">Pricing Model</FormLabel>
            <div className="relative">
              <select
                value={form.pricingModel}
                onChange={(e) => {
                  const model = e.target.value as ServicePricingModel;
                  update("pricingModel", model);
                }}
                className="w-full h-11 px-3.5 text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
              >
                {PRICING_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Conditional Pricing Inputs */}
          {form.pricingModel === 'Custom Quote' ? (
            <div className="p-5 rounded-2xl bg-surface-2 border border-primary/20 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Custom Consultation Model Active</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Specific currency and numerical amounts are hidden. On the public site, this service will automatically display &quot;Contact Us&quot; instead of a price tag.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-surface-1 border border-border space-y-4">
              {/* Currency Lookup */}
              <div>
                <FormLabel required className="text-xs font-semibold">Currency</FormLabel>
                <div className="relative mt-1.5">
                  <select
                    value={form.currency || "USD ($)"}
                    onChange={(e) => update("currency", e.target.value)}
                    className="w-full h-11 px-3.5 text-sm rounded-xl bg-surface-2 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  >
                    {DEFAULT_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Single value for Fixed / Starting At */}
              {(form.pricingModel === 'Fixed' || form.pricingModel === 'Starting At') && (
                <InputBlock
                  label={form.pricingModel === 'Fixed' ? "Fixed Amount" : "Starting Amount"}
                  type="number"
                  value={form.amount !== undefined ? form.amount : ""}
                  onChange={(e) => update("amount", e.target.value === "" ? undefined : Number(e.target.value))}
                  placeholder="1500"
                  required
                  description={`Specify the ${form.pricingModel.toLowerCase()} investment amount in ${form.currency || 'USD'}.`}
                />
              )}

              {/* Min-Max for Range */}
              {form.pricingModel === 'Range' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputBlock
                    label="Minimum Amount"
                    type="number"
                    value={form.minAmount !== undefined ? form.minAmount : ""}
                    onChange={(e) => update("minAmount", e.target.value === "" ? undefined : Number(e.target.value))}
                    placeholder="1000"
                    required
                  />
                  <InputBlock
                    label="Maximum Amount"
                    type="number"
                    value={form.maxAmount !== undefined ? form.maxAmount : ""}
                    onChange={(e) => update("maxAmount", e.target.value === "" ? undefined : Number(e.target.value))}
                    placeholder="5000"
                    required
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: CALL TO ACTION                                                    */}
        {/* ========================================================================= */}
        <TabsContent value="cta" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Call to Action (CTA)</h2>
            <p className="text-xs text-muted-foreground">Configure conversion prompt, visual element (icon or media image), button text, and destination page.</p>
          </div>

          {/* CTA Visual: Optional Icon Picker or Media Picker (Mutually Exclusive) */}
          <div className="space-y-3">
            <FormLabel className="text-xs font-semibold">CTA Visual Accent (Optional)</FormLabel>
            <div className="grid grid-cols-3 max-w-sm gap-2 p-1 bg-surface-2 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => {
                  setCtaVisualMode('none');
                  update("ctaVisual", undefined);
                }}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                  ctaVisualMode === 'none'
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => {
                  setCtaVisualMode('icon');
                  update("ctaVisual", { type: 'icon', value: form.ctaVisual?.value || 'Sparkles' });
                }}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                  ctaVisualMode === 'icon'
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Icon
              </button>
              <button
                type="button"
                onClick={() => {
                  setCtaVisualMode('image');
                  update("ctaVisual", { type: 'image', value: form.ctaVisual?.value || '' });
                }}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                  ctaVisualMode === 'image'
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Media Image
              </button>
            </div>

            {ctaVisualMode === 'icon' && (
              <div className="p-4 rounded-xl bg-surface-1 border border-border">
                <IconPicker
                  label="CTA Icon"
                  value={form.ctaVisual?.value || "Sparkles"}
                  onChange={(val) => update("ctaVisual", { type: 'icon', value: val })}
                />
              </div>
            )}

            {ctaVisualMode === 'image' && (
              <div className="p-4 rounded-xl bg-surface-1 border border-border">
                <ImageInput
                  label="CTA Visual Asset"
                  value={typeof form.ctaVisual?.value === 'string' ? form.ctaVisual.value : null}
                  onChange={(val) => update("ctaVisual", { type: 'image', value: val || "" })}
                  description="Choose an accent asset from media library"
                />
              </div>
            )}
          </div>

          <TextareaBlock
            label="CTA Explanatory Text"
            value={form.ctaText || ""}
            onChange={(e) => update("ctaText", e.target.value)}
            rows={3}
            placeholder="Ready to transform your operations? Get in touch with our engineering leads..."
            description="Compelling invitation copy displayed above the action button."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InputBlock
              label="Button Text"
              value={form.ctaButtonText}
              onChange={(e) => update("ctaButtonText", e.target.value)}
              placeholder="Contact Us"
              required
              description="Label rendered on the primary CTA button."
            />

            <div>
              <FormLabel required className="text-xs font-semibold">Button Destination Page</FormLabel>
              <div className="relative mt-1.5">
                <select
                  value={form.ctaButtonLink}
                  onChange={(e) => update("ctaButtonLink", e.target.value)}
                  className="w-full h-11 px-3.5 text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                >
                  {AVAILABLE_PAGES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label} ({p.value})</option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Select from internal pages lookup.</p>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: TECH USED                                                         */}
        {/* ========================================================================= */}
        <TabsContent value="tech" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Technology Stack & Related Projects</h2>
            <p className="text-xs text-muted-foreground">Multi-select tech stacks from your Tech Stack model and link portfolio projects built using this service.</p>
          </div>

          {/* Tech Stacks Multi-select with "Add Tech Stack" modal */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-sm font-semibold">Tech Stacks Employed</FormLabel>
                <p className="text-xs text-muted-foreground">Select all technologies used by this capability module.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="glass"
                onClick={() => setIsAddTechStackOpen(true)}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tech Stack
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {techStacks.map((stk) => {
                const selected = (form.techStacks || []).includes(stk.id) || (form.techStacks || []).includes(stk.name);
                return (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => {
                      const current = form.techStacks || [];
                      const exists = current.includes(stk.id) || current.includes(stk.name);
                      if (exists) {
                        update("techStacks", current.filter((id) => id !== stk.id && id !== stk.name));
                      } else {
                        update("techStacks", [...current, stk.id]);
                      }
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer shadow-xs",
                      selected
                        ? "bg-primary/10 border-primary text-foreground shadow-glow-sm"
                        : "bg-surface-1 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-4 border border-border flex items-center justify-center shrink-0">
                      <TechStackIcon stack={stk} className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate text-foreground">{stk.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">{stk.classification}</div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                      selected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                    )}>
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
              {techStacks.length === 0 && (
                <div className="col-span-full p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                  No tech stacks registered yet. Click &quot;Add Tech Stack&quot; to create one.
                </div>
              )}
            </div>
          </div>

          {/* Related Projects Multi-select from Products Model */}
          <div className="space-y-3 pt-6 border-t border-border/40">
            <FormLabel className="text-sm font-semibold">Related Portfolio Projects</FormLabel>
            <p className="text-xs text-muted-foreground">Select completed project deliverables engineered with this service capability.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {products.map((p) => {
                const selected = (form.relatedProjects || []).includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const current = form.relatedProjects || [];
                      if (current.includes(p.id)) {
                        update("relatedProjects", current.filter((id) => id !== p.id));
                      } else {
                        update("relatedProjects", [...current, p.id]);
                      }
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer shadow-xs",
                      selected
                        ? "bg-primary/10 border-primary text-foreground shadow-glow-sm"
                        : "bg-surface-1 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-4 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                      selected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                    )}>
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                  No portfolio projects registered yet in the database.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 7: SEO                                                               */}
        {/* ========================================================================= */}
        <TabsContent value="seo" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Search Engine Optimization (SEO)</h2>
            <p className="text-xs text-muted-foreground">Fine-tune page metadata, open-graph titles, search previews, and keyword taxonomy.</p>
          </div>

          <InputBlock
            label="Meta Title"
            value={form.metaTitle || ""}
            onChange={(e) => update("metaTitle", e.target.value)}
            placeholder={`${form.title || 'Service'} | Wise Byte Concepts`}
            description="Browser tab title and search engine result headline."
          />

          <TextareaBlock
            label="Meta Description"
            value={form.metaDescription || ""}
            onChange={(e) => update("metaDescription", e.target.value)}
            rows={3}
            placeholder={form.shortDescription || "Comprehensive digital engineering solutions for modern enterprise scalability..."}
            description="Concise description snippet shown in Google search results (150–160 chars recommended)."
          />

          <TagInput
            label="SEO Keywords"
            value={form.keywords || []}
            onChange={(tags) => update("keywords", tags)}
            placeholder="custom software, fullstack engineering, typescript, react..."
            description="Comma-separated keywords for meta tags and algorithmic indexing."
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 8: ENTRY PREVIEW                                                     */}
        {/* ========================================================================= */}
        <TabsContent value="preview" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Live Entry Preview
              </h2>
              <p className="text-xs text-muted-foreground">Comprehensive real-time preview of how this service entry and its Markdown specifications render on the public site.</p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              {form.active ? 'Status: Active' : 'Status: Draft / Inactive'}
            </Badge>
          </div>

          <div className="rounded-2xl border border-border/70 bg-surface-1 overflow-hidden">
            {/* Header Hero Area */}
            {form.displayPicture && (
              <div className="w-full h-56 md:h-72 overflow-hidden relative bg-surface-3">
                <img 
                  src={form.displayPicture} 
                  alt={form.title || 'Service banner'} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold">
                      {form.category || 'Service'}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {form.title || 'Untitled Service Entry'}
                    </h1>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 md:p-8 space-y-8">
              {!form.displayPicture && (
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold">
                    {form.category || 'Service'}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
                    {form.title || 'Untitled Service Entry'}
                  </h1>
                </div>
              )}

              {form.caption && (
                <p className="text-base font-medium text-primary/90 italic">
                  &ldquo;{form.caption}&rdquo;
                </p>
              )}

              {form.shortDescription && (
                <div className="p-4 rounded-xl bg-surface-2 border border-border/60 text-sm text-muted-foreground leading-relaxed">
                  {form.shortDescription}
                </div>
              )}

              {/* Pricing & Turnaround Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-2/70 border border-border/60">
                <div>
                  <div className="text-[11px] font-mono uppercase text-muted-foreground">Model</div>
                  <div className="text-sm font-bold text-foreground capitalize mt-0.5">{form.pricingModel}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-muted-foreground">Price</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{form.amount ? `${form.currency || '$'}${form.amount}` : 'Custom Quote'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-muted-foreground">Turnaround</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {form.deliveredWithin ? `${form.deliveredWithin.range} ${form.deliveredWithin.unit}` : 'Agile Sprint'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase text-muted-foreground">Category</div>
                  <div className="text-sm font-bold text-foreground mt-0.5">{form.category || 'Engineering'}</div>
                </div>
              </div>

              {/* Markdown Documentation Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                    Service Specifications & Methodology (Markdown)
                  </h3>
                  <span className="text-[11px] font-mono text-muted-foreground">Rendered via MarkdownEngine</span>
                </div>
                <div className="p-5 md:p-6 rounded-xl bg-surface-2/60 border border-border/50">
                  <MarkdownContent 
                    content={form.fullDescription} 
                    className="text-foreground leading-relaxed text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Core Features */}
              {form.coreFeatures && form.coreFeatures.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary pb-2 border-b border-border/50">
                    Core Engineering Capabilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {form.coreFeatures.map((feat, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-surface-2 border border-border/60 space-y-1">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{feat.title || `Capability ${idx + 1}`}</span>
                        </div>
                        {feat.description && (
                          <p className="text-xs text-muted-foreground pl-5">{feat.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables */}
              {form.deliverables && form.deliverables.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary pb-2 border-b border-border/50">
                    Client Deliverables
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {form.deliverables.map((del, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-surface-2 border border-border/60 space-y-1">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{del.title || `Deliverable ${idx + 1}`}</span>
                        </div>
                        {del.description && (
                          <p className="text-xs text-muted-foreground pl-5">{del.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
    </div>
  );
};

export default AdminServiceEditPage;
