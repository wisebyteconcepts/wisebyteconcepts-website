import { create } from 'zustand';
import { 
  MediaItem, 
  MediaFolder, 
  MediaCollection, 
  MediaAuditLog, 
  MediaUsage,
  MediaType 
} from '@/types';
import { api } from '@/services/api';
import { useAppStore } from './index';
import { useAuthStore } from './authStore';
import { 
  generateMultiResolutions, 
  generateVideoThumbnail, 
  parseVideoEmbed,
  validateMediaUpload 
} from '@/utils/mediaOptimizer';

const RECENTLY_USED_KEY = 'wbc_media_recently_used';

interface MediaState {
  items: MediaItem[];
  folders: MediaFolder[];
  collections: MediaCollection[];
  auditLogs: MediaAuditLog[];
  recentlyUsedIds: string[];
  isLoaded: boolean;
  isLoading: boolean;

  // Init
  init: () => Promise<void>;

  // Upload & Creation
  uploadFile: (
    file: File,
    metadata?: {
      name?: string;
      altText?: string;
      caption?: string;
      folderId?: string | null;
      tags?: string[];
      autoWebp?: boolean;
    }
  ) => Promise<MediaItem>;

  addEmbedVideo: (data: {
    url: string;
    name?: string;
    altText?: string;
    caption?: string;
    folderId?: string | null;
    tags?: string[];
  }) => Promise<MediaItem>;

  // Updates & Replacements
  updateItem: (id: string, updates: Partial<MediaItem>) => Promise<MediaItem>;

  replaceFile: (
    id: string,
    newFile: File | string,
    options?: { autoWebp?: boolean }
  ) => Promise<MediaItem>;

  restoreVersion: (id: string, versionId: string) => Promise<MediaItem>;

  // Deletion
  deleteItem: (
    id: string,
    options?: {
      replaceWithUrl?: string;
      usePlaceholder?: boolean;
    }
  ) => Promise<void>;

  // Bulk Actions
  bulkMove: (ids: string[], folderId: string | null) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkTag: (ids: string[], tagsToAdd: string[], tagsToRemove?: string[]) => Promise<void>;

  // Folders
  createFolder: (name: string, parentId?: string | null, color?: string) => Promise<MediaFolder>;
  renameFolder: (id: string, name: string) => Promise<MediaFolder>;
  deleteFolder: (id: string) => Promise<void>;

  // Collections
  createCollection: (name: string, description?: string, mediaIds?: string[]) => Promise<MediaCollection>;
  updateCollection: (id: string, updates: Partial<MediaCollection>) => Promise<MediaCollection>;
  deleteCollection: (id: string) => Promise<void>;

  // Usage & Auditing
  getUsage: (mediaUrl: string) => MediaUsage[];
  recordRecentlyUsed: (id: string) => void;
  getStorageStats: () => {
    totalBytes: number;
    totalFiles: number;
    imageBytes: number;
    imageCount: number;
    videoBytes: number;
    videoCount: number;
    fileBytes: number;
    fileCount: number;
    orphanedCount: number;
  };
}

export const useMediaStore = create<MediaState>((set, get) => ({
  items: [],
  folders: [],
  collections: [],
  auditLogs: [],
  recentlyUsedIds: [],
  isLoaded: false,
  isLoading: false,

  init: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true });

    try {
      const [items, folders, collections, auditLogs] = await Promise.all([
        api.data.getMediaItems(),
        api.data.getMediaFolders(),
        api.data.getMediaCollections(),
        api.data.getMediaAuditLogs(),
      ]);

      let recentlyUsed: string[] = [];
      try {
        const stored = localStorage.getItem(RECENTLY_USED_KEY);
        if (stored) recentlyUsed = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse recently used', e);
      }

      set({
        items,
        folders,
        collections,
        auditLogs,
        recentlyUsedIds: recentlyUsed,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('[MediaStore] Init failed:', error);
      set({ isLoaded: true, isLoading: false });
    }
  },

  recordRecentlyUsed: (id: string) => {
    const current = get().recentlyUsedIds.filter((item) => item !== id);
    const updated = [id, ...current].slice(0, 12);
    set({ recentlyUsedIds: updated });
    try {
      localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recently used', e);
    }
  },

  uploadFile: async (file, metadata = {}) => {
    const currentUser = useAuthStore.getState().user?.email || 'admin@wisebyteconcepts.com';
    let mediaType: MediaType = 'file';

    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    }

    const validation = validateMediaUpload(file, mediaType);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid file');
    }

    const id = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const name = metadata.name?.trim() || file.name.replace(/\.[^/.]+$/, '');
    const autoWebp = metadata.autoWebp !== false;

    let url = '';
    let thumbnailUrl = '';
    let mediumUrl = '';
    let largeUrl = '';
    let dimensions: { width: number; height: number } | undefined;
    let size = file.size;
    let mimeType = file.type;
    let optimizedFormat: 'webp' | 'avif' | 'original' = 'original';
    let duration: number | undefined;

    if (mediaType === 'image') {
      try {
        const multiRes = await generateMultiResolutions(file, autoWebp);
        url = multiRes.large || multiRes.original;
        thumbnailUrl = multiRes.thumbnail;
        mediumUrl = multiRes.medium;
        largeUrl = multiRes.large;
        dimensions = { width: multiRes.width, height: multiRes.height };
        size = multiRes.size;
        optimizedFormat = autoWebp ? 'webp' : 'original';
        mimeType = autoWebp ? 'image/webp' : file.type;
      } catch (e) {
        console.warn('Canvas optimization fallback to direct FileReader', e);
        url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        thumbnailUrl = url;
      }
    } else if (mediaType === 'video') {
      try {
        const thumb = await generateVideoThumbnail(file);
        thumbnailUrl = thumb.thumbnailDataUrl;
        duration = Math.round(thumb.duration);
      } catch (e) {
        console.warn('Video thumbnail capture skipped', e);
      }
      url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else {
      url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const newItem: MediaItem = {
      id,
      name,
      type: mediaType,
      url,
      thumbnailUrl: thumbnailUrl || url,
      mediumUrl,
      largeUrl,
      originalUrl: url,
      originalFormat: file.type,
      optimizedFormat,
      altText: metadata.altText || name,
      caption: metadata.caption || '',
      folderId: metadata.folderId || null,
      tags: metadata.tags || [],
      size,
      mimeType,
      dimensions,
      duration,
      uploadedBy: currentUser,
      uploadedAt: now,
      updatedAt: now,
      versionHistory: [],
    };

    const saved = await api.data.createMediaItem(newItem);

    // Audit log
    const log: MediaAuditLog = {
      id: `log-${Date.now()}`,
      action: 'upload',
      mediaId: id,
      mediaName: name,
      performedBy: currentUser,
      timestamp: now,
      details: `Uploaded ${mediaType} (${Math.round(size / 1024)} KB)`,
    };
    await api.data.createMediaAuditLog(log);

    set((state) => ({
      items: [saved, ...state.items],
      auditLogs: [log, ...state.auditLogs],
    }));

    get().recordRecentlyUsed(saved.id);
    return saved;
  },

  addEmbedVideo: async (data) => {
    const currentUser = useAuthStore.getState().user?.email || 'admin@wisebyteconcepts.com';
    const parsed = parseVideoEmbed(data.url);

    if (!parsed.isValid) {
      throw new Error('Please enter a valid YouTube, Vimeo, or direct MP4/WebM video URL.');
    }

    const id = `media-embed-${Date.now()}`;
    const now = new Date().toISOString();
    const name = data.name?.trim() || parsed.titleSuggestion || 'Embedded Video';

    const newItem: MediaItem = {
      id,
      name,
      type: 'video',
      url: data.url.trim(),
      embedUrl: parsed.embedUrl,
      thumbnailUrl: parsed.thumbnailUrl || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80',
      videoProvider: parsed.provider,
      altText: data.altText || name,
      caption: data.caption || '',
      folderId: data.folderId || null,
      tags: data.tags || ['video', parsed.provider],
      size: 0,
      mimeType: 'video/embed',
      uploadedBy: currentUser,
      uploadedAt: now,
      updatedAt: now,
    };

    const saved = await api.data.createMediaItem(newItem);

    const log: MediaAuditLog = {
      id: `log-${Date.now()}`,
      action: 'upload',
      mediaId: id,
      mediaName: name,
      performedBy: currentUser,
      timestamp: now,
      details: `Embedded ${parsed.provider} video: ${data.url}`,
    };
    await api.data.createMediaAuditLog(log);

    set((state) => ({
      items: [saved, ...state.items],
      auditLogs: [log, ...state.auditLogs],
    }));

    get().recordRecentlyUsed(saved.id);
    return saved;
  },

  updateItem: async (id, updates) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) throw new Error('Media item not found');

    const updated: MediaItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const saved = await api.data.updateMediaItem(updated);

    set((state) => ({
      items: state.items.map((i) => (i.id === id ? saved : i)),
    }));

    return saved;
  },

  replaceFile: async (id, newFile, options = {}) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) throw new Error('Media item not found');

    const currentUser = useAuthStore.getState().user?.email || 'admin@wisebyteconcepts.com';
    const now = new Date().toISOString();
    const autoWebp = options.autoWebp !== false;

    // Archive current version into history
    const oldVersion = {
      id: `ver-${Date.now()}`,
      version: (item.versionHistory?.length || 0) + 1,
      url: item.url,
      size: item.size,
      replacedAt: now,
      replacedBy: currentUser,
    };

    let newUrl = '';
    let newThumb = '';
    let newMedium = '';
    let newLarge = '';
    let newSize = item.size;
    let newDimensions = item.dimensions;

    if (typeof newFile === 'string') {
      newUrl = newFile;
      newThumb = newFile;
    } else {
      if (item.type === 'image') {
        const multi = await generateMultiResolutions(newFile, autoWebp);
        newUrl = multi.large || multi.original;
        newThumb = multi.thumbnail;
        newMedium = multi.medium;
        newLarge = multi.large;
        newSize = multi.size;
        newDimensions = { width: multi.width, height: multi.height };
      } else {
        newUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(newFile);
        });
        newSize = newFile.size;
      }
    }

    const updatedItem: MediaItem = {
      ...item,
      url: newUrl,
      thumbnailUrl: newThumb || newUrl,
      mediumUrl: newMedium,
      largeUrl: newLarge,
      size: newSize,
      dimensions: newDimensions,
      updatedAt: now,
      versionHistory: [oldVersion, ...(item.versionHistory || [])],
    };

    const saved = await api.data.updateMediaItem(updatedItem);

    // Synchronize references across Services & Products in the app
    const appStore = useAppStore.getState();
    const oldUrl = item.url;

    // Check & replace in Services
    for (const service of appStore.services) {
      let changed = false;
      const copy = { ...service };
      if (copy.thumbnail === oldUrl) {
        copy.thumbnail = newUrl;
        changed = true;
      }
      if (copy.bannerImage === oldUrl) {
        copy.bannerImage = newUrl;
        changed = true;
      }
      if (copy.gallery && copy.gallery.includes(oldUrl)) {
        copy.gallery = copy.gallery.map((g) => (g === oldUrl ? newUrl : g));
        changed = true;
      }
      if (changed) {
        await appStore.updateService(copy);
      }
    }

    // Check & replace in Products
    for (const product of appStore.products) {
      if (product.imageUrl === oldUrl) {
        await appStore.updateProduct({ ...product, imageUrl: newUrl });
      }
    }

    // Audit log
    const log: MediaAuditLog = {
      id: `log-${Date.now()}`,
      action: 'replace',
      mediaId: id,
      mediaName: item.name,
      performedBy: currentUser,
      timestamp: now,
      details: `Replaced file contents (kept ID: ${id}). Updated across referenced modules.`,
    };
    await api.data.createMediaAuditLog(log);

    set((state) => ({
      items: state.items.map((i) => (i.id === id ? saved : i)),
      auditLogs: [log, ...state.auditLogs],
    }));

    return saved;
  },

  restoreVersion: async (id, versionId) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) throw new Error('Media item not found');

    const targetVersion = item.versionHistory?.find((v) => v.id === versionId);
    if (!targetVersion) throw new Error('Version not found');

    const currentUser = useAuthStore.getState().user?.email || 'admin@wisebyteconcepts.com';
    const now = new Date().toISOString();

    const archiveCurrent = {
      id: `ver-${Date.now()}`,
      version: (item.versionHistory?.length || 0) + 1,
      url: item.url,
      size: item.size,
      replacedAt: now,
      replacedBy: currentUser,
    };

    const remainingVersions = item.versionHistory?.filter((v) => v.id !== versionId) || [];

    const updatedItem: MediaItem = {
      ...item,
      url: targetVersion.url,
      thumbnailUrl: targetVersion.url,
      size: targetVersion.size,
      updatedAt: now,
      versionHistory: [archiveCurrent, ...remainingVersions],
    };

    const saved = await api.data.updateMediaItem(updatedItem);

    // Audit log
    const log: MediaAuditLog = {
      id: `log-${Date.now()}`,
      action: 'replace',
      mediaId: id,
      mediaName: item.name,
      performedBy: currentUser,
      timestamp: now,
      details: `Restored previous version ${targetVersion.version}`,
    };
    await api.data.createMediaAuditLog(log);

    set((state) => ({
      items: state.items.map((i) => (i.id === id ? saved : i)),
      auditLogs: [log, ...state.auditLogs],
    }));

    return saved;
  },

  deleteItem: async (id, options = {}) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const currentUser = useAuthStore.getState().user?.email || 'admin@wisebyteconcepts.com';
    const appStore = useAppStore.getState();
    const oldUrl = item.url;
    const placeholderUrl = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=75';

    const targetReplacement = options.replaceWithUrl 
      ? options.replaceWithUrl 
      : options.usePlaceholder 
      ? placeholderUrl 
      : null;

    // Handle reference replacements in Services
    for (const service of appStore.services) {
      let changed = false;
      const copy = { ...service };
      if (copy.thumbnail === oldUrl) {
        copy.thumbnail = targetReplacement || '';
        changed = true;
      }
      if (copy.bannerImage === oldUrl) {
        copy.bannerImage = targetReplacement || '';
        changed = true;
      }
      if (copy.gallery && copy.gallery.includes(oldUrl)) {
        copy.gallery = targetReplacement
          ? copy.gallery.map((g) => (g === oldUrl ? targetReplacement : g))
          : copy.gallery.filter((g) => g !== oldUrl);
        changed = true;
      }
      if (changed) {
        await appStore.updateService(copy);
      }
    }

    // Handle references in Products
    for (const product of appStore.products) {
      if (product.imageUrl === oldUrl) {
        await appStore.updateProduct({ ...product, imageUrl: targetReplacement || '' });
      }
    }

    await api.data.deleteMediaItem(id);

    // Audit log
    const log: MediaAuditLog = {
      id: `log-${Date.now()}`,
      action: 'delete',
      mediaId: id,
      mediaName: item.name,
      performedBy: currentUser,
      timestamp: new Date().toISOString(),
      details: targetReplacement ? `Deleted file and replaced usages with ${targetReplacement}` : 'Force removed media file',
    };
    await api.data.createMediaAuditLog(log);

    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      recentlyUsedIds: state.recentlyUsedIds.filter((uid) => uid !== id),
      auditLogs: [log, ...state.auditLogs],
    }));
  },

  bulkMove: async (ids, folderId) => {
    const currentUser = useAuthStore.getState().user?.email || 'admin@wisebyteconcepts.com';
    const updates = ids.map((id) => {
      const item = get().items.find((i) => i.id === id);
      return { ...item, folderId, updatedAt: new Date().toISOString() };
    });

    await api.data.batchUpdate('media', updates);

    const log: MediaAuditLog = {
      id: `log-${Date.now()}`,
      action: 'move',
      mediaName: `${ids.length} items`,
      performedBy: currentUser,
      timestamp: new Date().toISOString(),
      details: `Moved ${ids.length} files to folder ${folderId || 'Root'}`,
    };
    await api.data.createMediaAuditLog(log);

    set((state) => ({
      items: state.items.map((item) => {
        if (ids.includes(item.id)) {
          return { ...item, folderId, updatedAt: new Date().toISOString() };
        }
        return item;
      }),
      auditLogs: [log, ...state.auditLogs],
    }));
  },

  bulkDelete: async (ids) => {
    const currentUser = useAuthStore.getState().user?.email || 'admin@wisebyteconcepts.com';
    for (const id of ids) {
      await api.data.deleteMediaItem(id);
    }

    const log: MediaAuditLog = {
      id: `log-${Date.now()}`,
      action: 'bulk_delete',
      mediaName: `${ids.length} files`,
      performedBy: currentUser,
      timestamp: new Date().toISOString(),
      details: `Bulk deleted ${ids.length} media files`,
    };
    await api.data.createMediaAuditLog(log);

    set((state) => ({
      items: state.items.filter((i) => !ids.includes(i.id)),
      recentlyUsedIds: state.recentlyUsedIds.filter((uid) => !ids.includes(uid)),
      auditLogs: [log, ...state.auditLogs],
    }));
  },

  bulkTag: async (ids, tagsToAdd, tagsToRemove = []) => {
    const updates = ids.map((id) => {
      const item = get().items.find((i) => i.id === id);
      if (!item) return null;
      let newTags = [...(item.tags || [])];
      tagsToAdd.forEach((t) => {
        if (!newTags.includes(t)) newTags.push(t);
      });
      if (tagsToRemove.length > 0) {
        newTags = newTags.filter((t) => !tagsToRemove.includes(t));
      }
      return { ...item, tags: newTags, updatedAt: new Date().toISOString() };
    }).filter(Boolean) as MediaItem[];

    await api.data.batchUpdate('media', updates);

    set((state) => ({
      items: state.items.map((item) => {
        const found = updates.find((u) => u.id === item.id);
        return found || item;
      }),
    }));
  },

  createFolder: async (name, parentId = null, color = '#3B82F6') => {
    const id = `folder-${Date.now()}`;
    const newFolder: MediaFolder = {
      id,
      name: name.trim(),
      parentId,
      color,
      createdAt: new Date().toISOString(),
    };

    const saved = await api.data.createMediaFolder(newFolder);
    set((state) => ({ folders: [...state.folders, saved] }));
    return saved;
  },

  renameFolder: async (id, name) => {
    const folder = get().folders.find((f) => f.id === id);
    if (!folder) throw new Error('Folder not found');

    const updated = { ...folder, name: name.trim() };
    const saved = await api.data.updateMediaFolder(updated);

    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? saved : f)),
    }));
    return saved;
  },

  deleteFolder: async (id) => {
    // Reassign items in this folder to root (null)
    const itemsInFolder = get().items.filter((i) => i.folderId === id);
    if (itemsInFolder.length > 0) {
      await get().bulkMove(itemsInFolder.map((i) => i.id), null);
    }

    await api.data.deleteMediaFolder(id);
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
    }));
  },

  createCollection: async (name, description = '', mediaIds = []) => {
    const id = `coll-${Date.now()}`;
    const now = new Date().toISOString();
    const newColl: MediaCollection = {
      id,
      name: name.trim(),
      description: description.trim(),
      mediaIds,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await api.data.createMediaCollection(newColl);
    set((state) => ({ collections: [...state.collections, saved] }));
    return saved;
  },

  updateCollection: async (id, updates) => {
    const coll = get().collections.find((c) => c.id === id);
    if (!coll) throw new Error('Collection not found');

    const updated = { ...coll, ...updates, updatedAt: new Date().toISOString() };
    const saved = await api.data.updateMediaCollection(updated);

    set((state) => ({
      collections: state.collections.map((c) => (c.id === id ? saved : c)),
    }));
    return saved;
  },

  deleteCollection: async (id) => {
    await api.data.deleteMediaCollection(id);
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    }));
  },

  getUsage: (mediaUrl: string): MediaUsage[] => {
    const usages: MediaUsage[] = [];
    if (!mediaUrl) return usages;

    const { services, products } = useAppStore.getState();

    // Check in Services
    services.forEach((s) => {
      if (s.thumbnail === mediaUrl) {
        usages.push({
          locationType: 'service',
          locationId: s.id,
          locationTitle: s.name || 'Untitled Service',
          field: 'Thumbnail Image',
          url: `/services/${s.slug || s.id}`,
        });
      }
      if (s.bannerImage === mediaUrl) {
        usages.push({
          locationType: 'service',
          locationId: s.id,
          locationTitle: s.name || 'Untitled Service',
          field: 'Hero Banner',
          url: `/services/${s.slug || s.id}`,
        });
      }
      if (s.gallery && s.gallery.includes(mediaUrl)) {
        usages.push({
          locationType: 'service',
          locationId: s.id,
          locationTitle: s.name || 'Untitled Service',
          field: 'Showcase Gallery',
          url: `/services/${s.slug || s.id}`,
        });
      }
    });

    // Check in Products
    products.forEach((p) => {
      if (p.imageUrl === mediaUrl) {
        usages.push({
          locationType: 'product',
          locationId: p.id,
          locationTitle: p.name || 'Untitled Product',
          field: 'Main Preview Image',
          url: `/products/${p.id}`,
        });
      }
    });

    return usages;
  },

  getStorageStats: () => {
    const items = get().items;
    let totalBytes = 0;
    let imageBytes = 0;
    let imageCount = 0;
    let videoBytes = 0;
    let videoCount = 0;
    let fileBytes = 0;
    let fileCount = 0;
    let orphanedCount = 0;

    items.forEach((item) => {
      const bytes = item.size || 0;
      totalBytes += bytes;

      if (item.type === 'image') {
        imageBytes += bytes;
        imageCount++;
      } else if (item.type === 'video') {
        videoBytes += bytes;
        videoCount++;
      } else {
        fileBytes += bytes;
        fileCount++;
      }

      const usages = get().getUsage(item.url);
      if (usages.length === 0) {
        orphanedCount++;
      }
    });

    return {
      totalBytes,
      totalFiles: items.length,
      imageBytes,
      imageCount,
      videoBytes,
      videoCount,
      fileBytes,
      fileCount,
      orphanedCount,
    };
  },
}));
