import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Check, 
  Clock, 
  DollarSign, 
  IndianRupee,
  MessageSquare, 
  Send, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle,
  Mail,
  Phone,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { CountryCode, parsePhoneNumber } from 'libphonenumber-js';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { Service, Product, Query } from '@/types';
import { CountryCodeSelector } from '@/components/CountryCodeSelector';
import { SelectionCheckBadge } from '@/components/SelectionCheckBadge';
import { CopyTokenButton } from '@/components/CopyTokenButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { SubPageHero } from '@/pages';
import { formatISTDate, generateReferenceToken } from '@/utils/date';
import { buildQueryFingerprint, calculateBriefSimilarity } from '@/utils/duplicateCheck';

// Budget Configurations (Currency auto-switched by visitor country detection)
const BUDGET_CONFIG = {
  USD: {
    symbol: '$',
    tiers: [
      { key: 'tier_1', label: '$5,000 to $10,000' },
      { key: 'tier_2', label: '$10,000 to $25,000' },
      { key: 'tier_3', label: '$25,000 to $50,000' },
      { key: 'tier_4', label: '$50,000+' },
    ],
  },
  INR: {
    symbol: '₹',
    tiers: [
      { key: 'tier_1', label: '₹20,000 to ₹50,000' },
      { key: 'tier_2', label: '₹50,000 to ₹1,00,000' },
      { key: 'tier_3', label: '₹1,00,000 to ₹3,00,000' },
      { key: 'tier_4', label: '₹3,00,000+' },
    ],
  },
} as const;

type CurrencyType = keyof typeof BUDGET_CONFIG;
type BudgetTier = (typeof BUDGET_CONFIG)['USD']['tiers'][number];

const TIMELINE_OPTIONS = [
  'Within 2 Weeks',
  '2 – 4 Weeks',
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
  phoneCountry: CountryCode;
  whatsapp: string;
  whatsappCountry: CountryCode;
  sameAsPhone: boolean;
  contactMethod: ContactMethod;
  currency: CurrencyType;
  budgetTierKey: BudgetTier['key'];
  timeline: string;
  message: string;
  honeypot: string;
}

interface SubmittedInquiry {
  id: string;
  referenceToken: string;
  timestamp: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  contactMethod: ContactMethod;
  budget: string;
  budgetTier?: BudgetTier['key'];
  budgetCurrency?: CurrencyType;
  timeline: string;
  message: string;
  services: Array<{ id: string; name: string; category?: string }>;
  projects: Array<{ id: string; name: string; parentService?: string }>;
  isUpdateNotice?: boolean;
  alreadyReceivedNotice?: boolean;
}

const QUOTE_DRAFT_KEY = 'wbc_quote_form_draft_v1';
const QUOTE_HANDOFF_KEY = 'wbc_quote_handoff';

export const QuotePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const services = useAppStore((state) => state.services);
  const products = useAppStore((state) => state.products);
  const queries = useAppStore((state) => state.queries);
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
    phoneCountry: 'IN',
    whatsapp: '',
    whatsappCountry: 'IN',
    sameAsPhone: true,
    contactMethod: 'email',
    currency: 'INR',
    budgetTierKey: 'tier_1',
    timeline: TIMELINE_OPTIONS[0],
    message: '',
    honeypot: '',
  });

  // UI state
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<SubmittedInquiry | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Duplicate Submission Modal state
  const [matchingQuery, setMatchingQuery] = useState<Query | null>(null);
  const [pendingInquiryPayload, setPendingInquiryPayload] = useState<{
    inquiry: SubmittedInquiry;
    rawFormattedPhone: string;
    rawFormattedWhatsApp: string;
  } | null>(null);

  // Timestamp for anti-bot speed check
  const [mountedTime] = useState<number>(() => Date.now());

  // ---------------------------------------------------------------------------
  // 0. Server-Side Country Detection for Automatic Currency
  // ---------------------------------------------------------------------------
  const hasDetectedCountryRef = useRef(false);
  useEffect(() => {
    if (hasDetectedCountryRef.current) return;
    hasDetectedCountryRef.current = true;

    fetch('/api/geo/country')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country) {
          const detectedCountry = data.country as CountryCode;
          const detectedCurrency: CurrencyType = detectedCountry === 'IN' ? 'INR' : 'USD';
          
          setFormData((prev) => {
            const rawDraft = sessionStorage.getItem(QUOTE_DRAFT_KEY);
            if (rawDraft) {
              try {
                const parsed = JSON.parse(rawDraft);
                if (parsed.currency || parsed.phoneCountry) {
                  return prev;
                }
              } catch {
                // ignore
              }
            }
            return {
              ...prev,
              phoneCountry: detectedCountry || 'US',
              whatsappCountry: detectedCountry || 'US',
              currency: detectedCurrency,
              budgetTierKey: prev.budgetTierKey || 'tier_1',
            };
          });
        }
      })
      .catch((err) => {
        console.warn('[QuotePage] Non-blocking country detection failed:', err);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // 1. Initial State Restoration & Autofill Hand-off from /contact
  // ---------------------------------------------------------------------------
  const hasInitializedRef = useRef(false);
  const lastParamServiceRef = useRef<string | null>(null);
  const lastParamProjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const paramService = searchParams.get('service');
    const paramProject = searchParams.get('project');

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

    // Check autofill hand-off from Contact page first
    try {
      const rawHandoff = sessionStorage.getItem(QUOTE_HANDOFF_KEY);
      if (rawHandoff) {
        const handoff = JSON.parse(rawHandoff);
        setFormData((prev) => ({
          ...prev,
          name: handoff.name || prev.name,
          email: handoff.email || prev.email,
          phone: handoff.phone || prev.phone,
          phoneCountry: handoff.phoneCountry || prev.phoneCountry,
          whatsappCountry: handoff.phoneCountry || prev.whatsappCountry,
          message: handoff.message || prev.message,
        }));
        sessionStorage.removeItem(QUOTE_HANDOFF_KEY);
      }
    } catch {
      // quiet fallback
    }

    // Next check saved draft
    let initialServiceIds: string[] = [];
    let initialProjectIds: string[] = [];

    try {
      const rawDraft = sessionStorage.getItem(QUOTE_DRAFT_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        setFormData((prev) => ({
          ...prev,
          name: prev.name || parsed.name || '',
          email: prev.email || parsed.email || '',
          phone: prev.phone || parsed.phone || '',
          phoneCountry: parsed.phoneCountry || prev.phoneCountry,
          whatsapp: parsed.whatsapp || '',
          whatsappCountry: parsed.whatsappCountry || prev.whatsappCountry,
          sameAsPhone: parsed.sameAsPhone !== undefined ? parsed.sameAsPhone : true,
          contactMethod: parsed.contactMethod || 'email',
          currency: parsed.currency || prev.currency,
          budgetTierKey: parsed.budgetTierKey || 'tier_1',
          timeline: parsed.timeline || TIMELINE_OPTIONS[0],
          message: prev.message || parsed.message || '',
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
        }
      }
    } catch {
      // ignore
    }

    // Process URL query parameters
    if (paramService || paramProject) {
      const matchedService = paramService
        ? services.find((s) => s.id === paramService || s.slug === paramService)
        : null;

      const matchedProject = paramProject
        ? products.find((p) => p.id === paramProject || p.slug === paramProject)
        : null;

      if (matchedProject && !matchedService) {
        const parentId = matchedProject.parentService || (matchedProject as any).serviceId;
        const parentSvc = parentId ? services.find((s) => s.id === parentId) : null;
        if (parentSvc) {
          initialServiceIds = [parentSvc.id];
        }
        initialProjectIds = [matchedProject.id];
      } else if (matchedService) {
        initialServiceIds = [matchedService.id];
        if (matchedProject) {
          const parentId = matchedProject.parentService || (matchedProject as any).serviceId;
          if (parentId === matchedService.id) {
            initialProjectIds = [matchedProject.id];
          }
        }
      }
    }

    if (initialServiceIds.length > 0) {
      setSelectedServiceIds(initialServiceIds);
    }
    if (initialProjectIds.length > 0) {
      setSelectedProjectIds(initialProjectIds);
    }
  }, [isLoaded, searchParams, services, products]);

  // Synchronize draft in sessionStorage
  useEffect(() => {
    if (!hasInitializedRef.current) return;
    const timeout = setTimeout(() => {
      try {
        const draftObj = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          phoneCountry: formData.phoneCountry,
          whatsapp: formData.whatsapp,
          whatsappCountry: formData.whatsappCountry,
          sameAsPhone: formData.sameAsPhone,
          contactMethod: formData.contactMethod,
          currency: formData.currency,
          budgetTierKey: formData.budgetTierKey,
          timeline: formData.timeline,
          message: formData.message,
          selectedServiceIds,
          selectedProjectIds,
        };
        sessionStorage.setItem(QUOTE_DRAFT_KEY, JSON.stringify(draftObj));
      } catch {
        // ignore
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData, selectedServiceIds, selectedProjectIds]);

  // Synchronize URL parameters
  const updateUrlParams = (serviceIds: string[], projectIds: string[]) => {
    const params = new URLSearchParams(searchParams);

    if (serviceIds.length === 0) {
      params.delete('service');
    } else if (serviceIds.length === 1) {
      params.set('service', serviceIds[0]);
    } else {
      params.set('service', serviceIds.join(','));
    }

    if (projectIds.length === 0) {
      params.delete('project');
    } else if (projectIds.length === 1) {
      params.set('project', projectIds[0]);
    } else {
      params.set('project', projectIds.join(','));
    }

    lastParamServiceRef.current = params.get('service');
    lastParamProjectRef.current = params.get('project');

    setSearchParams(params, { replace: true });
  };

  // Selection handlers
  const handleToggleService = (serviceId: string) => {
    if (multiSelect) {
      let nextServices: string[];
      if (selectedServiceIds.includes(serviceId)) {
        nextServices = selectedServiceIds.filter((id) => id !== serviceId);
      } else {
        nextServices = [...selectedServiceIds, serviceId];
      }
      setSelectedServiceIds(nextServices);

      const nextProjects = selectedProjectIds.filter((pId) => {
        const prj = activeProducts.find((p) => p.id === pId);
        if (!prj) return false;
        const parentId = prj.parentService || (prj as any).serviceId;
        return nextServices.includes(parentId);
      });
      setSelectedProjectIds(nextProjects);
      updateUrlParams(nextServices, nextProjects);
    } else {
      if (selectedServiceIds.includes(serviceId)) {
        setSelectedServiceIds([]);
        setSelectedProjectIds([]);
        updateUrlParams([], []);
      } else {
        setSelectedServiceIds([serviceId]);
        const validProjects = selectedProjectIds.filter((pId) => {
          const prj = activeProducts.find((p) => p.id === pId);
          return prj && (prj.parentService === serviceId || (prj as any).serviceId === serviceId);
        });
        setSelectedProjectIds(validProjects);
        updateUrlParams([serviceId], validProjects);
      }
    }
  };

  const handleToggleProject = (projectId: string) => {
    const prj = activeProducts.find((p) => p.id === projectId);
    const parentServiceId = prj ? (prj.parentService || (prj as any).serviceId) : null;

    if (multiSelect) {
      let nextProjects: string[];
      if (selectedProjectIds.includes(projectId)) {
        nextProjects = selectedProjectIds.filter((id) => id !== projectId);
      } else {
        nextProjects = [...selectedProjectIds, projectId];
      }
      setSelectedProjectIds(nextProjects);

      let nextServices = [...selectedServiceIds];
      if (parentServiceId && !nextServices.includes(parentServiceId)) {
        nextServices.push(parentServiceId);
        setSelectedServiceIds(nextServices);
      }
      updateUrlParams(nextServices, nextProjects);
    } else {
      if (selectedProjectIds.includes(projectId)) {
        setSelectedProjectIds([]);
        updateUrlParams(selectedServiceIds, []);
      } else {
        const nextProjects = [projectId];
        setSelectedProjectIds(nextProjects);

        let nextServices = [...selectedServiceIds];
        if (parentServiceId && !nextServices.includes(parentServiceId)) {
          nextServices = [parentServiceId];
          setSelectedServiceIds(nextServices);
        }
        updateUrlParams(nextServices, nextProjects);
      }
    }
  };

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
        return { service: svc, projects };
      })
      .filter((group) => group.projects.length > 0);
  }, [multiSelect, selectedServices, activeProducts]);

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

  // Validation
  const validateForm = (): { isValid: boolean; formattedPhone: string; formattedWhatsApp: string } => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    let formattedPhone = '';
    let formattedWhatsApp = '';

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }

    const phoneInput = formData.phone.trim();
    if (phoneInput) {
      try {
        const parsed = parsePhoneNumber(phoneInput, formData.phoneCountry);
        if (!parsed || !parsed.isValid()) {
          newErrors.phone = `Please enter a valid phone number for the selected country.`;
        } else {
          formattedPhone = parsed.number;
        }
      } catch {
        newErrors.phone = `Please enter a valid phone number for the selected country.`;
      }
    } else if (formData.contactMethod === 'phone' || (formData.contactMethod === 'whatsapp' && formData.sameAsPhone)) {
      newErrors.phone = 'Phone number is required for phone/WhatsApp contact.';
    }

    if (formData.sameAsPhone) {
      formattedWhatsApp = formattedPhone;
    } else {
      const waInput = formData.whatsapp.trim();
      if (waInput) {
        try {
          const parsed = parsePhoneNumber(waInput, formData.whatsappCountry);
          if (!parsed || !parsed.isValid()) {
            newErrors.whatsapp = `Please enter a valid WhatsApp number for the selected country.`;
          } else {
            formattedWhatsApp = parsed.number;
          }
        } catch {
          newErrors.whatsapp = `Please enter a valid WhatsApp number for the selected country.`;
        }
      } else if (formData.contactMethod === 'whatsapp') {
        newErrors.whatsapp = 'WhatsApp number is required when WhatsApp is chosen.';
      }
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Please provide a brief description of your needs (at least 10 characters).';
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      formattedPhone,
      formattedWhatsApp,
    };
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Spam honeypot
    if (formData.honeypot.trim().length > 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        const currentBudgetConfig = BUDGET_CONFIG[formData.currency] || BUDGET_CONFIG.USD;
        const currentTier = currentBudgetConfig.tiers.find((t) => t.key === formData.budgetTierKey) || currentBudgetConfig.tiers[0];
        setSubmittedInquiry({
          id: `inq_hp_${Date.now()}`,
          referenceToken: generateReferenceToken(),
          timestamp: new Date().toISOString(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp: formData.sameAsPhone ? formData.phone : formData.whatsapp,
          contactMethod: formData.contactMethod,
          budget: currentTier.label,
          budgetTier: formData.budgetTierKey,
          budgetCurrency: formData.currency,
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

    const { isValid, formattedPhone, formattedWhatsApp } = validateForm();
    if (!isValid) return;

    const currentBudgetConfig = BUDGET_CONFIG[formData.currency] || BUDGET_CONFIG.USD;
    const currentTier = currentBudgetConfig.tiers.find((t) => t.key === formData.budgetTierKey) || currentBudgetConfig.tiers[0];
    const budgetDisplayLabel = currentTier.label;

    const referenceToken = generateReferenceToken();
    const generatedId = `quote_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    const inquiryPayload: SubmittedInquiry = {
      id: generatedId,
      referenceToken,
      timestamp: nowIso,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formattedPhone || formData.phone.trim(),
      whatsapp: formattedWhatsApp || (formData.sameAsPhone ? formattedPhone : formData.whatsapp.trim()),
      contactMethod: formData.contactMethod,
      budget: budgetDisplayLabel,
      budgetTier: formData.budgetTierKey,
      budgetCurrency: formData.currency,
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

    // -------------------------------------------------------------
    // Duplicate Submission Check against existing queries
    // -------------------------------------------------------------
    const currentFingerprint = buildQueryFingerprint({
      email: formData.email,
      phone: formattedPhone || formData.phone,
      serviceIds: selectedServiceIds,
      projectIds: selectedProjectIds,
      budgetTier: formData.budgetTierKey,
      currency: formData.currency,
    });

    const existingMatch = queries.find((q) => {
      const qFingerprint = buildQueryFingerprint({
        email: q.email,
        phone: q.phone,
        serviceIds: (q.services || []).map((s) => s.id),
        projectIds: (q.projects || []).map((p) => p.id),
        budgetTier: q.budgetTier,
        currency: q.budgetCurrency,
      });
      return qFingerprint === currentFingerprint;
    });

    if (existingMatch) {
      // Show duplicate notice dialog, do not save yet
      setMatchingQuery(existingMatch);
      setPendingInquiryPayload({
        inquiry: inquiryPayload,
        rawFormattedPhone: formattedPhone,
        rawFormattedWhatsApp: formattedWhatsApp,
      });
      return;
    }

    // If no duplicate match, proceed with standard creation
    executeCreation(inquiryPayload);
  };

  /**
   * Completes creation of brand new query
   */
  const executeCreation = async (inquiryPayload: SubmittedInquiry) => {
    setIsSubmitting(true);
    const newQuery: Query = {
      id: inquiryPayload.id,
      name: inquiryPayload.name,
      email: inquiryPayload.email,
      phone: inquiryPayload.phone,
      whatsapp: inquiryPayload.whatsapp,
      countryCode: formData.phoneCountry,
      type: 'Quote request',
      message: inquiryPayload.message,
      services: inquiryPayload.services,
      projects: inquiryPayload.projects,
      budget: inquiryPayload.budget,
      budgetTier: formData.budgetTierKey,
      budgetCurrency: formData.currency,
      timeline: formData.timeline,
      contactMethod: formData.contactMethod,
      createdAt: inquiryPayload.timestamp,
      status: 'New',
      isRead: false,
      referenceToken: inquiryPayload.referenceToken,
      notes: '',
      notified: false,
    };

    try {
      await addQuery(newQuery);
    } catch (err) {
      console.error('[QuotePage] Failed to persist quote query:', err);
    }

    setIsSubmitting(false);
    setSubmittedInquiry(inquiryPayload);
    try {
      sessionStorage.removeItem(QUOTE_DRAFT_KEY);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger Telegram notification asynchronously
    triggerAdminNotification(newQuery).catch((err) => {
      console.warn('[QuotePage] Telegram notification error:', err);
    });
  };

  /**
   * User confirms "Submit anyway" on duplicate modal
   */
  const handleConfirmSubmitAnyway = async () => {
    if (!matchingQuery || !pendingInquiryPayload) return;

    setIsSubmitting(true);
    setMatchingQuery(null);

    const oldBrief = matchingQuery.message || '';
    const newBrief = pendingInquiryPayload.inquiry.message || '';
    const similarityScore = calculateBriefSimilarity(oldBrief, newBrief);

    const matchToken = (matchingQuery.referenceToken || matchingQuery.id).toUpperCase();

    // Default threshold: 40% similarity (0.40)
    if (similarityScore < 0.40) {
      // Brief is different -> UPDATE earlier query instead of creating new one
      const nowIso = new Date().toISOString();
      const updatedHistory = [
        ...(matchingQuery.messageHistory || []),
        {
          message: oldBrief,
          replacedAt: nowIso,
          previousTimeline: matchingQuery.timeline,
          previousBudget: matchingQuery.budget,
        },
      ];

      const updatedQuery: Query = {
        ...matchingQuery,
        message: newBrief,
        updatedAt: nowIso,
        status: 'New',
        isRead: false,
        messageHistory: updatedHistory,
      };

      try {
        await updateQuery(updatedQuery);
      } catch (err) {
        console.error('[QuotePage] Failed to update existing query:', err);
      }

      setIsSubmitting(false);
      setSubmittedInquiry({
        ...pendingInquiryPayload.inquiry,
        referenceToken: matchToken,
        isUpdateNotice: true,
      });

      try {
        sessionStorage.removeItem(QUOTE_DRAFT_KEY);
      } catch {
        // ignore
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Send Telegram alert with isUpdate = true
      triggerAdminNotification({ ...updatedQuery, referenceToken: matchToken }, true).catch((err) => {
        console.warn('[QuotePage] Telegram update alert error:', err);
      });
    } else {
      // Brief is the same or similar (>= 40%) -> Do NOT create or update anything
      setIsSubmitting(false);
      setSubmittedInquiry({
        ...pendingInquiryPayload.inquiry,
        referenceToken: matchToken,
        alreadyReceivedNotice: true,
      });

      try {
        sessionStorage.removeItem(QUOTE_DRAFT_KEY);
      } catch {
        // ignore
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setPendingInquiryPayload(null);
  };

  const triggerAdminNotification = async (query: Query, isUpdate = false): Promise<void> => {
    try {
      const response = await fetch('/api/notifications/telegram/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: { ...query, isUpdate } }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.notified) {
          await updateQuery({ ...query, notified: true });
        }
      }
    } catch (err) {
      console.warn('[QuotePage] Asynchronous Telegram notification dispatch error:', err);
    }
  };

  const handleResetForm = () => {
    setSubmittedInquiry(null);
    setFormData((prev) => ({
      name: '',
      email: '',
      phone: '',
      phoneCountry: prev.phoneCountry,
      whatsapp: '',
      whatsappCountry: prev.whatsappCountry,
      sameAsPhone: true,
      contactMethod: 'email',
      currency: prev.currency,
      budgetTierKey: 'tier_1',
      timeline: TIMELINE_OPTIONS[0],
      message: '',
      honeypot: '',
    }));
    setSelectedServiceIds([]);
    setSelectedProjectIds([]);
    setErrors({});
    updateUrlParams([], []);
    setIdempotencyKey(`idem_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    try {
      sessionStorage.removeItem(QUOTE_DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Hero Component (matching Services and Projects listing style) */}
      <SubPageHero
        badge="Get a quote"
        title={<>Tell us about <span className="text-primary">your project.</span></>}
        subtitle="Share your requirements, budget, and timeline to receive a tailored technical proposal."
      />

      {/* 2. Focused Single Column Form Section (max-w-4xl, centered, no sidebar) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Back to contact link */}
          <div className="mb-6">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to contact</span>
            </Link>
          </div>

          {/* SUCCESS SCREEN */}
          {submittedInquiry ? (
            <div className="rounded-3xl border border-border/80 bg-surface-1 p-8 sm:p-12 text-center shadow-card animate-in fade-in zoom-in-95 duration-300">
              {/* Check Icon Circle */}
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-glow-sm">
                <Check className="w-10 h-10" />
              </div>

              {/* Status Pill with even vertical margins (16-20px) */}
              <div className="my-5 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {submittedInquiry.isUpdateNotice
                      ? 'Inquiry successfully updated'
                      : submittedInquiry.alreadyReceivedNotice
                      ? 'Inquiry already on file'
                      : 'Inquiry successfully dispatched'}
                  </span>
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {submittedInquiry.isUpdateNotice
                  ? 'Inquiry Updated!'
                  : submittedInquiry.alreadyReceivedNotice
                  ? 'We Have Your Inquiry!'
                  : 'Thank you!'}
              </h1>

              {/* Subtitle / Explanation */}
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {submittedInquiry.isUpdateNotice
                  ? 'Your earlier inquiry has been updated with your new requirement brief. Our engineering leads will review the revised specifications.'
                  : submittedInquiry.alreadyReceivedNotice
                  ? 'An identical inquiry was already received earlier and is currently being processed by our team.'
                  : 'We have received your technical specifications. An engineering lead will review your requirements and follow up within 24 business hours.'}
              </p>

              {/* Reference Token Box (Uppercase + Copy Button) */}
              <div className="mt-8 p-5 rounded-2xl bg-surface-2 border border-border/80 max-w-md mx-auto text-center space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block font-bold">
                  Your Reference Token
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black text-primary tracking-widest select-all">
                    {submittedInquiry.referenceToken.toUpperCase()}
                  </span>
                  <CopyTokenButton token={submittedInquiry.referenceToken} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Save this token to reference your inquiry when corresponding with our team.
                </p>
              </div>

              {/* Summary Details */}
              <div className="mt-8 text-left bg-surface-2/60 rounded-2xl border border-border/60 p-6 max-w-xl mx-auto space-y-4 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-border/40">
                  <span className="text-muted-foreground font-mono uppercase">Submission Time</span>
                  <span className="font-semibold text-foreground">{formatISTDate(submittedInquiry.timestamp)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/40">
                  <span className="text-muted-foreground font-mono uppercase">Client</span>
                  <span className="font-semibold text-foreground">{submittedInquiry.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/40">
                  <span className="text-muted-foreground font-mono uppercase">Budget Range</span>
                  <span className="font-semibold text-foreground">{submittedInquiry.budget}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/40">
                  <span className="text-muted-foreground font-mono uppercase">Target Timeline</span>
                  <span className="font-semibold text-foreground">{submittedInquiry.timeline}</span>
                </div>
                {submittedInquiry.services.length > 0 && (
                  <div className="pt-1">
                    <span className="text-muted-foreground font-mono uppercase block mb-1.5">Selected Services</span>
                    <div className="flex flex-wrap gap-1.5">
                      {submittedInquiry.services.map((s) => (
                        <span key={s.id} className="px-2.5 py-1 rounded-md bg-surface-3 border border-border text-foreground font-medium">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleResetForm}
                  className="rounded-full px-8 py-3 text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Submit Another Inquiry
                </Button>
              </div>
            </div>
          ) : (
            /* INQUIRY FORM */
            <form onSubmit={handleSubmit} className="rounded-3xl border border-border/80 bg-surface-1 p-6 sm:p-10 shadow-card space-y-8">
              {/* Hidden Honeypot */}
              <input
                type="text"
                name="wbc_lead_code"
                value={formData.honeypot}
                onChange={(e) => setFormData((prev) => ({ ...prev, honeypot: e.target.value }))}
                style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                tabIndex={-1}
                autoComplete="off"
              />
              <input type="hidden" name="idempotency_key" value={idempotencyKey} />

              {/* 1. SERVICES SECTION */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary block">Step 1</span>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Select Primary Disciplines</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Multi-select:</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={multiSelect}
                      onClick={() => {
                        const next = !multiSelect;
                        setMultiSelect(next);
                        if (!next && selectedServiceIds.length > 1) {
                          setSelectedServiceIds([selectedServiceIds[0]]);
                          updateUrlParams([selectedServiceIds[0]], selectedProjectIds);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary ${
                        multiSelect ? 'bg-primary' : 'bg-surface-3'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          multiSelect ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Service Cards Grid (1.5px solid border on selected, no wobble) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleToggleService(service.id)}
                        className={`group relative box-border p-3.5 sm:p-4 rounded-2xl text-left cursor-pointer flex flex-col justify-between space-y-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent border-[1.5px] transition-[border-color,background-color] duration-150 ${
                          isSelected
                            ? 'border-accent bg-accent/10 shadow-xs'
                            : 'border-border/70 bg-surface-2/60 hover:border-accent/40 hover:bg-surface-2'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs sm:text-sm font-bold line-clamp-1 ${
                            isSelected ? 'text-accent' : 'text-foreground'
                          }`}>
                            {service.title || service.name}
                          </span>
                          <SelectionCheckBadge isSelected={isSelected} size="md" />
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {service.shortDescription || service.description || 'Specialized digital service.'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. RELATED PROJECTS SECTION */}
              {(singleServiceRelatedProjects.length > 0 || multiServiceProjectGroups.length > 0) && (
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent block">Step 2 (Optional)</span>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">Reference Relevant Projects</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select any existing reference architectures that match your desired product direction.
                    </p>
                  </div>

                  {/* Single service related projects */}
                  {singleServiceRelatedProjects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {singleServiceRelatedProjects.map((prj) => {
                        const isSelected = selectedProjectIds.includes(prj.id);
                        return (
                          <button
                            key={prj.id}
                            type="button"
                            onClick={() => handleToggleProject(prj.id)}
                            className={`group box-border p-3 rounded-2xl text-left cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent border-[1.5px] transition-[border-color,background-color] duration-150 ${
                              isSelected
                                ? 'border-accent bg-accent/10 shadow-xs'
                                : 'border-border/70 bg-surface-2/60 hover:border-accent/40 hover:bg-surface-2'
                            }`}
                          >
                            <span className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-accent' : 'text-foreground'
                            }`}>
                              {prj.title || prj.name}
                            </span>
                            <SelectionCheckBadge isSelected={isSelected} size="sm" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Multi service grouped projects */}
                  {multiServiceProjectGroups.map(({ service, projects }) => (
                    <div key={service.id} className="space-y-2 pt-2">
                      <span className="text-xs font-mono font-bold text-primary uppercase">
                        {service.title || service.name} Projects:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {projects.map((prj) => {
                          const isSelected = selectedProjectIds.includes(prj.id);
                          return (
                            <button
                              key={prj.id}
                              type="button"
                              onClick={() => handleToggleProject(prj.id)}
                              className={`group box-border p-3 rounded-2xl text-left cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent border-[1.5px] transition-[border-color,background-color] duration-150 ${
                                isSelected
                                  ? 'border-accent bg-accent/10 shadow-xs'
                                  : 'border-border/70 bg-surface-2/60 hover:border-accent/40 hover:bg-surface-2'
                              }`}
                            >
                              <span className={`text-xs font-semibold truncate ${
                                isSelected ? 'text-accent' : 'text-foreground'
                              }`}>
                                {prj.title || prj.name}
                              </span>
                              <SelectionCheckBadge isSelected={isSelected} size="sm" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. BUDGET & TIMELINE SECTION */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary block">Step 3</span>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Commercial & Delivery Preferences</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Budget Chips (Currency automatically set from server-detected country) */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase font-mono tracking-wider flex items-center gap-1.5">
                      {formData.currency === 'INR' ? (
                        <IndianRupee className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span>Budget Parameter ({formData.currency})</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(BUDGET_CONFIG[formData.currency] || BUDGET_CONFIG.USD).tiers.map((tier) => {
                        const isSelected = formData.budgetTierKey === tier.key;
                        return (
                          <button
                            key={tier.key}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, budgetTierKey: tier.key }))}
                            className={`group box-border p-2.5 rounded-xl text-xs font-semibold border-[1.5px] transition-[border-color,background-color] duration-150 cursor-pointer text-left flex items-center justify-between ${
                              isSelected
                                ? 'bg-accent/10 text-accent border-accent'
                                : 'bg-surface-2/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-surface-2'
                            }`}
                          >
                            <span>{tier.label}</span>
                            <SelectionCheckBadge isSelected={isSelected} size="sm" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery Timeline */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent" /> Target Delivery Timeline
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TIMELINE_OPTIONS.map((opt) => {
                        const isSelected = formData.timeline === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, timeline: opt }))}
                            className={`group box-border p-2.5 rounded-xl text-xs font-semibold border-[1.5px] transition-[border-color,background-color] duration-150 cursor-pointer text-left flex items-center justify-between ${
                              isSelected
                                ? 'bg-accent/10 text-accent border-accent'
                                : 'bg-surface-2/60 text-muted-foreground border-border/60 hover:text-foreground hover:bg-surface-2'
                            }`}
                          >
                            <span>{opt}</span>
                            <SelectionCheckBadge isSelected={isSelected} size="sm" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Preferred Contact Method */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase font-mono tracking-wider block">
                    Preferred Contact Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-w-md">
                    {CONTACT_METHODS.map(({ id, label, icon: IconComponent }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, contactMethod: id }))}
                        className={`p-2.5 rounded-xl text-xs font-bold border-[1.5px] transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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

              {/* 4. CONTACT DETAILS */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary block">Step 4</span>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Your Contact Details</h2>
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

                  {/* Email */}
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

                {/* Phone Number with Searchable Country Code Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                    Phone Number{' '}
                    {formData.contactMethod !== 'email' ? (
                      <span className="text-rose-500">*</span>
                    ) : (
                      <span className="text-muted-foreground font-normal">(Optional)</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelector
                      value={formData.phoneCountry}
                      onChange={(c) => {
                        setFormData((prev) => ({
                          ...prev,
                          phoneCountry: c,
                          ...(prev.sameAsPhone ? { whatsappCountry: c } : {}),
                        }));
                      }}
                    />
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, phone: e.target.value }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="e.g. 98765 43210"
                      className="bg-surface-2/70 border-border h-11 rounded-xl text-sm flex-1"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                {/* WhatsApp Checkbox & Dedicated Field */}
                <div className="space-y-2 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.sameAsPhone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          sameAsPhone: checked,
                          ...(checked ? { whatsapp: '', whatsappCountry: prev.phoneCountry } : {}),
                        }));
                      }}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
                    />
                    <span className="text-xs font-medium text-foreground">
                      WhatsApp number is same as phone
                    </span>
                  </label>

                  {!formData.sameAsPhone && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                      <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                        WhatsApp Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <CountryCodeSelector
                          value={formData.whatsappCountry}
                          onChange={(c) => {
                            setFormData((prev) => ({ ...prev, whatsappCountry: c }));
                          }}
                        />
                        <Input
                          type="tel"
                          value={formData.whatsapp}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, whatsapp: e.target.value }));
                            if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
                          }}
                          placeholder="e.g. 98765 43210"
                          className="bg-surface-2/70 border-border h-11 rounded-xl text-sm flex-1"
                        />
                      </div>
                      {errors.whatsapp && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.whatsapp}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. REQUIREMENT BRIEF */}
              <div className="space-y-2 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary block">Step 5</span>
                    <label className="text-lg sm:text-xl font-bold text-foreground block">
                      Requirement Brief <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formData.message.trim().length} chars
                  </span>
                </div>
                <Textarea
                  value={formData.message}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, message: e.target.value }));
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  placeholder={messagePlaceholder}
                  rows={5}
                  className="bg-surface-2/70 border-border rounded-xl text-sm leading-relaxed resize-y"
                />
                {errors.message && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.message}</span>
                  </p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>24-Hour Scoping Guarantee &bull; NDA Compliant</span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-full font-semibold shadow-sm hover:shadow-card-hover transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit Project Inquiry</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* DUPLICATE INQUIRY NOTICE MODAL */}
      <Modal
        isOpen={Boolean(matchingQuery)}
        onClose={() => {
          setMatchingQuery(null);
          setPendingInquiryPayload(null);
        }}
        title="Similar Inquiry Already Submitted"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block text-foreground text-sm font-semibold mb-1">
                A matching inquiry was found on file
              </strong>
              We detected an existing project inquiry with the same email, phone, and selected service/project specifications.
            </div>
          </div>

          {matchingQuery && (
            <div className="p-4 rounded-xl bg-surface-2 border border-border text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Reference Token:</span>
                <span className="font-mono font-bold text-foreground">
                  {(matchingQuery.referenceToken || matchingQuery.id).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Submitted Date:</span>
                <span className="font-semibold text-foreground">
                  {formatISTDate(matchingQuery.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono">Status:</span>
                <span className="font-semibold text-primary">{matchingQuery.status}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            If you want to update your requirements, click <strong>Submit anyway</strong>. If your brief contains revised details, we will update your earlier inquiry for you.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setMatchingQuery(null);
                setPendingInquiryPayload(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmSubmitAnyway}
              className="rounded-xl px-5"
            >
              Submit anyway
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
