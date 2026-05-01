import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/ui/Card';

interface CrudPageShellProps {
  title: string;
  description: string;
  onAdd: () => void;
  addLabel: string;
  count: number;
  children: React.ReactNode;
}

export const CrudPageShell = ({
  title,
  description,
  onAdd,
  addLabel,
  count,
  children
}: CrudPageShellProps) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-bold tracking-tighter">{title}</h1>
            <div className="px-3 py-1 bg-primary/10 rounded-full">
              <span className="text-[10px] font-mono font-bold text-primary">{count} Entries</span>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>
        <Button onClick={onAdd} className="rounded-full px-8 shadow-glow-primary">
          <Plus className="w-4 h-4 mr-2" /> {addLabel}
        </Button>
      </div>

      <Card className="overflow-hidden border-white/5">
        {children}
      </Card>
    </div>
  );
};
