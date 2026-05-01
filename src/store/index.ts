import { create } from 'zustand';
import { Service, Product, Skill } from '@/types';
import { api } from '@/services/api';

interface AppState {
  services: Service[];
  products: Product[];
  skills: Skill[];
  isLoaded: boolean;

  // Actions for Services
  addService: (service: Service) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  reorderServices: (items: Service[]) => Promise<void>;

  // Actions for Products
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  reorderProducts: (items: Product[]) => Promise<void>;

  // Actions for Skills
  addSkill: (skill: Skill) => Promise<void>;
  updateSkill: (skill: Skill) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  reorderSkills: (items: Skill[]) => Promise<void>;

  // Reset functionality
  resetToDefaults: () => Promise<void>;

  // Initialization
  init: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  services: [],
  products: [],
  skills: [],
  isLoaded: false,

  resetToDefaults: async () => {
    // In a real app this would call a seed API. 
    // Here we'll just clear and re-init (which might need a backend seed check)
    // For now, let's just refresh state.
    await get().init();
  },

  addService: async (service) => {
    const newService = await api.data.createService(service);
    set((state) => ({ services: [...state.services, newService] }));
  },

  updateService: async (service) => {
    const updated = await api.data.updateService(service);
    set((state) => ({
      services: state.services.map((s) => (s.id === updated.id ? updated : s)),
    }));
  },

  deleteService: async (id) => {
    await api.data.deleteService(id);
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
    }));
  },

  reorderServices: async (items) => {
    const updates = items.map((item, index) => ({ ...item, order: index }));
    set({ services: updates });
    await api.data.batchUpdate('services', updates);
  },

  addProduct: async (product) => {
    const newProduct = await api.data.createProduct(product);
    set((state) => ({ products: [...state.products, newProduct] }));
  },

  updateProduct: async (product) => {
    const updated = await api.data.updateProduct(product);
    set((state) => ({
      products: state.products.map((p) => (p.id === updated.id ? updated : p)),
    }));
  },

  deleteProduct: async (id) => {
    await api.data.deleteProduct(id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  reorderProducts: async (items) => {
    const updates = items.map((item, index) => ({ ...item, order: index }));
    set({ products: updates });
    await api.data.batchUpdate('products', updates);
  },

  addSkill: async (skill) => {
    const newSkill = await api.data.createSkill(skill);
    set((state) => ({ skills: [...state.skills, newSkill] }));
  },

  updateSkill: async (skill) => {
    const updated = await api.data.updateSkill(skill);
    set((state) => ({
      skills: state.skills.map((s) => (s.id === updated.id ? updated : s)),
    }));
  },

  deleteSkill: async (id) => {
    await api.data.deleteSkill(id);
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
    }));
  },

  reorderSkills: async (items) => {
    const updates = items.map((item, index) => ({ ...item, order: index }));
    set({ skills: updates });
    await api.data.batchUpdate('skills', updates);
  },

  init: async () => {
    const { isLoaded } = useAppStore.getState();
    if (isLoaded) return;

    try {
      const [services, products, skills] = await Promise.all([
        api.data.getServices(),
        api.data.getProducts(),
        api.data.getSkills(),
      ]);

      // Final safety deduplication before setting state
      const seenServiceIds = new Set();
      const uniqueServices = services.filter(s => {
        if (!s.id || seenServiceIds.has(s.id)) return false;
        seenServiceIds.add(s.id);
        return true;
      });

      const seenProductIds = new Set();
      const uniqueProducts = products.filter(p => {
        if (!p.id || seenProductIds.has(p.id)) return false;
        seenProductIds.add(p.id);
        return true;
      });

      const seenSkillIds = new Set();
      const uniqueSkills = skills.filter(sk => {
        if (!sk.id || seenSkillIds.has(sk.id)) return false;
        seenSkillIds.add(sk.id);
        return true;
      });

      set({ 
        services: uniqueServices, 
        products: uniqueProducts, 
        skills: uniqueSkills, 
        isLoaded: true 
      });
    } catch (error) {
      console.error('[AppStore] Initialization failed', error);
      set({ isLoaded: true });
    }
  },
}));
