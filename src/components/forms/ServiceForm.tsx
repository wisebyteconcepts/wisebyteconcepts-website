import React from 'react';
import { Service } from '@/types';
import { normalizeService } from '@/utils/serviceMigration';

export interface ServiceFormProps {
  initialData?: Partial<Service>;
  onSubmit: (data: Service) => void;
  isLoading?: boolean;
}

/**
 * ServiceForm wrapper component for backward-compatibility with component exports.
 * The primary comprehensive form is hosted at AdminServiceEditPage with all 7 tabs.
 */
export const ServiceForm: React.FC<ServiceFormProps> = ({ initialData, onSubmit, isLoading }) => {
  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-border text-center space-y-3">
      <p className="text-sm font-medium text-foreground">
        Please use the comprehensive 7-tab editor on the Services page.
      </p>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          if (initialData) onSubmit(normalizeService(initialData));
        }}
        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
      >
        Submit Normalized Service
      </button>
    </div>
  );
};

export default ServiceForm;
