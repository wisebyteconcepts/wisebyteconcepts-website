import { Service, Product, Skill, TechStack, MediaItem, MediaFolder, MediaCollection, MediaAuditLog, Query } from '@/types';
import { StorageService } from './storageService';
import { DEFAULT_FOLDERS, DEFAULT_MEDIA_ITEMS, DEFAULT_COLLECTIONS } from '@/data/defaultMedia';
import { normalizeTechStack, DEFAULT_CLASSIFICATIONS } from '@/utils/techStackMigration';
import { normalizeService, DEFAULT_SERVICE_CATEGORIES } from '@/utils/serviceMigration';

const KEYS = {
  SERVICES: 'wbc_services',
  SERVICE_CATEGORIES: 'wbc_service_categories',
  PRODUCTS: 'wbc_products',
  SKILLS: 'wbc_skills',
  TECH_STACKS: 'wbc_tech_stacks',
  CLASSIFICATIONS: 'wbc_classifications',
  MEDIA: 'wbc_media',
  FOLDERS: 'wbc_media_folders',
  COLLECTIONS: 'wbc_media_collections',
  AUDIT_LOGS: 'wbc_media_audit_logs',
  QUERIES: 'wbc_queries',
} as const;

export class LocalStorageAdapter implements StorageService {
  private getItem<T>(key: string, defaultData: T[] = []): T[] {
    const data = localStorage.getItem(key);
    if (!data) {
      if (defaultData.length > 0) {
        this.setItem(key, defaultData);
        return defaultData;
      }
      return [];
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`[LocalStorageAdapter] Error parsing key: ${key}`, e);
      return defaultData;
    }
  }

  private setItem<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[LocalStorageAdapter] Error saving key: ${key}`, e);
    }
  }

  async getServices(): Promise<Service[]> {
    const raw = this.getItem<any>(KEYS.SERVICES);
    return raw.map(normalizeService);
  }

  async createService(service: Service): Promise<Service> {
    const normalized = normalizeService(service);
    const services = await this.getServices();
    services.push(normalized);
    this.setItem(KEYS.SERVICES, services);
    return normalized;
  }

  async updateService(service: Service): Promise<Service> {
    const normalized = normalizeService(service);
    const services = await this.getServices();
    const index = services.findIndex(s => s.id === normalized.id);
    if (index !== -1) {
      services[index] = normalized;
      this.setItem(KEYS.SERVICES, services);
    }
    return normalized;
  }

  async deleteService(id: string): Promise<void> {
    const services = await this.getServices();
    const filtered = services.filter(s => s.id !== id);
    this.setItem(KEYS.SERVICES, filtered);
  }

  // Service Categories Lookup
  async getServiceCategories(): Promise<string[]> {
    const stored = this.getItem<string>(KEYS.SERVICE_CATEGORIES);
    return Array.from(new Set([...DEFAULT_SERVICE_CATEGORIES, ...stored]));
  }

  async addServiceCategory(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name cannot be empty');
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const current = await this.getServiceCategories();
    if (!current.some(c => c.toLowerCase() === formatted.toLowerCase())) {
      const stored = this.getItem<string>(KEYS.SERVICE_CATEGORIES);
      stored.push(formatted);
      this.setItem(KEYS.SERVICE_CATEGORIES, stored);
      return formatted;
    }
    return current.find(c => c.toLowerCase() === formatted.toLowerCase())!;
  }

  async getProducts(): Promise<Product[]> {
    return this.getItem<Product>(KEYS.PRODUCTS);
  }

  async createProduct(product: Product): Promise<Product> {
    const products = this.getItem<Product>(KEYS.PRODUCTS);
    products.push(product);
    this.setItem(KEYS.PRODUCTS, products);
    return product;
  }

  async updateProduct(product: Product): Promise<Product> {
    const products = this.getItem<Product>(KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      this.setItem(KEYS.PRODUCTS, products);
    }
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const products = this.getItem<Product>(KEYS.PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    this.setItem(KEYS.PRODUCTS, filtered);
  }

  // Tech Stacks
  async getTechStacks(): Promise<TechStack[]> {
    const rawTechStacks = this.getItem<any>(KEYS.TECH_STACKS);
    if (rawTechStacks.length > 0) {
      return rawTechStacks.map(normalizeTechStack);
    }

    // Auto-migration from legacy skills key if tech_stacks is empty
    const legacySkills = this.getItem<any>(KEYS.SKILLS);
    if (legacySkills.length > 0) {
      const migrated = legacySkills.map(normalizeTechStack);
      this.setItem(KEYS.TECH_STACKS, migrated);
      return migrated;
    }

    return [];
  }

  async createTechStack(techStack: TechStack): Promise<TechStack> {
    const normalized = normalizeTechStack(techStack);
    const stacks = await this.getTechStacks();
    stacks.push(normalized);
    this.setItem(KEYS.TECH_STACKS, stacks);
    // Dual-write to skills for backward compatibility
    this.setItem(KEYS.SKILLS, stacks);
    return normalized;
  }

  async updateTechStack(techStack: TechStack): Promise<TechStack> {
    const normalized = normalizeTechStack(techStack);
    const stacks = await this.getTechStacks();
    const index = stacks.findIndex(s => s.id === normalized.id);
    if (index !== -1) {
      stacks[index] = normalized;
      this.setItem(KEYS.TECH_STACKS, stacks);
      this.setItem(KEYS.SKILLS, stacks);
    }
    return normalized;
  }

  async deleteTechStack(id: string): Promise<void> {
    const stacks = await this.getTechStacks();
    const filtered = stacks.filter(s => s.id !== id);
    this.setItem(KEYS.TECH_STACKS, filtered);
    this.setItem(KEYS.SKILLS, filtered);
  }

  // Legacy Skills methods for backwards compatibility
  async getSkills(): Promise<Skill[]> {
    return this.getTechStacks();
  }

  async createSkill(skill: Skill): Promise<Skill> {
    return this.createTechStack(normalizeTechStack(skill));
  }

  async updateSkill(skill: Skill): Promise<Skill> {
    return this.updateTechStack(normalizeTechStack(skill));
  }

  async deleteSkill(id: string): Promise<void> {
    return this.deleteTechStack(id);
  }

  // Classifications Lookup
  async getClassifications(): Promise<string[]> {
    const stored = this.getItem<string>(KEYS.CLASSIFICATIONS);
    const combined = Array.from(new Set([...DEFAULT_CLASSIFICATIONS, ...stored]));
    return combined;
  }

  async addClassification(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Classification name cannot be empty');
    
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const current = await this.getClassifications();
    const exists = current.some(c => c.toLowerCase() === formatted.toLowerCase());
    
    if (!exists) {
      const stored = this.getItem<string>(KEYS.CLASSIFICATIONS);
      stored.push(formatted);
      this.setItem(KEYS.CLASSIFICATIONS, stored);
      return formatted;
    }
    
    const existing = current.find(c => c.toLowerCase() === formatted.toLowerCase())!;
    return existing;
  }

  async deleteClassification(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;

    const techStacks = await this.getTechStacks();
    const inUse = techStacks.some(
      s => (s.classification || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (inUse) {
      throw new Error(`Cannot delete "${trimmed}" because it is currently assigned to one or more tech stacks.`);
    }

    const stored = this.getItem<string>(KEYS.CLASSIFICATIONS);
    const filtered = stored.filter(c => c.toLowerCase() !== trimmed.toLowerCase());
    this.setItem(KEYS.CLASSIFICATIONS, filtered);
  }

  // Media Gallery Items
  async getMediaItems(): Promise<MediaItem[]> {
    return this.getItem<MediaItem>(KEYS.MEDIA, DEFAULT_MEDIA_ITEMS);
  }

  async createMediaItem(item: MediaItem): Promise<MediaItem> {
    const items = this.getItem<MediaItem>(KEYS.MEDIA, DEFAULT_MEDIA_ITEMS);
    items.unshift(item);
    this.setItem(KEYS.MEDIA, items);
    return item;
  }

  async updateMediaItem(item: MediaItem): Promise<MediaItem> {
    const items = this.getItem<MediaItem>(KEYS.MEDIA, DEFAULT_MEDIA_ITEMS);
    const index = items.findIndex(m => m.id === item.id);
    if (index !== -1) {
      items[index] = item;
      this.setItem(KEYS.MEDIA, items);
    }
    return item;
  }

  async deleteMediaItem(id: string): Promise<void> {
    const items = this.getItem<MediaItem>(KEYS.MEDIA, DEFAULT_MEDIA_ITEMS);
    const filtered = items.filter(m => m.id !== id);
    this.setItem(KEYS.MEDIA, filtered);
  }

  // Media Folders
  async getMediaFolders(): Promise<MediaFolder[]> {
    return this.getItem<MediaFolder>(KEYS.FOLDERS, DEFAULT_FOLDERS);
  }

  async createMediaFolder(folder: MediaFolder): Promise<MediaFolder> {
    const folders = this.getItem<MediaFolder>(KEYS.FOLDERS, DEFAULT_FOLDERS);
    folders.push(folder);
    this.setItem(KEYS.FOLDERS, folders);
    return folder;
  }

  async updateMediaFolder(folder: MediaFolder): Promise<MediaFolder> {
    const folders = this.getItem<MediaFolder>(KEYS.FOLDERS, DEFAULT_FOLDERS);
    const index = folders.findIndex(f => f.id === folder.id);
    if (index !== -1) {
      folders[index] = folder;
      this.setItem(KEYS.FOLDERS, folders);
    }
    return folder;
  }

  async deleteMediaFolder(id: string): Promise<void> {
    const folders = this.getItem<MediaFolder>(KEYS.FOLDERS, DEFAULT_FOLDERS);
    const filtered = folders.filter(f => f.id !== id);
    this.setItem(KEYS.FOLDERS, filtered);
  }

  // Media Collections
  async getMediaCollections(): Promise<MediaCollection[]> {
    return this.getItem<MediaCollection>(KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
  }

  async createMediaCollection(collection: MediaCollection): Promise<MediaCollection> {
    const collections = this.getItem<MediaCollection>(KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    collections.push(collection);
    this.setItem(KEYS.COLLECTIONS, collections);
    return collection;
  }

  async updateMediaCollection(collection: MediaCollection): Promise<MediaCollection> {
    const collections = this.getItem<MediaCollection>(KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const index = collections.findIndex(c => c.id === collection.id);
    if (index !== -1) {
      collections[index] = collection;
      this.setItem(KEYS.COLLECTIONS, collections);
    }
    return collection;
  }

  async deleteMediaCollection(id: string): Promise<void> {
    const collections = this.getItem<MediaCollection>(KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
    const filtered = collections.filter(c => c.id !== id);
    this.setItem(KEYS.COLLECTIONS, filtered);
  }

  // Media Audit Logs
  async getMediaAuditLogs(): Promise<MediaAuditLog[]> {
    return this.getItem<MediaAuditLog>(KEYS.AUDIT_LOGS, []);
  }

  async createMediaAuditLog(log: MediaAuditLog): Promise<MediaAuditLog> {
    const logs = this.getItem<MediaAuditLog>(KEYS.AUDIT_LOGS, []);
    logs.unshift(log);
    // keep max 500 audit logs
    if (logs.length > 500) logs.pop();
    this.setItem(KEYS.AUDIT_LOGS, logs);
    return log;
  }

  // Queries (Contact Inquiries)
  async getQueries(): Promise<Query[]> {
    const raw = this.getItem<Query>(KEYS.QUERIES, []);
    return raw.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createQuery(query: Query): Promise<Query> {
    const queries = this.getItem<Query>(KEYS.QUERIES, []);
    queries.unshift(query);
    this.setItem(KEYS.QUERIES, queries);
    return query;
  }

  async updateQuery(query: Query): Promise<Query> {
    const queries = this.getItem<Query>(KEYS.QUERIES, []);
    const index = queries.findIndex((q) => q.id === query.id);
    if (index !== -1) {
      queries[index] = query;
      this.setItem(KEYS.QUERIES, queries);
    }
    return query;
  }

  async deleteQuery(id: string): Promise<void> {
    const queries = this.getItem<Query>(KEYS.QUERIES, []);
    const filtered = queries.filter((q) => q.id !== id);
    this.setItem(KEYS.QUERIES, filtered);
  }

  async batchUpdate(collectionName: string, updates: any[]): Promise<void> {
    let key: string | null = null;
    if (collectionName === 'services') key = KEYS.SERVICES;
    else if (collectionName === 'products') key = KEYS.PRODUCTS;
    else if (collectionName === 'tech_stacks' || collectionName === 'skills') {
      key = KEYS.TECH_STACKS;
    }
    else if (collectionName === 'media') key = KEYS.MEDIA;
    
    if (!key) return;

    const data = this.getItem<any>(key);
    const newData = data.map((item: any) => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, ...update } : item;
    });

    this.setItem(key, newData);
    if (collectionName === 'tech_stacks' || collectionName === 'skills') {
      this.setItem(KEYS.SKILLS, newData);
    }
  }
}

export const storage = new LocalStorageAdapter();
