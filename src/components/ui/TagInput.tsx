import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormLabel, FormDescription, FormMessage } from '@/components/forms/FormControls';

export interface TagInputProps {
  label?: string;
  description?: string;
  error?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  description,
  error,
  value = [],
  onChange,
  placeholder = "Type tag and press comma or enter...",
  required,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = (text: string) => {
    const raw = text.split(',');
    const newTags: string[] = [];

    raw.forEach((r) => {
      const clean = r.trim().toLowerCase().replace(/^#/, '');
      if (clean && !value.includes(clean) && !newTags.includes(clean)) {
        newTags.push(clean);
      }
    });

    if (newTags.length > 0) {
      onChange([...value, ...newTags]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && (
        <FormLabel required={required} className="text-xs font-semibold">
          {label}
        </FormLabel>
      )}
      {description && <FormDescription>{description}</FormDescription>}

      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border bg-surface-1 min-h-[44px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-3 text-foreground border border-border group"
          >
            <span className="text-primary font-mono text-[10px]">#</span>
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue);
          }}
          placeholder={value.length === 0 ? placeholder : "Add more tags..."}
          className="flex-1 min-w-[140px] h-7 px-2 text-xs bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>

      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
};
