import { create } from 'zustand';
import { Service, Product, Skill, TechStack, Query } from '@/types';
import { api } from '@/services/api';
import { DEFAULT_CLASSIFICATIONS } from '@/utils/techStackMigration';
import { DEFAULT_SERVICE_CATEGORIES } from '@/utils/serviceMigration';
import { DEFAULT_PROJECT_CATEGORIES, normalizeProject } from '@/utils/projectMigration';

interface AppState {
  services: Service[];
  serviceCategories: string[];
  products: Product[];
  projectCategories: string[];
  techStacks: TechStack[];
  skills: TechStack[]; // Backwards compatibility alias
  classifications: string[];
  queries: Query[];
  isLoaded: boolean;

  // Actions for Queries
  addQuery: (query: Query) => Promise<void>;
  updateQuery: (query: Query) => Promise<void>;
  deleteQuery: (id: string) => Promise<void>;
  markQueryRead: (id: string, isRead: boolean) => Promise<void>;
  loadQueries: () => Promise<void>;

  // Actions for Services
  addService: (service: Service) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  reorderServices: (items: Service[]) => Promise<void>;
  addServiceCategory: (name: string) => Promise<string>;
  loadServiceCategories: () => Promise<void>;

  // Actions for Products / Projects
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  reorderProducts: (items: Product[]) => Promise<void>;
  addProjectCategory: (name: string) => Promise<string>;

  // Actions for Tech Stacks
  addTechStack: (techStack: TechStack) => Promise<void>;
  updateTechStack: (techStack: TechStack) => Promise<void>;
  deleteTechStack: (id: string) => Promise<void>;
  reorderTechStacks: (items: TechStack[]) => Promise<void>;

  // Legacy Actions for Skills
  addSkill: (skill: Skill) => Promise<void>;
  updateSkill: (skill: Skill) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  reorderSkills: (items: Skill[]) => Promise<void>;

  // Classifications
  addClassification: (name: string) => Promise<string>;
  deleteClassification: (name: string) => Promise<void>;
  loadClassifications: () => Promise<void>;

  // Reset functionality
  resetToDefaults: () => Promise<void>;

  // Initialization
  init: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  services: [],
  serviceCategories: DEFAULT_SERVICE_CATEGORIES,
  products: [],
  projectCategories: DEFAULT_PROJECT_CATEGORIES,
  techStacks: [],
  skills: [],
  classifications: DEFAULT_CLASSIFICATIONS,
  queries: [],
  isLoaded: false,

  resetToDefaults: async () => {
    await get().init();
  },

  addQuery: async (query) => {
    const created = await api.data.createQuery(query);
    set((state) => ({
      queries: [created, ...state.queries.filter((q) => q.id !== created.id)],
    }));
  },

  updateQuery: async (query) => {
    const updated = await api.data.updateQuery(query);
    set((state) => ({
      queries: state.queries.map((q) => (q.id === updated.id ? updated : q)),
    }));
  },

  deleteQuery: async (id) => {
    await api.data.deleteQuery(id);
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
    }));
  },

  markQueryRead: async (id, isRead) => {
    const target = get().queries.find((q) => q.id === id);
    if (!target) return;
    const updated: Query = { ...target, isRead };
    await get().updateQuery(updated);
  },

  loadQueries: async () => {
    const list = await api.data.getQueries();
    set({ queries: list });
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
    // When deleting a service, uncouple any projects referencing it as parentService to prevent orphan crashes
    const updatedProducts = get().products.map((p) => {
      if (p.parentService === id || p.serviceId === id) {
        return { ...p, parentService: '', serviceId: '' };
      }
      return p;
    });
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
      products: updatedProducts,
    }));
    await api.data.batchUpdate('products', updatedProducts);
  },

  reorderServices: async (items) => {
    const updates = items.map((item, index) => ({ ...item, order: index }));
    set({ services: updates });
    await api.data.batchUpdate('services', updates);
  },

  addServiceCategory: async (name) => {
    const created = await api.data.addServiceCategory(name);
    set((state) => {
      if (state.serviceCategories.some(c => c.toLowerCase() === created.toLowerCase())) {
        return state;
      }
      return { serviceCategories: [...state.serviceCategories, created] };
    });
    return created;
  },

  loadServiceCategories: async () => {
    const list = await api.data.getServiceCategories();
    set({ serviceCategories: list });
  },

  addProduct: async (product) => {
    const normalized = normalizeProject(product);
    const newProduct = await api.data.createProduct(normalized);
    set((state) => ({ products: [...state.products, newProduct] }));
  },

  updateProduct: async (product) => {
    const normalized = normalizeProject(product);
    const updated = await api.data.updateProduct(normalized);
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

  addProjectCategory: async (name: string) => {
    const trimmed = name.trim();
    set((state) => {
      if (state.projectCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        return state;
      }
      return { projectCategories: [...state.projectCategories, trimmed] };
    });
    return trimmed;
  },

  // Tech Stacks Actions
  addTechStack: async (techStack) => {
    const newStack = await api.data.createTechStack(techStack);
    set((state) => ({ 
      techStacks: [...state.techStacks, newStack],
      skills: [...state.techStacks, newStack]
    }));
  },

  updateTechStack: async (techStack) => {
    const updated = await api.data.updateTechStack(techStack);
    set((state) => {
      const updatedList = state.techStacks.map((s) => (s.id === updated.id ? updated : s));
      return {
        techStacks: updatedList,
        skills: updatedList
      };
    });
  },

  deleteTechStack: async (id) => {
    await api.data.deleteTechStack(id);
    set((state) => {
      const filtered = state.techStacks.filter((s) => s.id !== id);
      return {
        techStacks: filtered,
        skills: filtered
      };
    });
  },

  reorderTechStacks: async (items) => {
    const updates = items.map((item, index) => ({ ...item, order: index }));
    set({ 
      techStacks: updates,
      skills: updates
    });
    await api.data.batchUpdate('tech_stacks', updates);
  },

  // Legacy Skills methods for backwards compatibility
  addSkill: async (skill) => {
    await get().addTechStack(skill);
  },

  updateSkill: async (skill) => {
    await get().updateTechStack(skill);
  },

  deleteSkill: async (id) => {
    await get().deleteTechStack(id);
  },

  reorderSkills: async (items) => {
    await get().reorderTechStacks(items);
  },

  // Classifications Actions
  addClassification: async (name) => {
    const created = await api.data.addClassification(name);
    set((state) => {
      if (state.classifications.some(c => c.toLowerCase() === created.toLowerCase())) {
        return state;
      }
      return { classifications: [...state.classifications, created] };
    });
    return created;
  },

  deleteClassification: async (name) => {
    await api.data.deleteClassification(name);
    set((state) => ({
      classifications: state.classifications.filter(c => c.toLowerCase() !== name.toLowerCase())
    }));
  },

  loadClassifications: async () => {
    const list = await api.data.getClassifications();
    set({ classifications: list });
  },

  init: async () => {
    const { isLoaded } = useAppStore.getState();
    if (isLoaded) return;

    try {
      const [services, products, techStacks, classifications, storedServiceCategories, loadedQueries] = await Promise.all([
        api.data.getServices(),
        api.data.getProducts(),
        api.data.getTechStacks(),
        api.data.getClassifications(),
        api.data.getServiceCategories(),
        api.data.getQueries(),
      ]);

      // Deduplicate
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

      const seenStackIds = new Set();
      const uniqueStacks = techStacks.filter(sk => {
        if (!sk.id || seenStackIds.has(sk.id)) return false;
        seenStackIds.add(sk.id);
        return true;
      });

      // Also gather any classifications already present on tech stack items
      const itemClassifications = uniqueStacks.map(s => s.classification).filter(Boolean);
      const mergedClassifications = Array.from(new Set([
        ...DEFAULT_CLASSIFICATIONS,
        ...classifications,
        ...itemClassifications
      ]));

      // Gather any categories already present on services
      const itemServiceCategories = uniqueServices.map(s => s.category).filter(Boolean);
      const mergedServiceCategories = Array.from(new Set([
        ...DEFAULT_SERVICE_CATEGORIES,
        ...storedServiceCategories,
        ...itemServiceCategories
      ]));

      // Normalize products and gather project categories
      const normalizedProducts = uniqueProducts.map(p => normalizeProject(p));
      const itemProjectCategories = normalizedProducts.map(p => p.category).filter(Boolean);
      const mergedProjectCategories = Array.from(new Set([
        ...DEFAULT_PROJECT_CATEGORIES,
        ...itemProjectCategories
      ]));

      // Deduplicate and sort queries newest first
      const seenQueryIds = new Set();
      const uniqueQueries = (loadedQueries || []).filter(q => {
        if (!q.id || seenQueryIds.has(q.id)) return false;
        seenQueryIds.add(q.id);
        return true;
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      set({ 
        services: uniqueServices,
        serviceCategories: mergedServiceCategories,
        products: normalizedProducts, 
        projectCategories: mergedProjectCategories,
        techStacks: uniqueStacks,
        skills: uniqueStacks,
        classifications: mergedClassifications,
        queries: uniqueQueries,
        isLoaded: true 
      });
    } catch (error) {
      console.error('[AppStore] Initialization failed', error);
      set({ isLoaded: true });
    }
  },
}));
