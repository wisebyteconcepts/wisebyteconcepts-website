import { Service, Product, Skill } from '@/types';
import { StorageService } from './storageService';

const KEYS = {
  SERVICES: 'wbc_services',
  PRODUCTS: 'wbc_products',
  SKILLS: 'wbc_skills',
} as const;

export class LocalStorageAdapter implements StorageService {
  private getItem<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`[LocalStorageAdapter] Error parsing key: ${key}`, e);
      return [];
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

  async batchUpdate(collectionName: string, updates: any[]): Promise<void> {
    const key = collectionName === 'services' ? KEYS.SERVICES : 
                collectionName === 'products' ? KEYS.PRODUCTS : 
                collectionName === 'skills' ? KEYS.SKILLS : null;
    
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
