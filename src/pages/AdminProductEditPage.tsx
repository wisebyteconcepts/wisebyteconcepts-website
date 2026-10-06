import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon, 
  Globe, 
  Plus, 
  Layers, 
  Briefcase, 
  Eye, 
  Target,
  FileText 
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
import { ImportTextModal } from '@/components/forms/ImportTextModal';
import { useAppStore } from '@/store';
import { useToastStore } from '@/store/toastStore';
import { 
  Project, 
  ProjectDeliveredUnit, 
  TechStack 
} from '@/types';
import { 
  slugify, 
  isValidUrl, 
  isProjectSlugUnique, 
  normalizeProject 
} from '@/utils/projectMigration';
import { cn } from '@/lib/utils';

const DELIVERED_UNITS: ProjectDeliveredUnit[] = ['Days', 'Weeks', 'Month', 'Depends Upon Project'];

const emptyProject = (defaultParentService: string = ''): Project => ({
  id: '',
  title: '',
  slug: '',
  caption: '',
  shortDescription: '',
  fullDescription: '',
  category: 'Web Application',
  parentService: defaultParentService,
  tags: [],
  active: true,
  featured: false,
  order: 0,

  iconType: 'icon',
  icon: 'ShoppingBag',
  iconImage: '',
  displayPicture: '',
  bannerPicture: '',
  gallery: [],

  coreFeatures: [
    { icon: 'CheckCircle2', title: 'High Performance Architecture', description: 'Engineered for optimal latency, security, and responsive UX' },
    { icon: 'Sparkles', title: 'Modern User Experience', description: 'Reactive state management and intuitive interactions' }
  ],
  deliverables: [
    { icon: 'Package', title: 'Live Deployed Instance', description: 'Production release with high availability infrastructure' },
    { icon: 'Package', title: 'Source Code Repository', description: 'Well-documented codebase with continuous integration' }
  ],
  deliveredWithin: {
    unit: 'Weeks',
    range: '3–6'
  },

  techStacks: [],

  liveLink: '',
  gitRepository: '',

  ctaHeading: 'Ready to engineer a similar solution for your organization?',
  ctaText: 'Connect with our engineering leads to discuss your scope, deliverables, and production roadmap.',
  ctaButtonText: 'Discuss Your Project',
  ctaButtonLink: '/contact',
  ctaSecondaryButtonText: '',
  ctaSecondaryButtonLink: '',
  ctaVisual: undefined,

  metaTitle: '',
  metaDescription: '',
  keywords: [],
  focusKeyword: '',
  ogImage: '',
  ogImageAlt: '',
  canonicalUrl: '',
  noIndex: false,
  noFollow: false,
  twitterCardType: 'summary_large_image',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  enableStructuredData: true,

  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { 
    products, 
    services, 
    techStacks, 
    projectCategories, 
    addProduct, 
    updateProduct, 
    updateService, 
    addTechStack 
  } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);

  const [form, setForm] = useState<Project>(emptyProject(services[0]?.id || ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modal "Add Tech Stack" state
  const [isAddTechStackOpen, setIsAddTechStackOpen] = useState(false);
  const [isSavingTechStack, setIsSavingTechStack] = useState(false);

  const handleApplyProductImport = (imported: Partial<Project>) => {
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
      const existing = products.find((p) => p.id === id || p.slug === id);
      if (existing) {
        const normalized = normalizeProject(existing, services[0]?.id || '');
        setForm(normalized);
        setSlugCustomized(true);
      } else if (products.length > 0) {
        addToast('Project not found', 'error');
        navigate('/admin/products');
      }
    }
  }, [id, isEditing, products, services, navigate, addToast]);

  const update = <K extends keyof Project>(key: K, val: Project[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => {
      const updated: Partial<Project> = { title: newTitle };
      if (!slugCustomized) {
        updated.slug = slugify(newTitle);
      }
      return { ...prev, ...updated };
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.title.trim()) {
      addToast('Project title is required in Basic Details', 'error');
      setActiveTab('basic');
      return;
    }

    const cleanSlug = (form.slug || slugify(form.title)).trim();
    if (!cleanSlug) {
      addToast('Project slug is required in Basic Details', 'error');
      setActiveTab('basic');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      addToast('Slug must only contain lowercase letters, numbers, and hyphens', 'error');
      setActiveTab('basic');
      return;
    }

    const currentId = form.id || id || `prj_${Math.random().toString(36).substring(2, 9)}`;
    const isUnique = isProjectSlugUnique(cleanSlug, currentId, products);
    if (!isUnique) {
      addToast(`A project with the slug "${cleanSlug}" already exists. Please choose a unique slug.`, 'error');
      setActiveTab('basic');
      return;
    }

    if (!form.parentService.trim()) {
      addToast('Parent Service selection is required', 'error');
      setActiveTab('basic');
      return;
    }

    if (!form.shortDescription.trim()) {
      addToast('Short description is required in Basic Details', 'error');
      setActiveTab('basic');
      return;
    }
    if (!form.fullDescription.trim()) {
      addToast('Full description is required in Basic Details', 'error');
      setActiveTab('basic');
      return;
    }

    if (!form.displayPicture.trim()) {
      addToast('Display picture is required in the Media tab', 'error');
      setActiveTab('media');
      return;
    }

    if (form.iconType === 'icon' && !form.icon) {
      addToast('Please select a project icon in the Media tab', 'error');
      setActiveTab('media');
      return;
    }

    if (form.iconType === 'image' && (!form.iconImage || !form.iconImage.trim())) {
      addToast('Please choose an icon image badge in the Media tab', 'error');
      setActiveTab('media');
      return;
    }

    if (form.liveLink && form.liveLink.trim() && !isValidUrl(form.liveLink.trim())) {
      addToast('Live URL must be a valid web address (e.g. https://example.com)', 'error');
      setActiveTab('deployment');
      return;
    }

    if (form.gitRepository && form.gitRepository.trim() && !isValidUrl(form.gitRepository)) {
      addToast('Git repository must be a valid web URL (e.g. https://github.com/org/repo)', 'error');
      setActiveTab('deployment');
      return;
    }

    const finalIcon = form.iconType === 'icon' ? form.icon : undefined;
    const finalIconImage = form.iconType === 'image' ? form.iconImage : undefined;

    const finalDeliveredWithin = {
      unit: form.deliveredWithin.unit,
      range: form.deliveredWithin.unit === 'Depends Upon Project' ? undefined : form.deliveredWithin.range,
    };

    const payload: Project = {
      ...form,
      id: currentId,
      title: form.title.trim(),
      slug: cleanSlug,
      caption: form.caption?.trim() || '',
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      category: form.category.trim() || 'Web Application',
      parentService: form.parentService.trim(),
      tags: form.tags || [],
      active: form.active,
      featured: form.featured,
      order: Number(form.order) || 0,

      iconType: form.iconType,
      icon: finalIcon,
      iconImage: finalIconImage,
      displayPicture: form.displayPicture.trim(),
      bannerPicture: form.bannerPicture?.trim() || undefined,
      gallery: form.gallery || [],

      coreFeatures: form.coreFeatures || [],
      deliverables: form.deliverables || [],
      deliveredWithin: finalDeliveredWithin,

      techStacks: form.techStacks || [],

      liveLink: form.liveLink.trim(),
      gitRepository: form.gitRepository?.trim() || undefined,

      ctaHeading: form.ctaHeading?.trim() || undefined,
      ctaText: form.ctaText?.trim() || undefined,
      ctaButtonText: form.ctaButtonText?.trim() || 'View Live Project',
      ctaButtonLink: form.ctaButtonLink?.trim() || form.liveLink || '/contact',
      ctaSecondaryButtonText: form.ctaSecondaryButtonText?.trim() || undefined,
      ctaSecondaryButtonLink: form.ctaSecondaryButtonLink?.trim() || undefined,
      ctaVisual: form.ctaVisual,

      metaTitle: form.metaTitle?.trim() || `${form.title.trim()} | Wise Byte Concepts`,
      metaDescription: form.metaDescription?.trim() || form.shortDescription.trim(),
      keywords: form.keywords || [],
      focusKeyword: form.focusKeyword?.trim() || undefined,
      ogImage: form.ogImage || form.displayPicture || undefined,
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
      description: form.shortDescription.trim(),
      serviceId: form.parentService.trim(),
      imageUrl: form.displayPicture.trim(),
      demoUrl: form.liveLink.trim(),
      repoUrl: form.gitRepository?.trim() || undefined,
      isActive: form.active,
      isFeatured: form.featured,

      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateProduct(payload);
        const parent = services.find((s) => s.id === payload.parentService);
        if (parent && !(parent.relatedProjects || []).includes(payload.id)) {
          await updateService({
            ...parent,
            relatedProjects: [...(parent.relatedProjects || []), payload.id],
          });
        }
        addToast('Project updated successfully', 'success');
      } else {
        await addProduct(payload);
        const parent = services.find((s) => s.id === payload.parentService);
        if (parent && !(parent.relatedProjects || []).includes(payload.id)) {
          await updateService({
            ...parent,
            relatedProjects: [...(parent.relatedProjects || []), payload.id],
          });
        }
        addToast('Project registered successfully', 'success');
      }
      navigate('/admin/products');
    } catch (err: any) {
      addToast(err?.message || 'Failed to save project', 'error');
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
            <Link to="/admin/products" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects Showcase</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">
              {isEditing ? 'Edit Project' : 'New Project'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            {isEditing ? form.title || 'Edit Project' : 'Register New Project'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
          <Link to="/admin/products">
            <Button variant="ghost" size="sm" type="button" className="rounded-xl cursor-pointer">
              Cancel
            </Button>
          </Link>
          {isEditing ? (
            <a 
              href={`/products/${(form.slug || id || '').toLowerCase()}`} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Open live Project Details page in another tab"
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
              title="Save project first to preview live page" 
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
            <span>{isEditing ? 'Save Changes' : 'Publish Project'}</span>
          </Button>
        </div>
      </div>

      {/* Main 7 Form Tabs (Entry Preview removed per Requirement 3) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="w-full overflow-x-auto py-0.5 hide-scrollbar">
          <TabsList className="bg-surface-2 p-1 rounded-2xl border border-border inline-flex h-auto max-h-none gap-1">
            <TabsTrigger value="basic" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Briefcase className="w-3.5 h-3.5" /> Basic Details
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <ImageIcon className="w-3.5 h-3.5" /> Media
            </TabsTrigger>
            <TabsTrigger value="value" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Sparkles className="w-3.5 h-3.5" /> Features & Deliverables
            </TabsTrigger>
            <TabsTrigger value="cta" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Target className="w-3.5 h-3.5" /> Call to Action
            </TabsTrigger>
            <TabsTrigger value="tech" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Layers className="w-3.5 h-3.5" /> Tech Used
            </TabsTrigger>
            <TabsTrigger value="deployment" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Globe className="w-3.5 h-3.5" /> Deployment
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Globe className="w-3.5 h-3.5" /> SEO
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: BASIC DETAILS */}
        <TabsContent value="basic" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Project Identity & Classification</h2>
              <p className="text-xs text-muted-foreground">Title, unique slug, parent service mapping, description, tags, and visibility status.</p>
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
              placeholder="e.g. Distributed Cloud Monitoring Suite"
              required
              description="Primary project title displayed across showcase grids and portfolio cards."
            />

            <InputBlock
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugCustomized(true);
                update('slug', slugify(e.target.value));
              }}
              placeholder="e.g. distributed-cloud-monitoring"
              required
              description={`URL: /products/${form.slug || '...'}`}
            />
          </div>

          <InputBlock
            label="Caption (Short Sub-heading)"
            value={form.caption || ''}
            onChange={(e) => update('caption', e.target.value)}
            placeholder="e.g. Real-time telemetry pipeline built with Rust and WebSockets"
            description="One-sentence impact tagline displayed beneath the project title."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FormLabel required className="text-xs font-semibold">Category</FormLabel>
              <div className="relative mt-1.5">
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                >
                  {projectCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FormLabel required className="text-xs font-semibold">Parent Service Offering</FormLabel>
              <div className="relative mt-1.5">
                <select
                  value={form.parentService}
                  onChange={(e) => update('parentService', e.target.value)}
                  className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                >
                  <option value="" disabled>Select parent service capability</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title || s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <TextareaBlock
            label="Short Description"
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            rows={2}
            placeholder="Concise overview for portfolio cards, preview grids, and index listings..."
            required
            description="Used on catalog cards, preview summaries, and search snippets."
          />

          <div className="space-y-2">
            <FormLabel required className="text-xs font-semibold">Full Project Specification & Case Study</FormLabel>
            <MarkdownEditor
              value={form.fullDescription}
              onChange={(val) => update('fullDescription', val)}
              placeholder="Detailed case study documentation with problem statement, architecture, diagrams, and benchmarks..."
              minHeight="240px"
            />
          </div>

          <TagInput
            label="Tags & Domain Keywords"
            description="Search tags and technical keywords. Type and press comma or enter."
            value={form.tags}
            onChange={(tags) => update('tags', tags)}
            placeholder="rust, telemetry, distributed, docker..."
          />

          {/* Status (Display Order removed per Requirement 2) */}
          <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SwitchBlock
              label="Active Status"
              description="Make visible on public portfolio."
              checked={form.active}
              onCheckedChange={(val) => update('active', val)}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />

            <SwitchBlock
              label="Featured on Homepage"
              description="Highlight this project in the homepage showcase."
              checked={form.featured}
              onCheckedChange={(val) => update('featured', val)}
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            />
          </div>
        </TabsContent>

        {/* TAB 2: MEDIA */}
        <TabsContent value="media" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Media & Visual Assets</h2>
            <p className="text-xs text-muted-foreground">Configure project symbol (icon or badge image), required display screenshot, hero banner, and showcase gallery.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-text-primary block">
              Icon Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 max-w-xs gap-2 p-1 bg-surface-2 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => update('iconType', 'icon')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  form.iconType === 'icon'
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-3'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Icon Picker</span>
              </button>

              <button
                type="button"
                onClick={() => update('iconType', 'image')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  form.iconType === 'image'
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-3'
                )}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Custom Image</span>
              </button>
            </div>

            {form.iconType === 'icon' ? (
              <div className="p-4 rounded-xl bg-surface-1 border border-border">
                <IconPicker
                  label="Project Icon"
                  value={form.icon || 'ShoppingBag'}
                  onChange={(val) => update('icon', val)}
                  required
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-1 border border-border">
                <ImageInput
                  label="Project Badge Image"
                  value={form.iconImage || null}
                  onChange={(val) => update('iconImage', val || '')}
                  required
                  description="Optimized square badge icon (SVG, PNG, or WebP recommended)."
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <FormLabel required className="text-xs font-semibold">Display Picture (Primary Screenshot)</FormLabel>
            <ImageInput
              value={form.displayPicture}
              onChange={(val) => update('displayPicture', val || '')}
              required
              description="Primary screenshot or hero visual used on showcase cards, modal previews, and index grids."
            />
          </div>

          <div className="space-y-2">
            <FormLabel className="text-xs font-semibold">Hero Banner (Optional Header Panorama)</FormLabel>
            <ImageInput
              value={form.bannerPicture || null}
              onChange={(val) => update('bannerPicture', val || '')}
              description="High-resolution panoramic banner displayed on top of the project detail page."
            />
          </div>

          <div className="space-y-2">
            <FormLabel className="text-xs font-semibold">Project Showcase Gallery</FormLabel>
            <ImagesInput
              value={form.gallery || []}
              onChange={(imgs) => update('gallery', imgs)}
              description="Multi-asset visual gallery highlighting application interfaces, dashboards, or workflow states."
            />
          </div>
        </TabsContent>

        {/* TAB 3: FEATURES & DELIVERABLES (Requirement 1: Two cards side by side, quick-add, drag-drop) */}
        <TabsContent value="value" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Features & Deliverables</h2>
            <p className="text-xs text-muted-foreground">Concrete specifications, production deliverables, and implementation turnaround.</p>
          </div>

          {/* Two cards side by side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ReorderableCardList
              title="Core Features"
              helperText="Key capabilities and technical strengths built into this project."
              items={form.coreFeatures}
              onChange={(features) => update('coreFeatures', features)}
              defaultIcon="CheckCircle2"
              quickAddPlaceholder="Add a feature and press Enter (or paste multiple)..."
            />

            <ReorderableCardList
              title="Tangible Deliverables"
              helperText="Tangible deliverables, repositories, and documentation produced."
              items={form.deliverables}
              onChange={(delivs) => update('deliverables', delivs)}
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
                      const newUnit = e.target.value as ProjectDeliveredUnit;
                      update('deliveredWithin', {
                        unit: newUnit,
                        range: newUnit === 'Depends Upon Project' ? undefined : (form.deliveredWithin.range || '3–6')
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
                    placeholder="e.g. 3–6, 6–12, 10–20"
                    className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                    Estimated duration: {form.deliveredWithin.range || 'N/A'} {form.deliveredWithin.unit}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: CALL TO ACTION (Requirement 5: Shared CtaSection) */}
        <TabsContent value="cta" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <CtaSection
            heading={form.ctaHeading}
            onHeadingChange={(val) => update('ctaHeading', val)}
            description={form.ctaText || ''}
            onDescriptionChange={(val) => update('ctaText', val)}
            buttonText={form.ctaButtonText || 'View Live Project'}
            onButtonTextChange={(val) => update('ctaButtonText', val)}
            buttonLink={form.ctaButtonLink || form.liveLink || '/contact'}
            onButtonLinkChange={(val) => update('ctaButtonLink', val)}
            secondaryButtonText={form.ctaSecondaryButtonText}
            onSecondaryButtonTextChange={(val) => update('ctaSecondaryButtonText', val)}
            secondaryButtonLink={form.ctaSecondaryButtonLink}
            onSecondaryButtonLinkChange={(val) => update('ctaSecondaryButtonLink', val)}
            visual={form.ctaVisual}
            onVisualChange={(val) => update('ctaVisual', val)}
          />
        </TabsContent>

        {/* TAB 5: TECH USED */}
        <TabsContent value="tech" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Technologies & Frameworks</h2>
            <p className="text-xs text-muted-foreground">Select the tech stacks, programming languages, and tools deployed in this project.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-xs font-semibold">Associated Tech Stacks</FormLabel>
                <p className="text-xs text-muted-foreground">Click technologies to link them to this project showcase.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsAddTechStackOpen(true)}
                className="gap-1.5 text-xs rounded-xl cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>New Tech Stack</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1 custom-scrollbar">
              {techStacks.map((stk) => {
                const selected = form.techStacks?.includes(stk.id);
                return (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => {
                      const current = form.techStacks || [];
                      update(
                        'techStacks',
                        selected ? current.filter((id) => id !== stk.id) : [...current, stk.id]
                      );
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer shadow-xs',
                      selected
                        ? 'bg-primary/10 border-primary text-foreground shadow-glow-sm'
                        : 'bg-surface-1 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
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
                        'w-4 h-4 rounded-md border flex items-center justify-center shrink-0',
                        selected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                      )}
                    >
                      {selected && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
              {techStacks.length === 0 && (
                <div className="col-span-full p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                  No tech stacks registered yet. Click &quot;New Tech Stack&quot; above to create one.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 6: DEPLOYMENT */}
        <TabsContent value="deployment" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Live Deployment & Code Repositories</h2>
            <p className="text-xs text-muted-foreground">Verify URLs and external links to the production application and open-source repositories.</p>
          </div>

          <div className="space-y-4">
            <InputBlock
              label="Live Production URL"
              value={form.liveLink}
              onChange={(e) => update('liveLink', e.target.value)}
              placeholder="https://app.example.com"
              description="Direct hyperlink to the deployed application, staging instance, or digital product."
            />

            <InputBlock
              label="Source Code Repository (Optional)"
              value={form.gitRepository || ''}
              onChange={(e) => update('gitRepository', e.target.value)}
              placeholder="https://github.com/organization/repository"
              description="Optional public GitHub, GitLab, or Bitbucket link for open-source verification."
            />
          </div>
        </TabsContent>

        {/* TAB 7: SEO */}
        <TabsContent value="seo" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <SeoFields
            type="Product"
            sourceTitle={form.title}
            sourceShortDescription={form.shortDescription}
            sourceDisplayPicture={form.displayPicture}
            sourceTags={form.tags}
            sourceCategory={form.category}
            sourceLiveLink={form.liveLink}
            metaTitle={form.metaTitle || ''}
            onMetaTitleChange={(val) => update('metaTitle', val)}
            metaDescription={form.metaDescription || ''}
            onMetaDescriptionChange={(val) => update('metaDescription', val)}
            slug={form.slug}
            onSlugChange={(val) => update('slug', slugify(val))}
            pathPrefix="products"
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
            Editing: <strong className="text-foreground">{form.title || 'Untitled Project'}</strong>
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
          <Link to="/admin/products">
            <Button variant="ghost" size="sm" type="button" className="rounded-xl">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-xl shadow-glow-primary gap-2 min-w-[140px] font-bold cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Publish Project'}</span>
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
                  update('techStacks', [...(form.techStacks || []), newStack.id]);
                  setIsAddTechStackOpen(false);
                  addToast(`Tech stack "${newStack.name}" created and attached`, 'success');
                } catch (err: any) {
                  addToast(err?.message || 'Failed to create tech stack', 'error');
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
        targetType="Product"
        existingCategories={projectCategories}
        onApplyProduct={handleApplyProductImport}
      />
    </div>
  );
};

export default AdminProductEditPage;
