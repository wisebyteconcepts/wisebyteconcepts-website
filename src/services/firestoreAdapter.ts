import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Service, Product, Skill, MediaItem, MediaFolder, MediaCollection, MediaAuditLog, OperationType } from '@/types';
import { StorageService } from './storageService';
import { auth } from '../lib/firebase';
import { storage as localFallback } from './localStorageAdapter';

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

export class FirestoreAdapter implements StorageService {
  async getServices(): Promise<Service[]> {
    try {
      const snapshot = await getDocs(collection(db, 'services'));
      if (snapshot.empty) {
        return localFallback.getServices();
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'services');
      return localFallback.getServices();
    }
  }

  async createService(service: Service): Promise<Service> {
    try {
      await setDoc(doc(db, 'services', service.id), service);
      await localFallback.createService(service);
      return service;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `services/${service.id}`);
      return localFallback.createService(service);
    }
  }

  async updateService(service: Service): Promise<Service> {
    try {
      await setDoc(doc(db, 'services', service.id), service);
      await localFallback.updateService(service);
      return service;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${service.id}`);
      return localFallback.updateService(service);
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
      await setDoc(doc(db, 'products', product.id), product);
      await localFallback.createProduct(product);
      return product;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
      return localFallback.createProduct(product);
    }
  }

  async updateProduct(product: Product): Promise<Product> {
    try {
      await setDoc(doc(db, 'products', product.id), product);
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

  async getSkills(): Promise<Skill[]> {
    try {
      const snapshot = await getDocs(collection(db, 'skills'));
      if (snapshot.empty) {
        return localFallback.getSkills();
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'skills');
      return localFallback.getSkills();
    }
  }

  async createSkill(skill: Skill): Promise<Skill> {
    try {
      await setDoc(doc(db, 'skills', skill.id), skill);
      await localFallback.createSkill(skill);
      return skill;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `skills/${skill.id}`);
      return localFallback.createSkill(skill);
    }
  }

  async updateSkill(skill: Skill): Promise<Skill> {
    try {
      await setDoc(doc(db, 'skills', skill.id), skill);
      await localFallback.updateSkill(skill);
      return skill;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `skills/${skill.id}`);
      return localFallback.updateSkill(skill);
    }
  }

  async deleteSkill(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'skills', id));
      await localFallback.deleteSkill(id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `skills/${id}`);
      await localFallback.deleteSkill(id);
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
        batch.set(ref, item, { merge: true });
      });
      await batch.commit();
      await localFallback.batchUpdate(collectionName, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, collectionName);
      await localFallback.batchUpdate(collectionName, updates);
    }
  }
}
