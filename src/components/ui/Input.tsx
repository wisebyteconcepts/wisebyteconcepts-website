import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  addonLeft?: React.ReactNode;
  addonRight?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  error?: boolean | string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      startIcon,
      endIcon,
      addonLeft,
      addonRight,
      clearable,
      onClear,
      error,
      containerClassName,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const showClear = Boolean(clearable && hasValue && !disabled && onClear);

    // If no icons, addons, or wrappers needed, check if we need an outer container
    const needsContainer = Boolean(
      startIcon || endIcon || addonLeft || addonRight || showClear || containerClassName
    );

    const inputElement = (
      <input
        type={type}
        disabled={disabled}
        value={value}
        className={cn(
          "flex h-9 w-full rounded-xl border border-border bg-surface-3 px-3.5 py-1.5 text-xs sm:text-sm text-text-primary shadow-xs transition-all duration-200 placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent focus-ring-accent disabled:cursor-not-allowed disabled:opacity-50 font-sans",
          startIcon && "pl-10",
          (endIcon || showClear) && "pr-10",
          addonLeft && "rounded-l-none border-l-0",
          addonRight && "rounded-r-none border-r-0",
          error && "border-destructive focus-visible:border-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (!needsContainer) {
      return (
        <div className="relative group/input w-full">
          {inputElement}
          <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity duration-300" />
        </div>
      );
    }

    return (
      <div className={cn("relative flex items-center group/input w-full", containerClassName)}>
        {addonLeft && (
          <div className="flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-border-strong bg-surface-1 text-xs font-mono text-text-muted select-none">
            {addonLeft}
          </div>
        )}

        <div className="relative flex-1 w-full">
          {startIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted pointer-events-none transition-colors group-focus-within/input:text-accent z-10 [&>svg]:w-4 [&>svg]:h-4">
              {startIcon}
            </div>
          )}

          {inputElement}

          {showClear && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear?.();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary rounded-md transition-colors z-10 hover-overlay"
              tabIndex={-1}
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {endIcon && !showClear && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted pointer-events-none transition-colors group-focus-within/input:text-accent z-10 [&>svg]:w-4 [&>svg]:h-4">
              {endIcon}
            </div>
          )}
        </div>

        {addonRight && (
          <div className="flex items-center px-3 h-10 rounded-r-xl border border-l-0 border-border-strong bg-surface-1 text-xs font-mono text-text-muted select-none">
            {addonRight}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
