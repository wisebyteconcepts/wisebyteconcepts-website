import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Service, Product, Skill, OperationType } from '@/types';
import { StorageService } from './storageService';
import { auth } from '../lib/firebase';

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
  throw new Error(JSON.stringify(errInfo));
}

export class FirestoreAdapter implements StorageService {
  async getServices(): Promise<Service[]> {
    try {
      const snapshot = await getDocs(collection(db, 'services'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'services');
      return [];
    }
  }

  async createService(service: Service): Promise<Service> {
    try {
      await setDoc(doc(db, 'services', service.id), service);
      return service;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `services/${service.id}`);
      throw error;
    }
  }

  async updateService(service: Service): Promise<Service> {
    try {
      await setDoc(doc(db, 'services', service.id), service);
      return service;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${service.id}`);
      throw error;
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
      return [];
    }
  }

  async createProduct(product: Product): Promise<Product> {
    try {
      await setDoc(doc(db, 'products', product.id), product);
      return product;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
      throw error;
    }
  }

  async updateProduct(product: Product): Promise<Product> {
    try {
      await setDoc(doc(db, 'products', product.id), product);
      return product;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      throw error;
    }
  }

  async getSkills(): Promise<Skill[]> {
    try {
      const snapshot = await getDocs(collection(db, 'skills'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'skills');
      return [];
    }
  }

  async createSkill(skill: Skill): Promise<Skill> {
    try {
      await setDoc(doc(db, 'skills', skill.id), skill);
      return skill;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `skills/${skill.id}`);
      throw error;
    }
  }

  async updateSkill(skill: Skill): Promise<Skill> {
    try {
      await setDoc(doc(db, 'skills', skill.id), skill);
      return skill;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `skills/${skill.id}`);
      throw error;
    }
  }

  async deleteSkill(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'skills', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `skills/${id}`);
      throw error;
    }
  }
}
