import React from 'react';
import { Project, Product, Service } from '@/types';
import { normalizeProject } from '@/utils/projectMigration';

export interface ProductFormProps {
  initialData?: Partial<Project | Product>;
  services?: Service[];
  onSubmit: (data: Project) => void;
  isLoading?: boolean;
}

/**
 * ProductForm wrapper component for backward-compatibility with component exports.
 * The primary comprehensive 5-tab editor is hosted at AdminProductEditPage.
 */
export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, isLoading }) => {
  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-border text-center space-y-3">
      <p className="text-sm font-medium text-foreground">
        Please use the comprehensive 5-tab Project editor at /admin/products.
      </p>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          if (initialData) onSubmit(normalizeProject(initialData));
        }}
        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg cursor-pointer"
      >
        Submit Normalized Project
      </button>
    </div>
  );
};

export const ProjectForm = ProductForm;
export default ProductForm;
