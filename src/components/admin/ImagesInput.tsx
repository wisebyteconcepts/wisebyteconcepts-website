import { useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/Button';

interface ImagesInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export const ImagesInput = ({ label, value = [], onChange }: ImagesInputProps) => {
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
        <div className="relative flex-1">
          <Input 
            value={current} 
            onChange={(e) => setCurrent(e.target.value)} 
            placeholder="Add Image URL..."
            className="bg-white/5 border-white/10 pl-10"
          />
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button type="button" size="icon" onClick={add} variant="secondary" className="shrink-0 rounded-xl">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {value.map((url, i) => (
          <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-2 bg-destructive text-white rounded-full transition-transform"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {value.length === 0 && (
          <div className="col-span-full py-8 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-xs text-muted-foreground italic font-mono uppercase tracking-widest opacity-50">
            Empty_Gallery
          </div>
        )}
      </div>
    </div>
  );
};
