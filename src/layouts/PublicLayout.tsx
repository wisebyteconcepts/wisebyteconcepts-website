import { Link, Outlet, useLocation } from 'react-router-dom';
import { GlowOrb, Navbar } from '@/components';
import { Code2, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PublicLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Background Effects */}
      <GlowOrb className="top-[-10%] left-[-5%]" color="rgba(59, 130, 246, 0.1)" />
      <GlowOrb className="bottom-[-10%] right-[-5%]" color="rgba(59, 130, 246, 0.08)" delay={2} />

      <Navbar />

      <main className="flex-1">
        <AnimatePresence>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="transform-gpu"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-border relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-lg font-bold text-primary text-xs">
                  <Code2 className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-foreground font-display">Wise Byte Concepts</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                Practical, scalable, and visually strong digital solutions. We combine development expertise with design precision.
              </p>
            </div>
            
            <div className="flex items-center gap-8">
                <div className="flex gap-6">
                    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                    <Link to="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Services</Link>
                    <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Products</Link>
                    <Link to="/skills" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Skills</Link>
                    <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                </div>
                <div className="h-4 w-[1px] bg-border hidden md:block" />
                <a 
                  href="https://github.com/wisebyteconcepts" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Copyright Bar */}
      <div className="py-6 border-t border-border/50 text-center">
        <div className="container mx-auto px-6">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold font-display">
            &copy; {new Date().getFullYear()} Wise Byte Concepts. Precision Digital Engineering.
          </span>
        </div>
      </div>
    </div>
  );
};
