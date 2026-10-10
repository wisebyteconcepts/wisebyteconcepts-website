import { Link, Outlet, useLocation } from 'react-router-dom';
import { GlowOrb, Navbar } from '@/components';
import { Code2, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PublicLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-surface-0 text-text-primary selection:bg-accent/30">
      {/* Background Effects */}
      <GlowOrb className="top-[-10%] left-[-5%]" color="rgba(59, 130, 246, 0.08)" />
      <GlowOrb className="bottom-[-10%] right-[-5%]" color="rgba(59, 130, 246, 0.06)" delay={2} />

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
      <footer className="py-14 md:py-20 border-t border-border bg-surface-0 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-10 md:grid md:grid-cols-2 lg:flex lg:flex-row lg:items-start lg:justify-between md:gap-12">
            {/* Col 1: Brand & Info */}
            <div className="flex flex-col gap-3 max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-surface-2 border border-border flex items-center justify-center rounded-xl font-bold text-accent shadow-xs shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-text-primary font-display tracking-tight">
                  Wise Byte Concepts
                </span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">
                Practical, scalable, and visually strong digital solutions. We combine development expertise with design precision.
              </p>
            </div>
            
            {/* Col 2 / Desktop Right: Navigation Links & Social */}
            <div className="flex flex-col gap-8 sm:gap-6 md:flex-row md:items-center lg:gap-8">
              {/* Navigation Links with clear section heading on mobile */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent md:hidden">
                  Navigation
                </span>
                <nav aria-label="Footer Navigation" className="grid grid-cols-1 gap-1 md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3">
                  <Link to="/" className="min-h-[44px] flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2 px-1">
                    Home
                  </Link>
                  <Link to="/services" className="min-h-[44px] flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2 px-1">
                    Services
                  </Link>
                  <Link to="/products" className="min-h-[44px] flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2 px-1">
                    Projects
                  </Link>
                  <Link to="/tech-stacks" className="min-h-[44px] flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2 px-1">
                    Tech Stacks
                  </Link>
                  <Link to="/contact" className="min-h-[44px] flex items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors py-2 px-1">
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="hidden md:block h-5 w-px bg-border shrink-0" />

              {/* Social / Connect */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-accent md:hidden">
                  Connect
                </span>
                <div className="flex items-center">
                  <a 
                    href="https://github.com/wisebyteconcepts" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl bg-surface-2 border border-border/80 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/40 transition-colors shadow-xs"
                    aria-label="GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Copyright Bar */}
      <div className="py-6 border-t border-border/50 bg-surface-0">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="text-[11px] uppercase tracking-[0.2em] text-text-muted font-bold font-display">
            &copy; {new Date().getFullYear()} Wise Byte Concepts. Precision Digital Engineering.
          </span>
          <span className="text-[11px] text-text-muted/80">
            All rights reserved.
          </span>
        </div>
      </div>
    </div>
  );
};
