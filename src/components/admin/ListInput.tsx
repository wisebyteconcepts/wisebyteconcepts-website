import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/Button';
import { Label } from '@/components/ui/Label';

interface ListInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const ListInput = ({ label, value = [], onChange, placeholder }: ListInputProps) => {
  const [current, setCurrent] = useState('');

  const add = () => {
    if (current.trim()) {
      onChange([...value, current.trim()]);
      setCurrent('');
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input 
          value={current} 
          onChange={(e) => setCurrent(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <Button type="button" size="icon" onClick={add} variant="secondary" className="shrink-0 rounded-xl">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-xl group transition-all hover:border-primary/50">
            <span className="text-sm font-medium">{item}</span>
            <button 
              type="button" 
              onClick={() => remove(i)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length === 0 && <span className="text-xs text-muted-foreground italic">No items added yet.</span>}
      </div>
    </div>
  );
};
