import React, { ReactNode, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input as UiInput, InputProps as UiInputProps } from '@/components/ui/Input';
import { Textarea as UiTextarea, TextareaProps as UiTextareaProps } from '@/components/ui/Textarea';
import { Label as UiLabel, LabelProps as UiLabelProps } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { AlertCircle, Eye, EyeOff, Search } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                               Shadcn Form Primitives                       */
/* -------------------------------------------------------------------------- */

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1.5 group/form-item w-full", className)} {...props} />
  )
);
FormItem.displayName = "FormItem";

export interface FormLabelProps extends UiLabelProps {}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => (
    <UiLabel ref={ref} className={cn("text-xs font-semibold text-foreground/90", className)} {...props} />
  )
);
FormLabel.displayName = "FormLabel";

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative", className)} {...props} />
  )
);
FormControl.displayName = "FormControl";

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-[11px] text-muted-foreground/80 leading-relaxed mt-1 select-none", className)}
      {...props}
    />
  )
);
FormDescription.displayName = "FormDescription";

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null;
    return (
      <p
        ref={ref}
        className={cn(
          "text-[11px] font-medium text-destructive flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200",
          className
        )}
        {...props}
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{children}</span>
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";

/* -------------------------------------------------------------------------- */
/*                       Composite FormField Wrapper Block                    */
/* -------------------------------------------------------------------------- */

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  children: ReactNode;
  id?: string;
  required?: boolean;
  optional?: boolean;
  badge?: string;
  className?: string;
}

export const FormField = ({
  label,
  description,
  error,
  children,
  id,
  required,
  optional,
  badge,
  className = '',
}: FormFieldProps) => {
  return (
    <FormItem className={className}>
      {label && (
        <FormLabel htmlFor={id} required={required} optional={optional} badge={badge}>
          {label}
        </FormLabel>
      )}
      <FormControl>{children}</FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
};

/* -------------------------------------------------------------------------- */
/*                         Shadcn Precomposed Input Blocks                     */
/* -------------------------------------------------------------------------- */

export interface InputBlockProps extends UiInputProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  badge?: string;
  fieldClassName?: string;
}

export const InputBlock = forwardRef<HTMLInputElement, InputBlockProps>(
  (
    {
      label,
      description,
      error,
      required,
      optional,
      badge,
      fieldClassName,
      id,
      ...inputProps
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <FormField
        label={label}
        description={description}
        error={error}
        required={required}
        optional={optional}
        badge={badge}
        id={inputId}
        className={fieldClassName}
      >
        <UiInput ref={ref} id={inputId} error={Boolean(error)} {...inputProps} />
      </FormField>
    );
  }
);
InputBlock.displayName = "InputBlock";

export interface TextareaBlockProps extends UiTextareaProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  badge?: string;
  fieldClassName?: string;
}

export const TextareaBlock = forwardRef<HTMLTextAreaElement, TextareaBlockProps>(
  (
    {
      label,
      description,
      error,
      required,
      optional,
      badge,
      fieldClassName,
      id,
      ...textareaProps
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <FormField
        label={label}
        description={description}
        error={error}
        required={required}
        optional={optional}
        badge={badge}
        id={inputId}
        className={fieldClassName}
      >
        <UiTextarea ref={ref} id={inputId} error={Boolean(error)} {...textareaProps} />
      </FormField>
    );
  }
);
TextareaBlock.displayName = "TextareaBlock";

export interface SelectBlockProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  badge?: string;
  fieldClassName?: string;
  children: ReactNode;
}

export const SelectBlock = forwardRef<HTMLSelectElement, SelectBlockProps>(
  (
    {
      label,
      description,
      error,
      required,
      optional,
      badge,
      fieldClassName,
      id,
      className,
      children,
      ...selectProps
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <FormField
        label={label}
        description={description}
        error={error}
        required={required}
        optional={optional}
        badge={badge}
        id={inputId}
        className={fieldClassName}
      >
        <div className="relative group/select">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "flex h-10 w-full appearance-none rounded-xl border border-input bg-background/80 dark:bg-zinc-950/70 px-3.5 py-2 pr-10 text-sm text-foreground shadow-sm transition-all duration-200 hover:border-border dark:hover:border-white/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 font-sans cursor-pointer",
              error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              className
            )}
            {...selectProps}
          >
            {children}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/70 transition-transform group-focus-within/select:text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within/select:opacity-100 pointer-events-none transition-opacity duration-300" />
        </div>
      </FormField>
    );
  }
);
SelectBlock.displayName = "SelectBlock";

export interface PasswordInputBlockProps extends Omit<InputBlockProps, 'type'> {}

export const PasswordInputBlock = forwardRef<HTMLInputElement, PasswordInputBlockProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <InputBlock
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        endIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 hover:text-foreground text-muted-foreground transition-colors focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInputBlock.displayName = "PasswordInputBlock";

export interface SearchInputProps extends UiInputProps {
  onSearchChange?: (val: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, onChange, onSearchChange, ...props }, ref) => {
    const handleClear = () => {
      onClear?.();
      onSearchChange?.('');
    };

    return (
      <UiInput
        ref={ref}
        type="search"
        startIcon={<Search className="w-4 h-4 text-muted-foreground" />}
        clearable
        onClear={handleClear}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          onSearchChange?.(e.target.value);
        }}
        className={cn("h-9 text-xs bg-muted/40 border-input", className)}
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

export interface SwitchBlockProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
  badge?: string;
}

export const SwitchBlock = ({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
  disabled,
  className,
  badge,
}: SwitchBlockProps) => {
  return (
    <div
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border border-input/80 bg-background/60 hover:bg-muted/40 hover:border-border transition-all cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        checked && "border-primary/40 bg-primary/5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-border/50",
              checked ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground"
            )}
          >
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{label}</span>
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*             Backward Compatible Styled Inputs for FormControls             */
/* -------------------------------------------------------------------------- */

export const Input = forwardRef<HTMLInputElement, UiInputProps>((props, ref) => (
  <UiInput ref={ref} {...props} />
));
Input.displayName = "FormInput";

export const Textarea = forwardRef<HTMLTextAreaElement, UiTextareaProps>((props, ref) => (
  <UiTextarea ref={ref} {...props} />
));
Textarea.displayName = "FormTextarea";

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className = '', children, ...props }, ref) => (
    <div className="relative group/select w-full">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-xl border border-input bg-background/80 dark:bg-zinc-950/70 px-3.5 py-2 pr-10 text-sm text-foreground shadow-sm transition-all duration-200 hover:border-border dark:hover:border-white/25 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 font-sans cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/70 transition-transform group-focus-within/select:text-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within/select:opacity-100 pointer-events-none transition-opacity duration-300" />
    </div>
  )
);
Select.displayName = "FormSelect";
