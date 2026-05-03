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
    className={`w-full px-4 py-3 bg-background/95 border border-border rounded-xl text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 font-sans ${className}`}
    {...props}
  />
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-4 py-3 bg-background/95 border border-border rounded-xl text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] font-sans ${className}`}
    {...props}
  />
);

export const Select = ({ className = '', children, ...props }: { className?: string; children: ReactNode; [key: string]: any }) => (
  <div className="relative">
    <select
      className={`w-full px-4 py-3 bg-background/95 border border-border rounded-xl text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-sans ${className}`}
      {...props}
    >
      {children}
    </select>
    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-50">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);
