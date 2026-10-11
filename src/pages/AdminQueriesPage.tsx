import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  Mail, 
  Phone, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  ChevronRight, 
  X, 
  Check, 
  Briefcase, 
  ShoppingBag, 
  ChevronLeft,
  Save,
  MessageCircle,
  Copy,
  History
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useToastStore } from '@/store/toastStore';
import { Query, QueryStatus } from '@/types';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { CopyTokenButton } from '@/components/CopyTokenButton';
import { formatISTDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import { parsePhoneNumber } from 'libphonenumber-js';

const ITEMS_PER_PAGE = 10;

type SubTab = 'quote' | 'contact';

export const AdminQueriesPage: React.FC = () => {
  const queries = useAppStore((state) => state.queries || []);
  const updateQuery = useAppStore((state) => state.updateQuery);
  const deleteQuery = useAppStore((state) => state.deleteQuery);
  const markQueryRead = useAppStore((state) => state.markQueryRead);
  const services = useAppStore((state) => state.services || []);
  const products = useAppStore((state) => state.products || []);
  const isLoaded = useAppStore((state) => state.isLoaded);
  const addToast = useToastStore((state) => state.addToast);

  const [searchParams, setSearchParams] = useSearchParams();

  // Sub tab state synchronized with URL (default to Project Queries)
  // URL: ?tab=queries&type=contact or ?type=contact
  const activeSubTab: SubTab = useMemo(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'contact' || typeParam === 'Contact message') {
      return 'contact';
    }
    return 'quote';
  }, [searchParams]);

  const handleSubTabChange = (nextTab: SubTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === 'contact') {
      nextParams.set('type', 'contact');
    } else {
      nextParams.delete('type');
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Sub tab 1 (Project Queries) independent filter & search states
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatus, setQuoteStatus] = useState<'all' | QueryStatus>('all');
  const [quoteService, setQuoteService] = useState<'all' | string>('all');
  const [quoteRead, setQuoteRead] = useState<'all' | 'unread' | 'read'>('all');
  const [quotePage, setQuotePage] = useState(1);

  // Sub tab 2 (Contact Messages) independent filter & search states
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatus, setContactStatus] = useState<'all' | QueryStatus>('all');
  const [contactDate, setContactDate] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [contactRead, setContactRead] = useState<'all' | 'unread' | 'read'>('all');
  const [contactPage, setContactPage] = useState(1);

  // Selected Query for Detail Drawer
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Preserve container ref
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  // Telegram Notifications Admin Settings State
  const [telegramStatus, setTelegramStatus] = useState<{ enabled: boolean; isConfigured: boolean } | null>(null);
  const [isTogglingTelegram, setIsTogglingTelegram] = useState(false);
  const [isSendingTestTelegram, setIsSendingTestTelegram] = useState(false);

  // Load Telegram notification status from server
  useEffect(() => {
    fetch('/api/notifications/telegram/status')
      .then((res) => res.json())
      .then((data) => {
        setTelegramStatus(data);
      })
      .catch((err) => {
        console.warn('[AdminQueriesPage] Could not load Telegram status:', err);
      });
  }, []);

  // Link to query opens detail view automatically
  useEffect(() => {
    const idParam = searchParams.get('id') || searchParams.get('query');
    if (idParam) {
      setSelectedQueryId(idParam);
    }
  }, [searchParams]);

  // Toggle Telegram notifications enabled/disabled
  const handleToggleTelegram = async () => {
    if (!telegramStatus || isTogglingTelegram) return;
    setIsTogglingTelegram(true);
    try {
      const nextEnabled = !telegramStatus.enabled;
      const res = await fetch('/api/notifications/telegram/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus((prev) => (prev ? { ...prev, enabled: data.enabled } : null));
        addToast(
          data.enabled ? 'Telegram notifications turned ON' : 'Telegram notifications turned OFF',
          'info'
        );
      } else {
        addToast('Failed to toggle Telegram notifications', 'error');
      }
    } catch {
      addToast('Network error while toggling notifications', 'error');
    } finally {
      setIsTogglingTelegram(false);
    }
  };

  // Send a test message to verify Telegram Bot configuration
  const handleSendTestTelegram = async () => {
    if (isSendingTestTelegram) return;
    setIsSendingTestTelegram(true);
    try {
      const res = await fetch('/api/notifications/telegram/test', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        addToast('Test message sent to Telegram successfully!', 'success');
      } else {
        addToast(data.error || 'Failed to send test message to Telegram', 'error');
      }
    } catch {
      addToast('Network error sending test Telegram notification', 'error');
    } finally {
      setIsSendingTestTelegram(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(label);
        addToast(`${label} copied to clipboard`, 'success');
        setTimeout(() => {
          setCopiedField((prev) => (prev === label ? null : prev));
        }, 2000);
      }).catch(() => {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text: string, label: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(label);
      addToast(`${label} copied to clipboard`, 'success');
      setTimeout(() => {
        setCopiedField((prev) => (prev === label ? null : prev));
      }, 2000);
    } catch {
      addToast(`Unable to copy ${label.toLowerCase()}`, 'error');
    }
  };

  // Split datasets according to prompt requirements:
  // "Use the existing type field to split the data, and treat older records without a type as Project Queries."
  const isContactRecord = (q: Query) => q.type === 'Contact message';
  const isQuoteRecord = (q: Query) => !q.type || q.type === 'Quote request';

  // Counts (Sub tabs unread badges and total)
  const totalUnreadCount = useMemo(() => queries.filter((q) => !q.isRead).length, [queries]);
  const quoteUnreadCount = useMemo(
    () => queries.filter((q) => isQuoteRecord(q) && !q.isRead).length,
    [queries]
  );
  const contactUnreadCount = useMemo(
    () => queries.filter((q) => isContactRecord(q) && !q.isRead).length,
    [queries]
  );

  const totalQuoteCount = useMemo(() => queries.filter(isQuoteRecord).length, [queries]);
  const totalContactCount = useMemo(() => queries.filter(isContactRecord).length, [queries]);

  // Filtered Project Queries
  const filteredQuoteQueries = useMemo(() => {
    return queries
      .filter((q) => {
        if (!isQuoteRecord(q)) return false;

        if (quoteStatus !== 'all' && q.status !== quoteStatus) return false;
        if (quoteRead === 'unread' && q.isRead) return false;
        if (quoteRead === 'read' && !q.isRead) return false;

        if (quoteService !== 'all') {
          const hasService = q.services?.some((s) => s.id === quoteService || s.name === quoteService);
          if (!hasService) return false;
        }

        if (quoteSearch.trim()) {
          const term = quoteSearch.toLowerCase().trim();
          const matchesName = q.name?.toLowerCase().includes(term);
          const matchesEmail = q.email?.toLowerCase().includes(term);
          const matchesPhone = q.phone?.toLowerCase().includes(term);
          const matchesMessage = q.message?.toLowerCase().includes(term);
          const matchesService = q.services?.some((s) => s.name?.toLowerCase().includes(term));
          const matchesProject = q.projects?.some((p) => p.name?.toLowerCase().includes(term));
          const matchesToken = (q.referenceToken || q.id)?.toLowerCase().includes(term);
          if (!matchesName && !matchesEmail && !matchesPhone && !matchesMessage && !matchesService && !matchesProject && !matchesToken) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [queries, quoteStatus, quoteService, quoteRead, quoteSearch]);

  // Filtered Contact Messages (filters: status, date, read, search; no service/budget filters)
  const filteredContactQueries = useMemo(() => {
    const now = Date.now();
    return queries
      .filter((q) => {
        if (!isContactRecord(q)) return false;

        if (contactStatus !== 'all' && q.status !== contactStatus) return false;
        if (contactRead === 'unread' && q.isRead) return false;
        if (contactRead === 'read' && !q.isRead) return false;

        // Date filter
        if (contactDate !== 'all') {
          const createdTime = new Date(q.createdAt).getTime();
          if (isNaN(createdTime)) return true;
          const diffMs = now - createdTime;
          if (contactDate === 'today' && diffMs > 24 * 60 * 60 * 1000) return false;
          if (contactDate === '7d' && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
          if (contactDate === '30d' && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
        }

        if (contactSearch.trim()) {
          const term = contactSearch.toLowerCase().trim();
          const matchesName = q.name?.toLowerCase().includes(term);
          const matchesEmail = q.email?.toLowerCase().includes(term);
          const matchesPhone = q.phone?.toLowerCase().includes(term);
          const matchesMessage = q.message?.toLowerCase().includes(term);
          const matchesToken = (q.referenceToken || q.id)?.toLowerCase().includes(term);
          if (!matchesName && !matchesEmail && !matchesPhone && !matchesMessage && !matchesToken) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [queries, contactStatus, contactDate, contactRead, contactSearch]);

  // Active sub tab pagination
  const quoteTotalPages = Math.max(1, Math.ceil(filteredQuoteQueries.length / ITEMS_PER_PAGE));
  const paginatedQuoteQueries = useMemo(() => {
    const start = (quotePage - 1) * ITEMS_PER_PAGE;
    return filteredQuoteQueries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuoteQueries, quotePage]);

  const contactTotalPages = Math.max(1, Math.ceil(filteredContactQueries.length / ITEMS_PER_PAGE));
  const paginatedContactQueries = useMemo(() => {
    const start = (contactPage - 1) * ITEMS_PER_PAGE;
    return filteredContactQueries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContactQueries, contactPage]);

  // Reset pagination on filter changes
  useEffect(() => {
    setQuotePage(1);
  }, [quoteSearch, quoteStatus, quoteService, quoteRead]);

  useEffect(() => {
    setContactPage(1);
  }, [contactSearch, contactStatus, contactDate, contactRead]);

  // Active Query instance
  const selectedQuery = useMemo(() => {
    return queries.find((q) => q.id === selectedQueryId) || null;
  }, [queries, selectedQueryId]);

  // Synchronize notes draft when selected query changes
  useEffect(() => {
    if (selectedQuery) {
      setNotesDraft(selectedQuery.notes || '');
      setNotesSavedNotice(false);

      // Auto-mark as read when opened
      if (!selectedQuery.isRead) {
        markQueryRead(selectedQuery.id, true).catch((err) => {
          console.error('[AdminQueriesPage] Auto-mark read failed', err);
        });
      }
    }
  }, [selectedQuery?.id]);

  // Status badge styling helper
  const renderStatusBadge = (status: QueryStatus) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            New
          </span>
        );
      case 'In progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  // Status change handler
  const handleStatusChange = async (targetId: string, nextStatus: QueryStatus) => {
    const target = queries.find((q) => q.id === targetId);
    if (!target) return;
    try {
      await updateQuery({ ...target, status: nextStatus });
      addToast(`Status updated to "${nextStatus}"`, 'success');
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  // Read / Unread toggle
  const handleToggleRead = async (targetId: string, currentRead: boolean) => {
    try {
      await markQueryRead(targetId, !currentRead);
      addToast(`Marked as ${!currentRead ? 'Read' : 'Unread'}`, 'success');
    } catch {
      addToast('Failed to update read state', 'error');
    }
  };

  // Resolve query being deleted
  const queryToDelete = useMemo(() => {
    if (!deleteConfirmationId) return null;
    return queries.find((q) => q.id === deleteConfirmationId) || null;
  }, [queries, deleteConfirmationId]);

  // Delete query
  const handleConfirmDelete = async () => {
    if (!deleteConfirmationId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteQuery(deleteConfirmationId);
      addToast('Query deleted successfully', 'success');
      if (selectedQueryId === deleteConfirmationId) {
        setSelectedQueryId(null);
      }
      setDeleteConfirmationId(null);
    } catch {
      addToast('Failed to delete query', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedQuery) return;
    setIsSavingNotes(true);
    try {
      await updateQuery({ ...selectedQuery, notes: notesDraft.trim() });
      setNotesSavedNotice(true);
      addToast('Internal notes saved', 'success');
      setTimeout(() => setNotesSavedNotice(false), 2500);
    } catch {
      addToast('Failed to save notes', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Format date helper in Indian Standard Time (IST)
  const formatDate = (dateStr: string) => formatISTDate(dateStr);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Inquiries & Queries
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-surface-2 border border-border text-foreground">
                {queries.length} Total
              </span>
              {totalUnreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-accent text-on-accent animate-pulse">
                  {totalUnreadCount} Unread
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review incoming project leads, manage statuses, take internal notes, and direct contact client inquiries.
          </p>
        </div>

        {/* Telegram Admin Notifications Control */}
        {telegramStatus && (
          <div className="flex flex-wrap items-center gap-2.5 p-2 px-3 rounded-xl bg-surface-2/70 border border-border text-xs">
            <div className="flex items-center gap-2 pr-2 border-r border-border/60">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  !telegramStatus.isConfigured
                    ? 'bg-amber-500'
                    : telegramStatus.enabled
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-muted-foreground'
                )}
              />
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                Telegram:
                <span className="text-muted-foreground font-normal">
                  {!telegramStatus.isConfigured
                    ? 'Unconfigured (env vars)'
                    : telegramStatus.enabled
                    ? 'Active'
                    : 'Disabled'}
                </span>
              </span>
            </div>

            <Button
              variant="glass"
              size="sm"
              disabled={isTogglingTelegram}
              onClick={handleToggleTelegram}
              className="text-xs h-7 px-2.5 rounded-lg"
              title={telegramStatus.enabled ? 'Disable Telegram notifications' : 'Enable Telegram notifications'}
            >
              {telegramStatus.enabled ? 'Turn Off' : 'Turn On'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={isSendingTestTelegram || !telegramStatus.isConfigured}
              onClick={handleSendTestTelegram}
              className="text-xs h-7 px-2.5 rounded-lg border-border"
              title="Send a test message to the configured Telegram chat"
            >
              {isSendingTestTelegram ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SUB TABS NAVIGATION (Services/Projects content tabs style)    */}
      {/* ============================================================ */}
      <div className="w-full overflow-x-auto py-0.5 hide-scrollbar">
        <div
          role="tablist"
          aria-label="Queries Sub Tabs"
          className="bg-surface-2 p-1 rounded-2xl border border-border inline-flex h-auto max-h-none gap-1 shrink-0"
        >
          {/* Sub Tab 1: Project Queries */}
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'quote'}
            onClick={() => handleSubTabChange('quote')}
            className={cn(
              "relative inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold border transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 select-none shrink-0 cursor-pointer min-h-[36px]",
              activeSubTab === 'quote'
                ? "bg-surface-1 text-foreground shadow-xs border-border/80 font-bold"
                : "bg-transparent text-muted-foreground hover:bg-[var(--hover-overlay)] hover:text-foreground border-transparent"
            )}
          >
            <Briefcase className={cn("w-4 h-4 shrink-0", activeSubTab === 'quote' ? "text-primary" : "text-muted-foreground")} />
            <span>Project Queries</span>
            {quoteUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent text-on-accent shrink-0 shadow-xs leading-none">
                {quoteUnreadCount}
              </span>
            )}
          </button>

          {/* Sub Tab 2: Contact Messages */}
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'contact'}
            onClick={() => handleSubTabChange('contact')}
            className={cn(
              "relative inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold border transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 select-none shrink-0 cursor-pointer min-h-[36px]",
              activeSubTab === 'contact'
                ? "bg-surface-1 text-foreground shadow-xs border-border/80 font-bold"
                : "bg-transparent text-muted-foreground hover:bg-[var(--hover-overlay)] hover:text-foreground border-transparent"
            )}
          >
            <Mail className={cn("w-4 h-4 shrink-0", activeSubTab === 'contact' ? "text-emerald-500" : "text-muted-foreground")} />
            <span>Contact Messages</span>
            {contactUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent text-on-accent shrink-0 shadow-xs leading-none">
                {contactUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUB TAB 1: PROJECT QUERIES VIEW                             */}
      {/* ============================================================ */}
      {activeSubTab === 'quote' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Project Queries Search & Filters Toolbar */}
          <div className="p-4 rounded-2xl bg-surface-1 border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search Box */}
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  placeholder="Search sender, email, token, or brief..."
                  className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
                {quoteSearch && (
                  <button
                    type="button"
                    onClick={() => setQuoteSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="lg:col-span-2">
                <select
                  value={quoteStatus}
                  onChange={(e) => setQuoteStatus(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="New">Status: New</option>
                  <option value="In progress">Status: In progress</option>
                  <option value="Resolved">Status: Resolved</option>
                </select>
              </div>

              {/* Service Filter */}
              <div className="lg:col-span-3">
                <select
                  value={quoteService}
                  onChange={(e) => setQuoteService(e.target.value)}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate"
                >
                  <option value="all">All Services</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title || s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read / Unread Filter */}
              <div className="lg:col-span-2">
                <select
                  value={quoteRead}
                  onChange={(e) => setQuoteRead(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="all">All Read States</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>
            </div>

            {/* Filter Chips / Active Counts */}
            {(quoteSearch || quoteStatus !== 'all' || quoteService !== 'all' || quoteRead !== 'all') && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>Filtered:</span>
                  <strong className="text-foreground">{filteredQuoteQueries.length} of {totalQuoteCount} project queries</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteSearch('');
                    setQuoteStatus('all');
                    setQuoteService('all');
                    setQuoteRead('all');
                  }}
                  className="text-primary hover:underline text-xs font-semibold cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Project Queries List Container */}
          <div ref={listContainerRef} className="rounded-2xl border border-border/60 bg-surface-1 overflow-hidden shadow-xs">
            {!isLoaded ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-2/40 animate-pulse gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-surface-3" />
                      <div className="w-32 h-4 bg-surface-3 rounded" />
                    </div>
                    <div className="w-48 h-4 bg-surface-3 rounded hidden sm:block" />
                    <div className="w-20 h-6 bg-surface-3 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredQuoteQueries.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  icon={Briefcase}
                  title="No project queries yet"
                  description={
                    totalQuoteCount === 0
                      ? 'Quote requests submitted from the /quote page will appear here with service and budget selections.'
                      : 'Try adjusting your search keywords, service filter, or read state.'
                  }
                />
              </div>
            ) : (
              <div>
                {/* Desktop Table Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 bg-surface-2/60 border-b border-border/60 text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  <div className="col-span-3">Sender & Status</div>
                  <div className="col-span-4">Requirement Brief</div>
                  <div className="col-span-3">Service & Project Scope</div>
                  <div className="col-span-2 text-right">Date & Action</div>
                </div>

                {/* List Rows */}
                <div className="divide-y divide-border/50">
                  {paginatedQuoteQueries.map((query) => {
                    const isSelected = selectedQueryId === query.id;
                    const isUnread = !query.isRead;

                    return (
                      <div
                        key={query.id}
                        onClick={() => setSelectedQueryId(query.id)}
                        className={cn(
                          'p-4 sm:px-6 sm:py-4 transition-all duration-150 cursor-pointer flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center text-left hover:bg-surface-2/70',
                          isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary/30' : '',
                          isUnread ? 'bg-surface-2/30 font-medium' : 'text-muted-foreground'
                        )}
                      >
                        {/* Column 1: Sender Name & Unread Dot & Status */}
                        <div className="w-full md:col-span-3 flex items-start gap-3">
                          <div className="pt-1 md:pt-0 shrink-0">
                            {isUnread ? (
                              <div 
                                className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse" 
                                title="Unread Query"
                              />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn('text-sm truncate', isUnread ? 'font-bold text-foreground' : 'text-foreground/90')}>
                                {query.name || 'Anonymous Client'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {query.email}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {renderStatusBadge(query.status)}
                              {query.budget && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold truncate max-w-[140px]">
                                  <DollarSign className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{query.budget}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                                {(query.referenceToken || query.id).toUpperCase()}
                              </span>
                              <CopyTokenButton token={(query.referenceToken || query.id).toUpperCase()} />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Requirement Brief Preview */}
                        <div className="w-full md:col-span-4 min-w-0">
                          <p className={cn('text-xs line-clamp-2 leading-relaxed', isUnread ? 'text-foreground/90 font-normal' : 'text-muted-foreground')}>
                            {query.message}
                          </p>
                        </div>

                        {/* Column 3: Service/Project Chips */}
                        <div className="w-full md:col-span-3 flex flex-wrap gap-1.5 items-center">
                          {query.services?.map((svc) => (
                            <span
                              key={svc.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-surface-3/80 text-foreground border border-border/50 truncate max-w-[150px]"
                            >
                              <Briefcase className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate">{svc.name}</span>
                            </span>
                          ))}

                          {query.projects?.map((proj) => (
                            <span
                              key={proj.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-surface-3/80 text-foreground border border-border/50 truncate max-w-[150px]"
                            >
                              <ShoppingBag className="w-3 h-3 text-accent shrink-0" />
                              <span className="truncate">{proj.name}</span>
                            </span>
                          ))}

                          {(!query.services || query.services.length === 0) && (!query.projects || query.projects.length === 0) && (
                            <span className="text-[11px] font-mono text-muted-foreground/60 italic">
                              General Consultation
                            </span>
                          )}
                        </div>

                        {/* Column 4: Date & Action */}
                        <div className="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                          <div className="text-right">
                            <span className="text-[11px] font-mono text-muted-foreground block">
                              {formatDate(query.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmationId(query.id);
                              }}
                              className="p-2 sm:p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center group"
                              aria-label="Delete query"
                              title="Delete query"
                            >
                              <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 hidden sm:block" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pagination Bar */}
            {filteredQuoteQueries.length > ITEMS_PER_PAGE && (
              <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-surface-2/30">
                <div>
                  Showing <strong className="text-foreground">{(quotePage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
                  <strong className="text-foreground">{Math.min(quotePage * ITEMS_PER_PAGE, filteredQuoteQueries.length)}</strong> of{' '}
                  <strong className="text-foreground">{filteredQuoteQueries.length}</strong> project queries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setQuotePage((p) => Math.max(1, p - 1))}
                    disabled={quotePage <= 1}
                    className="rounded-lg h-8 px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                  </Button>
                  <span className="font-mono px-2">
                    {quotePage} / {quoteTotalPages}
                  </span>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setQuotePage((p) => Math.min(quoteTotalPages, p + 1))}
                    disabled={quotePage >= quoteTotalPages}
                    className="rounded-lg h-8 px-2.5"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB TAB 2: CONTACT MESSAGES VIEW (Requirement 3)             */}
      {/* ============================================================ */}
      {activeSubTab === 'contact' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Contact Messages Search & Filters Toolbar */}
          <div className="p-4 rounded-2xl bg-surface-1 border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search Box */}
              <div className="lg:col-span-6 relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search name, email, phone, token, or message..."
                  className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
                {contactSearch && (
                  <button
                    type="button"
                    onClick={() => setContactSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="lg:col-span-2">
                <select
                  value={contactStatus}
                  onChange={(e) => setContactStatus(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="New">Status: New</option>
                  <option value="In progress">Status: In progress</option>
                  <option value="Resolved">Status: Resolved</option>
                </select>
              </div>

              {/* Date Filter (Requirement 3: Filters are status and date) */}
              <div className="lg:col-span-2">
                <select
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today (24h)</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              {/* Read / Unread Filter */}
              <div className="lg:col-span-2">
                <select
                  value={contactRead}
                  onChange={(e) => setContactRead(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="all">All Read States</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>
            </div>

            {/* Filter Chips / Active Counts */}
            {(contactSearch || contactStatus !== 'all' || contactDate !== 'all' || contactRead !== 'all') && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>Filtered:</span>
                  <strong className="text-foreground">{filteredContactQueries.length} of {totalContactCount} contact messages</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContactSearch('');
                    setContactStatus('all');
                    setContactDate('all');
                    setContactRead('all');
                  }}
                  className="text-primary hover:underline text-xs font-semibold cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* Contact Messages List Container */}
          <div ref={listContainerRef} className="rounded-2xl border border-border/60 bg-surface-1 overflow-hidden shadow-xs">
            {!isLoaded ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-surface-2/40 animate-pulse gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-surface-3" />
                      <div className="w-32 h-4 bg-surface-3 rounded" />
                    </div>
                    <div className="w-48 h-4 bg-surface-3 rounded hidden sm:block" />
                    <div className="w-20 h-6 bg-surface-3 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredContactQueries.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  icon={Mail}
                  title="No contact messages yet"
                  description={
                    totalContactCount === 0
                      ? 'Messages submitted from the /contact form will appear here.'
                      : 'Try adjusting your search keywords, date range, or status filter.'
                  }
                />
              </div>
            ) : (
              <div>
                {/* Desktop Table Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 bg-surface-2/60 border-b border-border/60 text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  <div className="col-span-3">Sender & Status</div>
                  <div className="col-span-4">Message Preview</div>
                  <div className="col-span-3">Contact Details</div>
                  <div className="col-span-2 text-right">Date & Action</div>
                </div>

                {/* List Rows */}
                <div className="divide-y divide-border/50">
                  {paginatedContactQueries.map((query) => {
                    const isSelected = selectedQueryId === query.id;
                    const isUnread = !query.isRead;

                    return (
                      <div
                        key={query.id}
                        onClick={() => setSelectedQueryId(query.id)}
                        className={cn(
                          'p-4 sm:px-6 sm:py-4 transition-all duration-150 cursor-pointer flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center text-left hover:bg-surface-2/70',
                          isSelected ? 'bg-primary/5 ring-1 ring-inset ring-primary/30' : '',
                          isUnread ? 'bg-surface-2/30 font-medium' : 'text-muted-foreground'
                        )}
                      >
                        {/* Column 1: Sender Name & Unread Dot & Status */}
                        <div className="w-full md:col-span-3 flex items-start gap-3">
                          <div className="pt-1 md:pt-0 shrink-0">
                            {isUnread ? (
                              <div 
                                className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" 
                                title="Unread Message"
                              />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-border" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn('text-sm truncate', isUnread ? 'font-bold text-foreground' : 'text-foreground/90')}>
                                {query.name || 'Anonymous Message'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {query.email}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {renderStatusBadge(query.status)}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                                {(query.referenceToken || query.id).toUpperCase()}
                              </span>
                              <CopyTokenButton token={(query.referenceToken || query.id).toUpperCase()} />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Message Preview */}
                        <div className="w-full md:col-span-4 min-w-0">
                          <p className={cn('text-xs line-clamp-2 leading-relaxed', isUnread ? 'text-foreground/90 font-normal' : 'text-muted-foreground')}>
                            {query.message}
                          </p>
                        </div>

                        {/* Column 3: Email and Phone details */}
                        <div className="w-full md:col-span-3 space-y-1 text-xs">
                          {query.email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate">{query.email}</span>
                            </div>
                          )}
                          {query.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground truncate font-mono">
                              <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span className="truncate">{query.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Column 4: Date & Action */}
                        <div className="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                          <div className="text-right">
                            <span className="text-[11px] font-mono text-muted-foreground block">
                              {formatDate(query.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmationId(query.id);
                              }}
                              className="p-2 sm:p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center group"
                              aria-label="Delete message"
                              title="Delete message"
                            >
                              <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 hidden sm:block" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pagination Bar */}
            {filteredContactQueries.length > ITEMS_PER_PAGE && (
              <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-surface-2/30">
                <div>
                  Showing <strong className="text-foreground">{(contactPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
                  <strong className="text-foreground">{Math.min(contactPage * ITEMS_PER_PAGE, filteredContactQueries.length)}</strong> of{' '}
                  <strong className="text-foreground">{filteredContactQueries.length}</strong> contact messages
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                    disabled={contactPage <= 1}
                    className="rounded-lg h-8 px-2.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                  </Button>
                  <span className="font-mono px-2">
                    {contactPage} / {contactTotalPages}
                  </span>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setContactPage((p) => Math.min(contactTotalPages, p + 1))}
                    disabled={contactPage >= contactTotalPages}
                    className="rounded-lg h-8 px-2.5"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DETAIL VIEW DRAWER / SLIDE-OVER (Requirement 4)              */}
      {/* ============================================================ */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-surface-1 border-l border-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-border/60 flex items-start justify-between gap-4 bg-surface-2/40">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {renderStatusBadge(selectedQuery.status)}
                  <CopyTokenButton token={(selectedQuery.referenceToken || selectedQuery.id).toUpperCase()} variant="badge" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {selectedQuery.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Received {formatDate(selectedQuery.createdAt)}
                  </span>
                  {selectedQuery.updatedAt && (
                    <span className="flex items-center gap-1.5 text-accent font-semibold">
                      <History className="w-3.5 h-3.5" />
                      Updated {formatDate(selectedQuery.updatedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedQueryId(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
              {/* Primary Direct Contact Actions Bar */}
              <div className="grid grid-cols-3 gap-2.5">
                {selectedQuery.email ? (
                  <a
                    href={`mailto:${selectedQuery.email}?subject=Re: Technical Inquiry from Wise Byte Concepts`}
                    className="p-3 rounded-xl bg-surface-2 hover:bg-primary/10 border border-border hover:border-primary/40 text-center transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-foreground">Email Client</span>
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-2/40 border border-border/40 text-center opacity-50 flex flex-col items-center gap-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">No Email</span>
                  </div>
                )}

                {selectedQuery.phone ? (
                  <a
                    href={`tel:${selectedQuery.phone}`}
                    className="p-3 rounded-xl bg-surface-2 hover:bg-accent/10 border border-border hover:border-accent/40 text-center transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-foreground">Call Phone</span>
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-2/40 border border-border/40 text-center opacity-50 flex flex-col items-center gap-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">No Phone</span>
                  </div>
                )}

                {selectedQuery.phone ? (
                  <a
                    href={`https://wa.me/${selectedQuery.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-surface-2 hover:bg-emerald-500/10 border border-border hover:border-emerald-500/40 text-center transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-foreground">WhatsApp</span>
                  </a>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-2/40 border border-border/40 text-center opacity-50 flex flex-col items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">No WhatsApp</span>
                  </div>
                )}
              </div>

              {/* Status and Read State Management Bar */}
              <div className="p-4 rounded-xl bg-surface-2/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Query Status:</span>
                  <select
                    value={selectedQuery.status}
                    onChange={(e) => handleStatusChange(selectedQuery.id, e.target.value as QueryStatus)}
                    className="h-9 px-3 text-xs font-semibold rounded-lg bg-surface-3 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="In progress">In progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => handleToggleRead(selectedQuery.id, selectedQuery.isRead)}
                    className="rounded-lg text-xs"
                  >
                    {selectedQuery.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  </Button>
                </div>
              </div>

              {/* Contact Information Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
                  Sender Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60">
                    <span className="text-muted-foreground block text-[11px] mb-0.5">Full Name</span>
                    <strong className="text-foreground text-sm font-semibold">{selectedQuery.name}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60">
                    <span className="text-muted-foreground block text-[11px] mb-1">Email Address</span>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-foreground text-sm font-semibold truncate block">
                        {selectedQuery.email || '—'}
                      </strong>
                      {selectedQuery.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedQuery.email, 'Email')}
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer group"
                          title="Copy email to clipboard"
                        >
                          {copiedField === 'Email' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phone & WhatsApp with actions */}
                  {(() => {
                    const formatNum = (raw?: string) => {
                      if (!raw) return { formatted: '—', digits: '', raw: '' };
                      try {
                        const parsed = parsePhoneNumber(raw);
                        if (parsed && parsed.isValid()) {
                          return {
                            formatted: parsed.formatInternational(),
                            digits: parsed.number.replace(/\D/g, ''),
                            raw,
                          };
                        }
                      } catch {
                        // fallback
                      }
                      return {
                        formatted: raw,
                        digits: raw.replace(/\D/g, ''),
                        raw,
                      };
                    };

                    const phoneData = formatNum(selectedQuery.phone);
                    const waData = formatNum(selectedQuery.whatsapp || selectedQuery.phone);

                    return (
                      <>
                        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60">
                          <span className="text-muted-foreground block text-[11px] mb-1">Phone Number</span>
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-foreground text-sm font-semibold truncate block">
                              {phoneData.formatted}
                            </strong>
                            {selectedQuery.phone && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`tel:${selectedQuery.phone}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-xs font-semibold transition-colors"
                                  title={`Call ${selectedQuery.phone}`}
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedQuery.phone, 'Phone number')}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer group"
                                  title="Copy phone number to clipboard"
                                >
                                  {copiedField === 'Phone number' ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span className="text-emerald-500 font-semibold text-[11px]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
                                      <span className="text-[11px]">Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60">
                          <span className="text-muted-foreground block text-[11px] mb-1">WhatsApp Number</span>
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-foreground text-sm font-semibold truncate block">
                              {waData.formatted}
                            </strong>
                            {waData.digits && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`https://wa.me/${waData.digits}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-semibold transition-colors shadow-xs"
                                  title={`Open WhatsApp chat with ${waData.formatted}`}
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedQuery.whatsapp || selectedQuery.phone, 'WhatsApp number')}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-3 hover:bg-surface-4 border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer group"
                                  title="Copy WhatsApp number"
                                >
                                  {copiedField === 'WhatsApp number' ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span className="text-emerald-500 font-semibold text-[11px]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
                                      <span className="text-[11px]">Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60">
                    <span className="text-muted-foreground block text-[11px] mb-0.5">Preferred Contact Method</span>
                    <strong className="text-foreground text-sm font-semibold capitalize">
                      {selectedQuery.contactMethod || 'Email'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Scope & Logistics Specifications (Only for Project Queries) */}
              {selectedQuery.type !== 'Contact message' && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
                      Project Scope & Budget
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60">
                        <span className="text-muted-foreground block text-[11px] mb-0.5 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-500" /> Target Budget Range
                        </span>
                        <strong className="text-foreground text-sm font-semibold">{selectedQuery.budget || 'Flexible / Scope TBD'}</strong>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border/60">
                        <span className="text-muted-foreground block text-[11px] mb-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary" /> Target Implementation Timeline
                        </span>
                        <strong className="text-foreground text-sm font-semibold">{selectedQuery.timeline || 'Flexible / As needed'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Linked Services & Projects with direct links to Detail Pages in new tab */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
                      Selected Services & Associated Projects
                    </h3>
                    <div className="space-y-2">
                      {selectedQuery.services && selectedQuery.services.length > 0 && (
                        <div className="p-4 rounded-xl bg-surface-2/60 border border-border/60 space-y-2">
                          <span className="text-[11px] font-mono uppercase text-primary font-bold block">
                            Associated Services:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedQuery.services.map((svc) => {
                              const matchedSvc = services.find((s) => s.id === svc.id || s.slug === svc.id);
                              const serviceDetailUrl = `/services/${matchedSvc?.slug || svc.id}`;
                              return (
                                <a
                                  key={svc.id}
                                  href={serviceDetailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-primary/10 border border-border hover:border-primary text-xs font-semibold text-foreground transition-colors group cursor-pointer"
                                  title={`Open ${svc.name} detail page in new tab`}
                                >
                                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                                  <span>{svc.name}</span>
                                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedQuery.projects && selectedQuery.projects.length > 0 && (
                        <div className="p-4 rounded-xl bg-surface-2/60 border border-border/60 space-y-2">
                          <span className="text-[11px] font-mono uppercase text-accent font-bold block">
                            Selected Projects:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedQuery.projects.map((proj) => {
                              const matchedProj = products.find((p) => p.id === proj.id || p.slug === proj.id);
                              const projectDetailUrl = `/products/${matchedProj?.slug || proj.id}`;
                              return (
                                <a
                                  key={proj.id}
                                  href={projectDetailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-accent/10 border border-border hover:border-accent text-xs font-semibold text-foreground transition-colors group cursor-pointer"
                                  title={`Open ${proj.name} detail page in new tab`}
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-accent" />
                                  <span>{proj.name}</span>
                                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(!selectedQuery.services || selectedQuery.services.length === 0) &&
                        (!selectedQuery.projects || selectedQuery.projects.length === 0) && (
                          <div className="p-3.5 rounded-xl bg-surface-2/40 border border-border/40 text-xs text-muted-foreground italic">
                            No specific service or project was pre-selected during submission.
                          </div>
                        )}
                    </div>
                  </div>
                </>
              )}

              {/* Full Submitted Message */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
                  {selectedQuery.type === 'Contact message' ? 'Submitted Contact Message' : 'Inquiry Message / Requirement Brief'}
                </h3>
                <div className="p-5 rounded-xl bg-surface-2/70 border border-border/80">
                  <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedQuery.message}
                  </p>
                </div>
              </div>

              {/* Previous Requirement Brief Revisions History (from duplicate update replacement) */}
              {selectedQuery.type !== 'Contact message' && selectedQuery.messageHistory && selectedQuery.messageHistory.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-accent" />
                    Previous Requirement Briefs ({selectedQuery.messageHistory.length})
                  </h3>
                  <div className="space-y-2.5">
                    {selectedQuery.messageHistory.map((hist, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-surface-2/50 border border-border/60 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                          <span className="font-semibold text-foreground">Revision #{idx + 1}</span>
                          <span>Replaced {formatDate(hist.replacedAt)}</span>
                        </div>
                        <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                          {hist.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes Section */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                    Internal Engineering Notes
                  </h3>
                  {notesSavedNotice && (
                    <span className="text-xs font-mono text-emerald-500 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Record private internal notes, follow-up timelines, deal value, or technical observations..."
                  rows={4}
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    isLoading={isSavingNotes}
                    className="rounded-xl px-4 text-xs shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Save Internal Notes
                  </Button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-border/60 bg-surface-2/60 flex items-center justify-between gap-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirmationId(selectedQuery.id)}
                className="rounded-xl px-4 text-xs gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete {selectedQuery.type === 'Contact message' ? 'Message' : 'Query'}
              </Button>

              <Button
                variant="glass"
                size="sm"
                onClick={() => setSelectedQueryId(null)}
                className="rounded-xl px-4 text-xs"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmationId)}
        onClose={() => {
          if (!isDeleting) setDeleteConfirmationId(null);
        }}
        title="Delete this query?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This can't be undone.
          </p>

          {queryToDelete && (
            <div className="p-3.5 rounded-xl bg-surface-2/70 border border-border/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Sender:</span>
                <strong className="text-foreground font-semibold truncate max-w-[280px]">
                  {queryToDelete.name || 'Anonymous Inquiry'}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono font-bold text-foreground uppercase tracking-wider">
                  {(queryToDelete.referenceToken || queryToDelete.id).toUpperCase()}
                </span>
              </div>
              {queryToDelete.type && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground font-medium">
                    {queryToDelete.type}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmationId(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isDeleting}
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="rounded-xl px-5"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminQueriesPage;
