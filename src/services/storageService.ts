import { Service, Product, Skill } from '@/types';

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
}
