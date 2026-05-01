import { useToastStore } from '@/store/toastStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-4 h-4 text-brand-green" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
  info: <Info className="w-4 h-4 text-primary" />,
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-3 px-4 py-3 bg-card border border-border shadow-elegant rounded-xl min-w-[280px]`}
          >
            {icons[toast.type]}
            <p className="text-sm font-medium text-foreground flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-secondary rounded-md transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
