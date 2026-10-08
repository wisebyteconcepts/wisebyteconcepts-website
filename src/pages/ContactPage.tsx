import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  CheckCircle2, 
  X, 
  Briefcase, 
  ShoppingBag, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Github, 
  Code2, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  Send, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { Service, Product, Query } from '@/types';
import { Button } from '@/components/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/GlassCard';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';

const DRAFT_STORAGE_KEY = 'wbc_contact_form_draft_v1';

const BUDGET_OPTIONS = [
  'Flexible / Scope TBD',
  '< $5,000',
  '$5,000 – $15,000',
  '$15,000 – $30,000',
  '$30,000+',
];

const TIMELINE_OPTIONS = [
  'Flexible / Exploration',
  'Urgent (< 1 Month)',
  '1 – 3 Months',
  '3 – 6 Months',
];

const CONTACT_METHODS = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
] as const;

type ContactMethod = (typeof CONTACT_METHODS)[number]['id'];

interface FormState {
  name: string;
  email: string;
  phone: string;
  contactMethod: ContactMethod;
  budget: string;
  timeline: string;
  message: string;
  honeypot: string;
}

interface SubmittedInquiry {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  contactMethod: ContactMethod;
  budget: string;
  timeline: string;
  message: string;
  services: Array<{ id: string; name: string; category?: string }>;
  projects: Array<{ id: string; name: string; parentService?: string }>;
}

export const ContactPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const services = useAppStore((state) => state.services);
  const products = useAppStore((state) => state.products);
  const addQuery = useAppStore((state) => state.addQuery);
  const updateQuery = useAppStore((state) => state.updateQuery);
  const isLoaded = useAppStore((state) => state.isLoaded);
  const { user } = useAuthStore();
  const isAdmin = Boolean(user);

  // Active services list
  const activeServices = useMemo(() => {
    return services
      .filter((s) => s.active !== false || isAdmin)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [services, isAdmin]);

  // Active products list
  const activeProducts = useMemo(() => {
    return products
      .filter((p) => p.active !== false || isAdmin)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [products, isAdmin]);

  // Selection state
  const [multiSelect, setMultiSelect] = useState<boolean>(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Form input state
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    contactMethod: 'email',
    budget: BUDGET_OPTIONS[0],
    timeline: TIMELINE_OPTIONS[0],
    message: '',
    honeypot: '',
  });

  // UI state
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<SubmittedInquiry | null>(null);
  const [mountedTime] = useState<number>(() => Date.now());

  // ---------------------------------------------------------------------------
  // 1. Initial State Restoration & Preselection from URL / Draft
  // ---------------------------------------------------------------------------
  const hasInitializedRef = useRef(false);
  const lastParamServiceRef = useRef<string | null>(null);
  const lastParamProjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const paramService = searchParams.get('service');
    const paramProject = searchParams.get('project');

    // Skip re-processing when searchParams was just updated by our own updateUrlParams
    if (
      hasInitializedRef.current &&
      paramService === lastParamServiceRef.current &&
      paramProject === lastParamProjectRef.current
    ) {
      return;
    }

    hasInitializedRef.current = true;
    lastParamServiceRef.current = paramService;
    lastParamProjectRef.current = paramProject;

    let restoredFromDraft = false;
    let initialServiceIds: string[] = [];
    let initialProjectIds: string[] = [];

    // First attempt restoring text fields from draft
    try {
      const rawDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          contactMethod: parsed.contactMethod || 'email',
          budget: parsed.budget || BUDGET_OPTIONS[0],
          timeline: parsed.timeline || TIMELINE_OPTIONS[0],
          message: parsed.message || '',
        }));

        if (!paramService && !paramProject) {
          if (Array.isArray(parsed.selectedServiceIds) && parsed.selectedServiceIds.length > 0) {
            initialServiceIds = parsed.selectedServiceIds.filter((id: string) => 
              services.some((s) => s.id === id)
            );
          }
          if (Array.isArray(parsed.selectedProjectIds) && parsed.selectedProjectIds.length > 0) {
            initialProjectIds = parsed.selectedProjectIds.filter((id: string) => 
              products.some((p) => p.id === id)
            );
          }
          if (typeof parsed.multiSelect === 'boolean') {
            setMultiSelect(parsed.multiSelect);
          }
          restoredFromDraft = true;
        }
      }
    } catch {
      // Ignore corrupted session storage
    }

    // URL Query Params take precedence for preselection:
    // (Requirement 3: From service details pass service ID -> auto-select service with none selected)
    // (Requirement 3: From project details pass project ID -> auto-select parent service + auto-select project)
    if (paramService || paramProject) {
      const validServiceIds: string[] = [];
      const validProjectIds: string[] = [];

      // Process Project parameter first
      if (paramProject) {
        const foundProject = products.find(
          (p) => p.id === paramProject || p.slug === paramProject
        );
        if (foundProject) {
          validProjectIds.push(foundProject.id);

          // Auto-select the project's parent service if not explicitly specified
          const parentSvcId = foundProject.parentService || (foundProject as any).serviceId;
          if (parentSvcId) {
            const foundParentSvc = services.find(
              (s) => s.id === parentSvcId || s.slug === parentSvcId
            );
            if (foundParentSvc && !validServiceIds.includes(foundParentSvc.id)) {
              validServiceIds.push(foundParentSvc.id);
            }
          }
        }
      }

      // Process Service parameter
      if (paramService) {
        const serviceTokens = paramService.split(',').map((t) => t.trim()).filter(Boolean);
        serviceTokens.forEach((token) => {
          const foundService = services.find(
            (s) => s.id === token || s.slug === token
          );
          if (foundService && !validServiceIds.includes(foundService.id)) {
            validServiceIds.push(foundService.id);
          }
        });
      }

      if (validServiceIds.length > 1) {
        setMultiSelect(true);
      }
      setSelectedServiceIds(validServiceIds);
      setSelectedProjectIds(validProjectIds);
    } else if (restoredFromDraft) {
      setSelectedServiceIds(initialServiceIds);
      setSelectedProjectIds(initialProjectIds);
    }
  }, [isLoaded, services, products, searchParams]);

  // ---------------------------------------------------------------------------
  // 2. Draft Autosave to Session Storage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (submittedInquiry) return;
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        contactMethod: formData.contactMethod,
        budget: formData.budget,
        timeline: formData.timeline,
        message: formData.message,
        multiSelect,
        selectedServiceIds,
        selectedProjectIds,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore session storage quotas
    }
  }, [formData, multiSelect, selectedServiceIds, selectedProjectIds, submittedInquiry]);

  // ---------------------------------------------------------------------------
  // 3. Keep URL Query Params In Sync For Shareability (Requirement 3)
  // ---------------------------------------------------------------------------
  const updateUrlParams = useCallback((svcIds: string[], projIds: string[]) => {
    const params = new URLSearchParams();
    if (svcIds.length > 0) {
      params.set('service', svcIds.join(','));
    }
    if (projIds.length > 0) {
      params.set('project', projIds.join(','));
    }
    const newServiceStr = svcIds.length > 0 ? svcIds.join(',') : null;
    const newProjectStr = projIds.length > 0 ? projIds.join(',') : null;
    lastParamServiceRef.current = newServiceStr;
    lastParamProjectRef.current = newProjectStr;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // ---------------------------------------------------------------------------
  // 4. Service Selection Handler (Requirement 1 & 2)
  // ---------------------------------------------------------------------------
  const handleToggleService = (serviceId: string) => {
    if (multiSelect) {
      const nextServices = selectedServiceIds.includes(serviceId)
        ? selectedServiceIds.filter((id) => id !== serviceId)
        : [...selectedServiceIds, serviceId];
      setSelectedServiceIds(nextServices);
      updateUrlParams(nextServices, selectedProjectIds);
    } else {
      // Single select: toggling or switching to a new service resets project selection
      const isAlreadySelected = selectedServiceIds.length === 1 && selectedServiceIds[0] === serviceId;
      const nextServices = isAlreadySelected ? [] : [serviceId];
      setSelectedServiceIds(nextServices);
      setSelectedProjectIds([]);
      updateUrlParams(nextServices, []);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Project Selection Handler (Requirement 2)
  // ---------------------------------------------------------------------------
  const handleToggleProject = (projectId: string) => {
    const nextProjects = selectedProjectIds.includes(projectId)
      ? selectedProjectIds.filter((id) => id !== projectId)
      : [...selectedProjectIds, projectId];
    setSelectedProjectIds(nextProjects);
    updateUrlParams(selectedServiceIds, nextProjects);
  };

  // Switch Multi-Select Mode
  const handleToggleMultiSelect = () => {
    const nextMulti = !multiSelect;
    setMultiSelect(nextMulti);
    if (!nextMulti && selectedServiceIds.length > 1) {
      // Switching from multi to single: preserve only the first chosen service
      const trimmedServices = [selectedServiceIds[0]];
      setSelectedServiceIds(trimmedServices);
      // Keep only projects belonging to this single service
      const trimmedProjects = selectedProjectIds.filter((pId) => {
        const prj = activeProducts.find((p) => p.id === pId);
        return prj && (prj.parentService === trimmedServices[0] || (prj as any).serviceId === trimmedServices[0]);
      });
      setSelectedProjectIds(trimmedProjects);
      updateUrlParams(trimmedServices, trimmedProjects);
    }
  };

  // Removal helpers for Chip Row (Requirement 5)
  const handleRemoveService = (serviceId: string) => {
    const nextServices = selectedServiceIds.filter((id) => id !== serviceId);
    setSelectedServiceIds(nextServices);
    // Remove projects that were attached to this removed service if not attached to remaining
    const nextProjects = selectedProjectIds.filter((pId) => {
      const prj = activeProducts.find((p) => p.id === pId);
      if (!prj) return false;
      const parentId = prj.parentService || (prj as any).serviceId;
      return nextServices.includes(parentId);
    });
    setSelectedProjectIds(nextProjects);
    updateUrlParams(nextServices, nextProjects);
  };

  const handleRemoveProject = (projectId: string) => {
    const nextProjects = selectedProjectIds.filter((id) => id !== projectId);
    setSelectedProjectIds(nextProjects);
    updateUrlParams(selectedServiceIds, nextProjects);
  };

  const handleClearAll = () => {
    setSelectedServiceIds([]);
    setSelectedProjectIds([]);
    updateUrlParams([], []);
  };

  // ---------------------------------------------------------------------------
  // 6. Selected Models & Related Projects Resolution
  // ---------------------------------------------------------------------------
  const selectedServices = useMemo(() => {
    return selectedServiceIds
      .map((id) => activeServices.find((s) => s.id === id))
      .filter((s): s is Service => Boolean(s));
  }, [selectedServiceIds, activeServices]);

  const selectedProjects = useMemo(() => {
    return selectedProjectIds
      .map((id) => activeProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [selectedProjectIds, activeProducts]);

  // Compute related projects for single-select mode
  const singleServiceRelatedProjects = useMemo(() => {
    if (multiSelect || selectedServiceIds.length !== 1) return [];
    const svcId = selectedServiceIds[0];
    const svc = activeServices.find((s) => s.id === svcId);
    const linkedIds = new Set(Array.isArray(svc?.relatedProjects) ? svc.relatedProjects : []);

    return activeProducts.filter((p) => {
      if (p.parentService === svcId || (p as any).serviceId === svcId) return true;
      if (linkedIds.has(p.id)) return true;
      return false;
    });
  }, [multiSelect, selectedServiceIds, activeServices, activeProducts]);

  // Compute grouped related projects for multi-select mode
  const multiServiceProjectGroups = useMemo(() => {
    if (!multiSelect || selectedServices.length === 0) return [];
    return selectedServices
      .map((svc) => {
        const linkedIds = new Set(Array.isArray(svc.relatedProjects) ? svc.relatedProjects : []);
        const projects = activeProducts.filter((p) => {
          if (p.parentService === svc.id || (p as any).serviceId === svc.id) return true;
          if (linkedIds.has(p.id)) return true;
          return false;
        });
        return {
          service: svc,
          projects,
        };
      })
      .filter((group) => group.projects.length > 0);
  }, [multiSelect, selectedServices, activeProducts]);

  // Dynamic message placeholder mentions selected service (Requirement 5)
  const messagePlaceholder = useMemo(() => {
    if (selectedServices.length === 1) {
      const sName = selectedServices[0].title || selectedServices[0].name || 'this service';
      return `Describe your requirements for ${sName}... (e.g. scope, target audience, infrastructure constraints, key objectives)`;
    }
    if (selectedServices.length > 1) {
      const names = selectedServices.map((s) => s.title || s.name).slice(0, 2).join(', ');
      return `Describe your requirements across ${names}${selectedServices.length > 2 ? ' and other disciplines' : ''}...`;
    }
    return 'Describe your technical requirements, architectural goals, target timeline, or project questions...';
  }, [selectedServices]);

  // ---------------------------------------------------------------------------
  // 7. Validation & Submission Handler (Requirement 4 & 5)
  // ---------------------------------------------------------------------------
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if ((formData.contactMethod === 'phone' || formData.contactMethod === 'whatsapp') && !formData.phone.trim()) {
      newErrors.phone = `Phone number is required for ${formData.contactMethod === 'whatsapp' ? 'WhatsApp' : 'Phone'} contact.`;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Please provide a brief description of your needs (at least 10 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot spam protection: if hidden field filled, silently finish
    if (formData.honeypot.trim().length > 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedInquiry({
          id: `inq_hp_${Date.now()}`,
          timestamp: new Date().toISOString(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          contactMethod: formData.contactMethod,
          budget: formData.budget,
          timeline: formData.timeline,
          message: formData.message,
          services: [],
          projects: [],
        });
      }, 400);
      return;
    }

    // Bot speed check (< 600ms)
    if (Date.now() - mountedTime < 600) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const generatedId = `query_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    // Prepare complete inquiry payload with selected service & project IDs and names (Requirement 4)
    const inquiryPayload: SubmittedInquiry = {
      id: generatedId,
      timestamp: nowIso,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      contactMethod: formData.contactMethod,
      budget: formData.budget,
      timeline: formData.timeline,
      message: formData.message.trim(),
      services: selectedServices.map((s) => ({
        id: s.id,
        name: s.title || s.name || 'Untitled Service',
        category: s.category,
      })),
      projects: selectedProjects.map((p) => ({
        id: p.id,
        name: p.title || p.name || 'Untitled Project',
        parentService: p.parentService || (p as any).serviceId,
      })),
    };

    // Construct persistent Query entity (Requirement 1 & 5)
    const newQuery: Query = {
      id: generatedId,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      message: formData.message.trim(),
      services: inquiryPayload.services,
      projects: inquiryPayload.projects,
      budget: formData.budget,
      timeline: formData.timeline,
      contactMethod: formData.contactMethod,
      createdAt: nowIso,
      status: 'New', // Defaults to New
      isRead: false,
      notes: '',
      notified: false, // Future mobile push notification flag
    };

    // Save query to store & database and invoke future notification trigger
    (async () => {
      try {
        await addQuery(newQuery);
      } catch (err) {
        console.error('[ContactPage] Failed to persist query to database', err);
      }

      // Show confirmation immediately so client is never blocked
      setIsSubmitting(false);
      setSubmittedInquiry(inquiryPayload);
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger Telegram notification from server asynchronously in the background
      triggerAdminNotification(newQuery).catch((err) => {
        console.warn('[ContactPage] Background notification dispatch error:', err);
      });
    })();
  };

  /**
   * Dispatches query notification to the server-side Telegram endpoint.
   * If delivery succeeds, updates the query's notified flag in the database.
   * If notifications are disabled, missing credentials, or fail, silently completes.
   */
  const triggerAdminNotification = async (query: Query): Promise<void> => {
    try {
      const response = await fetch('/api/notifications/telegram/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.notified) {
          await updateQuery({ ...query, notified: true });
        }
      }
    } catch (err) {
      console.warn('[ContactPage] Asynchronous Telegram notification dispatch error:', err);
    }
  };

  const handleResetInquiry = () => {
    setSubmittedInquiry(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      contactMethod: 'email',
      budget: BUDGET_OPTIONS[0],
      timeline: TIMELINE_OPTIONS[0],
      message: '',
      honeypot: '',
    });
    setSelectedServiceIds([]);
    setSelectedProjectIds([]);
    setErrors({});
    updateUrlParams([], []);
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // ---------------------------------------------------------------------------
  // 8. RENDER: Success State (Requirement 5)
  // ---------------------------------------------------------------------------
  if (submittedInquiry) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b border-border/50">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-glow-sm animate-in zoom-in-90 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Inquiry Successfully Dispatched
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                Thank You, <span className="text-primary">{submittedInquiry.name}</span>.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Our engineering leadership has logged your project scope and specifications. We will review your requirements and respond via{' '}
                <strong className="text-foreground capitalize">{submittedInquiry.contactMethod}</strong> within 24 business hours.
              </p>
            </div>

            {/* Recap Card */}
            <div className="mt-10 text-left bg-surface-1/90 border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Submitted Scope Recap</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">Reference ID: {submittedInquiry.id}</p>
                </div>
                <Badge variant="outline" className="font-mono text-xs text-primary border-primary/20 bg-primary/10">
                  Confirmed
                </Badge>
              </div>

              {/* Selected Services Recap */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
                  Target Services
                </span>
                {submittedInquiry.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {submittedInquiry.services.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{s.name}</span>
                        {s.category && <span className="text-[10px] opacity-75 font-mono">({s.category})</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">General Technical Consultation (No specific service preselected)</p>
                )}
              </div>

              {/* Selected Projects Recap */}
              {submittedInquiry.projects.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
                    Referenced Project Implementations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {submittedInquiry.projects.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent border border-accent/30"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{p.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/40">
                <div className="p-3 rounded-xl bg-surface-2/60 border border-border/40">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Budget Parameter</span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block">{submittedInquiry.budget}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-2/60 border border-border/40">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Target Timeline</span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block">{submittedInquiry.timeline}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-2/60 border border-border/40">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Preferred Channel</span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block capitalize">{submittedInquiry.contactMethod} ({submittedInquiry.email || submittedInquiry.phone})</span>
                </div>
              </div>

              {/* Message Brief Recap */}
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block mb-1.5">
                  Technical Requirements Brief
                </span>
                <p className="text-xs sm:text-sm text-foreground/90 bg-surface-2/80 p-4 rounded-xl border border-border/60 whitespace-pre-wrap leading-relaxed">
                  {submittedInquiry.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <Button
                size="lg"
                onClick={handleResetInquiry}
                className="rounded-xl px-7 font-bold gap-2 cursor-pointer shadow-glow-primary"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Send Another Inquiry</span>
              </Button>
              <Button
                variant="glass"
                size="lg"
                onClick={() => navigate('/services')}
                className="rounded-xl px-7 font-semibold gap-2 cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>Explore Service Catalog</span>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 9. RENDER: Standard Contact Page & Interactive Form
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Page Header */}
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-20 border-b border-border/50 overflow-hidden bg-gradient-to-b from-surface-1/80 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] font-mono rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" /> Project Inquiries & Architecture Scope
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
              Get in <span className="text-primary">Touch.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl font-normal">
              Have a production project in mind or want to evaluate custom engineering capabilities? Select your target services below or tell us about your technical goals.
            </p>
          </div>
        </div>
      </section>

      {/* Main Form & Contact Information Grid */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* LEFT COLUMN: Contact Details & Brand Info (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Direct Info Card */}
              <div className="rounded-3xl border border-border/70 bg-surface-1/90 p-6 sm:p-7 shadow-lg space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em] font-mono mb-4 inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Technical Advisory
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Direct access to engineering leadership. Every inquiry receives architectural scoping within 24 business hours.
                  </p>
                </div>

                <div className="space-y-5 pt-2 border-t border-border/40">
                  {/* Email */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Direct Email</span>
                      <a 
                        href="mailto:contact@wisebyteconcepts.com" 
                        className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors truncate block"
                      >
                        contact@wisebyteconcepts.com
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Phone Contact</span>
                      <p className="text-sm sm:text-base font-bold text-foreground">+91-XXXXXXXXXX</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Headquarters</span>
                      <p className="text-sm sm:text-base font-bold text-foreground">India (Global Remote Dispatch)</p>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Web Portfolio</span>
                      <a 
                        href="https://www.wisebyteconcepts.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
                      >
                        wisebyteconcepts.com
                      </a>
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Github className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block">Open Source</span>
                      <a 
                        href="https://github.com/wisebyteconcepts" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate block"
                      >
                        github.com/wisebyteconcepts
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Card */}
              <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface-1 to-surface-2 p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground leading-none">Wise Byte Concepts</h4>
                    <span className="text-[10px] font-mono text-primary uppercase">Precision Digital Engineering</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  Custom software architecture, scalable web products, and modern design systems built for long-term production resilience.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Inquiry Form (lg:col-span-8) */}
            <div className="lg:col-span-8">
              <GlassCard className="p-6 sm:p-8 md:p-10 border-border/70 rounded-3xl shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-8" noValidate>
                  
                  {/* Invisible Honeypot Spam Protection Field (Requirement 5) */}
                  <input
                    type="text"
                    name="website_url_hp"
                    value={formData.honeypot}
                    onChange={(e) => setFormData((prev) => ({ ...prev, honeypot: e.target.value }))}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="opacity-0 absolute -z-20 h-0 w-0 pointer-events-none"
                  />

                  {/* ============================================================ */}
                  {/* 1. SERVICE SELECTOR (Requirement 1 & 5)                      */}
                  {/* ============================================================ */}
                  <div className="space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-border/40">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">01 / Services</span>
                          <h2 className="text-base sm:text-lg font-extrabold text-foreground">Select Target Services</h2>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {multiSelect 
                            ? 'Multi-select active: choose multiple engineering capabilities for composite architecture.' 
                            : 'Click any service card to focus your scope inquiry.'}
                        </p>
                      </div>

                      {/* Multi-Select Toggle Switch (Requirement 5) */}
                      <button
                        type="button"
                        onClick={handleToggleMultiSelect}
                        className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer self-start sm:self-center shrink-0 ${
                          multiSelect
                            ? 'bg-primary/15 text-primary border-primary/40 shadow-xs'
                            : 'bg-surface-2 text-muted-foreground border-border hover:text-foreground'
                        }`}
                        title="Toggle multiple services selection"
                        aria-pressed={multiSelect}
                      >
                        <span>Multi-Service Mode</span>
                        <div className={`w-8 h-4 rounded-full transition-colors p-0.5 flex items-center ${
                          multiSelect ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start'
                        }`}>
                          <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                        </div>
                      </button>
                    </div>

                    {/* Loading Skeleton (Requirement 5) */}
                    {!isLoaded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                        {[1, 2, 3].map((n) => (
                          <Skeleton key={n} className="h-28 rounded-2xl w-full" />
                        ))}
                      </div>
                    )}

                    {/* Empty State (Requirement 5) */}
                    {isLoaded && activeServices.length === 0 && (
                      <div className="py-6">
                        <EmptyState
                          icon={Briefcase}
                          title="No Services Cataloged"
                          description="Our technical services are currently synchronizing. You may still submit a general consultation request below."
                        />
                      </div>
                    )}

                    {/* Service Cards Grid (Requirement 1) */}
                    {isLoaded && activeServices.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {activeServices.map((svc) => {
                          const isSelected = selectedServiceIds.includes(svc.id);
                          const svcTitle = svc.title || svc.name || 'Untitled Service';
                          const svcImg = svc.displayPicture || svc.bannerPicture || svc.iconImage;

                          return (
                            <button
                              key={svc.id}
                              type="button"
                              role="button"
                              aria-pressed={isSelected}
                              tabIndex={0}
                              onClick={() => handleToggleService(svc.id)}
                              onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                  e.preventDefault();
                                  handleToggleService(svc.id);
                                }
                              }}
                              className={`group relative p-3.5 sm:p-4 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                isSelected
                                  ? 'border-2 border-primary bg-primary/10 shadow-glow-sm ring-1 ring-primary/30'
                                  : 'border border-border/80 bg-surface-1/90 hover:border-primary/50 hover:bg-surface-2/80'
                              }`}
                            >
                              {/* Top Row: Icon/Image + Selection Check Badge */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border/70 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                  {svcImg ? (
                                    <img
                                      src={svcImg}
                                      alt={svcTitle}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <Icon
                                      value={svc.icon}
                                      fallback={Briefcase}
                                      className="w-5 h-5 text-primary"
                                    />
                                  )}
                                </div>

                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground shadow-2xs' 
                                    : 'border border-border/80 bg-surface-2/60 group-hover:border-primary/50'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>

                              {/* Content: Title & Category */}
                              <div className="min-w-0">
                                <h3 className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                                  isSelected ? 'text-primary' : 'text-foreground'
                                }`}>
                                  {svcTitle}
                                </h3>
                                {svc.shortDescription && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                    {svc.shortDescription}
                                  </p>
                                )}
                              </div>

                              {/* Category Tag */}
                              {svc.category && (
                                <span className="text-[10px] font-mono text-muted-foreground/80 uppercase tracking-wider block truncate">
                                  {svc.category}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ============================================================ */}
                  {/* 2. RELATED PROJECTS (Requirement 2 & 5)                      */}
                  {/* ============================================================ */}
                  {/* Single-Select Mode: Projects related to the chosen service */}
                  {!multiSelect && singleServiceRelatedProjects.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-border/40 animate-in fade-in duration-300">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">02 / References</span>
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Related Case Studies & Production Projects (Optional)
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Select prior implementations to anchor your requirements. Click again to deselect.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {singleServiceRelatedProjects.map((prj) => {
                          const isSelected = selectedProjectIds.includes(prj.id);
                          const prjTitle = prj.title || prj.name || 'Untitled Project';
                          const prjImg = prj.displayPicture || prj.bannerPicture || prj.imageUrl;

                          return (
                            <button
                              key={prj.id}
                              type="button"
                              role="button"
                              aria-pressed={isSelected}
                              tabIndex={0}
                              onClick={() => handleToggleProject(prj.id)}
                              onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                  e.preventDefault();
                                  handleToggleProject(prj.id);
                                }
                              }}
                              className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                isSelected
                                  ? 'border-2 border-accent bg-accent/10 shadow-glow-sm ring-1 ring-accent/30'
                                  : 'border border-border/70 bg-surface-1/90 hover:border-accent/50 hover:bg-surface-2/80'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border/60 overflow-hidden shrink-0 flex items-center justify-center">
                                {prjImg ? (
                                  <img src={prjImg} alt={prjTitle} className="w-full h-full object-cover" />
                                ) : (
                                  <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className={`text-xs font-bold truncate ${
                                  isSelected ? 'text-accent' : 'text-foreground'
                                }`}>
                                  {prjTitle}
                                </h4>
                                {prj.category && (
                                  <span className="text-[10px] font-mono text-muted-foreground uppercase block truncate">
                                    {prj.category}
                                  </span>
                                )}
                              </div>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-accent text-accent-foreground' : 'border border-border/80'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Multi-Select Mode: Projects Grouped Under Each Selected Service */}
                  {multiSelect && multiServiceProjectGroups.length > 0 && (
                    <div className="space-y-4 pt-2 border-t border-border/40 animate-in fade-in duration-300">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">02 / References</span>
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            Related Projects Grouped by Service (Optional)
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Pick specific project references across your selected disciplines.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {multiServiceProjectGroups.map(({ service: groupSvc, projects }) => (
                          <div key={groupSvc.id} className="p-4 rounded-2xl bg-surface-2/40 border border-border/60 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                              <span className="w-2 h-2 rounded-full bg-primary" />
                              <span>{groupSvc.title || groupSvc.name} References:</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {projects.map((prj) => {
                                const isSelected = selectedProjectIds.includes(prj.id);
                                const prjTitle = prj.title || prj.name || 'Untitled Project';
                                const prjImg = prj.displayPicture || prj.bannerPicture || prj.imageUrl;

                                return (
                                  <button
                                    key={prj.id}
                                    type="button"
                                    role="button"
                                    aria-pressed={isSelected}
                                    tabIndex={0}
                                    onClick={() => handleToggleProject(prj.id)}
                                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                      isSelected
                                        ? 'border border-accent bg-accent/15 text-accent shadow-xs'
                                        : 'border border-border/70 bg-surface-1 hover:border-accent/40'
                                    }`}
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-surface-2 overflow-hidden shrink-0 flex items-center justify-center border border-border/40">
                                      {prjImg ? (
                                        <img src={prjImg} alt={prjTitle} className="w-full h-full object-cover" />
                                      ) : (
                                        <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-xs font-bold truncate text-foreground">{prjTitle}</h5>
                                    </div>
                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                      isSelected ? 'bg-accent text-accent-foreground' : 'border border-border/80'
                                    }`}>
                                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* 3. SELECTION SUMMARY CHIP ROW WITH "x" (Requirement 5)       */}
                  {/* ============================================================ */}
                  {(selectedServices.length > 0 || selectedProjects.length > 0) && (
                    <div className="p-3.5 rounded-2xl bg-surface-2/70 border border-border/60 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                        <span>Active Selection Scope ({selectedServices.length + selectedProjects.length})</span>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-xs text-muted-foreground hover:text-rose-400 transition-colors font-sans cursor-pointer underline"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Service Chips */}
                        {selectedServices.map((svc) => (
                          <span
                            key={svc.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30 shadow-2xs"
                          >
                            <Briefcase className="w-3 h-3" />
                            <span>{svc.title || svc.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveService(svc.id);
                              }}
                              className="w-4 h-4 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                              title={`Remove ${svc.title || svc.name}`}
                              aria-label={`Remove ${svc.title || svc.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        {/* Project Chips */}
                        {selectedProjects.map((prj) => (
                          <span
                            key={prj.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent border border-accent/30 shadow-2xs"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>{prj.title || prj.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProject(prj.id);
                              }}
                              className="w-4 h-4 rounded-full hover:bg-accent/20 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                              title={`Remove ${prj.title || prj.name}`}
                              aria-label={`Remove ${prj.title || prj.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* 4. OPTIONAL PARAMETERS: BUDGET, TIMELINE, METHOD (Req 5)     */}
                  {/* ============================================================ */}
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">02 / Parameters</span>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">Commercial & Delivery Preferences</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Budget Range Selection */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-primary" /> Budget Parameter
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {BUDGET_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, budget: opt }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                formData.budget === opt
                                  ? 'bg-primary/20 text-primary border-primary/50 shadow-2xs'
                                  : 'bg-surface-2/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-surface-2'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Preferred Timeline Selection */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" /> Target Delivery Timeline
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {TIMELINE_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, timeline: opt }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                formData.timeline === opt
                                  ? 'bg-primary/20 text-primary border-primary/50 shadow-2xs'
                                  : 'bg-surface-2/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-surface-2'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preferred Contact Method Selection */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase font-mono tracking-wider block">
                        Preferred Contact Channel
                      </label>
                      <div className="grid grid-cols-3 gap-2 max-w-md">
                        {CONTACT_METHODS.map(({ id, label, icon: IconComponent }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, contactMethod: id }))}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                              formData.contactMethod === id
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                : 'bg-surface-2/70 text-muted-foreground border-border/70 hover:text-foreground'
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* 5. CLIENT CONTACT INFORMATION (Requirement 5)               */}
                  {/* ============================================================ */}
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">03 / Client Info</span>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">Your Contact Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, name: e.target.value }));
                            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                          }}
                          placeholder="e.g. Alex Morgan"
                          className="bg-surface-2/70 border-border h-11 rounded-xl text-sm"
                        />
                        {errors.name && (
                          <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.name}</span>
                          </p>
                        )}
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, email: e.target.value }));
                            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                          }}
                          placeholder="e.g. alex@company.com"
                          className="bg-surface-2/70 border-border h-11 rounded-xl text-sm"
                        />
                        {errors.email && (
                          <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone / WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                        Phone / WhatsApp Number{' '}
                        {formData.contactMethod !== 'email' ? (
                          <span className="text-rose-500">*</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">(Optional)</span>
                        )}
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, phone: e.target.value }));
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="bg-surface-2/70 border-border h-11 rounded-xl text-sm"
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Message Box with Dynamic Placeholder (Requirement 5) */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                        Technical Requirements Brief <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={formData.message}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, message: e.target.value }));
                          if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                        }}
                        placeholder={messagePlaceholder}
                        className="w-full bg-surface-2/70 border border-border rounded-xl p-3.5 text-sm focus:outline-none focus:border-primary/60 transition-colors text-foreground leading-relaxed"
                      />
                      {errors.message && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.message}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* 6. SUBMISSION SUMMARY & ACTION (Requirement 4)               */}
                  {/* ============================================================ */}
                  <div className="space-y-3 pt-3 border-t border-border/40">
                    {/* Short Summary Near Submit Button (Requirement 4) */}
                    <div className="p-4 rounded-2xl bg-surface-2/70 border border-border/70 text-xs space-y-2">
                      <div className="flex items-center justify-between text-muted-foreground font-mono uppercase text-[10px] tracking-wider">
                        <span>Inquiry Scope Summary</span>
                        <span>
                          {selectedServices.length > 0
                            ? `${selectedServices.length} Service(s) Target`
                            : 'General Engineering Scoping'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {selectedServices.length > 0 ? (
                          selectedServices.map((s) => (
                            <Badge
                              key={s.id}
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold"
                            >
                              {s.title || s.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">
                            No specific service preselected (General Technical Inquiry)
                          </span>
                        )}

                        {selectedProjects.map((p) => (
                          <Badge
                            key={p.id}
                            variant="outline"
                            className="bg-accent/10 text-accent border-accent/20 text-xs font-semibold"
                          >
                            Ref: {p.title || p.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-1.5 border-t border-border/40 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-mono">
                        <span>Budget: <strong className="text-foreground">{formData.budget}</strong></span>
                        <span>Timeline: <strong className="text-foreground">{formData.timeline}</strong></span>
                        <span>Channel: <strong className="text-foreground capitalize">{formData.contactMethod}</strong></span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full h-14 text-base rounded-2xl font-bold shadow-glow-primary gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Dispatching Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Dispatch Inquiry to Engineering Leads</span>
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground font-mono">
                      🔒 Direct engineering evaluation. No third-party sales brokers. Responses delivered within 24h.
                    </p>
                  </div>

                </form>
              </GlassCard>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
