import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Inbox, 
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
  Copy
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useToastStore } from '@/store/toastStore';
import { QueryStatus } from '@/types';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/utils';
import { parsePhoneNumber } from 'libphonenumber-js';

const ITEMS_PER_PAGE = 10;

export const AdminQueriesPage: React.FC = () => {
  const queries = useAppStore((state) => state.queries || []);
  const updateQuery = useAppStore((state) => state.updateQuery);
  const deleteQuery = useAppStore((state) => state.deleteQuery);
  const markQueryRead = useAppStore((state) => state.markQueryRead);
  const services = useAppStore((state) => state.services || []);
  const products = useAppStore((state) => state.products || []);
  const isLoaded = useAppStore((state) => state.isLoaded);
  const addToast = useToastStore((state) => state.addToast);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QueryStatus>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Query for Detail Drawer
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Telegram Notifications Admin Settings State (Requirement 6)
  const [telegramStatus, setTelegramStatus] = useState<{ enabled: boolean; isConfigured: boolean } | null>(null);
  const [isTogglingTelegram, setIsTogglingTelegram] = useState(false);
  const [isSendingTestTelegram, setIsSendingTestTelegram] = useState(false);

  const [searchParams] = useSearchParams();

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

  // Requirement 3: Link to query opens detail view automatically
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

  // Active Query instance
  const selectedQuery = useMemo(() => {
    return queries.find((q) => q.id === selectedQueryId) || null;
  }, [queries, selectedQueryId]);

  // Synchronize notes draft when selected query changes
  useEffect(() => {
    if (selectedQuery) {
      setNotesDraft(selectedQuery.notes || '');
      setNotesSavedNotice(false);

      // Requirement 3: Opening a query marks it as read automatically
      if (!selectedQuery.isRead) {
        markQueryRead(selectedQuery.id, true).catch((err) => {
          console.error('[AdminQueriesPage] Auto-mark read failed', err);
        });
      }
    }
  }, [selectedQuery?.id]);

  // Filtered queries list (newest first)
  const filteredQueries = useMemo(() => {
    return queries
      .filter((q) => {
        // Status filter
        if (statusFilter !== 'all' && q.status !== statusFilter) return false;

        // Read filter
        if (readFilter === 'unread' && q.isRead) return false;
        if (readFilter === 'read' && !q.isRead) return false;

        // Service filter
        if (serviceFilter !== 'all') {
          const hasService = q.services?.some((s) => s.id === serviceFilter || s.name === serviceFilter);
          if (!hasService) return false;
        }

        // Search term (name, email, phone, message)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchesName = q.name?.toLowerCase().includes(term);
          const matchesEmail = q.email?.toLowerCase().includes(term);
          const matchesPhone = q.phone?.toLowerCase().includes(term);
          const matchesMessage = q.message?.toLowerCase().includes(term);
          const matchesService = q.services?.some((s) => s.name?.toLowerCase().includes(term));
          const matchesProject = q.projects?.some((p) => p.name?.toLowerCase().includes(term));
          if (!matchesName && !matchesEmail && !matchesPhone && !matchesMessage && !matchesService && !matchesProject) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [queries, statusFilter, serviceFilter, readFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredQueries.length / ITEMS_PER_PAGE));
  const paginatedQueries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQueries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQueries, currentPage]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, serviceFilter, readFilter]);

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

  // Delete query
  const handleConfirmDelete = async () => {
    if (!deleteConfirmationId) return;
    try {
      await deleteQuery(deleteConfirmationId);
      addToast('Query deleted successfully', 'success');
      if (selectedQueryId === deleteConfirmationId) {
        setSelectedQueryId(null);
      }
      setDeleteConfirmationId(null);
    } catch {
      addToast('Failed to delete query', 'error');
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

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const unreadCount = queries.filter((q) => !q.isRead).length;

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
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-accent text-on-accent animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review incoming project leads, manage statuses, take internal notes, and direct contact client inquiries.
          </p>
        </div>

        {/* Telegram Admin Notifications Control (Requirement 6) */}
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

      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sender, email, phone, or message..."
              className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-10 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="New">Status: New</option>
              <option value="In progress">Status: In progress</option>
              <option value="Resolved">Status: Resolved</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="lg:col-span-2">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
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
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as any)}
              className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="all">All Read States</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Filter Chips / Active Counts */}
        {(searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || readFilter !== 'all') && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-1.5">
              <span>Filtered:</span>
              <strong className="text-foreground">{filteredQueries.length} of {queries.length} queries</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setServiceFilter('all');
                setReadFilter('all');
              }}
              className="text-primary hover:underline text-xs font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Query List Card / Table Container */}
      <div className="rounded-2xl border border-border/60 bg-surface-1 overflow-hidden shadow-xs">
        {!isLoaded ? (
          /* Loading Skeletons */
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
        ) : filteredQueries.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center">
            <EmptyState
              icon={Inbox}
              title={queries.length === 0 ? 'No Queries Yet' : 'No Matching Queries'}
              description={
                queries.length === 0
                  ? 'Incoming client inquiries submitted from the public contact page will appear here.'
                  : 'Try adjusting your search keywords, read state, or filter selections.'
              }
            />
          </div>
        ) : (
          <div>
            {/* Desktop Table Header (hidden on mobile) */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 bg-surface-2/60 border-b border-border/60 text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              <div className="col-span-3">Sender & Status</div>
              <div className="col-span-4">Message Preview</div>
              <div className="col-span-3">Selected Capabilities</div>
              <div className="col-span-2 text-right">Date & Action</div>
            </div>

            {/* List Rows / Mobile Cards */}
            <div className="divide-y divide-border/50">
              {paginatedQueries.map((query) => {
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
                    {/* Column 1: Sender Name & Unread Dot & Status (col-span-3) */}
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
                            {query.name || 'Anonymous Inquiry'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {query.email}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          {renderStatusBadge(query.status)}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Message Preview (col-span-4) */}
                    <div className="w-full md:col-span-4 min-w-0">
                      <p className={cn('text-xs line-clamp-2 leading-relaxed', isUnread ? 'text-foreground/90 font-normal' : 'text-muted-foreground')}>
                        {query.message}
                      </p>
                    </div>

                    {/* Column 3: Selected Service & Project Chips (col-span-3) */}
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

                    {/* Column 4: Date & Quick Actions (col-span-2) */}
                    <div className="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                      <div className="text-right">
                        <span className="text-[11px] font-mono text-muted-foreground block">
                          {formatDate(query.createdAt)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredQueries.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-surface-2/30">
            <div>
              Showing <strong className="text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
              <strong className="text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredQueries.length)}</strong> of{' '}
              <strong className="text-foreground">{filteredQueries.length}</strong> queries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg h-8 px-2.5"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <span className="font-mono px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg h-8 px-2.5"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* DETAIL VIEW DRAWER / SLIDE-OVER (Requirement 3)              */}
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
                <div className="flex items-center gap-2.5 mb-1.5">
                  {renderStatusBadge(selectedQuery.status)}
                  <span className="text-xs font-mono text-muted-foreground">
                    ID: {selectedQuery.id}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {selectedQuery.name}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  Received {formatDate(selectedQuery.createdAt)}
                </p>
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

              {/* Scope & Logistics Specifications */}
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

              {/* Full Submitted Message */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted-foreground">
                  Inquiry Message / Project Brief
                </h3>
                <div className="p-5 rounded-xl bg-surface-2/70 border border-border/80">
                  <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedQuery.message}
                  </p>
                </div>
              </div>

              {/* Internal Notes Section (Requirement 3: saved with the query) */}
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
                <Trash2 className="w-3.5 h-3.5" /> Delete Query
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

      {/* Delete Confirmation Modal (Requirement 3 & 6) */}
      <Modal
        isOpen={Boolean(deleteConfirmationId)}
        onClose={() => setDeleteConfirmationId(null)}
        title="Delete Contact Inquiry?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to permanently remove this inquiry from both the admin dashboard list and the persistent database? This action is terminal and cannot be reversed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmationId(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="rounded-xl px-5"
            >
              Yes, Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminQueriesPage;
