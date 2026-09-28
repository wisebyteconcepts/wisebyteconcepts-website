import { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/Button';
import { FormLabel } from '@/components/forms/FormControls';

interface ListInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  description?: string;
}

export const ListInput = ({
  label,
  value = [],
  onChange,
  placeholder = "Add item and press Enter...",
  description,
}: ListInputProps) => {
  const [current, setCurrent] = useState('');

  const add = () => {
    const trimmed = current.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setCurrent('');
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2.5 w-full">
      <div className="flex items-center justify-between">
        <FormLabel className="text-xs font-semibold">{label}</FormLabel>
        {value.length > 0 && (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
            {value.length} {value.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}

      <div className="flex gap-2 items-center">
        <Input
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          startIcon={<Tag className="w-3.5 h-3.5" />}
          className="h-9 text-xs"
        />
        <Button
          type="button"
          size="sm"
          onClick={add}
          disabled={!current.trim()}
          variant="secondary"
          className="shrink-0 h-9 rounded-xl text-xs gap-1 px-3 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-xl bg-muted/20 border border-border/40">
        {value.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 bg-background dark:bg-zinc-900 border border-border/60 hover:border-primary/50 px-2.5 py-1 rounded-lg text-xs font-medium text-foreground transition-all shadow-xs group"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 p-0.5 rounded transition-colors"
              title="Remove item"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground/60 italic py-0.5 px-1 select-none">
            No items added yet. Type above and press Enter.
          </span>
        )}
      </div>
    </div>
  );
};
