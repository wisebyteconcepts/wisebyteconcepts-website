import { Service, Product, Skill, MediaItem, MediaFolder, MediaCollection, MediaAuditLog } from '@/types';

export interface StorageService {
  // Services
  getServices(): Promise<Service[]>;
  createService(service: Service): Promise<Service>;
  updateService(service: Service): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  createProduct(product: Product): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Skills
  getSkills(): Promise<Skill[]>;
  createSkill(skill: Skill): Promise<Skill>;
  updateSkill(skill: Skill): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;

  // Media Gallery Items
  getMediaItems(): Promise<MediaItem[]>;
  createMediaItem(item: MediaItem): Promise<MediaItem>;
  updateMediaItem(item: MediaItem): Promise<MediaItem>;
  deleteMediaItem(id: string): Promise<void>;

  // Media Folders
  getMediaFolders(): Promise<MediaFolder[]>;
  createMediaFolder(folder: MediaFolder): Promise<MediaFolder>;
  updateMediaFolder(folder: MediaFolder): Promise<MediaFolder>;
  deleteMediaFolder(id: string): Promise<void>;

  // Media Collections
  getMediaCollections(): Promise<MediaCollection[]>;
  createMediaCollection(collection: MediaCollection): Promise<MediaCollection>;
  updateMediaCollection(collection: MediaCollection): Promise<MediaCollection>;
  deleteMediaCollection(id: string): Promise<void>;

  // Media Audit Logs
  getMediaAuditLogs(): Promise<MediaAuditLog[]>;
  createMediaAuditLog(log: MediaAuditLog): Promise<MediaAuditLog>;

  // Batch
  batchUpdate(collectionName: string, updates: any[]): Promise<void>;
}
