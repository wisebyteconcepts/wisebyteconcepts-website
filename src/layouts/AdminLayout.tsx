import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, ShoppingBag, Briefcase, Code, LogOut, Terminal, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { GlowOrb, Button } from '@/components';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Services', path: '/admin/services', icon: Briefcase },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Skills', path: '/admin/skills', icon: Code },
  ];

  const isMediaActive = location.pathname === '/admin/media' || location.pathname.startsWith('/admin/media');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      <GlowOrb className="top-[-10%] right-[-5%]" color="rgba(59, 130, 246, 0.05)" />
      <GlowOrb className="bottom-0 left-[-5%]" color="rgba(59, 130, 246, 0.05)" delay={3} />

      <header className="fixed top-0 left-0 right-0 z-50 glass py-4 border-b border-border/50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-brand flex items-center justify-center rounded-lg font-bold text-white shadow-glow">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground leading-none uppercase">Console</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">
                  {user?.role} Mode
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-4 h-4 mr-2" /> View Website
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
            <div className="h-6 w-px bg-border/50 mx-2" />
            <Link to="/">
              <Button variant="glass" size="sm">Exit Console</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 pt-24 pb-12 flex flex-col gap-6">
        {/* Top Navigation Tabs Bar */}
        <aside className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl glass border border-border/50 backdrop-blur-md">
          <nav
            role="tablist"
            aria-label="Admin Navigation Tabs"
            className="inline-flex h-11 max-h-11 items-center gap-1.5 p-1 rounded-xl bg-muted/80 text-muted-foreground border border-border/40 shadow-inner overflow-x-auto overflow-y-hidden scrollbar-none w-full sm:w-auto shrink-0"
          >
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  role="tab"
                  aria-selected={active}
                  data-state={active ? 'active' : 'inactive'}
                  className={cn(
                    "inline-flex h-9 items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 text-xs sm:text-sm font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0 select-none",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Media Gallery & Session Status */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <Link
              to="/admin/media"
              role="tab"
              aria-selected={isMediaActive}
              data-state={isMediaActive ? 'active' : 'inactive'}
              className={cn(
                "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs sm:text-sm font-medium border transition-colors duration-150 shrink-0 select-none",
                isMediaActive
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-muted/70 hover:bg-muted text-foreground border-border/50 hover:border-primary/40 shadow-xs"
              )}
            >
              <ImageIcon className={cn("w-4 h-4 shrink-0", isMediaActive ? "text-primary-foreground" : "text-primary")} />
              <span>Media Gallery</span>
            </Link>

            {/* Session Status Pill */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 text-xs font-mono rounded-xl bg-background/40 border border-border/40">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase">Identity:</span>
                <span className="text-foreground/80 font-medium truncate max-w-[170px]">{user?.email}</span>
              </div>
              <div className="h-3.5 w-px bg-border/50" />
              <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Secure Access</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area - Now takes full width */}
        <div className="w-full flex flex-col min-h-[600px]">
          <div className="glass rounded-2xl p-6 sm:p-8 border-border/50 flex-1 relative overflow-hidden backdrop-blur-md">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Terminal className="w-32 h-32 text-foreground" />
             </div>
             <AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.15, ease: "easeOut" }}
                 className="h-full"
               >
                 <Outlet />
               </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <span>&copy; Console Engine v1.0</span>
            <span>Channel: Encrypted</span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground italic">
            Access strictly monitored for quality and security.
          </div>
        </div>
      </footer>
    </div>
  );
};
