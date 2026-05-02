import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100vh] flex flex-col items-center justify-start pt-[140px] p-8 text-center bg-background relative overflow-hidden">
      {/* Subtle background element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-10"
      >
        {/* Minimal Icon Display */}
        <div className="relative flex justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 border border-primary/20 bg-primary/5 rounded-2xl flex items-center justify-center backdrop-blur-md relative group"
          >
            <LucideIcons.SearchX className="w-10 h-10 text-primary/60 group-hover:text-primary transition-colors duration-500" />
            
          </motion.div>
        </div>

        {/* Messaging */}
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 bg-primary/5 border border-primary/20 rounded-full mb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary font-display">Path Unavailable</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground font-display">Route Terminated</h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed">
            The requested technical resource is unavailable or has been decommissioned from our active registry.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button 
            size="lg" 
            className="rounded-full px-10 hover:shadow-glow transition-all duration-300 w-full sm:w-auto"
            onClick={() => navigate('/')}
          >
            Return to Base
          </Button>
          <Button 
            variant="glass" 
            size="lg" 
            className="rounded-full px-10 border border-border/50 w-full sm:w-auto"
            onClick={() => navigate('/contact')}
          >
            Support Inquiry
          </Button>
        </div>

        {/* Metadata section */}
        <div className="pt-16 flex items-center justify-center gap-8 opacity-30 grayscale pointer-events-none">
          <div className="flex items-center gap-2">
            <LucideIcons.ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest font-sans">Secure Protocol</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <LucideIcons.Activity className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest font-sans">v1.2.0-STABLE</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
