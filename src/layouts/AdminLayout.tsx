import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, ShoppingBag, Briefcase, Code, LogOut, Terminal, ExternalLink } from 'lucide-react';
import { GlowOrb, Button } from '@/components';
import { motion, AnimatePresence } from 'motion/react';

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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      <GlowOrb className="top-[-10%] right-[-5%]" color="rgba(131, 48, 255, 0.05)" />
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

      <main className="flex-1 container mx-auto px-6 grid grid-cols-12 gap-8 pt-28 pb-12">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 border-border/50">
            <h2 className="text-[10px] font-bold text-primary mb-4 uppercase tracking-[0.2em] flex items-center gap-2 font-mono">
              <Terminal className="w-3 h-3" /> System Control
            </h2>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-primary text-primary-foreground shadow-glow' 
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="glass rounded-2xl p-6 border-border/50 mt-auto">
            <div className="space-y-3">
               <div>
                 <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Session Identity</p>
                 <p className="text-xs font-mono text-foreground/80">{user?.email}</p>
               </div>
               <div className="pt-4 border-t border-border/50">
                 <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Authenticated</p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-green-500 font-bold">Secure Access</span>
                 </div>
               </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="col-span-12 lg:col-span-9 flex flex-col min-h-[600px]">
          <div className="glass rounded-2xl p-8 border-border/50 flex-1 relative overflow-hidden backdrop-blur-md">
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
