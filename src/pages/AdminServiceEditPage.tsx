import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon, 
  FolderTree, 
  DollarSign, 
  FileText, 
  Code, 
  Search, 
  Sliders,
  ExternalLink,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/Button';
import { 
  InputBlock, 
  TextareaBlock, 
  SwitchBlock, 
  FormField, 
  FormLabel 
} from '@/components/forms/FormControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { IconPicker } from '@/components/admin/IconPicker';
import { ListInput } from '@/components/admin/ListInput';
import { ImageInput } from '@/components/admin/ImageInput';
import { ImagesInput } from '@/components/admin/ImagesInput';
import { useAppStore } from '@/store';
import { useToastStore } from '@/store/toastStore';
import { Service, ServiceCategory, PricingType, PricingUnit, CtaAction } from '@/types';
import { cn } from '@/lib/utils';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const emptyService = (): Service => ({
  id: "",
  slug: "",
  name: "",
  icon: "Briefcase",
  caption: "",
  header: "",
  shortDescription: "",
  fullDescription: "",
  thumbnail: "",
  bannerImage: "",
  gallery: [],
  category: ServiceCategory.DEVELOPMENT,
  tags: [],
  features: [],
  deliverables: [],
  pricing: { type: 'custom', note: 'Contact for quote' } as any,
  estimatedDuration: "",
  technologies: [],
  relatedProjects: [],
  cta: { label: "Schedule a consultation", action: 'contact' },
  seo: {},
  isActive: true,
  isFeatured: false,
  order: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminServiceEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { services, products, addService, updateService } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);

  const [form, setForm] = useState<Service>(emptyService());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    if (isEditing && id) {
      const existing = services.find((s) => s.id === id || s.slug === id);
      if (existing) {
        setForm({ ...existing });
      } else if (services.length > 0) {
        addToast("Service not found", "error");
        navigate("/admin/services");
      }
    }
  }, [id, isEditing, services, navigate, addToast]);

  const update = <K extends keyof Service>(key: K, val: Service[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      addToast("Service name is required", "error");
      setActiveTab("content");
      return;
    }

    const slug = (form.slug || slugify(form.name)).trim();
    const serviceId = isEditing ? (form.id || id || slug) : (form.id || slug);

    const payload: Service = {
      ...form,
      id: serviceId,
      slug,
      header: form.header || form.name,
      caption: form.caption || form.shortDescription,
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateService(payload);
        addToast("Service updated successfully", "success");
      } else {
        if (services.some((s) => s.id === serviceId)) {
          addToast("A service with this ID or slug already exists", "error");
          setIsSubmitting(false);
          return;
        }
        await addService(payload);
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
              {isEditing ? "Edit Node" : "New Node"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-glow">
              <Briefcase className="w-5 h-5" />
            </div>
            {isEditing ? (form.name ? `Edit: ${form.name}` : 'Edit Service') : 'Create New Service'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEditing 
              ? `Manage system capabilities, media assets, pricing matrix, and search discoverability for this service node.`
              : `Define a new studio capability with full metadata, pricing models, portfolio attachments, and SEO tags.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
          <Link to="/admin/services">
            <Button variant="ghost" size="sm" type="button" className="rounded-xl">
              Cancel
            </Button>
          </Link>
          {isEditing && form.slug && (
            <a href={`/services/${form.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="glass" size="sm" type="button" className="rounded-xl gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> View Live
              </Button>
            </a>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-xl shadow-glow-primary gap-2 min-w-[130px]"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Service"}
          </Button>
        </div>
      </div>

      {/* Main Tabbed Form Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Tab Controls Bar */}
        <TabsList className="max-w-full gap-1">
          <TabsTrigger value="content" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <FileText className="w-3.5 h-3.5" /> Content
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <ImageIcon className="w-3.5 h-3.5" /> Media
          </TabsTrigger>
          <TabsTrigger value="organize" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <FolderTree className="w-3.5 h-3.5" /> Categorization
          </TabsTrigger>
          <TabsTrigger value="value" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <Sparkles className="w-3.5 h-3.5" /> Deliverables
          </TabsTrigger>
          <TabsTrigger value="commercial" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <DollarSign className="w-3.5 h-3.5" /> Pricing & CTA
          </TabsTrigger>
          <TabsTrigger value="tech" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <Code className="w-3.5 h-3.5" /> Tech Stack
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <Search className="w-3.5 h-3.5" /> SEO
          </TabsTrigger>
          <TabsTrigger value="control" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <Sliders className="w-3.5 h-3.5" /> System & Status
          </TabsTrigger>
        </TabsList>

        {/* Tab: Content */}
        <TabsContent value="content" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <h2 className="text-base font-semibold text-foreground">Core Service Identity</h2>
              <p className="text-xs text-muted-foreground">Primary service title, URL slug, and visual icon identifiers.</p>
            </div>
            {form.isActive ? (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 flex items-center gap-1.5 font-mono text-[10px]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> ACTIVE IN PRODUCTION
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border bg-muted/20 flex items-center gap-1.5 font-mono text-[10px]">
                <EyeOff className="w-3 h-3" /> DRAFT / HIDDEN
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputBlock
              label="Name (Title)"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((p) => ({
                  ...p,
                  name,
                  slug: isEditing ? p.slug : slugify(name),
                  header: p.header || name,
                }));
              }}
              placeholder="E.g. Web Development"
              required
            />
            <InputBlock
              label="Slug (URL Identifier)"
              value={form.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
              placeholder="web-development"
              addonLeft="services/"
              required
            />
          </div>

          <IconPicker 
            value={form.icon || ""} 
            onChange={(val) => update("icon", val)} 
            label="Service Visual Identity"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputBlock
              label="Header (Detail Title)"
              value={form.header}
              onChange={(e) => update("header", e.target.value)}
              placeholder="The Ultimate Web Solution"
              required
            />

            <InputBlock
              label="Caption (Hero Hook)"
              value={form.caption}
              onChange={(e) => update("caption", e.target.value)}
              placeholder="Building for the next generation"
              required
            />
          </div>

          <TextareaBlock
            label="Short Description"
            description="Brief summary for registry indexing cards and public listings."
            rows={2}
            value={form.shortDescription}
            onChange={(e) => update("shortDescription", e.target.value)}
            placeholder="Brief summary for indexing..."
            required
          />

          <TextareaBlock
            label="Full Description (Markdown Compatible)"
            description="Comprehensive engineering specifications and detailed process documentation."
            rows={6}
            value={form.fullDescription}
            onChange={(e) => update("fullDescription", e.target.value)}
            placeholder="Detailed engineering specifications..."
            required
          />
        </TabsContent>

        {/* Tab: Media */}
        <TabsContent value="media" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Media Assets</h2>
            <p className="text-xs text-muted-foreground">Select thumbnail images, hero banners, and project screenshot showcase galleries.</p>
          </div>

          <ImageInput
            label="Thumbnail (Grid Image)"
            value={form.thumbnail}
            onChange={(v) => update("thumbnail", v || "")}
            required
            description="Primary preview image used on service cards, showcases, and directory grids."
          />
          <ImageInput
            label="Banner (Hero Image)"
            value={form.bannerImage || ""}
            onChange={(v) => update("bannerImage", v || "")}
            description="Wide hero banner displayed at the top of the individual service details page."
          />
          <ImagesInput
            label="Gallery (Showcase)"
            value={form.gallery || []}
            onChange={(v) => update("gallery", v)}
            description="Additional screenshots, architectural diagrams, and sample visual deliverables."
          />
        </TabsContent>

        {/* Tab: Organize */}
        <TabsContent value="organize" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Categorization & Taxonomy</h2>
            <p className="text-xs text-muted-foreground">Classify the service domain and tag it with searchable technical keywords.</p>
          </div>

          <FormField label="Category Classification" required description="Primary functional discipline for filtering and navigation menus">
            <Select
              value={form.category}
              onValueChange={(v) => update("category", v as ServiceCategory)}
            >
              <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                {Object.values(ServiceCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <ListInput
            label="Service Taxonomy Tags"
            value={form.tags || []}
            onChange={(v) => update("tags", v)}
            placeholder="web, react, fullstack, modern..."
            description="Search tags used for matching queries and related capability pills."
          />
        </TabsContent>

        {/* Tab: Value */}
        <TabsContent value="value" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Capabilities & Concrete Deliverables</h2>
            <p className="text-xs text-muted-foreground">List the exact benefits, technical features, and tangible items clients receive.</p>
          </div>

          <ListInput
            label="Core Capabilities & Features"
            value={form.features || []}
            onChange={(v) => update("features", v)}
            placeholder="Add an architectural capability or feature..."
            description="Primary technical capabilities and client advantages."
          />

          <ListInput
            label="Concrete Deliverables"
            value={form.deliverables || []}
            onChange={(v) => update("deliverables", v)}
            placeholder="Add a tangible output item..."
            description="Documented outputs, assets, code repos, and launch assets delivered upon project completion."
          />
        </TabsContent>

        {/* Tab: Commercial */}
        <TabsContent value="commercial" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Commercial Model & Conversion</h2>
            <p className="text-xs text-muted-foreground">Specify pricing tiers, billing frequency, delivery timeframes, and call-to-action behaviors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Pricing Structure">
              <Select
                value={form.pricing?.type || 'custom'}
                onValueChange={(v) =>
                  update("pricing", { ...form.pricing, type: v as PricingType } as any)
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="starting_from">Starting From</SelectItem>
                  <SelectItem value="custom">Custom Consultation Quote</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <InputBlock
              label="Currency Code"
              value={form.pricing?.currency ?? ""}
              onChange={(e) => update("pricing", { ...form.pricing, currency: e.target.value } as any)}
              placeholder="USD"
            />

            <InputBlock
              label="Starting Amount"
              type="number"
              value={form.pricing?.amount ?? ""}
              onChange={(e) =>
                update("pricing", {
                  ...form.pricing,
                  amount: e.target.value === "" ? 0 : Number(e.target.value),
                } as any)
              }
              placeholder="1500"
            />

            <FormField label="Billing Unit">
              <Select
                value={form.pricing?.unit || 'project'}
                onValueChange={(v) =>
                  update("pricing", { ...form.pricing, unit: v as PricingUnit } as any)
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Per Project</SelectItem>
                  <SelectItem value="month">Per Month (Retainer)</SelectItem>
                  <SelectItem value="hour">Per Hour</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <InputBlock
            label="Estimated Timeline / Duration"
            value={form.estimatedDuration || ""}
            onChange={(e) => update("estimatedDuration", e.target.value)}
            placeholder="2–4 weeks"
            description="Typical delivery window for standard projects."
          />

          <div className="pt-4 border-t border-border/50 space-y-4">
            <FormLabel className="text-sm font-semibold">Call to Action (CTA)</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputBlock
                label="Button Text"
                value={form.cta?.label || ""}
                onChange={(e) => update("cta", { ...form.cta, label: e.target.value } as any)}
                placeholder="Schedule Consultation"
              />
              <FormField label="Action Behavior">
                <Select
                  value={form.cta?.action || 'contact'}
                  onValueChange={(v) => update("cta", { ...form.cta, action: v as CtaAction } as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Open Contact Form</SelectItem>
                    <SelectItem value="quote">Request Detailed Quote</SelectItem>
                    <SelectItem value="external">Navigate External URL</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            {form.cta?.action === 'external' && (
              <InputBlock
                label="External Destination URL"
                value={form.cta?.link || ""}
                onChange={(e) => update("cta", { ...form.cta, link: e.target.value } as any)}
                placeholder="https://..."
              />
            )}
          </div>
        </TabsContent>

        {/* Tab: Tech */}
        <TabsContent value="tech" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Technology Stack & Showcase Links</h2>
            <p className="text-xs text-muted-foreground">Enumerate software technologies used and cross-link products registered in the portfolio.</p>
          </div>

          <ListInput
            label="Technologies & Frameworks"
            value={form.technologies || []}
            onChange={(v) => update("technologies", v)}
            placeholder="React, TypeScript, Next.js, Node.js, AWS..."
            description="Core languages, libraries, platforms, and databases employed."
          />

          <div className="space-y-3 pt-2">
            <div>
              <FormLabel className="text-sm font-semibold">Portfolio Product Links</FormLabel>
              <p className="text-xs text-muted-foreground mt-0.5">Click to toggle products built using this service capability:</p>
            </div>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {products.map((p) => {
                const active = (form.relatedProjects || []).includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      update(
                        "relatedProjects",
                        active
                          ? form.relatedProjects!.filter((id) => id !== p.id)
                          : [...(form.relatedProjects || []), p.id],
                      )
                    }
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center gap-2",
                      active
                        ? "bg-primary border-primary text-primary-foreground shadow-glow"
                        : "bg-muted/40 border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />}
                    {p.name}
                  </button>
                );
              })}
              {products.length === 0 && (
                <div className="text-xs text-muted-foreground italic bg-muted/20 p-4 rounded-xl w-full border border-border/40">
                  No products registered in the studio database yet.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: SEO */}
        <TabsContent value="seo" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Search Engine Optimization (SEO)</h2>
            <p className="text-xs text-muted-foreground">Fine-tune search previews, browser titles, and social discovery tags.</p>
          </div>

          <InputBlock
            label="Meta Title"
            description="Page title tag for search engine indexing and browser tabs."
            value={form.seo?.metaTitle ?? ""}
            onChange={(e) => update("seo", { ...form.seo, metaTitle: e.target.value })}
            placeholder="Web Development Services | Wise Byte Concepts"
          />
          <TextareaBlock
            label="Meta Description"
            description="Meta description displayed under your link in search results."
            rows={3}
            value={form.seo?.metaDescription ?? ""}
            onChange={(e) => update("seo", { ...form.seo, metaDescription: e.target.value })}
            placeholder="Scalable, enterprise-ready web applications built with React and TypeScript..."
          />
          <ListInput
            label="SEO Keywords"
            value={form.seo?.keywords ?? []}
            onChange={(v) => update("seo", { ...form.seo, keywords: v })}
            placeholder="custom software, web design, react agency..."
            description="Target keywords for indexing algorithms."
          />
        </TabsContent>

        {/* Tab: System & Control */}
        <TabsContent value="control" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">System Governance & Display Order</h2>
            <p className="text-xs text-muted-foreground">Control live visibility, homepage spotlights, and sequence ordering.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SwitchBlock
              label="Production Visibility"
              description="Make this service active and visible on public pages."
              checked={form.isActive}
              onCheckedChange={(v) => update("isActive", v)}
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />
            <SwitchBlock
              label="Featured Spotlight"
              description="Promote on homepage showcase and priority menus."
              checked={form.isFeatured || false}
              onCheckedChange={(v) => update("isFeatured", v)}
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            />
          </div>

          <div className="max-w-xs">
            <InputBlock
              label="Node Sequence Order"
              description="Ascending numerical sequence order (0, 1, 2...)."
              type="number"
              value={form.order || 0}
              onChange={(e) => update("order", Number(e.target.value) || 0)}
              className="font-mono"
            />
          </div>

          {isEditing && (
            <div className="pt-4 border-t border-border/40 text-[11px] font-mono text-muted-foreground space-y-1">
              <div>Node ID: <span className="text-foreground">{form.id}</span></div>
              <div>Created: <span className="text-foreground">{form.createdAt ? new Date(form.createdAt).toLocaleString() : 'N/A'}</span></div>
              <div>Last Updated: <span className="text-foreground">{form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'N/A'}</span></div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-6 z-30 p-4 rounded-2xl bg-background/80 backdrop-blur-md border border-border/60 shadow-glass flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Editing {form.name || "Service Node"}
          </span>
          {form.isActive ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              Draft
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
            className="rounded-xl shadow-glow-primary gap-2 min-w-[140px]"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : isEditing ? "Update Service" : "Deploy Service"}
          </Button>
        </div>
      </div>
    </div>
  );
};
