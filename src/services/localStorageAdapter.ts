import { Service, Product, Skill, MediaItem, MediaFolder, MediaCollection, MediaAuditLog } from '@/types';
import { StorageService } from './storageService';
import { DEFAULT_FOLDERS, DEFAULT_MEDIA_ITEMS, DEFAULT_COLLECTIONS } from '@/data/defaultMedia';

const KEYS = {
  SERVICES: 'wbc_services',
  PRODUCTS: 'wbc_products',
  SKILLS: 'wbc_skills',
  MEDIA: 'wbc_media',
  FOLDERS: 'wbc_media_folders',
  COLLECTIONS: 'wbc_media_collections',
  AUDIT_LOGS: 'wbc_media_audit_logs',
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
    return this.getItem<Service>(KEYS.SERVICES);
  }

  async createService(service: Service): Promise<Service> {
    const services = this.getItem<Service>(KEYS.SERVICES);
    services.push(service);
    this.setItem(KEYS.SERVICES, services);
    return service;
  }

  async updateService(service: Service): Promise<Service> {
    const services = this.getItem<Service>(KEYS.SERVICES);
    const index = services.findIndex(s => s.id === service.id);
    if (index !== -1) {
      services[index] = service;
      this.setItem(KEYS.SERVICES, services);
    }
    return service;
  }

  async deleteService(id: string): Promise<void> {
    const services = this.getItem<Service>(KEYS.SERVICES);
    const filtered = services.filter(s => s.id !== id);
    this.setItem(KEYS.SERVICES, filtered);
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

  async getSkills(): Promise<Skill[]> {
    return this.getItem<Skill>(KEYS.SKILLS);
  }

  async createSkill(skill: Skill): Promise<Skill> {
    const skills = this.getItem<Skill>(KEYS.SKILLS);
    skills.push(skill);
    this.setItem(KEYS.SKILLS, skills);
    return skill;
  }

  async updateSkill(skill: Skill): Promise<Skill> {
    const skills = this.getItem<Skill>(KEYS.SKILLS);
    const index = skills.findIndex(s => s.id === skill.id);
    if (index !== -1) {
      skills[index] = skill;
      this.setItem(KEYS.SKILLS, skills);
    }
    return skill;
  }

  async deleteSkill(id: string): Promise<void> {
    const skills = this.getItem<Skill>(KEYS.SKILLS);
    const filtered = skills.filter(s => s.id !== id);
    this.setItem(KEYS.SKILLS, filtered);
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

  async batchUpdate(collectionName: string, updates: any[]): Promise<void> {
    let key: string | null = null;
    if (collectionName === 'services') key = KEYS.SERVICES;
    else if (collectionName === 'products') key = KEYS.PRODUCTS;
    else if (collectionName === 'skills') key = KEYS.SKILLS;
    else if (collectionName === 'media') key = KEYS.MEDIA;
    
    if (!key) return;

    const data = this.getItem<any>(key);
    const newData = data.map((item: any) => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, ...update } : item;
    });

    this.setItem(key, newData);
  }
}

export const storage = new LocalStorageAdapter();
