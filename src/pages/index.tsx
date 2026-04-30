import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { 
  Modal, 
  ServiceForm, 
  ProductForm, 
  SkillForm, 
  Input, 
  EmptyState,
  Button,
  Section,
  GlassCard,
  GlowOrb
} from '@/components';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  Lock, 
  Briefcase, 
  ShoppingBag, 
  Code, 
  Search,
  X,
  Terminal,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Globe,
  Layers,
  Cpu,
  CheckCircle2,
  Clock,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Zap,
  Sparkles,
  Monitor
} from 'lucide-react';
import { Service, Product, Skill } from '@/types';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';

// Animation variants for pages
// ... (omitting unused pageVariants)

export const HomePage = () => {
  const { services, products } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[65vh] md:min-h-[70vh] lg:min-h-[85vh] flex items-center justify-center overflow-hidden pt-12 md:pt-16 lg:pt-20">
        {/* Animated Background decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-6 inline-block py-2 px-4 bg-white/5 backdrop-blur-md rounded-full border border-white/10"
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Precision Digital Engineering</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter max-w-4xl mx-auto"
          >
            Build. <span className="text-primary">Design.</span> Scale.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Modern digital solutions for businesses — from websites and apps to branding and publishing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="rounded-full px-10" onClick={() => navigate('/contact')}>
              Start Your Project
            </Button>
            <Button variant="glass" size="lg" className="rounded-full px-10" onClick={() => navigate('/products')}>
              View Our Work
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Services Preview */}
      <Section 
        title="Core Services" 
        description="Our specialized technical services are engineered to scale your operations and deliver measurable results."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s) => (
            <GlassCard key={s.id} className="flex flex-col h-full group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{s.name}</h3>
              <p className="text-muted-foreground mb-8 flex-grow leading-relaxed">{s.shortDescription}</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {s.features?.slice(0, 3).map(f => (
                  <span key={f} className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded-md text-muted-foreground">{f}</span>
                ))}
              </div>
              <Link to={`/services/${s.id}`} className="inline-flex items-center text-sm font-bold text-primary group/link">
                Review Full Scope <span className="ml-2 group-hover/link:translate-x-1 transition-transform">→</span>
              </Link>
            </GlassCard>
          ))}
          {services.length === 0 && (
            <div className="col-span-full">
               <EmptyState icon={Briefcase} title="Registry Offline" description="Service nodes are currently being synchronized." />
            </div>
          )}
        </div>
      </Section>

      {/* Why Choose Us Section */}
      <Section 
        title="Why Choose Us" 
        description="Engineered for reliability, performance, and long-term growth."
        className="bg-white/[0.02]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'Modern Tech Stack', desc: 'Built using up-to-date frameworks and tools to ensure longevity and efficiency.', icon: Cpu },
            { title: 'Scalable Solutions', desc: 'Designed to grow with your business, handling increased loads effortlessly.', icon: Layers },
            { title: 'Clean Architecture', desc: 'Maintainable and performance-focused systems built with precision.', icon: Code },
            { title: 'End-to-End Service', desc: 'Comprehensive support from conceptual design to production deployment.', icon: Zap },
            { title: 'Attention to Detail', desc: 'Surgical precision in design, code quality, and final delivery.', icon: CheckCircle2 },
            { title: 'Reliable Support', desc: 'Dedicated ongoing maintenance and technical assistance.', icon: Clock }
          ].map((item) => (
            <div key={item.title} className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Features Section */}
      <Section 
        title="Key Features" 
        description="The technical standards we uphold in every project we undertake."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'Responsive Design', desc: 'Flawless experiences across all devices and screen sizes.', icon: Monitor },
            { title: 'Fast Performance', desc: 'Optimized load times and smooth interactions.', icon: Zap },
            { title: 'SEO-Friendly Structure', desc: 'Built for visibility and search engine optimization.', icon: Search },
            { title: 'Secure Systems', desc: 'Hardened security protocols to protect your data.', icon: Shield },
            { title: 'Cross-Platform Compatibility', desc: 'Consistent performance across all modern browsers.', icon: Globe },
            { title: 'User-Centric Design', desc: 'Interfaces designed around the needs of your users.', icon: Sparkles }
          ].map((feature) => (
            <div key={feature.title} className="flex gap-4 p-4 border-l border-white/10 hover:border-primary transition-colors pl-6">
              <feature.icon className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-bold mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* About Us Section */}
      <section className="py-24 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="section-caption mb-8">About Us // The Mission</h2>
            <p className="text-2xl md:text-4xl font-bold leading-tight tracking-tight mb-12">
              Wise Byte Concepts delivers practical, scalable, and visually strong digital solutions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We combine development expertise with design precision to help businesses establish and grow their digital presence efficiently. Our approach focuses on technical excellence and meaningful user experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <Section 
        title="Project Showcase" 
        description="Demonstrating our ability to deliver robust digital solutions across various domains."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.slice(0, 3).map((p) => {
            const service = services.find(s => s.id === p.serviceId);
            return (
              <GlassCard key={p.id} className="p-0 overflow-hidden group border-white/5 hover:border-primary/30">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {p.imageUrl ? (
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-white/5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div className="flex gap-4">
                      {p.demoUrl && <a href={p.demoUrl} target="_blank" className="text-xs font-bold text-white hover:text-primary transition-colors flex items-center gap-1"><Search className="w-3 h-3" /> Live Instance</a>}
                      {p.repoUrl && <a href={p.repoUrl} target="_blank" className="text-xs font-bold text-white hover:text-primary transition-colors flex items-center gap-1"><Code className="w-3 h-3" /> Technical Specs</a>}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{service?.name || 'Technical Project'}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{p.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{p.description}</p>
                </div>
              </GlassCard>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full">
               <EmptyState icon={ShoppingBag} title="Showcase Offline" description="Output entries are currently being prepared." />
            </div>
          )}
        </div>
        <div className="mt-16 text-center">
          <Button variant="glass" onClick={() => navigate('/products')}>Explore Full Registry</Button>
        </div>
      </Section>

      {/* Skills / Tech Stack Section */}
      <Section 
        title="Technical Stack" 
        description="The modern, high-performance technologies we leverage to build resilient digital systems."
      >
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {['React', 'TypeScript', 'Blazor', 'ASP.NET Core', 'Node.js', 'PostgreSQL', 'Docker', 'Azure'].map((skill) => (
            <motion.div
              key={skill}
              className="px-6 py-3 rounded-full glass border-white/5 text-sm font-bold tracking-tight hover:border-primary/50 transition-colors"
            >
              {skill}
            </motion.div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/skills" className="text-xs font-bold text-muted-foreground hover:text-white uppercase tracking-widest transition-colors">
            View Expanded Skill Matrix →
          </Link>
        </div>
      </Section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden" id="contact">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3" />
        <div className="container mx-auto px-6 relative z-10">
          <GlassCard className="max-w-4xl mx-auto p-12 text-center" hoverGlow={false}>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Commence Your Technical Project</h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              Our engineering team is ready to discuss your requirements and design a custom solution that aligns with your technical and business objectives.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/contact')}>Send Project Inquiry</Button>
              <a href="mailto:contact@wisebyteconcepts.com" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors underline underline-offset-8">
                contact@wisebyteconcepts.com
              </a>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

export const ServicesPage = () => {
  const services = useAppStore((state) => state.services);
  return (
    <Section 
      title="Our Services" 
      description="technical.capabilities.registry — Explore our full range of engineering and design solutions."
    >
      {services.length === 0 ? (
        <EmptyState 
          icon={Briefcase}
          title="No Services Mapped"
          description="Our technical service registry is currently being synchronized. Check back shortly for our full capability map."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map(s => (
            <GlassCard key={s.id} className="group">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{s.name}</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">{s.shortDescription}</p>
              
              {s.features && s.features.length > 0 && (
                <div className="space-y-2 mb-8">
                  {s.features.slice(0, 3).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{s.category}</span>
                <Link to={`/services/${s.id}`}>
                  <Button variant="ghost" size="sm" className="group-hover:text-primary">
                    Details <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Section>
  );
};

export const ProductsPage = () => {
  const { products, services } = useAppStore();
  const [filter, setFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p: Product) => p.serviceId === filter);
  }, [products, filter]);

  return (
    <Section 
      title="Product Showcase" 
      description="engineering.output.showcase — Explore our portfolio of high-performance digital products and tools."
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-8 hide-scrollbar">
        <Button 
          variant={filter === 'all' ? 'primary' : 'glass'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Nodes
        </Button>
        {services.map(s => (
          <Button 
            key={s.id}
            variant={filter === s.id ? 'primary' : 'glass'}
            size="sm"
            onClick={() => setFilter(s.id)}
            className="whitespace-nowrap"
          >
            {s.name}
          </Button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState 
          icon={ShoppingBag}
          title="No Products Found"
          description={filter === 'all' ? "The engineering showcase is currently empty." : "No products currently associated with this service category."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(p => (
            <GlassCard key={p.id} className="p-0 overflow-hidden group">
               <div className="aspect-video relative overflow-hidden bg-muted">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-white/5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-4">
                     {p.demoUrl && <a href={p.demoUrl} target="_blank" className="text-xs font-bold text-white hover:text-primary transition-colors flex items-center gap-1"><Search className="w-3 h-3" /> Demo</a>}
                     {p.repoUrl && <a href={p.repoUrl} target="_blank" className="text-xs font-bold text-white hover:text-primary transition-colors flex items-center gap-1"><Code className="w-3 h-3" /> Repo</a>}
                   </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{p.name}</h3>
                  <Link to={`/products/${p.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-6 leading-relaxed">{p.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {services.find(s => s.id === p.serviceId) && (
                    <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest">
                      {services.find(s => s.id === p.serviceId)?.name}
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Section>
  );
};

export const SkillsPage = () => {
  const skills = useAppStore((state) => state.skills);
  
  const skillGroups = useMemo(() => {
    return skills.reduce((acc, skill) => {
      const cat = skill.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);
  }, [skills]);

  return (
    <Section 
      title="Technical Stack" 
      description="core.competencies.matrix — The foundation of our precision engineering and digital craftsmanship."
    >
      {skills.length === 0 ? (
        <EmptyState 
          icon={Code}
          title="Intelligence Matrix Empty"
          description="Skill synchronization in progress. Loading expert capabilities."
        />
      ) : (
        <div className="space-y-20">
          {Object.entries(skillGroups).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xs font-bold text-primary uppercase tracking-[0.3em] whitespace-nowrap">
                  {category}
                </h2>
                <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {(items as Skill[]).sort((a, b) => b.level - a.level).map(skill => (
                  <GlassCard key={skill.id} className="p-6 text-center group py-8">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                      <Code className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{skill.name}</h3>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1 px-1">
                         <span>Proficiency</span>
                         <span>{skill.level}%</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-brand shadow-glow"
                          />
                       </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { login, resetPassword } = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      addToast('Welcome back', 'success');
      navigate('/admin/dashboard');
    } catch (error: any) {
      addToast(error.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      addToast('Please enter your email first', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(email);
      addToast('Recovery signal sent. Check inbox (and spam).', 'success');
    } catch (error: any) {
      console.error('Reset error:', error);
      let message = 'Failed to send recovery signal';
      if (error.code === 'auth/user-not-found') {
        message = 'No associated user identity found';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email coordinate';
      }
      addToast(error.message || message, 'error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <GlowOrb className="top-[-10%] left-[-10%]" color="rgba(131, 48, 255, 0.15)" />
      
      <GlassCard className="w-full max-w-md p-10 text-center relative z-10" hoverGlow={false}>
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Portal Access</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">Identity Verification Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Email Address</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="admin@wisebyte.com"
              disabled={loading}
              className="glass border-white/10 focus:border-primary/50 py-4"
              autoFocus
            />
          </div>
          <div className="text-left space-y-2">
            <div className="flex justify-between items-center mr-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Safe-Key</label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {resetLoading ? 'Inverting...' : 'Recover Node'}
              </button>
            </div>
            <Input 
              type="password" 
              value={password} 
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="glass border-white/10 focus:border-primary/50 py-4"
            />
          </div>
          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-4 text-base font-bold"
          >
            {loading ? 'Authenticating...' : 'Access Command Module'}
          </Button>
        </form>
        
        <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          <span>SEC: FIREBASE v11+</span>
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Exit
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export const AdminDashboardPage = () => {
  const { services, products, skills } = useAppStore();
  const navigate = useNavigate();
  
  const stats = [
    { label: 'Core Services', count: services.length, icon: Briefcase, color: 'text-primary', path: '/admin/services' },
    { label: 'Active Products', count: products.length, icon: ShoppingBag, color: 'text-blue-400', path: '/admin/products' },
    { label: 'Expertise Nodes', count: skills.length, icon: Code, color: 'text-purple-400', path: '/admin/skills' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2">System Analytics</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">operational.status.normal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <GlassCard 
            key={stat.label} 
            className="p-8 cursor-pointer group"
            onClick={() => navigate(stat.path)}
          >
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <p className="text-5xl font-bold tracking-tighter">{stat.count}</p>
            <div className="mt-6 flex justify-end">
               <span className="text-[10px] uppercase font-bold text-primary group-hover:translate-x-1 transition-transform">Manage →</span>
            </div>
          </GlassCard>
        ))}
      </div>
      
      <GlassCard className="p-10 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-primary/10 to-transparent border-primary/20" hoverGlow={false}>
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Command Console Terminal</h3>
          <p className="text-muted-foreground leading-relaxed">
            All system nodes are operational. Manage core architectural services, deployed product registries, and expert capability matrices through the sidebar interface. All data updates are securely synchronized.
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export const AdminServicesPage = () => {
  const { services, addService, updateService, deleteService } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const addToast = useToastStore((state) => state.addToast);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [services, search]);

  const handleCreate = () => {
    setEditingService(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Decommission this service? This action is irreversible.')) {
      try {
        await deleteService(id);
        addToast('Service node purged', 'info');
      } catch (error: any) {
        let message = error.message;
        try {
          const parsed = JSON.parse(error.message);
          message = `Service delete failed: ${parsed.error}`;
        } catch {}
        addToast(message || 'Failed to purge service node', 'error');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingService) {
      await updateService({ ...editingService, ...data, updatedAt: new Date().toISOString() });
      addToast('Service architecture refactored', 'success');
    } else {
      const newService: Service = {
        ...data,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addService(newService);
      addToast('New service node initialized', 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Service Architecture</h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">registry.services.map</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search registry..." 
              value={search} 
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-10 glass border-white/5 focus:border-primary/50 w-64" 
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" /> Initialize Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <EmptyState 
            icon={Briefcase}
            title={search ? "No Matches Found" : "No Services Registered"}
            description={search ? `Refine your query or check for typo in registry search.` : "Start by registering your first core architectural service node."}
            action={!search && <Button onClick={handleCreate}>Add First Service</Button>}
          />
        ) : (
          filtered.map(s => (
            <GlassCard key={s.id} className="p-6 flex items-center justify-between group hover:border-primary/40" hoverGlow={false}>
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.isActive ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  <Briefcase className={`w-6 h-6 ${s.isActive ? 'text-primary' : 'text-destructive'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    {s.name} 
                    {!s.isActive && <span className="text-[10px] px-2 py-1 bg-destructive/10 text-destructive rounded-full font-mono uppercase tracking-widest border border-destructive/20">Inactive</span>}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs font-mono text-muted-foreground uppercase tracking-tight">
                    <span>{s.category}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{s.slug}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to={`/services/${s.id}`}>
                  <Button variant="ghost" size="icon" title="View Public Node">
                    <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                  <Edit2 className="w-4 h-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingService ? 'Refactor Service Definition' : 'Initialize Service Node'}
      >
        <ServiceForm initialData={editingService} onSubmit={handleSubmit} />
      </Modal>
    </div>
  );
};

export const AdminProductsPage = () => {
  const { products, services, addProduct, updateProduct, deleteProduct } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const addToast = useToastStore((state) => state.addToast);

  const handleCreate = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this product node from the registry?')) {
      try {
        await deleteProduct(id);
        addToast('Product entry purged', 'info');
      } catch (error: any) {
        let message = error.message;
        try {
          const parsed = JSON.parse(error.message);
          message = `Product delete failed: ${parsed.error}`;
        } catch {}
        addToast(message || 'Failed to purge product node', 'error');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingProduct) {
      await updateProduct({ ...editingProduct, ...data, updatedAt: new Date().toISOString() });
      addToast('Product metadata updated', 'success');
    } else {
      const newProduct: Product = {
        ...data,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addProduct(newProduct);
      addToast('Product node registered', 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Product Registry</h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">inventory.products.list</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" /> Register Product
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {products.length === 0 ? (
          <EmptyState 
            icon={ShoppingBag}
            title="Registry Offline"
            description="No product nodes have been registered in the system yet."
            action={<Button onClick={handleCreate}>Deploy First Product</Button>}
          />
        ) : (
          products.map(p => {
            const service = services.find(s => s.id === p.serviceId);
            return (
              <GlassCard key={p.id} className="p-6 flex items-center justify-between" hoverGlow={false}>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <ShoppingBag className="w-8 h-8 text-white/10" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                    <p className="text-sm font-mono text-primary flex items-center gap-2">
                       <Terminal className="w-3 h-3" /> {service?.name || 'Unmapped Environment'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1 max-w-sm">{p.description}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/products/${p.id}`}>
                    <Button variant="ghost" size="icon" title="View Product Node">
                      <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                    <Edit2 className="w-4 h-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? 'Configure Product metadata' : 'Register New Product Node'}
      >
        <ProductForm initialData={editingProduct} services={services} onSubmit={handleSubmit} />
      </Modal>
    </div>
  );
};

export const AdminSkillsPage = () => {
  const { skills, addSkill, updateSkill, deleteSkill } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>();
  const addToast = useToastStore((state) => state.addToast);

  const handleCreate = () => {
    setEditingSkill(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Decommission this capability from the matrix?')) {
      try {
        await deleteSkill(id);
        addToast('Skill profile purged', 'info');
      } catch (error: any) {
        let message = error.message;
        try {
          const parsed = JSON.parse(error.message);
          message = `Skill delete failed: ${parsed.error}`;
        } catch {}
        addToast(message || 'Failed to purge skill profile', 'error');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingSkill) {
      await updateSkill({ ...editingSkill, ...data, updatedAt: new Date().toISOString() });
      addToast('Skill profile recalibrated', 'success');
    } else {
      const newSkill: Skill = {
        ...data,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addSkill(newSkill);
      addToast('New skill node activated', 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Capabilities Matrix</h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">expert.competencies.registry</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" /> Inject Capability
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.length === 0 ? (
          <div className="col-span-full">
            <EmptyState 
              icon={Code}
              title="Intelligence Matrix Empty"
              description="No expertise data currently registered in the capability matrix registry."
              action={<Button onClick={handleCreate}>Add First Expertise</Button>}
            />
          </div>
        ) : (
          [...skills].sort((a, b) => b.level - a.level).map(skill => (
            <GlassCard key={skill.id} className="p-6 group hover:border-primary/30" hoverGlow={false}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                     <Code className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold">{skill.name}</h3>
                     <p className="text-[10px] font-mono text-primary uppercase tracking-[0.2em]">{skill.category}</p>
                   </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(skill)}>
                    <Edit2 className="w-3 h-3 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(skill.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase">
                    <span>Proficiency Level</span>
                    <span className="text-white font-bold">{skill.level}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-brand shadow-glow" 
                    />
                 </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSkill ? 'Recalibrate Capability' : 'Inject New Expertise Node'}
      >
        <SkillForm initialData={editingSkill} onSubmit={handleSubmit} />
      </Modal>
    </div>
  );
};

export const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const services = useAppStore((state) => state.services);
  const products = useAppStore((state) => state.products);
  
  const service = services.find(s => s.id === id);
  const relatedProducts = products.filter(p => p.serviceId === id);

  if (!service) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8">
          <Briefcase className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Service Node Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-8">The requested technical service module could not be located in our registry.</p>
        <Button onClick={() => navigate('/services')}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Registry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-10" />
        <div className="container mx-auto px-6">
          <Link 
            to="/services" 
            className="inline-flex items-center text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-12 uppercase tracking-widest"
          >
            <ArrowLeft className="mr-2 w-3 h-3" /> Registry.Back()
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono tracking-widest uppercase rounded-full">
                  {service.category}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                  Node ID: {service.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                {service.name}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {service.caption || service.shortDescription}
              </p>
            </div>
            
            {service.pricing && (
              <GlassCard className="lg:mb-4 min-w-[280px]">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">Pricing Matrix</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {service.pricing.amount ? `${service.pricing.currency || '$'}${service.pricing.amount}` : 'Custom'}
                  </span>
                  {service.pricing.unit && (
                    <span className="text-muted-foreground text-sm">/ {service.pricing.unit}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {service.pricing.type === 'starting_from' ? 'Starting from estimate' : 
                   service.pricing.type === 'fixed' ? 'Fixed project rate' : 'Bespoke quotation required'}
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Description & Features */}
          <div className="lg:col-span-7 space-y-16">
            <div>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Terminal className="w-6 h-6 text-primary" /> Engineering Specification
              </h2>
              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed text-lg space-y-6">
                {(service.fullDescription || service.shortDescription).split('\n').map((para, i) => (
                  para ? <p key={i}>{para}</p> : <br key={i} />
                ))}
              </div>
            </div>

            {service.features && service.features.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-primary" /> Core Capabilities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.features.map((feature, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-start gap-4 group hover:border-primary/30 transition-colors">
                      <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Meta & Stack */}
          <div className="lg:col-span-5 space-y-12">
            {service.technologies && service.technologies.length > 0 && (
              <GlassCard>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" /> Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {service.technologies.map((tech, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white/5 text-xs font-mono text-muted-foreground border border-white/5 rounded-md hover:border-primary/20 hover:text-primary transition-all">
                      {tech}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            {service.deliverables && service.deliverables.length > 0 && (
              <GlassCard>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Expected Deliverables
                </h3>
                <ul className="space-y-4">
                  {service.deliverables.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <ChevronRight className="w-3 h-3 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            {service.estimatedDuration && (
              <GlassCard>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Est. Deployment Time</p>
                    <p className="font-bold">{service.estimatedDuration}</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {service.cta && (
              <div className="pt-4">
                <Button className="w-full h-14 text-base group" onClick={() => {
                  if (service.cta?.action === 'external' && service.cta.link) {
                    window.open(service.cta.link, '_blank');
                  }
                }}>
                  {service.cta.label} 
                  {service.cta.action === 'external' ? <ExternalLink className="ml-2 w-5 h-5" /> : <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Output */}
      {relatedProducts.length > 0 && (
        <section className="bg-white/[0.02] py-24">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Derived Output</h2>
                <p className="text-muted-foreground">Recent products engineered using this service module.</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/products')}>
                View Entire Showcase <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map(p => (
                <GlassCard key={p.id} className="p-0 overflow-hidden group border-white/5 hover:border-white/10">
                   <div className="aspect-video relative overflow-hidden bg-muted">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-white/5" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">{p.description}</p>
                    <Link to={`/products/${p.id}`} className="inline-flex items-center text-xs font-mono text-primary hover:underline uppercase tracking-widest">
                      Detail_View() <ArrowRight className="ml-1 w-3 h-3" />
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, services } = useAppStore();
  
  const product = products.find(p => p.id === id);
  const service = services.find(s => s.id === product?.serviceId);

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Product Instance Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-8">The requested product node could not be retrieved from the engineering showcase.</p>
        <Button onClick={() => navigate('/products')}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Return to Showcase
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <section className="pt-32 pb-20 border-b border-white/5">
        <div className="container mx-auto px-6">
           <Link 
            to="/products" 
            className="inline-flex items-center text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-12 uppercase tracking-widest"
          >
            <ArrowLeft className="mr-2 w-3 h-3" /> Showcase.Back()
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-6">
               <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono tracking-widest uppercase rounded-full">
                    Product Node
                  </span>
                  {service && (
                    <Link to={`/services/${service.id}`} className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase">
                      Mapped to: {service.name}
                    </Link>
                  )}
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                  {product.name}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  {product.description}
                </p>
                
                <div className="flex flex-wrap gap-4 pt-6">
                  {product.demoUrl && (
                    <Button size="lg" className="px-8" onClick={() => window.open(product.demoUrl, '_blank')}>
                      Live Demo <Globe className="ml-2 w-5 h-5" />
                    </Button>
                  )}
                  {product.repoUrl && (
                    <Button variant="glass" size="lg" className="px-8" onClick={() => window.open(product.repoUrl, '_blank')}>
                      Repository <Github className="ml-2 w-5 h-5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-primary/20 blur-[80px] -z-10 rounded-full" />
                <div className="aspect-[16/10] bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
                      <p className="text-xs font-mono uppercase tracking-widest italic">Visual node data missing</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {product.tags && product.tags.length > 0 && (
         <div className="container mx-auto px-6 py-12">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] mb-6 border-l-2 border-primary pl-4">Metatags // Attributes</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs text-muted-foreground hover:border-primary/20 hover:text-primary transition-all cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
         </div>
      )}

      {service && (
        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-12 p-12 bg-white/[0.02] rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
              
              <div className="md:w-1/3 text-center md:text-left">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Powered By</h3>
                <p className="text-muted-foreground">This product is an outcome of our {service.name} capability module.</p>
              </div>

              <div className="md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Key features</h4>
                  <ul className="space-y-2">
                    {service.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 opacity-50" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-center md:justify-end">
                  <Button variant="glass" onClick={() => navigate(`/services/${service.id}`)}>
                    Service Portfolio <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export const ContactPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="pt-32 pb-20 border-b border-white/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter">
              Get in <span className="text-primary">Touch.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Have a project in mind or just want to chat about technical possibilities? We're always open to new engineering challenges.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 space-y-12">
              <div>
                <h3 className="text-xs font-mono text-primary uppercase tracking-[0.3em] mb-6">Contact_Details</h3>
                <div className="space-y-8">
                   <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Email</p>
                      <a href="mailto:contact@wisebyteconcepts.com" className="text-lg font-bold hover:text-primary transition-colors">
                        contact@wisebyteconcepts.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Phone</p>
                      <p className="text-lg font-bold">+91-XXXXXXXXXX</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                      <p className="text-lg font-bold">India</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Website</p>
                      <a href="https://www.wisebyteconcepts.com" target="_blank" className="text-lg font-bold hover:text-primary transition-colors">
                        www.wisebyteconcepts.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono text-primary uppercase tracking-[0.3em] mb-6">Business_Identity</h3>
                <p className="text-xl font-bold">Wise Byte Concepts</p>
                <p className="text-muted-foreground text-sm mt-2">Delivering precision digital engineering and scalable design systems for the modern era.</p>
              </div>
            </div>

            <div className="lg:col-span-8">
              <GlassCard className="p-8 lg:p-12">
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Full_Name</label>
                       <Input placeholder="John Doe" className="bg-white/5 border-white/10" id="contact-name" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Email_Address</label>
                       <Input type="email" placeholder="john@example.com" className="bg-white/5 border-white/10" id="contact-email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Project_Brief</label>
                     <Input placeholder="What are we building?" className="bg-white/5 border-white/10" id="contact-brief" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Technical_Requirements</label>
                     <textarea className="w-full min-h-[150px] bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-colors hide-scrollbar" placeholder="Tell us more about your needs..." id="contact-message" />
                  </div>
                  <Button size="lg" className="w-full h-14 text-base rounded-xl font-bold">
                    Transmit Inquiry // send_message()
                  </Button>
                </form>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

