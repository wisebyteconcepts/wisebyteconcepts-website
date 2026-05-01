import { Image as ImageIcon, X, Upload } from 'lucide-react';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';

interface ImageInputProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

export const ImageInput = ({ label, value, onChange }: ImageInputProps) => {
  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-white/10 aspect-video bg-white/5">
          <img src={value} alt="Preview" className="w-full h-full object-cover transition-transform duration-500" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-3 bg-destructive text-white rounded-full transition-transform"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Input 
            placeholder="Image URL (https://...)" 
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/5 border-white/10 pl-10"
          />
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="mt-4 p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
            <Upload className="h-8 w-8 opacity-20" />
            <p className="text-xs font-mono uppercase tracking-widest">Awaiting Direct Link</p>
          </div>
        </div>
      )}
    </div>
  );
};
