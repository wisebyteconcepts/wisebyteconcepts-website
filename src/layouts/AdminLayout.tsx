import { useMemo } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store';
import { LayoutDashboard, ShoppingBag, Briefcase, Layers, Inbox, LogOut, Terminal, ExternalLink, Image as ImageIcon } from 'lucide-react';
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

  const queries = useAppStore((state) => state.queries || []);
  const unreadQueriesCount = useMemo(() => queries.filter((q) => !q.isRead).length, [queries]);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Services', path: '/admin/services', icon: Briefcase },
    { name: 'Projects', path: '/admin/products', icon: ShoppingBag, aliases: ['/admin/projects'] },
    { name: 'Tech Stacks', path: '/admin/tech-stacks', icon: Layers, aliases: ['/admin/skills'] },
    { name: 'Queries', path: '/admin/queries', icon: Inbox, badge: unreadQueriesCount },
  ];

  const isMediaActive = location.pathname === '/admin/media' || location.pathname.startsWith('/admin/media');

  return (
    <div className="flex flex-col min-h-screen bg-surface-0 text-text-primary selection:bg-accent/30">
      <GlowOrb className="top-[-10%] right-[-5%]" color="rgba(59, 130, 246, 0.05)" />
      <GlowOrb className="bottom-0 left-[-5%]" color="rgba(59, 130, 246, 0.05)" delay={3} />

      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-1/90 py-4 border-b border-border backdrop-blur-md">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-accent-strong flex items-center justify-center rounded-lg font-bold text-on-accent shadow-xs">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-text-primary leading-none uppercase">Console</span>
                <span className="text-[10px] font-mono text-text-muted uppercase">
                  {user?.role} Mode
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary transition-colors">
                <ExternalLink className="w-4 h-4 mr-2" /> View Website
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-text-secondary hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <Link to="/">
              <Button variant="glass" size="sm">Exit Console</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 pt-24 pb-12 flex flex-col gap-6">
        {/* Top Navigation Tabs Bar */}
        <aside className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-surface-1 border border-border">
          <nav
            role="tablist"
            aria-label="Admin Navigation Tabs"
            className="inline-flex h-11 max-h-11 items-center gap-1.5 p-1 rounded-xl bg-surface-0 text-text-muted border border-border overflow-x-auto overflow-y-hidden scrollbar-none w-full sm:w-auto shrink-0"
          >
            {navItems.map((item) => {
              const active = 
                location.pathname === item.path || 
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path)) ||
                Boolean(item.aliases && item.aliases.some((a) => location.pathname === a || location.pathname.startsWith(a)));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  role="tab"
                  aria-selected={active}
                  data-state={active ? 'active' : 'inactive'}
                  className={cn(
                    "inline-flex h-9 items-center gap-2.5 whitespace-nowrap rounded-lg px-3.5 text-xs sm:text-sm font-medium border transition-all duration-150 focus-visible:outline-none focus-visible:border-accent focus-ring-accent shrink-0 select-none",
                    active
                      ? "bg-surface-2 text-text-primary shadow-xs border-border"
                      : "text-text-secondary hover:bg-[var(--hover-overlay)] hover:text-text-primary border-transparent"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-accent" : "text-text-muted")} />
                  <span>{item.name}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-accent text-on-accent shrink-0 shadow-xs">
                      {item.badge}
                    </span>
                  )}
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
                "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs sm:text-sm font-medium border transition-all duration-150 shrink-0 select-none",
                isMediaActive
                  ? "bg-accent-strong text-on-accent border-accent-strong shadow-xs"
                  : "bg-surface-4 hover:bg-[var(--hover-overlay)] text-text-primary border-border"
              )}
            >
              <ImageIcon className={cn("w-4 h-4 shrink-0", isMediaActive ? "text-on-accent" : "text-accent")} />
              <span>Media Gallery</span>
            </Link>

            {/* Session Status Pill */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 text-xs font-mono rounded-xl bg-surface-2 border border-border">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted uppercase">Identity:</span>
                <span className="text-text-primary font-medium truncate max-w-[170px]">{user?.email}</span>
              </div>
              <div className="h-3.5 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-success font-semibold text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span>Secure Access</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area - Now takes full width */}
        <div className="w-full flex flex-col min-h-[600px]">
          <div className="bg-surface-1 rounded-2xl p-6 sm:p-8 border border-border flex-1 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Terminal className="w-32 h-32 text-text-primary" />
             </div>
             <AnimatePresence mode="wait">
               <motion.div
                 key={location.pathname}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.12, ease: "easeOut" }}
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
