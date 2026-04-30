import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Github, Code2, Sun, Moon, Monitor } from 'lucide-react';
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
    { name: 'Products', path: '/products' },
    { name: 'Skills', path: '/skills' },
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

  const isActive = (path: string) => location.pathname === path;

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="w-4 h-4" />;
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'light') return 'Light';
    return 'Dark';
  };

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-background/80 backdrop-blur-md py-2' 
          : 'bg-transparent py-4'
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Left Section: Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-[#3b82f6] flex items-center justify-center rounded-lg"
          >
            <Code2 className="text-white w-6 h-6" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap">
            Wise Byte Concepts
          </span>
        </Link>

        {/* Center Section: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-foreground/5 rounded-full px-2 py-1 border border-foreground/5 backdrop-blur-sm">
          {links.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-all rounded-full relative',
                isActive(link.path) 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              )}
            >
              {link.name}
              {isActive(link.path) && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute inset-0 bg-foreground/10 rounded-full -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Section: Theme, GitHub & Contact */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group relative overflow-hidden"
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
            href={githubUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <Github className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>GitHub</span>
          </a>

          <div className="w-px h-4 bg-border" />

          <Link to="/contact">
            <Button 
              variant="primary" 
              size="md" 
              className="px-8 rounded-full"
            >
              Contact
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg hover:bg-foreground/5 text-foreground"
          >
            {getThemeIcon()}
          </button>
          <button 
            className="p-2 text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
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
            className="md:hidden glass border-t border-foreground/10 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              {links.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={cn(
                    'text-xl font-bold transition-colors',
                    isActive(link.path) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-px bg-foreground/5 w-full" />
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Appearance</span>
                  <div className="flex bg-foreground/5 p-1 rounded-lg border border-foreground/10">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all',
                          theme === t 
                            ? 'bg-background text-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
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
                  className="flex items-center gap-3 text-lg font-medium text-muted-foreground"
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
