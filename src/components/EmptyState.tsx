import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-2xl bg-secondary/10"
    >
      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-6 shadow-soft text-muted-foreground/40">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">{description}</p>
      {action}
    </motion.div>
  );
};
