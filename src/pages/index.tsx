import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { 
  EmptyState,
  Button,
  Section,
  GlassCard,
  GlowOrb
} from '@/components';
import { 
  Card 
} from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { CrudPageShell } from '@/components/admin/CrudPageShell';
import { ListInput } from '@/components/admin/ListInput';
import { ImageInput } from '@/components/admin/ImageInput';
import { ImagesInput } from '@/components/admin/ImagesInput';
import { IconPicker } from '@/components/admin/IconPicker';
import { SortableList, SortableRow } from '@/components/admin/SortableTable';
import * as LucideIcons from 'lucide-react';
import { 
  Trash2, 
  Shield, 
  Lock, 
  Briefcase, 
  ShoppingBag, 
  Code, 
  Code2, 
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
  Monitor,
  Settings,
  Star,
  EyeOff,
  Pencil,
  LucideIcon
} from 'lucide-react';
import { 
  Service, 
  Product, 
  Skill,
  ServiceCategory,
  SkillCategory,
  PricingType,
  PricingUnit,
  CtaAction
} from '@/types';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';

const DynamicIcon = ({ name, className, fallback: Fallback }: { name?: string; className?: string; fallback: LucideIcon }) => {
  if (!name) return <Fallback className={className} />;
  
  // Check if it's a URL
  const isUrl = name.startsWith('http') || name.startsWith('data:') || name.includes('/');
  
  if (isUrl) {
    return <img src={name} alt="icon" className={cn("object-contain", className)} referrerPolicy="no-referrer" />;
  }

  const Icon = (LucideIcons as any)[name] as LucideIcon;
  if (!Icon) return <Fallback className={className} />;
  return <Icon className={className} />;
};

// Animation variants for pages
// ... (omitting unused pageVariants)

export const HomePage = () => {
  const { skills, services, products } = useAppStore();
  const navigate = useNavigate();

  const skillsScrollRef = React.useRef<HTMLDivElement>(null);

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = () => {
    if (skillsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = skillsScrollRef.current;
      setShowLeftFade(scrollLeft > 20);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  React.useEffect(() => {
    checkScroll();
    const el = skillsScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      // Initial check after a short delay to ensure content is rendered
      const timer = setTimeout(checkScroll, 100);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [skills]);

  const handleWheel = (e: WheelEvent) => {
    if (skillsScrollRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        skillsScrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  React.useEffect(() => {
    const el = skillsScrollRef.current;
    if (el) {
      el.parentElement?.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      el?.parentElement?.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
        {/* Animated Background Decorative Elements */}
        <div className="absolute inset-x-0 -top-24 bottom-0 pointer-events-none">
          <div className="absolute top-0 right-[10%] w-[800px] h-[800px] bg-primary/15 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute top-1/4 left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Bottom Fade Mask to fix clipping */}
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-20 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8 inline-flex items-center py-2 px-4 bg-primary/5 dark:bg-primary/10 rounded-full border border-primary/20"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary font-display">Precision Digital Engineering</span>
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
            <Button size="lg" className="rounded-full px-10 hover:shadow-glow transition-all duration-300" onClick={() => navigate('/contact')}>
              Get Started
            </Button>
            <Button variant="glass" size="lg" className="rounded-full px-10" onClick={() => navigate('/products')}>
              View Portfolio
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Services Preview */}
      <Section 
        title="Core Services" 
        description="Our specialized technical services are engineered to scale your operations and deliver measurable results."
        className="bg-muted/10 border-y border-border/50"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((s) => (
            <GlassCard key={s.id} className="p-0 overflow-hidden group flex flex-col h-full border-white/5 hover:border-primary/20">
              <div className="relative">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {s.thumbnail ? (
                    <img 
                      src={s.thumbnail} 
                      alt={s.name} 
                      className="w-full h-full object-cover transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent">
                      <DynamicIcon name={s.icon} className="w-12 h-12 text-primary/20" fallback={Code} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                </div>
                <div className="absolute -bottom-6 right-6 z-20">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                    <DynamicIcon name={s.icon} className="w-6 h-6 text-white" fallback={Code} />
                  </div>
                </div>
              </div>
              <div className="p-8 pt-10 flex-grow flex flex-col">
                <Link to={`/services/${s.id}`}>
                  <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors cursor-pointer">{s.name}</h3>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 line-clamp-3">{s.shortDescription}</p>
                
                <Link to={`/services/${s.id}`} className="mt-auto">
                  <Button variant="ghost" className="justify-start px-0 hover:bg-transparent hover:text-primary gap-2 transition-all group/btn text-xs uppercase tracking-widest font-bold cursor-pointer">
                    Engineering Details
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ))}
          {services.length === 0 && (
            <div className="col-span-full">
               <EmptyState icon={Briefcase} title="Registry Offline" description="Service nodes are currently being synchronized." />
            </div>
          )}
        </div>
        <div className="mt-12 text-center">
          <Button variant="glass" size="sm" onClick={() => navigate('/services')}>Access All Services</Button>
        </div>
      </Section>

      {/* Why Choose Us Section */}
      <Section 
        title="Why Choose Us" 
        description="Engineered for reliability, performance, and long-term growth."
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
            <div key={item.title} className="p-8 rounded-3xl bg-background/50 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
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
        className="bg-muted/10 border-y border-border/50"
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
            <div key={feature.title} className="flex gap-4 p-4 border-l border-border/50 hover:border-primary transition-colors pl-6">
              <feature.icon className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-bold mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Featured Products */}
      <Section 
        title="Project Showcase" 
        description="Demonstrating our ability to deliver robust digital solutions across various domains."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {[...products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 3).map((p) => {
            return (
              <GlassCard key={p.id} className="p-0 overflow-hidden group border-white/5 hover:border-primary/20 h-full flex flex-col">
                <div className="relative">
                  <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                    {p.imageUrl ? (
                      <img 
                        src={p.imageUrl} 
                        alt={p.name} 
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
                        <div className="w-12 h-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center shadow-soft transition-transform duration-500">
                          <DynamicIcon name={p.icon} className="w-6 h-6 text-primary/40" fallback={ShoppingBag} />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                  </div>
                  <div className="absolute -bottom-6 right-6 z-20">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                      <DynamicIcon name={p.icon} className="w-6 h-6 text-white" fallback={ShoppingBag} />
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-10 flex-grow flex flex-col">
                  <Link to={`/products/${p.id}`}>
                    <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors cursor-pointer">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-8">{p.description}</p>
                  
                  <Link to={`/products/${p.id}`} className="mt-auto">
                    <Button variant="ghost" className="justify-start px-0 hover:bg-transparent hover:text-primary gap-2 transition-all group/btn text-xs uppercase tracking-widest font-bold cursor-pointer">
                      Project Insight
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
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
        <div className="mt-12 text-center">
          <Button variant="glass" size="sm" onClick={() => navigate('/products')}>Explore Full Registry</Button>
        </div>
      </Section>

      {/* About Us Section */}
      <section className="py-16 md:py-24 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[11px] font-bold text-primary uppercase tracking-[0.4em] mb-8 inline-flex items-center px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-full">Our Mission</h2>
            <p className="text-2xl md:text-4xl font-bold leading-tight tracking-tight mb-12">
              Wise Byte Concepts delivers practical, scalable, and visually strong digital solutions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We combine development expertise with design precision to help businesses establish and grow their digital presence efficiently. Our approach focuses on technical excellence and meaningful user experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Skills / Tech Stack Section */}
      <Section 
        title="Engineering Stack" 
        description="Our specialized technical arsenal is composed of industry-leading technologies optimized for performance, scalability, and long-term maintainability."
      >
        <div className="relative group">
          <div 
            ref={skillsScrollRef}
            style={{
              maskImage: `linear-gradient(to right, ${showLeftFade ? 'transparent' : 'black'} 0%, black ${showLeftFade ? '100px' : '0%'}, black ${showRightFade ? 'calc(100% - 100px)' : '100%'}, ${showRightFade ? 'transparent' : 'black'} 100%)`,
              WebkitMaskImage: `linear-gradient(to right, ${showLeftFade ? 'transparent' : 'black'} 0%, black ${showLeftFade ? '100px' : '0%'}, black ${showRightFade ? 'calc(100% - 100px)' : '100%'}, ${showRightFade ? 'transparent' : 'black'} 100%)`,
            }}
            className="flex gap-6 py-4 overflow-x-auto px-4 -mx-4 hide-scrollbar snap-x snap-mandatory scroll-smooth transition-all duration-300"
          >
            {([...skills].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || []).map((skill) => (
              <div
                key={skill.id}
                className="shrink-0 w-44 snap-center select-none"
              >
                <GlassCard className="p-6 flex flex-col items-center text-center group/skill hover:border-primary/50 transition-all duration-500 relative h-full">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/skill:opacity-100 transition-opacity duration-500" />
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 group-hover/skill:scale-110 group-hover/skill:bg-primary/20 group-hover/skill:shadow-glow-sm transition-all duration-500 relative z-10">
                    <DynamicIcon name={skill.icon} className="w-7 h-7 text-primary" fallback={Code} />
                  </div>
                  <h4 className="font-bold text-sm mb-1 relative z-10">{skill.name}</h4>
                  <div className="flex items-center gap-1 relative z-10 mt-auto">
                    <div className="h-0.5 w-12 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{skill.level}%</span>
                  </div>
                </GlassCard>
              </div>
            ))}
            {useAppStore().skills.length === 0 && (
              <div className="w-full flex justify-center py-12">
                <EmptyState icon={Terminal} title="No Skills Cataloged" description="The engineering matrix is currently offline." />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="pb-32">
        <div className="relative rounded-[2.5rem] overflow-hidden border border-border/50 bg-muted/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          
          <div className="relative z-10 px-8 py-20 text-center max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-tight">
                Ready to engineer your <span className="text-primary">digital edge?</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Join our network of precision-built applications. We transform complex technical requirements into high-performance experiences.
              </p>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-10 rounded-full hover:shadow-glow transition-all duration-300"
                onClick={() => navigate('/contact')}
              >
                Start Project Inquiry
              </Button>
              <Button 
                variant="glass" 
                size="lg" 
                className="w-full sm:w-auto px-10 rounded-full"
                onClick={() => navigate('/services')}
              >
                Explore Services
              </Button>
            </div>

            <div className="pt-8 flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
               <LucideIcons.CheckCircle2 className="w-5 h-5" />
               <span className="text-[10px] uppercase font-bold tracking-widest font-sans">Industry Standards Verified</span>
               <div className="w-1 h-1 rounded-full bg-border" />
               <LucideIcons.ShieldAlert className="w-5 h-5" />
               <span className="text-[10px] uppercase font-bold tracking-widest font-sans">Secure by Design</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

const SubPageHero = ({ title, subtitle, badge }: { title: React.ReactNode; subtitle?: string; badge?: string }) => (
  <section className="relative pt-48 pb-20 overflow-hidden border-b border-border/10">
    <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none">
      <div className="absolute top-[-20%] right-[10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
    <div className="max-w-6xl mx-auto px-6 relative z-10">
      <div className="max-w-4xl">
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 inline-flex items-center py-2 px-4 bg-primary/5 dark:bg-primary/10 rounded-full border border-primary/20"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary font-display">{badge}</span>
          </motion.div>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-tight"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-muted-foreground leading-relaxed max-w-2xl"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  </section>
);

export const ServicesPage = () => {
  const servicesData = useAppStore((state) => state.services);
  const services = [...servicesData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    <div className="flex flex-col">
      <SubPageHero 
        title={<>Specialized <span className="text-primary">Services.</span></>}
        subtitle="Explore our full range of engineering and design solutions tailored for modern business scalability."
        badge="Capability Registry"
      />
      <Section>
      {services.length === 0 ? (
        <EmptyState 
          icon={Briefcase}
          title="No Services Mapped"
          description="Our technical service registry is currently being synchronized. Check back shortly for our full capability map."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map(s => (
            <GlassCard key={s.id} className="p-0 overflow-hidden group flex flex-col h-full border-white/5 hover:border-primary/20">
              <div className="relative">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {s.thumbnail ? (
                    <img 
                      src={s.thumbnail} 
                      alt={s.name} 
                      className="w-full h-full object-cover transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-transparent">
                      <DynamicIcon name={s.icon} className="w-12 h-12 text-primary/20" fallback={Briefcase} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                </div>
                <div className="absolute -bottom-6 right-6 z-20">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                    <DynamicIcon name={s.icon} className="w-6 h-6 text-white" fallback={Briefcase} />
                  </div>
                </div>
              </div>
              <div className="p-8 pt-10 flex-grow flex flex-col">
                <Link to={`/services/${s.id}`}>
                  <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors cursor-pointer">{s.name}</h3>
                </Link>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 line-clamp-3">{s.shortDescription}</p>
                
                <Link to={`/services/${s.id}`} className="mt-auto">
                  <Button variant="ghost" className="justify-start px-0 hover:bg-transparent hover:text-primary gap-2 transition-all group/btn text-xs uppercase tracking-widest font-bold cursor-pointer">
                    Engineering Details
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Section>
    </div>
  );
};

export const ProductsPage = () => {
  const { products, services } = useAppStore();
  const [filter, setFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    const list = filter === 'all' ? products : products.filter((p: Product) => p.serviceId === filter);
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [products, filter]);

  return (
    <div className="flex flex-col">
      <SubPageHero 
        title={<>Project <span className="text-primary">Showcase.</span></>}
        subtitle="Explore our portfolio of high-performance digital products and technical tools engineered for precision."
        badge="Output Gallery"
      />
      <Section>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {filteredProducts.map(p => {
            return (
              <GlassCard key={p.id} className="p-0 overflow-hidden group border-white/5 hover:border-primary/20 h-full flex flex-col">
                <div className="relative">
                  <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                    {p.imageUrl ? (
                      <img 
                        src={p.imageUrl} 
                        alt={p.name} 
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
                        <div className="w-12 h-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center shadow-soft transition-transform duration-500">
                          <DynamicIcon name={p.icon} className="w-6 h-6 text-primary/40" fallback={ShoppingBag} />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                  </div>
                  <div className="absolute -bottom-6 right-6 z-20">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1">
                      <DynamicIcon name={p.icon} className="w-6 h-6 text-white" fallback={ShoppingBag} />
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-10 flex-grow flex flex-col">
                  <Link to={`/products/${p.id}`}>
                    <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors cursor-pointer">
                      {p.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-8">{p.description}</p>
                  
                  <Link to={`/products/${p.id}`} className="mt-auto">
                    <Button variant="ghost" className="justify-start px-0 hover:bg-transparent hover:text-primary gap-2 transition-all group/btn text-xs uppercase tracking-widest font-bold cursor-pointer">
                      Project Insight
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </Section>
    </div>
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
    <div className="flex flex-col">
      <SubPageHero 
        title={<>Technical <span className="text-primary">Stack.</span></>}
        subtitle="The foundation of our precision engineering and digital craftsmanship, powered by industry-leading core technologies."
        badge="Capability Matrix"
      />
      <Section>
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
                <h2 className="text-[11px] font-bold text-primary uppercase tracking-[0.4em] whitespace-nowrap px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-full">
                  {category}
                </h2>
                <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {(items as Skill[]).sort((a, b) => {
                  const orderA = a.order ?? 999;
                  const orderB = b.order ?? 999;
                  if (orderA !== orderB) return orderA - orderB;
                  return b.level - a.level;
                }).map(skill => (
                  <GlassCard key={skill.id} className="p-6 text-center group py-8">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                      <DynamicIcon name={skill.icon} className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" fallback={Code} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{skill.name}</h3>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1 px-1">
                         <span>Proficiency</span>
                         <span>{skill.level}%</span>
                       </div>
                       <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
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
    </div>
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
      <GlowOrb className="top-[-10%] left-[-10%]" color="rgba(59, 130, 246, 0.15)" />
      
      <GlassCard className="w-full max-w-md p-10 text-center relative z-10" hoverGlow={false}>
        <div className="mb-10 relative">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-gradient-brand rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-glow transition-transform hover:scale-110 duration-500 relative z-10"
          >
            <Lock className="w-10 h-10 text-white" />
          </motion.div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-32 h-32 bg-primary/20 blur-3xl rounded-full" />

          <h1 className="text-4xl font-bold tracking-tighter mb-4 uppercase">Console Access</h1>
          <div className="inline-flex items-center px-4 py-2 bg-primary/5 border border-primary/20 rounded-full gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary uppercase tracking-[0.4em] font-bold font-mono">Secure System Node</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left space-y-3">
            <Label className="text-primary ml-1">Identity Vector (Email)</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="operator@wisebyte.concepts"
              disabled={loading}
              className="glass py-6"
              autoFocus
            />
          </div>
          <div className="text-left space-y-3">
            <div className="flex justify-between items-center px-1">
              <Label className="text-primary mb-0">Access Cipher (Password)</Label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-[9px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 tracking-tighter"
              >
                {resetLoading ? 'Decrypting...' : 'Reset Key'}
              </button>
            </div>
            <Input 
              type="password" 
              value={password} 
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="glass py-6"
            />
          </div>
          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-6 text-base font-bold shadow-glow-primary"
          >
            {loading ? 'Authenticating...' : 'Authorize Access'}
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
  const { services, products, skills, resetToDefaults } = useAppStore();
  const { user } = useAuthStore();
  const [showReset, setShowReset] = useState(false);

  const handleReset = async () => {
    await resetToDefaults();
    setShowReset(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-bold tracking-tighter">Overview</h2>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Welcome back{user?.email ? `, ${user.email}` : ""}. All systems normal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 group hover:border-primary/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Total services
            </h3>
            <Briefcase className="w-4 h-4 text-primary opacity-50" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{services.length}</p>
        </Card>
        
        <Card className="p-6 group hover:border-blue-400/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Total products
            </h3>
            <ShoppingBag className="w-4 h-4 text-blue-400 opacity-50" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{products.length}</p>
        </Card>

        <Card className="p-6 group hover:border-purple-400/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Total skills
            </h3>
            <Code className="w-4 h-4 text-purple-400 opacity-50" />
          </div>
          <p className="text-4xl font-bold tracking-tighter">{skills.length}</p>
        </Card>

        <Card className="p-6 group hover:border-emerald-400/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Your role
            </h3>
            <Shield className="w-4 h-4 text-emerald-400 opacity-50" />
          </div>
          <p className="text-xl font-bold uppercase tracking-widest font-mono text-emerald-400">
            {user?.role || "—"}
          </p>
        </Card>
      </div>

      <Card className="p-8 bg-gradient-to-br from-muted/50 to-transparent border-border/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">System Maintenance</h3>
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-tight">
                Danger Zone: Reset all application data to defaults.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowReset((prev) => !prev)}
            className="rounded-full px-8"
          >
            Reset System Data
          </Button>
        </div>

        {showReset && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-destructive">Crucial Warning</p>
                <p className="text-sm text-muted-foreground">
                  This operation will purge all custom service nodes and product inventories, reverting the repository to its initial state. This action is terminal and cannot be rolled back.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button size="sm" variant="destructive" onClick={handleReset} className="rounded-lg">
                Confirm Purge
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReset(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </Card>
    </div>
  );
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const emptyService = (): Service => ({
  id: "",
  slug: "",
  name: "",
  icon: "Briefcase",
  caption: "",
  header: "",
  shortDescription: "",
  fullDescription: "",
  thumbnail: "",
  bannerImage: "",
  gallery: [],
  category: ServiceCategory.DEVELOPMENT,
  tags: [],
  features: [],
  deliverables: [],
  pricing: { type: 'custom', note: 'Contact for quote' } as any,
  estimatedDuration: "",
  technologies: [],
  relatedProjects: [],
  cta: { label: "Schedule a consultation", action: 'contact' },
  seo: {},
  isActive: true,
  isFeatured: false,
  order: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminServicesPage = () => {
  const { services, products, addService, updateService, deleteService, reorderServices } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<Service>(emptyService());

  const update = <K extends keyof Service>(key: K, val: Service[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptyService());
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ ...s });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast("Name is required", "error");
      return;
    }
    const slug = (form.slug || slugify(form.name)).trim();
    const id = editing?.id || form.id || slug;
    const payload: Service = {
      ...form,
      id,
      slug,
      header: form.header || form.name,
      caption: form.caption || form.shortDescription,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editing) {
        await updateService(payload);
        addToast("Service updated", "success");
      } else {
        if (services.some((s) => s.id === id)) {
          addToast("A service with this ID already exists", "error");
          return;
        }
        await addService(payload);
        addToast("Service added", "success");
      }
      setOpen(false);
    } catch (error: any) {
      addToast(error.message || "Operation failed", "error");
    }
  };

  const handleDelete = async (s: Service) => {
    if (!confirm(`Delete service "${s.name}"?`)) return;
    try {
      await deleteService(s.id);
      addToast("Service deleted", "success");
    } catch (error: any) {
      addToast("Delete failed", "error");
    }
  };

  const ordered = [...services].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CrudPageShell
        title="Services"
        description="Manage what your studio offers"
        onAdd={openAdd}
        addLabel="Add service"
        count={services.length}
      >
        <SortableList items={ordered} onReorder={reorderServices}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Tags</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="w-[120px] text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center text-sm text-muted-foreground uppercase tracking-widest bg-muted/10">
                   No Services Found
                </TableCell>
              </TableRow>
            )}
            {ordered.map((s, index) => (
              <SortableRow key={s.id} id={s.id}>
                {() => (
                  <>
                    <TableCell className="text-muted-foreground font-mono text-xs">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                           <DynamicIcon name={s.icon} className="w-4 h-4 text-primary opacity-50" fallback={Zap} />
                        </div>
                        {s.name}
                        {s.isFeatured && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-50">/{s.slug}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="capitalize font-mono text-[10px]">{s.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(s.tags ?? []).slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-muted-foreground">#{t}</span>
                        ))}
                        {(s.tags?.length ?? 0) > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{s.tags!.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {s.isActive ? (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 opacity-30">
                          <EyeOff className="h-3 w-3" />
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Hidden</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(s)} className="rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(s)} className="rounded-lg hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </SortableRow>
            ))}
          </TableBody>
        </SortableList>
      </CrudPageShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl" onOpenChange={setOpen}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service Module" : "Initialize Service Node"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0 mb-6 border-b border-border/20 rounded-none">
              <TabsTrigger value="content" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">Content</TabsTrigger>
              <TabsTrigger value="media" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">Media</TabsTrigger>
              <TabsTrigger value="organize" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">Organize</TabsTrigger>
              <TabsTrigger value="value" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">Value</TabsTrigger>
              <TabsTrigger value="commercial" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">Commercial</TabsTrigger>
              <TabsTrigger value="tech" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">Stack</TabsTrigger>
              <TabsTrigger value="seo" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">SEO</TabsTrigger>
              <TabsTrigger value="control" className="rounded-none px-4 py-3 text-sm font-semibold transition-colors hover:text-foreground/90">System</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name (Title)</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((p) => ({
                        ...p,
                        name,
                        slug: editing ? p.slug : slugify(name),
                        header: p.header || name,
                      }));
                    }}
                    placeholder="E.g. Web Development"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL Identifier)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => update("slug", slugify(e.target.value))}
                    placeholder="web-development"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <IconPicker 
                  value={form.icon || ""} 
                  onChange={(val) => update("icon", val)} 
                  label="Service Visual Identity"
                />
              </div>

              <div className="space-y-2">
                <Label>Header (Detail Title)</Label>
                <Input
                  value={form.header}
                  onChange={(e) => update("header", e.target.value)}
                  placeholder="The Ultimate Web Solution"
                />
              </div>

              <div className="space-y-2">
                <Label>Caption (Hero Hook)</Label>
                <Input
                  value={form.caption}
                  onChange={(e) => update("caption", e.target.value)}
                  placeholder="Building for the next generation"
                />
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => update("shortDescription", e.target.value)}
                  placeholder="Brief summary for indexing..."
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description (Markdown Compatible)</Label>
                <Textarea
                  rows={6}
                  value={form.fullDescription}
                  onChange={(e) => update("fullDescription", e.target.value)}
                  placeholder="Detailed engineering specifications..."
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-8">
              <ImageInput
                label="Thumbnail (Grid Image)"
                value={form.thumbnail}
                onChange={(v) => update("thumbnail", v || "")}
              />
              <ImageInput
                label="Banner (Hero Image)"
                value={form.bannerImage || ""}
                onChange={(v) => update("bannerImage", v || "")}
              />
              <ImagesInput
                label="Gallery (Showcase)"
                value={form.gallery || []}
                onChange={(v) => update("gallery", v)}
              />
            </TabsContent>

            <TabsContent value="organize" className="space-y-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => update("category", v as ServiceCategory)}
                >
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {Object.values(ServiceCategory).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ListInput
                label="Tags"
                value={form.tags || []}
                onChange={(v) => update("tags", v)}
                placeholder="tech, react, modern"
              />
            </TabsContent>

            <TabsContent value="value" className="space-y-6">
              <ListInput
                label="Core Features"
                value={form.features || []}
                onChange={(v) => update("features", v)}
                placeholder="Add a core feature..."
              />
              <ListInput
                label="Concrete Deliverables"
                value={form.deliverables || []}
                onChange={(v) => update("deliverables", v)}
                placeholder="Add a deliverable..."
              />
            </TabsContent>

            <TabsContent value="commercial" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <Select
                    value={form.pricing?.type || 'custom'}
                    onValueChange={(v) =>
                      update("pricing", { ...form.pricing, type: v as PricingType } as any)
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="starting_from">Starting at</SelectItem>
                      <SelectItem value="custom">Custom Quote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    value={form.pricing?.currency ?? ""}
                    onChange={(e) => update("pricing", { ...form.pricing, currency: e.target.value } as any)}
                    placeholder="USD"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={form.pricing?.amount ?? ""}
                    onChange={(e) =>
                      update("pricing", {
                        ...form.pricing,
                        amount: e.target.value === "" ? 0 : Number(e.target.value),
                      } as any)
                    }
                    placeholder="1500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Billing Unit</Label>
                   <Select
                    value={form.pricing?.unit || 'project'}
                    onValueChange={(v) =>
                      update("pricing", { ...form.pricing, unit: v as PricingUnit } as any)
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Per Project</SelectItem>
                      <SelectItem value="month">Per Month</SelectItem>
                      <SelectItem value="hour">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Est. Timeline</Label>
                <Input
                  value={form.estimatedDuration || ""}
                  onChange={(e) => update("estimatedDuration", e.target.value)}
                  placeholder="2–4 weeks"
                />
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <Label>Call to Action (CTA)</Label>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="normal-case">Label</Label>
                    <Input
                      value={form.cta?.label || ""}
                      onChange={(e) => update("cta", { ...form.cta, label: e.target.value } as any)}
                      placeholder="Discuss Project"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="normal-case">Action</Label>
                    <Select
                      value={form.cta?.action || 'contact'}
                      onValueChange={(v) => update("cta", { ...form.cta, action: v as CtaAction } as any)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contact">Contact Page</SelectItem>
                        <SelectItem value="quote">Request Quote</SelectItem>
                        <SelectItem value="external">External Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tech" className="space-y-6">
              <ListInput
                label="Technologies (Stack)"
                value={form.technologies || []}
                onChange={(v) => update("technologies", v)}
                placeholder="React, TypeScript, AWS..."
              />

              <div className="space-y-3">
                <Label>Portfolio Integration</Label>
                <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-50">Map existing product nodes to this service</p>
                <div className="flex flex-wrap gap-2">
                  {products.map((p) => {
                    const active = (form.relatedProjects || []).includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          update(
                            "relatedProjects",
                            active
                              ? form.relatedProjects!.filter((id) => id !== p.id)
                              : [...(form.relatedProjects || []), p.id],
                          )
                        }
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                          active
                            ? "bg-primary border-primary text-white shadow-glow-primary"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                        )}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                  {products.length === 0 && (
                    <p className="text-xs text-muted-foreground italic bg-white/5 p-4 rounded-xl w-full">No products available in registry.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={form.seo?.metaTitle ?? ""}
                  onChange={(e) => update("seo", { ...form.seo, metaTitle: e.target.value })}
                  placeholder="Page SEO Title..."
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  rows={3}
                  value={form.seo?.metaDescription ?? ""}
                  onChange={(e) => update("seo", { ...form.seo, metaDescription: e.target.value })}
                  placeholder="Brief summary for search engines..."
                />
              </div>
              <ListInput
                label="SEO Keywords"
                value={form.seo?.keywords ?? []}
                onChange={(v) => update("seo", { ...form.seo, keywords: v })}
                placeholder="kw1, kw2..."
              />
            </TabsContent>

            <TabsContent value="control" className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/50 transition-all">
                  <div className="space-y-1">
                    <Label className="mb-0">Active Status</Label>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">Production Visibility</p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => update("isActive", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/50 transition-all">
                  <div className="space-y-1">
                    <Label className="mb-0">Featured Node</Label>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">Priority Ranking</p>
                  </div>
                  <Switch
                    checked={form.isFeatured || false}
                    onCheckedChange={(v) => update("isFeatured", v)}
                  />
                </div>
              </div>

              <div className="space-y-2 max-w-xs">
                <Label>Node Display Order</Label>
                <Input
                  type="number"
                  value={form.order || 0}
                  onChange={(e) => update("order", Number(e.target.value) || 0)}
                  className="font-mono text-center"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl px-8 shadow-glow-primary">
              {editing ? "Save Refactor" : "Deploy Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const emptyProduct = (): Product => ({
  id: "",
  name: "",
  description: "",
  serviceId: "",
  icon: "ShoppingBag",
  imageUrl: "",
  demoUrl: "",
  repoUrl: "",
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminProductsPage = () => {
  const { products, services, addProduct, updateProduct, deleteProduct, reorderProducts } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Product>(emptyProduct());

  const update = <K extends keyof Product>(key: K, val: Product[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptyProduct());
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast("Name is required", "error");
      return;
    }
    const id = editing?.id || Math.random().toString(36).substring(7);
    const payload: Product = {
      ...form,
      id,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editing) {
        await updateProduct(payload);
        addToast("Product updated", "success");
      } else {
        await addProduct(payload);
        addToast("Product registered", "success");
      }
      setOpen(false);
    } catch (error: any) {
      addToast("Operation failed", "error");
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Remove product "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      addToast("Product removed", "success");
    } catch (error: any) {
      addToast("Delete failed", "error");
    }
  };

  const ordered = [...products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CrudPageShell
        title="Products"
        description="Register and showcase your completed projects"
        onAdd={openAdd}
        addLabel="Register Product"
        count={products.length}
      >
        <SortableList items={ordered} onReorder={reorderProducts}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead className="w-20">Preview</TableHead>
              <TableHead>Product Identity</TableHead>
              <TableHead className="hidden md:table-cell">Associated Service</TableHead>
              <TableHead className="hidden lg:table-cell">Tags</TableHead>
              <TableHead className="w-[120px] text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center text-sm text-muted-foreground font-mono uppercase tracking-widest bg-muted/10">
                   No_Product_Nodes_Found
                </TableCell>
              </TableRow>
            )}
            {ordered.map((p) => {
              const service = services.find(s => s.id === p.serviceId);
              return (
                <SortableRow key={p.id} id={p.id}>
                  {() => (
                    <>
                      <TableCell>
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <DynamicIcon name={p.icon} className="w-6 h-6 text-primary/40" fallback={ShoppingBag} />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold flex items-center gap-2">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase truncate max-w-[200px] opacity-50">{p.description}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {service ? (
                          <Badge variant="secondary" className="font-mono text-[10px] border-primary/20 text-primary">{service.name}</Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono italic">Unmapped</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(p.tags ?? []).slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-muted-foreground">#{t}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="rounded-lg hover:bg-primary/10 hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(p)} className="rounded-lg hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </SortableRow>
              );
            })}
          </TableBody>
        </SortableList>
      </CrudPageShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" onOpenChange={setOpen}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product node" : "Register Product node"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="base" className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0 mb-8 border-b border-white/5 rounded-none">
              <TabsTrigger value="base" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4">Identity</TabsTrigger>
              <TabsTrigger value="assets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4">Assets</TabsTrigger>
              <TabsTrigger value="links" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4">Deployment</TabsTrigger>
            </TabsList>

            <TabsContent value="base" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Wise Cloud Dashboard"
                  />
                </div>
                <div className="space-y-4">
                  <IconPicker 
                    value={form.icon || ""} 
                    onChange={(val) => update("icon", val)} 
                    label="Product Symbol"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Architecture Mapping</Label>
                <Select
                  value={form.serviceId}
                  onValueChange={(v) => update("serviceId", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select Parent Service" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Full engineering summary..."
                />
              </div>

              <ListInput
                label="Product Tags"
                value={form.tags || []}
                onChange={(v) => update("tags", v)}
                placeholder="react, tailwind, node"
              />
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <ImageInput
                label="Main Preview Image"
                value={form.imageUrl || ""}
                onChange={(v) => update("imageUrl", v || "")}
              />
            </TabsContent>

            <TabsContent value="links" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Live Project URL</Label>
                  <div className="relative">
                    <Input
                      value={form.demoUrl || ""}
                      onChange={(e) => update("demoUrl", e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Repository URL</Label>
                  <div className="relative">
                    <Input
                      value={form.repoUrl || ""}
                      onChange={(e) => update("repoUrl", e.target.value)}
                      placeholder="https://github.com/..."
                      className="pl-10"
                    />
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl px-8 shadow-glow-primary">
              {editing ? "Update Registry" : "Initialize Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const emptySkill = (): Skill => ({
  id: "",
  name: "",
  category: SkillCategory.OTHER,
  level: 80,
  icon: "Code",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const AdminSkillsPage = () => {
  const { skills, addSkill, updateSkill, deleteSkill, reorderSkills } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [form, setForm] = useState<Skill>(emptySkill());

  const update = <K extends keyof Skill>(key: K, val: Skill[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptySkill());
    setOpen(true);
  };

  const openEdit = (s: Skill) => {
    setEditing(s);
    setForm({ ...s });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast("Name is required", "error");
      return;
    }
    const id = editing?.id || Math.random().toString(36).substring(7);
    const payload: Skill = {
      ...form,
      id,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editing) {
        await updateSkill(payload);
        addToast("Skill updated", "success");
      } else {
        await addSkill(payload);
        addToast("Skill indexed", "success");
      }
      setOpen(false);
    } catch (error: any) {
      addToast("Operation failed", "error");
    }
  };

  const handleDelete = async (s: Skill) => {
    if (!confirm(`Purge skill "${s.name}"?`)) return;
    try {
      await deleteSkill(s.id);
      addToast("Skill purged", "success");
    } catch (error: any) {
      addToast("Delete failed", "error");
    }
  };

  const ordered = [...skills].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CrudPageShell
        title="Capability Matrix"
        description="Manage the technical and creative skill nodes"
        onAdd={openAdd}
        addLabel="Index Skill"
        count={skills.length}
      >
        <SortableList items={ordered} onReorder={reorderSkills}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead>Skill Identity</TableHead>
              <TableHead className="hidden md:table-cell">Classification</TableHead>
              <TableHead>Proficiency (%)</TableHead>
              <TableHead className="w-[120px] text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center text-sm text-muted-foreground uppercase tracking-widest bg-muted/10">
                   No Skills Found
                </TableCell>
              </TableRow>
            )}
            {ordered.map((s) => (
              <SortableRow key={s.id} id={s.id}>
                {() => (
                  <>
                    <TableCell>
                      <div className="font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                           <DynamicIcon name={s.icon} className="w-4 h-4 text-primary opacity-50" fallback={Zap} />
                        </div>
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="font-mono text-[10px] capitalize">{s.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-full max-w-[100px] h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full bg-primary shadow-glow-primary transition-all duration-1000" 
                          style={{ width: `${s.level}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold mt-1 block">{s.level}%</span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(s)} className="rounded-lg hover:bg-primary/10 hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(s)} className="rounded-lg hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </SortableRow>
            ))}
          </TableBody>
        </SortableList>
      </CrudPageShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" onOpenChange={setOpen}>
          <DialogHeader>
            <DialogTitle>{editing ? "Refactor Skill Node" : "Index Skill Node"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Skill Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="E.g. TypeScript"
                />
              </div>
              <IconPicker 
                value={form.icon || ""} 
                onChange={(val) => update("icon", val)} 
                label="Capability Node Icon"
              />
            </div>

            <div className="space-y-2">
              <Label>Classification</Label>
              <Select
                value={form.category}
                onValueChange={(v) => update("category", v as SkillCategory)}
              >
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {Object.values(SkillCategory).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Proficiency Level</Label>
                <span className="text-xs font-mono font-bold text-primary">{form.level}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={form.level}
                onChange={(e) => update("level", Number(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl px-8 shadow-glow-primary">
              {editing ? "Save Refactor" : "Deploy Index"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const services = useAppStore((state) => state.services);
  const products = useAppStore((state) => state.products);
  
  const service = services.find(s => s.id === id);
  const relatedProducts = [...products]
    .filter(p => p.serviceId === id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
            <ArrowLeft className="mr-2 w-3 h-3" /> Back to Services
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[11px] font-bold tracking-[0.4em] uppercase rounded-full font-display">
                  {service.category}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                  Service ID: {service.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                {service.name}
              </h1>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <DynamicIcon name={service.icon} className="w-8 h-8 text-primary shadow-glow-primary" fallback={Briefcase} />
                 </div>
              </div>
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
                <Terminal className="w-6 h-6 text-primary" /> Service Specifications
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
                    <p className="text-[11px] font-bold text-primary uppercase tracking-[0.4em] mb-1">Est. Duration</p>
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
                  {service.cta.action === 'external' ? <ExternalLink className="ml-2 w-5 h-5" /> : <ArrowRight className="ml-2 w-5 h-5 transition-transform" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Output */}
      {relatedProducts.length > 0 && (
        <section className="bg-white/[0.02] py-16 md:py-24">
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
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <DynamicIcon name={p.icon} className="w-12 h-12 text-white/5" fallback={ShoppingBag} />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 leading-relaxed">{p.description}</p>
                    <Link to={`/products/${p.id}`} className="inline-flex items-center text-xs font-mono text-primary hover:underline uppercase tracking-widest">
                      View Details <ArrowRight className="ml-1 w-3 h-3" />
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
            <ArrowLeft className="mr-2 w-3 h-3" /> Back to Products
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-6">
               <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-[11px] font-bold tracking-[0.4em] uppercase rounded-full font-display">
                    Product Node
                  </span>
                  {service && (
                    <Link to={`/services/${service.id}`} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors tracking-[0.4em] uppercase font-display">
                      Mapped to: {service.name}
                    </Link>
                  )}
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                      <DynamicIcon name={product.icon} className="w-8 h-8 text-primary shadow-glow-primary" fallback={ShoppingBag} />
                   </div>
                </div>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
                      <DynamicIcon name={product.icon} className="w-16 h-16 mb-4 opacity-10" fallback={ShoppingBag} />
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
            <div className="mb-6 inline-flex items-center px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-full">
              <h3 className="text-[11px] font-bold text-primary uppercase tracking-[0.4em]">Project Tags</h3>
            </div>
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
        <section className="py-16 md:py-24 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-12 p-12 bg-white/[0.02] rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10" />
              
              <div className="md:w-1/3 text-center md:text-left">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <DynamicIcon name={service.icon} className="w-8 h-8 text-primary" fallback={Briefcase} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Powered By</h3>
                <p className="text-muted-foreground">This product is an outcome of our {service.name} capability module.</p>
              </div>

              <div className="md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="mb-4 inline-flex items-center px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-full">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary">Key features</h4>
                  </div>
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
      <SubPageHero 
        title={<>Get in <span className="text-primary">Touch.</span></>}
        subtitle="Have a project in mind or just want to chat about technical possibilities? We're always open to new engineering challenges."
        badge="Project Inquiries"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
            <div className="lg:col-span-4 space-y-12">
              <div>
                <h3 className="text-[11px] font-bold text-primary uppercase tracking-[0.4em] mb-8 inline-flex items-center px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-full">Contact Details</h3>
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

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Github className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">GitHub</p>
                      <a href="https://github.com/wisebyteconcepts" target="_blank" className="text-lg font-bold hover:text-primary transition-colors">
                        wisebyteconcepts
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-primary uppercase tracking-[0.4em] mb-8 inline-flex items-center px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-full">Our Brand</h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-lg shadow-sm shrink-0">
                    <Code2 className="text-white w-5 h-5" />
                  </div>
                  <p className="text-xl font-bold font-display">Wise Byte Concepts</p>
                </div>
                <p className="text-muted-foreground text-sm mt-2">Delivering precision digital engineering and scalable design systems for the modern era.</p>
              </div>
            </div>

            <div className="lg:col-span-8">
              <GlassCard className="p-8 lg:p-12 border-border/50">
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Full Name</label>
                       <Input placeholder="John Doe" className="bg-muted/50 border-border" id="contact-name" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Email Address</label>
                       <Input type="email" placeholder="john@example.com" className="bg-muted/50 border-border" id="contact-email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Project Brief</label>
                     <Input placeholder="What are we building?" className="bg-muted/50 border-border" id="contact-brief" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Technical Requirements</label>
                     <textarea className="w-full min-h-[150px] bg-muted/50 border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-colors hide-scrollbar text-foreground" placeholder="Tell us more about your needs..." id="contact-message" />
                  </div>
                  <Button size="lg" className="w-full h-14 text-base rounded-xl font-bold">
                    Send Message
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

export * from './NotFoundPage';

