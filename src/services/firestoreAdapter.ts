import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Service, Product, Skill, TechStack, MediaItem, MediaFolder, MediaCollection, MediaAuditLog, OperationType } from '@/types';
import { StorageService } from './storageService';
import { auth } from '../lib/firebase';
import { storage as localFallback } from './localStorageAdapter';
import { normalizeTechStack } from '@/utils/techStackMigration';
import { normalizeService } from '@/utils/serviceMigration';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Non-fatal logging for client resilience
}

/**
 * Deeply removes all `undefined` values from an object or array before sending to Firestore,
 * preventing 'Function setDoc() called with invalid data. Unsupported field value: undefined' errors.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export class FirestoreAdapter implements StorageService {
  async getServices(): Promise<Service[]> {
    try {
      const snapshot = await getDocs(collection(db, 'services'));
      if (snapshot.empty) {
        return localFallback.getServices();
      }
      return snapshot.docs.map(doc => normalizeService({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'services');
      return localFallback.getServices();
    }
  }

  async createService(service: Service): Promise<Service> {
    const normalized = normalizeService(service);
    try {
      await setDoc(doc(db, 'services', normalized.id), cleanForFirestore(normalized));
      await localFallback.createService(normalized);
      return normalized;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `services/${normalized.id}`);
      return localFallback.createService(normalized);
    }
  }

  async updateService(service: Service): Promise<Service> {
    const normalized = normalizeService(service);
    try {
      await setDoc(doc(db, 'services', normalized.id), cleanForFirestore(normalized));
      await localFallback.updateService(normalized);
      return normalized;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${normalized.id}`);
      return localFallback.updateService(normalized);
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'services', id));
      await localFallback.deleteService(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
      await localFallback.deleteService(id);
    }
  }

  // Service Categories Lookup
  async getServiceCategories(): Promise<string[]> {
    try {
      const snapshot = await getDocs(collection(db, 'service_categories'));
      if (!snapshot.empty) {
        const firestoreList = snapshot.docs.map(doc => (doc.data().name as string) || doc.id);
        const fallbackList = await localFallback.getServiceCategories();
        return Array.from(new Set([...fallbackList, ...firestoreList]));
      }
      return localFallback.getServiceCategories();
    } catch (error) {
      return localFallback.getServiceCategories();
    }
  }

  async addServiceCategory(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Category name cannot be empty');
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    try {
      const slug = formatted.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'service_categories', slug), cleanForFirestore({
        name: formatted,
        createdAt: new Date().toISOString()
      }));
      await localFallback.addServiceCategory(formatted);
      return formatted;
    } catch (error) {
      return localFallback.addServiceCategory(formatted);
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      if (snapshot.empty) {
        return localFallback.getProducts();
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
      return localFallback.getProducts();
    }
  }

  async createProduct(product: Product): Promise<Product> {
    try {
      await setDoc(doc(db, 'products', product.id), cleanForFirestore(product));
      await localFallback.createProduct(product);
      return product;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
      return localFallback.createProduct(product);
    }
  }

  async updateProduct(product: Product): Promise<Product> {
    try {
      await setDoc(doc(db, 'products', product.id), cleanForFirestore(product));
      await localFallback.updateProduct(product);
      return product;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
      return localFallback.updateProduct(product);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', id));
      await localFallback.deleteProduct(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      await localFallback.deleteProduct(id);
    }
  }

  // Tech Stacks
  async getTechStacks(): Promise<TechStack[]> {
    try {
      // 1. Try tech_stacks collection
      const snapshot = await getDocs(collection(db, 'tech_stacks'));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => normalizeTechStack({ id: doc.id, ...doc.data() }));
      }
      
      // 2. Fallback to skills collection
      const legacySnapshot = await getDocs(collection(db, 'skills'));
      if (!legacySnapshot.empty) {
        return legacySnapshot.docs.map(doc => normalizeTechStack({ id: doc.id, ...doc.data() }));
      }

      return localFallback.getTechStacks();
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tech_stacks');
      return localFallback.getTechStacks();
    }
  }

  async createTechStack(techStack: TechStack): Promise<TechStack> {
    const normalized = normalizeTechStack(techStack);
    try {
      await setDoc(doc(db, 'tech_stacks', normalized.id), cleanForFirestore(normalized));
      // Dual-write to skills for backward compatibility
      try {
        await setDoc(doc(db, 'skills', normalized.id), cleanForFirestore(normalized));
      } catch (e) {
        // non-blocking
      }
      await localFallback.createTechStack(normalized);
      return normalized;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tech_stacks/${normalized.id}`);
      return localFallback.createTechStack(normalized);
    }
  }

  async updateTechStack(techStack: TechStack): Promise<TechStack> {
    const normalized = normalizeTechStack(techStack);
    try {
      await setDoc(doc(db, 'tech_stacks', normalized.id), cleanForFirestore(normalized));
      // Dual-write to skills for backward compatibility
      try {
        await setDoc(doc(db, 'skills', normalized.id), cleanForFirestore(normalized));
      } catch (e) {
        // non-blocking
      }
      await localFallback.updateTechStack(normalized);
      return normalized;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tech_stacks/${normalized.id}`);
      return localFallback.updateTechStack(normalized);
    }
  }

  async deleteTechStack(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tech_stacks', id));
      try {
        await deleteDoc(doc(db, 'skills', id));
      } catch (e) {
        // non-blocking
      }
      await localFallback.deleteTechStack(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tech_stacks/${id}`);
      await localFallback.deleteTechStack(id);
    }
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
    try {
      const snapshot = await getDocs(collection(db, 'classifications'));
      if (!snapshot.empty) {
        const firestoreList = snapshot.docs.map(doc => (doc.data().name as string) || doc.id);
        const fallbackList = await localFallback.getClassifications();
        return Array.from(new Set([...fallbackList, ...firestoreList]));
      }
      return localFallback.getClassifications();
    } catch (error) {
      return localFallback.getClassifications();
    }
  }

  async addClassification(name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Classification name cannot be empty');
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    try {
      const slug = formatted.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'classifications', slug), cleanForFirestore({
        name: formatted,
        createdAt: new Date().toISOString()
      }));
      await localFallback.addClassification(formatted);
      return formatted;
    } catch (error) {
      return localFallback.addClassification(formatted);
    }
  }

  async deleteClassification(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check if in use by any tech stack
    const techStacks = await this.getTechStacks();
    const inUse = techStacks.some(
      s => (s.classification || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (inUse) {
      throw new Error(`Cannot delete "${trimmed}" because it is currently assigned to one or more tech stacks.`);
    }

    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    try {
      await deleteDoc(doc(db, 'classifications', slug));
      await localFallback.deleteClassification(trimmed);
    } catch (error) {
      await localFallback.deleteClassification(trimmed);
    }
  }

  // Media Gallery Items
  async getMediaItems(): Promise<MediaItem[]> {
    try {
      const snapshot = await getDocs(collection(db, 'media'));
      if (snapshot.empty) {
        return localFallback.getMediaItems();
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'media');
      return localFallback.getMediaItems();
    }
  }

  async createMediaItem(item: MediaItem): Promise<MediaItem> {
    try {
      await setDoc(doc(db, 'media', item.id), item);
      await localFallback.createMediaItem(item);
      return item;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `media/${item.id}`);
      return localFallback.createMediaItem(item);
    }
  }

  async updateMediaItem(item: MediaItem): Promise<MediaItem> {
    try {
      await setDoc(doc(db, 'media', item.id), item);
      await localFallback.updateMediaItem(item);
      return item;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `media/${item.id}`);
      return localFallback.updateMediaItem(item);
    }
  }

  async deleteMediaItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'media', id));
      await localFallback.deleteMediaItem(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `media/${id}`);
      await localFallback.deleteMediaItem(id);
    }
  }

  // Media Folders
  async getMediaFolders(): Promise<MediaFolder[]> {
    try {
      const snapshot = await getDocs(collection(db, 'mediaFolders'));
      if (snapshot.empty) {
        return localFallback.getMediaFolders();
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaFolder));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'mediaFolders');
      return localFallback.getMediaFolders();
    }
  }

  async createMediaFolder(folder: MediaFolder): Promise<MediaFolder> {
    try {
      await setDoc(doc(db, 'mediaFolders', folder.id), folder);
      await localFallback.createMediaFolder(folder);
      return folder;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `mediaFolders/${folder.id}`);
      return localFallback.createMediaFolder(folder);
    }
  }

  async updateMediaFolder(folder: MediaFolder): Promise<MediaFolder> {
    try {
      await setDoc(doc(db, 'mediaFolders', folder.id), folder);
      await localFallback.updateMediaFolder(folder);
      return folder;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `mediaFolders/${folder.id}`);
      return localFallback.updateMediaFolder(folder);
    }
  }

  async deleteMediaFolder(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'mediaFolders', id));
      await localFallback.deleteMediaFolder(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `mediaFolders/${id}`);
      await localFallback.deleteMediaFolder(id);
    }
  }

  // Media Collections
  async getMediaCollections(): Promise<MediaCollection[]> {
    try {
      const snapshot = await getDocs(collection(db, 'mediaCollections'));
      if (snapshot.empty) {
        return localFallback.getMediaCollections();
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaCollection));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'mediaCollections');
      return localFallback.getMediaCollections();
    }
  }

  async createMediaCollection(collectionItem: MediaCollection): Promise<MediaCollection> {
    try {
      await setDoc(doc(db, 'mediaCollections', collectionItem.id), collectionItem);
      await localFallback.createMediaCollection(collectionItem);
      return collectionItem;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `mediaCollections/${collectionItem.id}`);
      return localFallback.createMediaCollection(collectionItem);
    }
  }

  async updateMediaCollection(collectionItem: MediaCollection): Promise<MediaCollection> {
    try {
      await setDoc(doc(db, 'mediaCollections', collectionItem.id), collectionItem);
      await localFallback.updateMediaCollection(collectionItem);
      return collectionItem;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `mediaCollections/${collectionItem.id}`);
      return localFallback.updateMediaCollection(collectionItem);
    }
  }

  async deleteMediaCollection(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'mediaCollections', id));
      await localFallback.deleteMediaCollection(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `mediaCollections/${id}`);
      await localFallback.deleteMediaCollection(id);
    }
  }

  // Media Audit Logs
  async getMediaAuditLogs(): Promise<MediaAuditLog[]> {
    try {
      const snapshot = await getDocs(collection(db, 'mediaAuditLogs'));
      if (snapshot.empty) {
        return localFallback.getMediaAuditLogs();
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaAuditLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'mediaAuditLogs');
      return localFallback.getMediaAuditLogs();
    }
  }

  async createMediaAuditLog(log: MediaAuditLog): Promise<MediaAuditLog> {
    try {
      await setDoc(doc(db, 'mediaAuditLogs', log.id), log);
      await localFallback.createMediaAuditLog(log);
      return log;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `mediaAuditLogs/${log.id}`);
      return localFallback.createMediaAuditLog(log);
    }
  }

  async batchUpdate(collectionName: string, updates: any[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      updates.forEach(item => {
        const ref = doc(db, collectionName, item.id);
        batch.set(ref, cleanForFirestore(item), { merge: true });
      });
      await batch.commit();
      await localFallback.batchUpdate(collectionName, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
      await localFallback.batchUpdate(collectionName, updates);
    }
  }
}
