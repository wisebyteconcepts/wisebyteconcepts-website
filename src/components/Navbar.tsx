import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Github, Code2, Sun, Moon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface NavLink {
  name: string;
  path: string;
}

interface NavbarProps {
  links?: NavLink[];
  githubUrl?: string;
}

export const Navbar = ({ 
  links = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Projects', path: '/products' },
    { name: 'Tech Stacks', path: '/tech-stacks' },
    { name: 'Contact', path: '/contact' },
  ],
  githubUrl = "https://github.com"
}: NavbarProps) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    return 'Dark';
  };

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform-gpu border-b',
        isScrolled 
          ? 'bg-surface-0/90 backdrop-blur-md h-16 border-border shadow-xs' 
          : 'bg-transparent h-24 border-border/20'
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left Section: Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group shrink-0 transform-gpu">
          <div 
            className="w-10 h-10 bg-accent-strong flex items-center justify-center rounded-lg shadow-xs transition-all duration-300"
          >
            <Code2 className="text-on-accent w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary whitespace-nowrap font-display">
            Wise Byte Concepts
          </span>
        </Link>

        {/* Center Section: Desktop Nav */}
        <nav 
          role="navigation"
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 bg-surface-1/80 backdrop-blur-xl p-1 rounded-full border border-border shadow-xs relative"
        >
          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path}
                className={cn(
                  'relative px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 rounded-full select-none flex items-center justify-center',
                  active 
                    ? 'text-text-primary font-semibold' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-[var(--hover-overlay)]/60'
                )}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {active && (
                    <motion.span 
                      layoutId="nav-active-dot"
                      className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)] shrink-0" 
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span>{link.name}</span>
                </span>
                {active && (
                  <motion.div 
                    layoutId="nav-active-pill"
                    className="absolute inset-0 z-0 rounded-full bg-surface-3 shadow-xs border border-border/80 overflow-hidden"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  >
                    {/* Top specular sheen */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                    {/* Subtle bottom accent glow line */}
                    <div className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Theme, GitHub & Contact */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-full hover:bg-[var(--hover-overlay)] text-text-secondary hover:text-text-primary transition-all flex items-center gap-2 group relative overflow-hidden"
            title={`Theme: ${getThemeLabel()}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {getThemeIcon()}
              </motion.div>
            </AnimatePresence>
          </button>

          <a 
            href="https://github.com/wisebyteconcepts" 
            target="_blank" 
            rel="noopener noreferrer"
            className="cursor-pointer"
          >
            <Button 
              variant="glass" 
              size="sm" 
              className="flex items-center gap-2 border-border shadow-xs cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </Button>
          </a>

          <div className="w-px h-4 bg-border mx-1" />

          <Link to="/contact">
            <Button 
              variant="primary" 
              size="md" 
              className="px-8 rounded-full shadow-sm hover:bg-accent-strong-hover transition-all duration-300"
            >
              Contact
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg hover:bg-[var(--hover-overlay)] text-text-primary"
          >
            {getThemeIcon()}
          </button>
          <button 
            className="p-2 text-text-primary hover:bg-[var(--hover-overlay)] rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface-5 border-t border-border shadow-popover overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              {links.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={cn(
                    'text-xl font-bold transition-colors',
                    isActive(link.path) ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-divider w-full" />
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted font-medium">Appearance</span>
                  <div className="flex bg-surface-1 p-1 rounded-lg border border-border">
                    {(['light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all',
                          theme === t 
                            ? 'bg-surface-2 text-text-primary shadow-xs' 
                            : 'text-text-muted hover:text-text-primary'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <a 
                  href={githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-lg font-medium text-text-secondary hover:text-text-primary"
                >
                  <Github className="w-6 h-6" />
                  GitHub
                </a>
                <Link to="/contact">
                  <Button variant="primary" className="w-full py-4 text-lg">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
