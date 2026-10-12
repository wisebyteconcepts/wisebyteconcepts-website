import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Code2,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { CountryCode, parsePhoneNumber } from 'libphonenumber-js';
import { useAppStore } from '@/store';
import { Query } from '@/types';
import { CountryCodeSelector } from '@/components/CountryCodeSelector';
import { CopyTokenButton } from '@/components/CopyTokenButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/Button';
import { SubPageHero } from '@/pages';
import { generateReferenceToken, formatISTDate } from '@/utils/date';
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon, TelegramIcon } from "@hugeicons/core-free-icons";


interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  phoneCountry: CountryCode;
  message: string;
  honeypot: string;
}

const QUOTE_HANDOFF_KEY = 'wbc_quote_handoff';

export const ContactPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const addQuery = useAppStore((state) => state.addQuery);
  const updateQuery = useAppStore((state) => state.updateQuery);

  // ---------------------------------------------------------------------------
  // 1. Backward-compatible Redirect: /contact?service=... -> /quote?service=...
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const projectParam = searchParams.get('project');
    if (serviceParam || projectParam) {
      navigate(`/quote${window.location.search}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Form input state
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    phoneCountry: 'IN',
    message: '',
    honeypot: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToken, setSubmittedToken] = useState<string | null>(null);
  const [submittedTime, setSubmittedTime] = useState<string | null>(null);
  const [mountedTime] = useState<number>(() => Date.now());

  // Detect visitor country non-blockingly
  useEffect(() => {
    fetch('/api/geo/country')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country) {
          setFormData((prev) => ({
            ...prev,
            phoneCountry: (data.country as CountryCode) || 'IN',
          }));
        }
      })
      .catch(() => {
        // quiet fallback
      });
  }, []);

  // Autofill Hand-off: Save typed contact fields to sessionStorage and navigate to /quote
  const handleGoToQuote = () => {
    if (formData.name || formData.email || formData.phone || formData.message) {
      try {
        sessionStorage.setItem(
          QUOTE_HANDOFF_KEY,
          JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            phoneCountry: formData.phoneCountry,
            message: formData.message.trim(),
          })
        );
      } catch {
        // ignore
      }
    }
    navigate('/quote');
  };

  // Inline Validation
  const validateForm = (): { isValid: boolean; formattedPhone: string } => {
    const newErrors: Partial<Record<keyof ContactFormData, string>> = {};
    let formattedPhone = '';

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your name (at least 2 characters).';
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
          newErrors.phone = 'Please enter a valid phone number for the selected country.';
        } else {
          formattedPhone = parsed.number; // E.164
        }
      } catch {
        newErrors.phone = 'Please enter a valid phone number for the selected country.';
      }
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Please provide a message (at least 10 characters).';
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      formattedPhone,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Spam honeypot
    if (formData.honeypot.trim().length > 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedToken(generateReferenceToken());
        setSubmittedTime(new Date().toISOString());
      }, 400);
      return;
    }

    // Bot speed check
    if (Date.now() - mountedTime < 600) {
      return;
    }

    const { isValid, formattedPhone } = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);

    const token = generateReferenceToken();
    const generatedId = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newQuery: Query = {
      id: generatedId,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formattedPhone || formData.phone.trim(),
      countryCode: formData.phoneCountry,
      type: 'Contact message',
      message: formData.message.trim(),
      services: [],
      projects: [],
      budget: '',
      timeline: '',
      contactMethod: 'email',
      createdAt: nowIso,
      status: 'New',
      isRead: false,
      referenceToken: token,
      notes: '',
      notified: false,
    };

    try {
      await addQuery(newQuery);
    } catch (err) {
      console.error('[ContactPage] Failed to save contact query:', err);
    }

    setIsSubmitting(false);
    setSubmittedToken(token);
    setSubmittedTime(nowIso);

    // Trigger Telegram notification
    try {
      const response = await fetch('/api/notifications/telegram/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newQuery }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.notified) {
          await updateQuery({ ...newQuery, notified: true });
        }
      }
    } catch (err) {
      console.warn('[ContactPage] Telegram dispatch error:', err);
    }
  };

  const handleReset = () => {
    setSubmittedToken(null);
    setSubmittedTime(null);
    setFormData((prev) => ({
      name: '',
      email: '',
      phone: '',
      phoneCountry: prev.phoneCountry,
      message: '',
      honeypot: '',
    }));
    setErrors({});
  };

  const PHONE_PARTS = ["91", "70998", "16688"];
  const TELEGRAM_PARTS = ["wisebyte", "concepts"];

  const CONTACT_MESSAGE =
    "Hi! I came across your website and I'd like to learn more about your services. Could you help me with the details?";

  const getPhoneNumber = () => PHONE_PARTS.join("");
  const getTelegramUsername = () => TELEGRAM_PARTS.join("");

  const handlePhoneClick = () => {
    window.location.href = `tel:+${getPhoneNumber()}`;
  };

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${getPhoneNumber()}?text=${encodeURIComponent(CONTACT_MESSAGE)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTelegramClick = () => {
    // Fire-and-forget: don't await, so window.open still counts as a direct user action
    navigator.clipboard?.writeText(CONTACT_MESSAGE).catch(() => {});
    window.open(`https://t.me/${getTelegramUsername()}`, "_blank", "noopener,noreferrer");
  };

  const EMAIL_PARTS = ["wisebyte", "concepts", "@", "gmail.com"];
  const EMAIL_SUBJECT = "Business Inquiry via Your Website";
  const EMAIL_BODY = "Hi, I came across your website and would like to discuss a project.";

  const getEmail = () => EMAIL_PARTS.join("");

  const handleMailClick = () => {
    const params = new URLSearchParams({ subject: EMAIL_SUBJECT, body: EMAIL_BODY });
    // URLSearchParams encodes spaces as "+", which some mail apps show literally, so convert to %20
    const query = params.toString().replace(/\+/g, "%20");

    const a = document.createElement("a");
    a.href = `mailto:${getEmail()}?${query}`;
    a.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Hero matching Services and Projects listing pages */}
      <SubPageHero
        badge="Contact"
        title={<>Get in <span className="text-primary">touch.</span></>}
        subtitle="Have questions or want to discuss a potential partnership? Reach out to our team."
      />

      {/* 2. Main Content: Two-column layout on desktop, stacked on mobile */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Top Banner / Callout: Prominent "Get a quote" card */}
          <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-surface-2 via-surface-1 to-surface-2 border border-primary/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Project Inquiries</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                Have a project in mind?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Share your requirements, budget, and timeline with our engineering leads to receive an architectural scope and delivery roadmap.
              </p>
            </div>
            <Button
              onClick={handleGoToQuote}
              size="lg"
              className="rounded-full px-7 py-3 font-semibold shadow-sm hover:shadow-card-hover transition-all cursor-pointer whitespace-nowrap shrink-0 group flex items-center gap-2"
            >
              <span>Get a quote</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column (Brand Info & Contact Detail Cards) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Brand Info Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-surface-1 border border-border/70 shadow-sm space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground">
                      Wise Byte Concepts
                    </h3>
                    <p className="text-xs font-mono uppercase tracking-wider text-primary">
                      Precision Digital Engineering
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We architect high-performance web applications, scalable platforms, and bespoke digital experiences with deliberate design precision.
                </p>
              </div>

              {/* Contact Detail Icon Cards */}
              <div className="space-y-3">
                {/* Email Card */}
                <button
                  type="button"
                  onClick={handleMailClick}
                  className="w-full text-left p-4 rounded-2xl bg-surface-1 hover:bg-surface-2/80 border border-border/70 hover:border-accent/40 transition-all flex items-center gap-4 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      Direct Mail
                    </span>
                    <strong className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors block">
                      Send an Email
                    </strong>
                  </div>
                </button>

                {/* Phone Card */}
                <button
                  type="button"
                  onClick={handlePhoneClick}
                  className="w-full text-left p-4 rounded-2xl bg-surface-1 hover:bg-surface-2/80 border border-border/70 hover:border-accent/40 transition-all flex items-center gap-4 group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      Phone Line
                    </span>
                    <strong className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors block">
                      Talk on Phone
                    </strong>
                  </div>
                </button>

                {/* WhatsApp Card */}
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="w-full text-left p-4 rounded-2xl bg-surface-1 hover:bg-surface-2/80 border border-border/70 hover:border-emerald-500/40 transition-all flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <HugeiconsIcon icon={WhatsappIcon} size={23} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                        WhatsApp Dispatch
                      </span>
                      <strong className="text-sm font-semibold text-foreground group-hover:text-emerald-500 transition-colors block">
                        Chat on WhatsApp
                      </strong>
                    </div>
                  </button>

                 {/* Telegram Card */}
                  <button
                    type="button"
                    onClick={handleTelegramClick}
                    className="w-full text-left p-4 rounded-2xl bg-surface-1 hover:bg-surface-2/80 border border-border/70 hover:border-[#26A5E4]/40 transition-all flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#26A5E4]/10 border border-[#26A5E4]/20 text-[#26A5E4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <HugeiconsIcon icon={TelegramIcon} size={23} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                        Telegram Dispatch
                      </span>
                      <strong className="text-sm font-semibold text-foreground group-hover:text-[#26A5E4] transition-colors block">
                        Chat on Telegram
                      </strong>
                    </div>
                  </button>
                {/* Location Card */}
                <div className="p-4 rounded-2xl bg-surface-1 border border-border/70 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-muted-foreground flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      Location
                    </span>
                    <strong className="text-sm font-semibold text-foreground block">
                      India (Global Remote Dispatch)
                    </strong>
                  </div>
                </div>

                {/* Working Hours Card */}
                <div className="p-4 rounded-2xl bg-surface-1 border border-border/70 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-muted-foreground flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      Working Hours
                    </span>
                    <strong className="text-sm font-semibold text-foreground block">
                      Mon &ndash; Fri: 9:00 AM &ndash; 6:00 PM IST
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Simple Contact Form & Inline Success) */}
            <div className="lg:col-span-7">
              {submittedToken ? (
                /* INLINE SUCCESS STATE */
                <div className="p-8 sm:p-10 rounded-3xl bg-surface-1 border border-border/80 shadow-card text-center space-y-6 animate-in fade-in duration-300">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-glow-sm">
                    <Check className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      Thank you for your message!
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                      We have received your note. Our team will review your message and reply via email or phone shortly.
                    </p>
                  </div>

                  {/* Reference Token */}
                  <div className="p-5 rounded-2xl bg-surface-2 border border-border max-w-sm mx-auto text-center space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-bold">
                      Reference Token
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-lg font-bold text-primary select-all">
                        {submittedToken.toUpperCase()}
                      </span>
                      <CopyTokenButton token={submittedToken} />
                    </div>
                    {submittedTime && (
                      <span className="text-[11px] text-muted-foreground font-mono block">
                        Received {formatISTDate(submittedTime)}
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleReset}
                      className="rounded-full px-7 py-2.5 text-xs font-semibold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-2" />
                      Send Another Message
                    </Button>
                  </div>
                </div>
              ) : (
                /* SIMPLE CONTACT FORM */
                <form
                  onSubmit={handleSubmit}
                  className="p-6 sm:p-8 rounded-3xl bg-surface-1 border border-border/80 shadow-card space-y-6"
                >
                  {/* Hidden Honeypot */}
                  <input
                    type="text"
                    name="wbc_hp_code"
                    value={formData.honeypot}
                    onChange={(e) => setFormData((prev) => ({ ...prev, honeypot: e.target.value }))}
                    style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      Send a message
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fill in your details below and we&apos;ll be in touch.
                    </p>
                  </div>

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

                  {/* Phone with Searchable Country Code Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                      Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <CountryCodeSelector
                        value={formData.phoneCountry}
                        onChange={(c) => {
                          setFormData((prev) => ({ ...prev, phoneCountry: c }));
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

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-foreground font-mono uppercase tracking-wider block">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, message: e.target.value }));
                        if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                      }}
                      placeholder="How can we help you? Feel free to ask questions or share project thoughts..."
                      rows={4}
                      className="bg-surface-2/70 border-border rounded-xl text-sm leading-relaxed resize-y"
                    />
                    {errors.message && (
                      <p className="text-xs text-rose-500 flex items-center gap-1 font-medium mt-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Privacy Protected &bull; Rapid Response</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-7 py-3 rounded-full font-semibold shadow-sm hover:shadow-card-hover transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
