import { Service, Product, Skill, TechStack, MediaItem, MediaFolder, MediaCollection, MediaAuditLog } from '@/types';

export interface StorageService {
  // Services
  getServices(): Promise<Service[]>;
  createService(service: Service): Promise<Service>;
  updateService(service: Service): Promise<Service>;
  deleteService(id: string): Promise<void>;
  getServiceCategories(): Promise<string[]>;
  addServiceCategory(name: string): Promise<string>;

  // Products
  getProducts(): Promise<Product[]>;
  createProduct(product: Product): Promise<Product>;
  updateProduct(product: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Tech Stacks
  getTechStacks(): Promise<TechStack[]>;
  createTechStack(techStack: TechStack): Promise<TechStack>;
  updateTechStack(techStack: TechStack): Promise<TechStack>;
  deleteTechStack(id: string): Promise<void>;

  // Legacy Skills methods for backwards compatibility
  getSkills(): Promise<Skill[]>;
  createSkill(skill: Skill): Promise<Skill>;
  updateSkill(skill: Skill): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;

  // Classifications lookup
  getClassifications(): Promise<string[]>;
  addClassification(name: string): Promise<string>;
  deleteClassification(name: string): Promise<void>;

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
