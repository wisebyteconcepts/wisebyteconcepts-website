import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  id?: string;
  required?: boolean;
}

export const FormField = ({ label, error, children, id, required }: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <label 
        htmlFor={id} 
        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"
      >
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] font-mono text-destructive animate-fade-up">
          {error}
        </p>
      )}
    </div>
  );
};

export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2 bg-background border border-border rounded-lg text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50 ${className}`}
    {...props}
  />
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-4 py-2 bg-background border border-border rounded-lg text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[100px] ${className}`}
    {...props}
  />
);

export const Select = ({ className = '', children, ...props }: { className?: string; children: ReactNode; [key: string]: any }) => (
  <select
    className={`w-full px-4 py-2 bg-background border border-border rounded-lg text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none ${className}`}
    {...props}
  >
    {children}
  </select>
);
