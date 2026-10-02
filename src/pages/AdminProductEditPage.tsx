import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon, 
  FolderPlus, 
  Globe, 
  Github, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Layers, 
  X, 
  Check,
  ExternalLink,
  Briefcase,
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
  Project, 
  ProjectDeliveredUnit, 
  ProjectValueItem,
  TechStack
} from '@/types';
import { 
  slugify, 
  isProjectSlugUnique, 
  isValidUrl, 
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
    { icon: 'CheckCircle2', title: 'Live Deployed Instance', description: 'Production release with high availability infrastructure' },
    { icon: 'CheckCircle2', title: 'Source Code Repository', description: 'Well-documented codebase with continuous integration' }
  ],
  deliveredWithin: {
    unit: 'Weeks',
    range: '3–6'
  },

  techStacks: [],

  liveLink: '',
  gitRepository: '',

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
    addProjectCategory,
    addTechStack 
  } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState<Project>(() => emptyProject(services[0]?.id || ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [valueSubTab, setValueSubTab] = useState<'features' | 'deliverables' | 'timeline'>('features');

  // Inline "Add Category" state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Inline "Add Tech Stack" modal state
  const [isAddTechStackOpen, setIsAddTechStackOpen] = useState(false);
  const [isSavingTechStack, setIsSavingTechStack] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const existing = products.find((p) => p.id === id || p.slug === id);
      if (existing) {
        setForm(normalizeProject(existing, services[0]?.id || ''));
        setSlugCustomized(true);
      } else if (products.length > 0) {
        addToast('Project node not found', 'error');
        navigate('/admin/products');
      }
    } else if (services.length > 0 && !form.parentService) {
      setForm((prev) => ({ ...prev, parentService: services[0].id }));
    }
  }, [id, isEditing, products, services, navigate, addToast]);

  const update = <K extends keyof Project>(key: K, val: Project[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleTitleChange = (val: string) => {
    update('title', val);
    if (!slugCustomized) {
      update('slug', slugify(val));
    }
  };

  // Inline Category Creation
  const handleCreateCategory = async () => {
    setCategoryError('');
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('Category name cannot be empty');
      return;
    }
    try {
      const created = await addProjectCategory(trimmed);
      update('category', created);
      setNewCategoryName('');
      setIsAddingCategory(false);
      addToast(`Category "${created}" added`, 'success');
    } catch (err: any) {
      setCategoryError(err?.message || 'Failed to add category');
    }
  };

  // Inline Tech Stack Creation
  const handleSaveNewTechStack = async (data: TechStack) => {
    setIsSavingTechStack(true);
    try {
      await addTechStack(data);
      update('techStacks', [...(form.techStacks || []), data.id]);
      setIsAddTechStackOpen(false);
      addToast(`Tech stack "${data.name}" registered`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to add tech stack', 'error');
    } finally {
      setIsSavingTechStack(false);
    }
  };

  // Repeatable Core Features Management
  const addFeature = () => {
    const next: ProjectValueItem = {
      icon: 'CheckCircle2',
      title: '',
      description: ''
    };
    update('coreFeatures', [...form.coreFeatures, next]);
  };

  const updateFeature = (index: number, patch: Partial<ProjectValueItem>) => {
    const list = [...form.coreFeatures];
    list[index] = { ...list[index], ...patch };
    update('coreFeatures', list);
  };

  const removeFeature = (index: number) => {
    update('coreFeatures', form.coreFeatures.filter((_, i) => i !== index));
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const list = [...form.coreFeatures];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    update('coreFeatures', list);
  };

  // Repeatable Deliverables Management
  const addDeliverable = () => {
    const next: ProjectValueItem = {
      icon: 'CheckCircle2',
      title: '',
      description: ''
    };
    update('deliverables', [...form.deliverables, next]);
  };

  const updateDeliverable = (index: number, patch: Partial<ProjectValueItem>) => {
    const list = [...form.deliverables];
    list[index] = { ...list[index], ...patch };
    update('deliverables', list);
  };

  const removeDeliverable = (index: number) => {
    update('deliverables', form.deliverables.filter((_, i) => i !== index));
  };

  const moveDeliverable = (index: number, direction: 'up' | 'down') => {
    const list = [...form.deliverables];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    update('deliverables', list);
  };

  // Save Validation & Submission
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Validate Title
    if (!form.title.trim()) {
      addToast('Project title is required in Basic Details', 'error');
      setActiveTab('basic');
      return;
    }

    // 2. Validate Slug
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

    // 3. Slug Uniqueness check
    const currentId = form.id || id || `prj_${Math.random().toString(36).substring(2, 9)}`;
    const isUnique = isProjectSlugUnique(cleanSlug, currentId, products);
    if (!isUnique) {
      addToast(`A project with the slug "${cleanSlug}" already exists. Please choose a unique slug.`, 'error');
      setActiveTab('basic');
      return;
    }

    // 4. Validate Parent Service
    if (!form.parentService.trim()) {
      addToast('Parent Service selection is required', 'error');
      setActiveTab('basic');
      return;
    }

    // 5. Validate Short & Full Description
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

    // 6. Validate Media
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

    // 7. Validate Deployment URLs
    if (!form.liveLink.trim()) {
      addToast('Live URL is required in the Deployment tab', 'error');
      setActiveTab('deployment');
      return;
    }
    if (!isValidUrl(form.liveLink)) {
      addToast('Live URL must be a valid web address (e.g. https://example.com)', 'error');
      setActiveTab('deployment');
      return;
    }

    if (form.gitRepository && form.gitRepository.trim() && !isValidUrl(form.gitRepository)) {
      addToast('Git repository must be a valid web URL (e.g. https://github.com/org/repo)', 'error');
      setActiveTab('deployment');
      return;
    }

    // Mutually exclusive active/inactive cleanup on save:
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

      // Backward compatibility aliases
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
        addToast('Project updated successfully', 'success');
      } else {
        await addProduct(payload);
        addToast('Project created successfully', 'success');
      }
      navigate('/admin/products');
    } catch (error: any) {
      addToast(error.message || 'Failed to save project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === form.parentService);

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Top Breadcrumbs & Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Link to="/admin/products">
              <Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground hover:text-foreground -ml-2.5 cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Projects
              </Button>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">
              {isEditing ? 'Edit Project' : 'New Project'}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-glow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {isEditing ? (form.title ? `Edit: ${form.title}` : 'Edit Project') : 'Create Project'}
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure project specifications, media assets, value delivery metrics, technology stack, and production URLs.
          </p>
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
              title="Open live Product Details page in another tab"
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
          {isEditing && form.liveLink && (
            <a href={form.liveLink} target="_blank" rel="noopener noreferrer">
              <Button variant="glass" size="sm" type="button" className="rounded-xl gap-1.5 cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" /> External Demo
              </Button>
            </a>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-xl shadow-glow-primary gap-2 min-w-[130px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </div>

      {/* Main 6-Tab Form */}
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
              <Sparkles className="w-3.5 h-3.5" /> Value & Delivery
            </TabsTrigger>
            <TabsTrigger value="tech" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Layers className="w-3.5 h-3.5" /> Tech Used
            </TabsTrigger>
            <TabsTrigger value="deployment" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Globe className="w-3.5 h-3.5" /> Deployment
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2 text-xs h-9 px-3.5 rounded-xl shrink-0">
              <Eye className="w-3.5 h-3.5" /> Entry Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: BASIC DETAILS                                                     */}
        {/* ========================================================================= */}
        <TabsContent value="basic" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Project Identity & Classification</h2>
            <p className="text-xs text-muted-foreground">Title, unique slug, parent service mapping, description, tags, and visibility status.</p>
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
              placeholder="e.g. distributed-cloud-monitoring-suite"
              required
              description="URL-friendly identifier. Must be unique across all projects."
            />
          </div>

          <InputBlock
            label="Caption"
            value={form.caption || ''}
            onChange={(e) => update('caption', e.target.value)}
            placeholder="e.g. Real-time telemetry pipeline handling 50k events/sec"
            description="Short punchy tagline or hero hook."
          />

          <TextareaBlock
            label="Short Description"
            value={form.shortDescription}
            onChange={(e) => update('shortDescription', e.target.value)}
            rows={2}
            placeholder="Concise overview for portfolio cards, preview grids, and index listings..."
            required
            description="Brief teaser summary rendered on showcase cards and search snippets."
          />

          <MarkdownEditor
            label="Full Description"
            value={form.fullDescription}
            onChange={(v) => update('fullDescription', v)}
            rows={8}
            placeholder="Write comprehensive case-study specifications, architectural challenge, solution, and outcomes in Markdown..."
            required
            description="Full case study documentation. Supports Markdown syntax with live preview."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Category Lookup with Inline Add Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel required className="text-xs font-semibold">Project Category</FormLabel>
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
                    <span>Create Project Category</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setCategoryError('');
                        setNewCategoryName('');
                      }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
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
                        setCategoryError('');
                      }}
                      placeholder="e.g. Edge Computing, FinTech Engine"
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
                      onClick={handleCreateCategory}
                      className="h-9 px-3 text-xs gap-1 cursor-pointer"
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
                    onChange={(e) => update('category', e.target.value)}
                    className="w-full h-11 px-3.5 text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  >
                    {projectCategories.map((cat) => (
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

            {/* Parent Service Model Select */}
            <div className="space-y-2">
              <FormLabel required className="text-xs font-semibold">Parent Service (Discipline)</FormLabel>
              <div className="relative">
                <select
                  value={form.parentService}
                  onChange={(e) => update('parentService', e.target.value)}
                  className="w-full h-11 px-3.5 text-sm rounded-xl bg-surface-1 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                >
                  <option value="">Select Parent Service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title || s.name} ({s.category})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              {selectedService && (
                <p className="text-[11px] text-muted-foreground">
                  Mapped to service: <strong className="text-foreground">{selectedService.title || selectedService.name}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <TagInput
            label="Tags"
            description="Search tags and filtering keywords. Type and press comma or enter."
            value={form.tags}
            onChange={(tags) => update('tags', tags)}
            placeholder="saas, cloud, kubernetes, realtime..."
          />

          {/* Status & Sorting */}
          <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <SwitchBlock
              label="Active Status"
              description="Make visible on public site (inactive projects are hidden)."
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

            <InputBlock
              label="Display Order"
              type="number"
              value={form.order}
              onChange={(e) => update('order', Number(e.target.value) || 0)}
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
            <h2 className="text-base font-semibold text-foreground">Media & Visual Assets</h2>
            <p className="text-xs text-muted-foreground">Configure project symbol (icon or badge image), required display screenshot, hero banner, and showcase gallery.</p>
          </div>

          {/* Icon Type Segmented Control */}
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
                <span>Media Image</span>
              </button>
            </div>
          </div>

          {/* Conditional Icon / Image input */}
          <div className="p-4 rounded-2xl bg-surface-1 border border-border space-y-4">
            {form.iconType === 'icon' ? (
              <div className="space-y-2">
                <IconPicker
                  label="Select Project Icon"
                  value={form.icon || 'ShoppingBag'}
                  onChange={(val) => update('icon', val)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Choose an icon representing this project from Lucide, Remix Icon, or Heroicons.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageInput
                  label="Project Badge Image"
                  value={form.iconImage || null}
                  onChange={(val) => update('iconImage', val || '')}
                  required
                  description="Choose a project badge or logo asset from the media library."
                />
              </div>
            )}
          </div>

          {/* Display Picture (Required) */}
          <ImageInput
            label="Display Picture"
            value={form.displayPicture || null}
            onChange={(val) => update('displayPicture', val || '')}
            required
            description="Primary screenshot or hero visual used on showcase cards, modal previews, and index grids."
          />

          {/* Banner Picture (Optional, falls back to displayPicture) */}
          <ImageInput
            label="Banner Picture (Optional)"
            value={form.bannerPicture || null}
            onChange={(val) => update('bannerPicture', val || '')}
            description="Wide hero banner displayed at the top of the project details page. If omitted, falls back to Display Picture."
          />

          {/* Gallery Collection */}
          <ImagesInput
            label="Showcase Gallery"
            value={form.gallery || []}
            onChange={(val) => update('gallery', val)}
            description="Artifacts, UI screenshots, and architecture diagrams from the unified media library."
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: VALUE & DELIVERY                                                  */}
        {/* ========================================================================= */}
        <TabsContent value="value" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Value Proposition & Timeline</h2>
            <p className="text-xs text-muted-foreground">Enumerate key project capabilities, deliverables, and total delivery turnaround.</p>
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
                  <p className="text-xs text-muted-foreground">Repeatable capability items each with an icon, title, and description.</p>
                </div>
                <Button type="button" size="sm" onClick={addFeature} className="gap-1 text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </Button>
              </div>

              <div className="space-y-3">
                {form.coreFeatures.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                    No core features added yet. Click &quot;Add Feature&quot; to specify capabilities.
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
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFeature(index, 'down')}
                          disabled={index === form.coreFeatures.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1 cursor-pointer"
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
                          placeholder="e.g. Distributed Telemetry Pipeline"
                          required
                        />
                      </div>
                    </div>

                    <TextareaBlock
                      label="Description"
                      value={feat.description}
                      onChange={(e) => updateFeature(index, { description: e.target.value })}
                      rows={2}
                      placeholder="Briefly describe what this capability delivers..."
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
                  <p className="text-xs text-muted-foreground">Repeatable deliverables engineered in this project.</p>
                </div>
                <Button type="button" size="sm" onClick={addDeliverable} className="gap-1 text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add Deliverable
                </Button>
              </div>

              <div className="space-y-3">
                {form.deliverables.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                    No deliverables specified yet.
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
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDeliverable(index, 'down')}
                          disabled={index === form.deliverables.length - 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDeliverable(index)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1 cursor-pointer"
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
                          placeholder="e.g. Terraform Infrastructure Scripts"
                          required
                        />
                      </div>
                    </div>

                    <TextareaBlock
                      label="Description"
                      value={deliv.description}
                      onChange={(e) => updateDeliverable(index, { description: e.target.value })}
                      rows={2}
                      placeholder="Provide details on the handover specification..."
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Sub-Tab 3: Delivery Timeframe */}
            <TabsContent value="timeline" className="space-y-4 mt-2">
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
                    value={form.deliveredWithin.range !== undefined ? String(form.deliveredWithin.range) : ''}
                    onChange={(e) => update('deliveredWithin', {
                      ...form.deliveredWithin,
                      range: e.target.value
                    })}
                    placeholder="e.g. 3–6 or 30"
                    description={`Specify expected number or range of ${form.deliveredWithin.unit.toLowerCase()}`}
                    required
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-muted/20 border border-border text-xs text-muted-foreground flex items-center">
                    Duration range number is hidden when delivery depends upon project scope.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: TECH USED                                                         */}
        {/* ========================================================================= */}
        <TabsContent value="tech" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Technology Stack Employed</h2>
            <p className="text-xs text-muted-foreground">Multi-select technologies used in this project directly from your Tech Stack model.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-sm font-semibold">Technologies</FormLabel>
                <p className="text-xs text-muted-foreground">Select all frameworks, databases, and libraries used to build this project.</p>
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
                        update('techStacks', current.filter((id) => id !== stk.id && id !== stk.name));
                      } else {
                        update('techStacks', [...current, stk.id]);
                      }
                    }}
                    className={cn(
                      'p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer shadow-xs',
                      selected
                        ? 'bg-primary/10 border-primary text-foreground shadow-glow-sm'
                        : 'bg-surface-1 border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
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
                      'w-4 h-4 rounded-md border flex items-center justify-center shrink-0',
                      selected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                    )}>
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
              {techStacks.length === 0 && (
                <div className="col-span-full p-6 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                  No technologies registered yet. Click &quot;Add Tech Stack&quot; to create one.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: DEPLOYMENT                                                        */}
        {/* ========================================================================= */}
        <TabsContent value="deployment" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Production Deployment & Repository</h2>
            <p className="text-xs text-muted-foreground">Provide verified live URLs and optional public source repository links.</p>
          </div>

          <div className="space-y-4">
            <InputBlock
              label="Live Production Link"
              required
              description="Direct URL to the live web application or download page. Must start with http:// or https://."
              value={form.liveLink}
              onChange={(e) => update('liveLink', e.target.value)}
              placeholder="https://app.example.com"
              startIcon={<Globe className="h-4 w-4 text-primary" />}
            />

            <InputBlock
              label="Git Repository (Optional - Public repos only)"
              description="Direct URL to public GitHub, GitLab, or Bitbucket repository."
              value={form.gitRepository || ''}
              onChange={(e) => update('gitRepository', e.target.value)}
              placeholder="https://github.com/organization/repository"
              startIcon={<Github className="h-4 w-4 text-foreground/70" />}
            />

            {isEditing && (
              <div className="pt-4 border-t border-border/40 text-[11px] font-mono text-muted-foreground space-y-1">
                <div>Project ID: <span className="text-foreground">{form.id}</span></div>
                <div>Slug: <span className="text-foreground">{form.slug}</span></div>
                <div>Created: <span className="text-foreground">{form.createdAt ? new Date(form.createdAt).toLocaleString() : 'N/A'}</span></div>
                <div>Last Updated: <span className="text-foreground">{form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'N/A'}</span></div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: ENTRY PREVIEW                                                     */}
        {/* ========================================================================= */}
        <TabsContent value="preview" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Live Entry Preview
              </h2>
              <p className="text-xs text-muted-foreground">Comprehensive real-time preview of how this project entry and its Markdown specifications render on the public site.</p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              {form.active !== false ? 'Status: Active' : 'Status: Draft / Inactive'}
            </Badge>
          </div>

          <div className="rounded-2xl border border-border/70 bg-surface-1 overflow-hidden">
            {/* Header Hero Area */}
            {form.displayPicture && (
              <div className="w-full h-56 md:h-72 overflow-hidden relative bg-surface-3">
                <img 
                  src={form.displayPicture} 
                  alt={form.title || 'Project banner'} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold">
                      {form.category || 'Engineering'}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {form.title || 'Untitled Project Entry'}
                    </h1>
                  </div>
                  {form.liveLink && (
                    <a href={form.liveLink} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-1.5 shadow-glow-primary text-xs">
                        <Globe className="w-3.5 h-3.5" /> Visit Site
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 md:p-8 space-y-8">
              {!form.displayPicture && (
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold">
                    {form.category || 'Engineering'}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-2">
                    {form.title || 'Untitled Project Entry'}
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

              {/* Markdown Documentation Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                    Project Documentation & Case Study (Markdown)
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
                    Core Capabilities & Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {form.coreFeatures.map((feat, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-surface-2 border border-border/60 space-y-1">
                        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{feat.title || `Feature ${idx + 1}`}</span>
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
                    Deliverables
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
        <span className="text-xs text-muted-foreground">
          {form.title ? `Configuring "${form.title}"` : 'New Project'}
        </span>

        <div className="flex items-center gap-3">
          <Link to="/admin/products">
            <Button variant="ghost" size="sm" type="button" className="rounded-xl cursor-pointer">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-xl shadow-glow-primary gap-2 min-w-[140px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </div>

      {/* Add Tech Stack Modal */}
      <Dialog open={isAddTechStackOpen} onOpenChange={setIsAddTechStackOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Tech Stack</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <TechStackForm
              onSubmit={handleSaveNewTechStack}
              onCancel={() => setIsAddTechStackOpen(false)}
              isLoading={isSavingTechStack}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProductEditPage;
