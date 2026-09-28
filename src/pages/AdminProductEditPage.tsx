import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  ShoppingBag, 
  Globe, 
  Github, 
  Image as ImageIcon, 
  Layers, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/Button';
import { 
  InputBlock, 
  TextareaBlock, 
  FormField 
} from '@/components/forms/FormControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { IconPicker } from '@/components/admin/IconPicker';
import { ListInput } from '@/components/admin/ListInput';
import { ImageInput } from '@/components/admin/ImageInput';
import { useAppStore } from '@/store';
import { useToastStore } from '@/store/toastStore';
import { Product } from '@/types';

const emptyProduct = (): Product => ({
  id: "",
  name: "",
  description: "",
  serviceId: "",
  icon: "ShoppingBag",
  imageUrl: "",
  demoUrl: "",
  repoUrl: "",
  tags: [],
  order: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { products, services, addProduct, updateProduct } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);

  const [form, setForm] = useState<Product>(emptyProduct());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const existing = products.find((p) => p.id === id);
      if (existing) {
        setForm({ ...existing });
      } else if (products.length > 0) {
        addToast("Product not found", "error");
        navigate("/admin/products");
      }
    } else if (services.length > 0 && !form.serviceId) {
      // Default to first service if available
      setForm((prev) => ({ ...prev, serviceId: services[0].id }));
    }
  }, [id, isEditing, products, services, navigate, addToast]);

  const update = <K extends keyof Product>(key: K, val: Product[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      addToast("Product name is required", "error");
      return;
    }

    const productId = isEditing ? (form.id || id || Math.random().toString(36).substring(7)) : (form.id || Math.random().toString(36).substring(7));
    const payload: Product = {
      ...form,
      id: productId,
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateProduct(payload);
        addToast("Product updated successfully", "success");
      } else {
        await addProduct(payload);
        addToast("Product registered successfully", "success");
      }
      navigate("/admin/products");
    } catch (error: any) {
      addToast(error.message || "Failed to save product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === form.serviceId);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Top Breadcrumbs & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Link to="/admin/products">
              <Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground hover:text-foreground -ml-2.5">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Products
              </Button>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase">
              {isEditing ? "Edit Node" : "New Node"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-glow">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {isEditing ? (form.name ? `Edit: ${form.name}` : 'Edit Product') : 'Register Product Node'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEditing 
              ? `Manage product showcase credentials, associated studio service, visuals, and deployment links.`
              : `Create a showcase project entry linked to a core studio service with live deployment references.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
          <Link to="/admin/products">
            <Button variant="ghost" size="sm" type="button" className="rounded-xl">
              Cancel
            </Button>
          </Link>
          {isEditing && form.demoUrl && (
            <a href={form.demoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="glass" size="sm" type="button" className="rounded-xl gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Live Demo
              </Button>
            </a>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting} 
            className="rounded-xl shadow-glow-primary gap-2 min-w-[130px]"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Register Product"}
          </Button>
        </div>
      </div>

      {/* Main Tabbed Form Container */}
      <Tabs defaultValue="base" className="w-full space-y-6">
        {/* Tab Controls Bar */}
        <TabsList className="max-w-full gap-1">
          <TabsTrigger value="base" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <Layers className="w-3.5 h-3.5" /> Identity & Mapping
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <ImageIcon className="w-3.5 h-3.5" /> Media & Showcase
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2 text-xs h-8 px-3 rounded-lg shrink-0">
            <Globe className="w-3.5 h-3.5" /> Deployment & URLs
          </TabsTrigger>
        </TabsList>

        {/* Tab: Identity */}
        <TabsContent value="base" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <h2 className="text-base font-semibold text-foreground">Product Identity</h2>
              <p className="text-xs text-muted-foreground">General information, title, symbol, and parent service association.</p>
            </div>
            {selectedService && (
              <Badge variant="secondary" className="font-mono text-[10px] border-primary/20 text-primary">
                Mapped: {selectedService.name}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputBlock
              label="Product Name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Wise Cloud Dashboard"
            />
            <IconPicker 
              value={form.icon || ""} 
              onChange={(val) => update("icon", val)} 
              label="Product Symbol"
            />
          </div>

          <FormField label="Parent Service Discipline" description="Link this product showcase item to a studio capability" required>
            <Select
              value={form.serviceId}
              onValueChange={(v) => update("serviceId", v)}
            >
              <SelectTrigger><SelectValue placeholder="Select Parent Service" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <TextareaBlock
            label="Product Overview & Specifications"
            description="Comprehensive technical summary and showcase overview."
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe the product architecture, user experience, problem solved, and key metrics achieved..."
            required
          />

          <ListInput
            label="Product Taxonomy Tags"
            value={form.tags || []}
            onChange={(v) => update("tags", v)}
            placeholder="react, tailwind, node, saas..."
            description="Keywords used for filtering showcase entries across the portfolio."
          />
        </TabsContent>

        {/* Tab: Assets */}
        <TabsContent value="assets" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Media & Visual Assets</h2>
            <p className="text-xs text-muted-foreground">Attach high-resolution hero screenshots or mockup images for this product.</p>
          </div>

          <ImageInput
            label="Main Preview Screenshot"
            value={form.imageUrl || ""}
            onChange={(v) => update("imageUrl", v || "")}
            description="Primary screenshot or showcase illustration displayed in cards and modal viewers."
          />
        </TabsContent>

        {/* Tab: Deployment */}
        <TabsContent value="links" className="space-y-6 p-6 rounded-2xl bg-card border border-border/50 backdrop-blur-sm shadow-xs">
          <div className="pb-3 border-b border-border/40">
            <h2 className="text-base font-semibold text-foreground">Live Deployment & Source Code</h2>
            <p className="text-xs text-muted-foreground">Provide external addresses to the live web project and public/private repositories.</p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <InputBlock
              label="Live Production URL"
              description="Direct hyperlink to the deployed, live application."
              value={form.demoUrl || ""}
              onChange={(e) => update("demoUrl", e.target.value)}
              placeholder="https://example.com"
              startIcon={<Globe className="h-4 w-4 text-primary" />}
            />

            <InputBlock
              label="Repository URL"
              description="Public or private source code repository (GitHub, GitLab, etc.)."
              value={form.repoUrl || ""}
              onChange={(e) => update("repoUrl", e.target.value)}
              placeholder="https://github.com/organization/repo"
              startIcon={<Github className="h-4 w-4 text-foreground/70" />}
            />

            <div className="max-w-xs pt-2">
              <InputBlock
                label="Display Order Sequence"
                description="Numerical ordering position in showcase lists."
                type="number"
                value={form.order || 0}
                onChange={(e) => update("order", Number(e.target.value) || 0)}
                className="font-mono"
              />
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 border-t border-border/40 text-[11px] font-mono text-muted-foreground space-y-1">
              <div>Product Node ID: <span className="text-foreground">{form.id}</span></div>
              <div>Created: <span className="text-foreground">{form.createdAt ? new Date(form.createdAt).toLocaleString() : 'N/A'}</span></div>
              <div>Last Updated: <span className="text-foreground">{form.updatedAt ? new Date(form.updatedAt).toLocaleString() : 'N/A'}</span></div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-6 z-30 p-4 rounded-2xl bg-background/80 backdrop-blur-md border border-border/60 shadow-glass flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {form.name ? `Configuring ${form.name}` : "New Product Node"}
        </span>

        <div className="flex items-center gap-3">
          <Link to="/admin/products">
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
            {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Register Product"}
          </Button>
        </div>
      </div>
    </div>
  );
};
