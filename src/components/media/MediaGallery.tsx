import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, 
  FolderPlus, 
  Search, 
  Layers, 
  HardDrive, 
  History, 
  Image as ImageIcon, 
  Film, 
  FileText, 
  CheckSquare, 
  Trash2, 
  FolderInput, 
  Tag as TagIcon, 
  Sparkles, 
  LayoutGrid, 
  List, 
  Folder,
  Globe
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useMediaStore } from '@/store/mediaStore';
import { useToastStore } from '@/store/toastStore';
import { MediaItem, MediaType, MediaUsage } from '@/types';
import { formatBytes } from '@/utils/mediaOptimizer';
import { cn } from '@/lib/utils';

import { MediaCard } from './MediaCard';
import { MediaUploadModal } from './MediaUploadModal';
import { MediaDetailsModal } from './MediaDetailsModal';
import { ImageOptimizerModal } from './ImageOptimizerModal';
import { UsageWarningModal } from './UsageWarningModal';
import { FolderManagerModal } from './FolderManagerModal';
import { CollectionManagerModal } from './CollectionManagerModal';
import { AuditLogDrawer } from './AuditLogDrawer';
import { StorageDashboard } from './StorageDashboard';

interface MediaGalleryProps {
  initialType?: MediaType | 'all';
  isPickerMode?: boolean;
  onSelectMedia?: (item: MediaItem) => void;
  onSelectMultiple?: (items: MediaItem[]) => void;
  allowedTypes?: MediaType[];
  title?: string;
  subtitle?: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  initialType = 'all',
  isPickerMode = false,
  onSelectMedia,
  onSelectMultiple,
  allowedTypes,
  title,
  subtitle,
}) => {
  const { 
    items, 
    folders, 
    collections, 
    init, 
    deleteItem, 
    replaceFile, 
    bulkMove, 
    bulkDelete, 
    bulkTag, 
    getUsage 
  } = useMediaStore();
  const addToast = useToastStore((s) => s.addToast);

  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>(initialType);
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'root'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showOrphanedOnly, setShowOrphanedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'used_desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<MediaItem | null>(null);
  const [optimizerItem, setOptimizerItem] = useState<MediaItem | null>(null);
  const [foldersModalOpen, setFoldersModalOpen] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);

  // Delete confirmation modals
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MediaItem | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Usage Warning Modal
  const [warningItem, setWarningItem] = useState<MediaItem | null>(null);
  const [itemUsages, setItemUsages] = useState<MediaUsage[]>([]);
  const [warningOpen, setWarningOpen] = useState(false);

  // Bulk Move / Tag dialog state
  const [moveFolderOpen, setMoveFolderOpen] = useState(false);
  const [targetMoveFolder, setTargetMoveFolder] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type tab filter
      if (activeTab === 'image') {
        if (item.type !== 'image' && item.type !== 'web-image') {
          return false;
        }
      } else if (activeTab !== 'all' && item.type !== activeTab) {
        return false;
      }

      // Allowed types constraint if in picker mode
      if (allowedTypes && !allowedTypes.includes(item.type)) {
        if (!(allowedTypes.includes('image') && item.type === 'web-image')) {
          return false;
        }
      }

      // Folder filter
      if (selectedFolderId === 'root' && item.folderId !== null) {
        return false;
      } else if (selectedFolderId !== 'all' && selectedFolderId !== 'root' && item.folderId !== selectedFolderId) {
        return false;
      }

      // Collection filter
      if (selectedCollectionId) {
        const coll = collections.find((c) => c.id === selectedCollectionId);
        if (!coll || !coll.mediaIds?.includes(item.id)) return false;
      }

      // Tag filter
      if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) {
        return false;
      }

      // Orphaned only filter
      if (showOrphanedOnly) {
        const usages = getUsage(item.url);
        if (usages.length > 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchAlt = item.altText?.toLowerCase().includes(q);
        const matchCaption = item.caption?.toLowerCase().includes(q);
        const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchAlt && !matchCaption && !matchTag) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'size_desc') {
        return (b.size || 0) - (a.size || 0);
      }
      if (sortBy === 'used_desc') {
        return getUsage(b.url).length - getUsage(a.url).length;
      }
      return 0;
    });
  }, [items, activeTab, allowedTypes, selectedFolderId, selectedCollectionId, selectedTag, showOrphanedOnly, searchQuery, sortBy, collections, getUsage]);

  // Handle single delete with usage check
  const handleDeleteRequest = (item: MediaItem) => {
    const usages = getUsage(item.url);
    if (usages.length > 0) {
      setWarningItem(item);
      setItemUsages(usages);
      setWarningOpen(true);
    } else {
      setDeleteConfirmItem(item);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      await deleteItem(deleteConfirmItem.id);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmItem.id));
      addToast(`"${deleteConfirmItem.name}" deleted successfully`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to delete file', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmItem(null);
    }
  };

  const handleConfirmWarningDelete = async (options: { replaceWithUrl?: string; usePlaceholder?: boolean }) => {
    if (warningItem) {
      setIsDeleting(true);
      try {
        await deleteItem(warningItem.id, options);
        setSelectedIds((prev) => prev.filter((id) => id !== warningItem.id));
        addToast(
          options.replaceWithUrl
            ? 'File deleted and references replaced'
            : options.usePlaceholder
            ? 'File deleted and replaced with fallback placeholder'
            : 'File deleted',
          'success'
        );
      } catch (err: any) {
        addToast(err.message || 'Failed to delete file', 'error');
      } finally {
        setIsDeleting(false);
        setWarningOpen(false);
        setWarningItem(null);
      }
    }
  };

  // Replace file flow
  const handleTriggerReplace = (item: MediaItem) => {
    setReplacingItemId(item.id);
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !replacingItemId) return;
    const file = e.target.files[0];
    try {
      await replaceFile(replacingItemId, file);
      addToast('File replaced and updated across all occurrences', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to replace file', 'error');
    } finally {
      setReplacingItemId(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // Multi-selection helpers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await bulkDelete(selectedIds);
      const count = selectedIds.length;
      setSelectedIds([]);
      addToast(`Deleted ${count} files successfully`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Bulk delete failed', 'error');
    } finally {
      setIsDeleting(false);
      setBulkDeleteConfirmOpen(false);
    }
  };

  const handleBulkMoveSubmit = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkMove(selectedIds, targetMoveFolder);
      setSelectedIds([]);
      setMoveFolderOpen(false);
      addToast(`Moved ${selectedIds.length} files`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Bulk move failed', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hidden input for direct file replacement */}
      <input
        ref={replaceFileInputRef}
        type="file"
        onChange={handleReplaceFileChange}
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-glow">
              <ImageIcon className="w-5 h-5" />
            </div>
            {title || 'Unified Media Gallery'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle || 'Single media management engine powering services, products, showcases, and blog assets.'}
          </p>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {!isPickerMode && (
            <>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setFoldersModalOpen(true)}
                className="rounded-xl border-border gap-1.5 text-xs whitespace-nowrap shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5 text-accent" /> Folders
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setCollectionsModalOpen(true)}
                className="rounded-xl border-border gap-1.5 text-xs whitespace-nowrap shrink-0"
              >
                <Layers className="w-3.5 h-3.5 text-accent" /> Collections
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setStorageOpen(true)}
                className="rounded-xl border-border gap-1.5 text-xs whitespace-nowrap shrink-0"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-500" /> Storage
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setAuditLogOpen(true)}
                title="Audit & Activity Log"
                className="rounded-xl hover:bg-[var(--hover-overlay)] shrink-0"
              >
                <History className="w-4 h-4 text-text-muted" />
              </Button>
            </>
          )}

          <Button
            onClick={() => setUploadOpen(true)}
            className="rounded-xl shadow-glow-primary gap-2 text-xs whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4" /> Upload Media
          </Button>
        </div>
      </div>

      {/* Main Tab bar & Search row */}
      <div className="flex flex-row flex-wrap sm:flex-nowrap gap-3 justify-between items-center p-3 rounded-2xl bg-surface-1 border border-border">
        {/* Media type tabs */}
        <div
          role="tablist"
          aria-label="Media category filter"
          className="inline-flex h-10 max-h-10 items-center justify-start rounded-xl bg-muted/80 p-1 text-muted-foreground border border-border/50 shadow-inner overflow-x-auto overflow-y-hidden scrollbar-none shrink-0"
        >
          {[
            { id: 'all', label: 'All Media', icon: Layers },
            { id: 'image', label: 'Images', icon: ImageIcon },
            { id: 'web-image', label: 'Web', icon: Globe },
            { id: 'video', label: 'Videos', icon: Film },
            { id: 'file', label: 'Files / Docs', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.id === 'all'
                ? items.length
                : tab.id === 'image'
                ? items.filter((i) => i.type === 'image' || i.type === 'web-image').length
                : items.filter((i) => i.type === tab.id).length;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                data-state={active ? 'active' : 'inactive'}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shrink-0 select-none",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "ml-0.5 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-mono leading-none transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "bg-muted/80 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort controls */}
        <div className="flex flex-row items-center gap-2.5 flex-nowrap shrink-0">
          <div className="w-48 sm:w-56 shrink">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename, alt, tag..."
              startIcon={<Search className="w-3.5 h-3.5 text-muted-foreground" />}
              clearable
              onClear={() => setSearchQuery('')}
              className="h-8 text-xs bg-muted/30 border-input"
            />
          </div>

          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="h-8 w-36 sm:w-40 text-xs bg-muted/40 hover:bg-muted/60 border-input shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">📅 Newest First</SelectItem>
              <SelectItem value="oldest">📅 Oldest First</SelectItem>
              <SelectItem value="name_asc">🔤 Name A &rarr; Z</SelectItem>
              <SelectItem value="name_desc">🔤 Name Z &rarr; A</SelectItem>
              <SelectItem value="size_desc">💾 Largest Size</SelectItem>
              <SelectItem value="used_desc">🔥 Most Used</SelectItem>
            </SelectContent>
          </Select>

          {/* Grid vs List view toggle */}
          <div className="inline-flex h-8 items-center rounded-xl border border-border/40 bg-muted/80 p-0.5 text-muted-foreground shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-7 w-7 inline-flex items-center justify-center rounded-lg text-xs transition-colors duration-150 select-none",
                viewMode === 'grid'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-7 w-7 inline-flex items-center justify-center rounded-lg text-xs transition-colors duration-150 select-none",
                viewMode === 'list'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter sub-bar: Folders, Collections, Tags & Orphaned toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Folders filter pill */}
          <div className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/60 border border-input rounded-xl p-1 px-2.5 transition-colors">
            <Folder className="w-3.5 h-3.5 text-primary" />
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value as any)}
              className="bg-transparent border-none text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-popover text-popover-foreground">All Folders</option>
              <option value="root" className="bg-popover text-popover-foreground">Root (Unassigned)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} className="bg-popover text-popover-foreground">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Collections filter */}
          {collections.length > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/40 hover:bg-muted/60 border border-input rounded-xl p-1 px-2.5 transition-colors">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <select
                value={selectedCollectionId || ''}
                onChange={(e) => setSelectedCollectionId(e.target.value || null)}
                className="bg-transparent border-none text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-popover text-popover-foreground">All Collections</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id} className="bg-popover text-popover-foreground">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tag chips */}
          {allTags.slice(0, 6).map((t) => {
            const isTagActive = selectedTag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTag(isTagActive ? null : t)}
                className={cn(
                  "px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors",
                  isTagActive
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                #{t}
              </button>
            );
          })}
        </div>

        {/* Right side quick filters */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOrphanedOnly(!showOrphanedOnly)}
            className={`px-2.5 py-1 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 ${
              showOrphanedOnly
                ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold'
                : 'border-border bg-surface-1 text-text-muted hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Unused Media Only</span>
          </button>
        </div>
      </div>

      {/* Bulk action toolbar (displays when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 flex items-center justify-between p-3 rounded-2xl bg-surface-5/95 backdrop-blur-xl border border-border shadow-popover animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              <span>
                {selectedIds.length} of {filteredItems.length} selected
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* If in picker mode with multiple selection */}
            {isPickerMode && onSelectMultiple && (
              <Button
                size="sm"
                onClick={() => {
                  const selectedItems = selectedIds
                    .map((id) => items.find((i) => i.id === id))
                    .filter(Boolean) as MediaItem[];
                  onSelectMultiple(selectedItems);
                }}
                className="rounded-xl shadow-glow-primary text-xs"
              >
                Insert Selected ({selectedIds.length})
              </Button>
            )}

            <Button
              size="sm"
              variant="glass"
              onClick={() => setMoveFolderOpen(true)}
              className="rounded-xl border-border text-xs gap-1.5"
            >
              <FolderInput className="w-3.5 h-3.5 text-accent" /> Move Folder
            </Button>

            <Button
              size="sm"
              variant="glass"
              onClick={() => {
                setBulkTagInput('');
                setBulkTagModalOpen(true);
              }}
              className="rounded-xl border-border text-xs gap-1.5"
            >
              <TagIcon className="w-3.5 h-3.5 text-accent" /> Add Tag
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleBulkDelete}
              className="rounded-xl text-destructive hover:bg-destructive/10 text-xs gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Media Grid or List */}
      {filteredItems.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredItems.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                isSelected={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
                onPreview={(i) => setDetailsItem(i)}
                onOptimize={(i) => setOptimizerItem(i)}
                onReplace={handleTriggerReplace}
                onDelete={handleDeleteRequest}
                onMoveToFolder={(i) => {
                  setSelectedIds([i.id]);
                  setMoveFolderOpen(true);
                }}
                onAddToCollection={() => {
                  setCollectionsModalOpen(true);
                }}
                onPick={onSelectMedia}
              />
            ))}
          </div>
        ) : (
          /* Table List View */
          <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden shadow-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-divider bg-surface-1 font-mono text-[10px] uppercase text-text-muted">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded accent-accent"
                    />
                  </th>
                  <th className="p-3">File Asset</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Dimensions</th>
                  <th className="p-3">Usage</th>
                  <th className="p-3">Uploaded</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredItems.map((item) => {
                  const usages = getUsage(item.url);
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => (onSelectMedia ? onSelectMedia(item) : setDetailsItem(item))}
                      className="hover:bg-[var(--hover-overlay)] cursor-pointer transition-colors"
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded accent-accent"
                        />
                      </td>
                      <td className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-surface-3 shrink-0 flex items-center justify-center">
                          {item.type === 'image' || item.type === 'web-image' ? (
                            <img
                              src={item.thumbnailUrl || item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : item.type === 'video' ? (
                            <Film className="w-4 h-4 text-purple-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div className="truncate max-w-[200px]">
                          <div className="font-semibold text-foreground truncate">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate font-mono">
                            {item.altText || item.caption || 'No alt text'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono uppercase text-muted-foreground">
                        {item.optimizedFormat || item.mimeType?.split('/')[1] || item.type}
                      </td>
                      <td className="p-3 font-mono">{formatBytes(item.size)}</td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {item.dimensions ? `${item.dimensions.width}×${item.dimensions.height}` : '—'}
                      </td>
                      <td className="p-3">
                        {usages.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-mono text-[10px] font-bold">
                            {usages.length} place{usages.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[10px]">Unused</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground text-[10px]">
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDetailsItem(item)}
                            className="h-7 w-7 rounded-lg"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteRequest(item)}
                            className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-surface-1 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No media assets found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            {searchQuery || selectedTag || selectedFolderId !== 'all' || showOrphanedOnly
              ? 'No media matches the currently active filters. Try clearing your search query or reset filters.'
              : 'Upload your first set of images, videos, or documents to power your services and products.'}
          </p>
          <div className="flex gap-2">
            {(searchQuery || selectedTag || selectedFolderId !== 'all' || showOrphanedOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                  setSelectedFolderId('all');
                  setShowOrphanedOnly(false);
                }}
              >
                Reset Filters
              </Button>
            )}
            <Button size="sm" onClick={() => setUploadOpen(true)} className="shadow-glow-primary">
              <Upload className="w-4 h-4 mr-1.5" /> Upload Media
            </Button>
          </div>
        </div>
      )}

      {/* Move Folder Dialog */}
      {moveFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-surface-5 border border-border p-5 space-y-4 shadow-popover">
            <h3 className="text-sm font-bold text-text-primary">
              Move {selectedIds.length} File{selectedIds.length !== 1 ? 's' : ''} to Folder
            </h3>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Select Destination Folder:</label>
              <select
                value={targetMoveFolder || 'root'}
                onChange={(e) => setTargetMoveFolder(e.target.value === 'root' ? null : e.target.value)}
                className="w-full p-2 rounded-xl bg-surface-3 border border-border-strong text-xs text-text-primary focus:outline-none"
              >
                <option value="root" className="bg-surface-5 text-text-primary">📁 Root (Unassigned)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id} className="bg-surface-5 text-text-primary">
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setMoveFolderOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleBulkMoveSubmit} className="shadow-glow-primary">
                Move Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MediaUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultFolderId={selectedFolderId !== 'all' && selectedFolderId !== 'root' ? selectedFolderId : null}
        onSuccess={(uploaded) => {
          if (isPickerMode && onSelectMedia && uploaded.length === 1) {
            onSelectMedia(uploaded[0]);
          }
        }}
      />

      <MediaDetailsModal
        open={!!detailsItem}
        onOpenChange={(op) => !op && setDetailsItem(null)}
        item={detailsItem}
        onOpenOptimizer={(i) => setOptimizerItem(i)}
        onOpenReplace={handleTriggerReplace}
        onDeleteRequest={handleDeleteRequest}
      />

      <ImageOptimizerModal
        open={!!optimizerItem}
        onOpenChange={(op) => !op && setOptimizerItem(null)}
        item={optimizerItem}
      />

      <UsageWarningModal
        open={warningOpen}
        onOpenChange={setWarningOpen}
        item={warningItem}
        usages={itemUsages}
        onConfirmDelete={handleConfirmWarningDelete}
      />

      <FolderManagerModal
        open={foldersModalOpen}
        onOpenChange={setFoldersModalOpen}
      />

      <CollectionManagerModal
        open={collectionsModalOpen}
        onOpenChange={setCollectionsModalOpen}
        initialSelectedMediaIds={selectedIds}
      />

      <AuditLogDrawer
        open={auditLogOpen}
        onOpenChange={setAuditLogOpen}
      />

      <StorageDashboard
        open={storageOpen}
        onOpenChange={setStorageOpen}
        onFilterOrphaned={() => setShowOrphanedOnly(true)}
      />

      {/* Delete Confirmation Modal for single files */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="max-w-md border-destructive/20 bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-1">
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Delete Media File
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate max-w-[280px]">
                  {deleteConfirmItem?.name}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">"{deleteConfirmItem?.name}"</span>? This will remove the file from your media gallery and cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirmItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSingleDelete}
              disabled={isDeleting}
              className="rounded-xl shadow-sm gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent className="max-w-md border-destructive/20 bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-1">
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Delete {selectedIds.length} Files?
              </DialogTitle>
            </div>
            <div className="text-xs text-muted-foreground mt-3 space-y-2">
              <p>
                Are you sure you want to permanently delete <span className="font-semibold text-foreground">{selectedIds.length} selected files</span>? This action cannot be undone.
              </p>
              {(() => {
                const usedCount = selectedIds.filter((id) => {
                  const itm = items.find((i) => i.id === id);
                  return itm && getUsage(itm.url).length > 0;
                }).length;
                if (usedCount > 0) {
                  return (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                      ⚠️ <strong>{usedCount} file{usedCount > 1 ? 's are' : ' is'} currently in active use</strong> across your services or products.
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setBulkDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={isDeleting}
              className="rounded-xl shadow-sm gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Files`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Tag Dialog */}
      <Dialog open={bulkTagModalOpen} onOpenChange={setBulkTagModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-1">
              <TagIcon className="w-4 h-4" />
              <DialogTitle className="text-base font-bold text-foreground">
                Add Tag to {selectedIds.length} Files
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3 my-2">
            <Input
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              placeholder="e.g. portfolio, marketing, hero"
              startIcon={<TagIcon className="w-3.5 h-3.5 text-muted-foreground" />}
              clearable
              onClear={() => setBulkTagInput('')}
              className="text-xs h-9 bg-muted/30 border-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (bulkTagInput.trim()) {
                    bulkTag(selectedIds, [bulkTagInput.trim()]);
                    addToast(`Tag added to ${selectedIds.length} files`, 'success');
                    setBulkTagModalOpen(false);
                    setBulkTagInput('');
                  }
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setBulkTagModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!bulkTagInput.trim()}
              onClick={() => {
                if (bulkTagInput.trim()) {
                  bulkTag(selectedIds, [bulkTagInput.trim()]);
                  addToast(`Tag added to ${selectedIds.length} files`, 'success');
                  setBulkTagModalOpen(false);
                  setBulkTagInput('');
                }
              }}
              className="rounded-xl shadow-glow-primary text-xs"
            >
              Apply Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
