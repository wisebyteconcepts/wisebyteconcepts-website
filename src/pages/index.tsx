import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { 
  EmptyState,
  Button,
  Section,
  GlassCard,
  GlowOrb,
  ServiceCard,
  ProjectCard,
} from '@/components';
import { 
  Card 
} from '@/components/ui/Card';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
  InputBlock,
  PasswordInputBlock,
} from '@/components/forms/FormControls';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { CrudPageShell } from '@/components/admin/CrudPageShell';
import { Icon } from '@/components/ui/Icon';
import { SortableList, SortableRow } from '@/components/admin/SortableTable';
import * as LucideIcons from 'lucide-react';
import { 
  Trash2, 
  Shield, 
  X,
  Lock, 
  Briefcase, 
  ShoppingBag, 
  Code, 
  Search,
  ArrowLeft,
  ExternalLink,
  Github,
  Globe,
  Layers,
  Cpu,
  CheckCircle2,
  Clock,
  ArrowRight,
  Mail,
  Zap,
  Sparkles,
  Monitor,
  Settings,
  Star,
  Pencil,
  LucideIcon
} from 'lucide-react';
import { 
  Service, 
  Product, 
  TechStack
} from '@/types';
import { TechStackForm } from '@/components/forms/TechStackForm';
import { TechStackIcon } from '@/components/TechStackIcon';
import { MarkdownContent } from '@/components/ui/MarkdownEditor';
import { useParams } from 'react-router-dom';
import { formatServicePrice } from '@/utils/currency';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const DynamicIcon = ({ name, className, fallback: Fallback }: { name?: any; className?: string; fallback: LucideIcon }) => {
  return <Icon value={name} className={className} fallback={Fallback} />;
};

// Animation variants for pages
// ... (omitting unused pageVariants)

export const HomePage = () => {
  const { skills, services, products } = useAppStore();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

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

  // Requirement 5: Ignore featured flag on homepage. Show first 6 services and first 6 projects in saved order.
  const displayServices = useMemo(() => {
    return services
      .filter((s) => s.active !== false && s.isActive !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 6);
  }, [services]);

  const displayProjects = useMemo(() => {
    return products
      .filter((p) => p.active !== false && p.isActive !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .slice(0, 6);
  }, [products]);

  // Requirement 6: Dynamic background alternation between sections (surface-0 and surface-1)
  let sectionIndex = 0;
  const getNextBg = () => {
    sectionIndex++;
    return sectionIndex % 2 === 1
      ? 'bg-surface-1 border-y border-border/60'
      : 'bg-surface-0';
  };

  const servicesBg = displayServices.length > 0 ? getNextBg() : '';
  const whyBg = getNextBg();
  const featuresBg = getNextBg();
  const projectsBg = displayProjects.length > 0 ? getNextBg() : '';
  const missionBg = getNextBg();
  const techBg = getNextBg();
  const ctaBg = getNextBg();

  // Helper pill components (Requirement 3: Section captions fully rounded with tinted background and dot; Card category badges smaller pill)
  const SectionCaption = ({ text }: { text: string }) => (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-display font-semibold uppercase tracking-wider shadow-2xs">
      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
      <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>{text}</span>
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-surface-0">
        {/* Animated Background Decorative Elements */}
        <div className="absolute inset-x-0 -top-24 bottom-0 pointer-events-none">
          <div className="absolute top-0 right-[10%] w-[550px] md:w-[750px] h-[550px] md:h-[750px] bg-accent/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/4 left-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-accent-soft/30 rounded-full blur-[120px]" />
        </div>
        
        {/* Bottom Fade Mask */}
        <div className="absolute bottom-0 left-0 right-0 h-40 md:h-60 bg-gradient-to-t from-surface-0 via-surface-0/80 to-transparent z-10 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 relative z-20 text-center">
          {/* Section Caption Pill (Requirement 3) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 md:mb-8 inline-flex items-center justify-center"
          >
            <SectionCaption text="Precision Digital Engineering" />
          </motion.div>
          
          {/* Headline with smooth word-by-word reveal (Requirement 3: no typewriter, no flicker, smooth gradient highlight on Design.) */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-bold mb-6 md:mb-8 tracking-tight max-w-4xl mx-auto leading-[1.06]">
            {[
              { text: 'Build.', highlight: false },
              { text: 'Design.', highlight: true },
              { text: 'Scale.', highlight: false },
            ].map((item, idx) => (
              <motion.span
                key={item.text}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: shouldReduceMotion ? 0 : 0.12 + idx * 0.12,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className={cn(
                  'inline-block',
                  item.highlight
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-indigo-600 dark:from-accent dark:via-sky-400 dark:to-indigo-400'
                    : 'text-text-primary'
                )}
              >
                {item.text}
                {idx < 2 && '\u00A0'}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: shouldReduceMotion ? 0 : 0.48, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Modern digital solutions for businesses — from websites and apps to branding and publishing.
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: shouldReduceMotion ? 0 : 0.62, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Button 
              size="lg" 
              className="w-full sm:w-auto rounded-full px-8 py-3 h-12 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 font-semibold cursor-pointer" 
              onClick={() => navigate('/contact')}
            >
              Get Started
            </Button>
            <Button 
              variant="glass" 
              size="lg" 
              className="w-full sm:w-auto rounded-full px-8 py-3 h-12 hover:-translate-y-0.5 transition-all duration-300 font-medium cursor-pointer" 
              onClick={() => navigate('/products')}
            >
              View Portfolio
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 2. Core Services (Hidden if 0 services) */}
      {displayServices.length > 0 && (
        <section className={cn('py-16 md:py-24', servicesBg)}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-12 md:mb-16">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <SectionCaption text="OUR EXPERTISE" />
              </motion.div>
              <motion.h2
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.06 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-text-primary mb-4"
              >
                Core Services
              </motion.h2>
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.12 }}
                className="text-text-secondary text-base sm:text-lg md:text-xl leading-relaxed"
              >
                Our specialized technical services are engineered to scale your operations and deliver measurable results.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayServices.map((s, index) => (
                <motion.div
                  key={s.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.5,
                    delay: shouldReduceMotion ? 0 : index * 0.08,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="h-full"
                >
                  <ServiceCard service={s} />
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button 
                variant="glass" 
                size="sm" 
                className="rounded-full px-6 py-2.5 h-10 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                onClick={() => navigate('/services')}
              >
                Access All Services
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 3. Why Choose Us Section */}
      <section className={cn('py-16 md:py-24', whyBg)}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-12 md:mb-16">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <SectionCaption text="VALUE PROPOSITION" />
            </motion.div>
            <motion.h2
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.06 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-text-primary mb-4"
            >
              Why Choose Us
            </motion.h2>
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.12 }}
              className="text-text-secondary text-base sm:text-lg md:text-xl leading-relaxed"
            >
              Engineered for reliability, performance, and long-term sustainable growth.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Modern Tech Stack', desc: 'Built using up-to-date frameworks and tools to ensure longevity and efficiency.', icon: Cpu },
              { title: 'Scalable Solutions', desc: 'Designed to grow with your business, handling increased loads effortlessly.', icon: Layers },
              { title: 'Clean Architecture', desc: 'Maintainable and performance-focused systems built with precision.', icon: Code },
              { title: 'End-to-End Service', desc: 'Comprehensive support from conceptual design to production deployment.', icon: Zap },
              { title: 'Attention to Detail', desc: 'Surgical precision in design, code quality, and final delivery.', icon: CheckCircle2 },
              { title: 'Reliable Support', desc: 'Dedicated ongoing maintenance and technical assistance.', icon: Clock },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : index * 0.08,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="h-full flex flex-col"
              >
                <div className="feature-hover-card p-8 rounded-2xl bg-surface-2 border border-border/70 shadow-card flex flex-col h-full group">
                  <div className="feature-hover-card-icon w-12 h-12 shrink-0 rounded-xl bg-accent-soft text-accent-strong flex items-center justify-center mb-6">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Key Features Section */}
      <section className={cn('py-16 md:py-24', featuresBg)}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-12 md:mb-16">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <SectionCaption text="CAPABILITIES" />
            </motion.div>
            <motion.h2
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.06 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-text-primary mb-4"
            >
              Key Features
            </motion.h2>
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.12 }}
              className="text-text-secondary text-base sm:text-lg md:text-xl leading-relaxed"
            >
              The architectural and engineering standards we uphold in every project we undertake.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: 'Responsive Design', desc: 'Flawless experiences across all devices, viewports, and screen sizes.', icon: Monitor },
              { title: 'Fast Performance', desc: 'Optimized load times and fluid, high-frame-rate interactions.', icon: Zap },
              { title: 'SEO-Friendly Structure', desc: 'Built for search engine visibility and rich metadata discovery.', icon: Search },
              { title: 'Secure Systems', desc: 'Hardened security protocols and strict data isolation.', icon: Shield },
              { title: 'Cross-Platform Compatibility', desc: 'Consistent performance and appearance across modern browsers.', icon: Globe },
              { title: 'User-Centric Design', desc: 'Intuitive interfaces engineered around real user workflows.', icon: Sparkles },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.45,
                  delay: shouldReduceMotion ? 0 : index * 0.06,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="h-full flex flex-col"
              >
                <div className="feature-hover-card p-6 rounded-2xl bg-surface-2 border border-border/70 shadow-card group flex items-start gap-4 h-full">
                  <div className="feature-hover-card-icon w-10 h-10 shrink-0 rounded-xl bg-accent-soft text-accent-strong flex items-center justify-center mt-0.5">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-text-primary text-base mb-1.5">
                      {feature.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Project Showcase (Hidden if 0 projects) */}
      {displayProjects.length > 0 && (
        <section className={cn('py-16 md:py-24', projectsBg)}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-3xl mb-12 md:mb-16">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <SectionCaption text="PORTFOLIO" />
              </motion.div>
              <motion.h2
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.06 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-text-primary mb-4"
              >
                Project Showcase
              </motion.h2>
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.12 }}
                className="text-text-secondary text-base sm:text-lg md:text-xl leading-relaxed"
              >
                Demonstrating our ability to deliver robust digital solutions across various domains.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayProjects.map((p, index) => (
                <motion.div
                  key={p.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.5,
                    delay: shouldReduceMotion ? 0 : index * 0.08,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="h-full"
                >
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button 
                variant="glass" 
                size="sm" 
                className="rounded-full px-6 py-2.5 h-10 hover:-translate-y-0.5 transition-all duration-300 font-medium"
                onClick={() => navigate('/products')}
              >
                Explore Full Registry
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 6. Our Mission Section (Requirement 4: Redesigned Split Layout with 2x2 Values Grid) */}
      <section className={cn('py-16 md:py-24 relative overflow-hidden', missionBg)}>
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Heading, caption pill, mission text */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 flex flex-col"
            >
              <div className="mb-4">
                <SectionCaption text="OUR MISSION" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-text-primary mb-6">
                Wise Byte Concepts delivers practical, scalable, and visually strong digital solutions.
              </h2>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6 font-normal">
                We combine development expertise with design precision to help businesses establish and grow their digital presence efficiently. Our approach focuses on technical excellence, transparent workflows, and meaningful user experiences.
              </p>
              <div className="pt-2 flex items-center gap-3 text-xs font-mono text-text-muted">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                <span>ENGINEERED FOR LONGEVITY & PERFORMANCE</span>
              </div>
            </motion.div>

            {/* Right Column: 2x2 grid of value / principle cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                {
                  title: 'Technical Rigor',
                  desc: 'Architected with modern industry standards, zero bloat, and resilient type safety for long-term maintainability.',
                  icon: Cpu,
                },
                {
                  title: 'Design Precision',
                  desc: 'Deliberate typography hierarchy, WCAG contrast compliance, and responsive clarity across every viewport.',
                  icon: Sparkles,
                },
                {
                  title: 'Scalable Systems',
                  desc: 'Systems engineered to expand effortlessly as user demand grows, avoiding premature technical debt.',
                  icon: Layers,
                },
                {
                  title: 'Reliable Execution',
                  desc: 'Transparent milestones, clean deliverables, and surgical attention to code quality from concept to production.',
                  icon: CheckCircle2,
                },
              ].map((val, index) => (
                <motion.div
                  key={val.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : index * 0.08,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="p-6 rounded-2xl bg-surface-2 border border-border/70 hover:border-accent/40 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col group [transform:translateZ(0)]"
                >
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-accent-soft text-accent-strong flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <val.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-text-primary mb-2">
                    {val.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {val.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Tech Stack Section */}
      <section className={cn('py-16 md:py-24', techBg)}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mb-12 md:mb-16">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4 }}
              className="mb-4"
            >
              <SectionCaption text="TECHNOLOGIES" />
            </motion.div>
            <motion.h2
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.06 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-text-primary mb-4"
            >
              Engineering Tech Stack
            </motion.h2>
            <motion.p
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.12 }}
              className="text-text-secondary text-base sm:text-lg md:text-xl leading-relaxed"
            >
              Our specialized technical arsenal is composed of industry-leading technologies optimized for performance, scalability, and long-term maintainability.
            </motion.p>
          </div>

          <div className="relative group">
            <div 
              ref={skillsScrollRef}
              style={{
                maskImage: `linear-gradient(to right, ${showLeftFade ? 'transparent' : 'black'} 0%, black ${showLeftFade ? '100px' : '0%'}, black ${showRightFade ? 'calc(100% - 100px)' : '100%'}, ${showRightFade ? 'transparent' : 'black'} 100%)`,
                WebkitMaskImage: `linear-gradient(to right, ${showLeftFade ? 'transparent' : 'black'} 0%, black ${showLeftFade ? '100px' : '0%'}, black ${showRightFade ? 'calc(100% - 100px)' : '100%'}, ${showRightFade ? 'transparent' : 'black'} 100%)`,
              }}
              className="flex gap-6 py-4 overflow-x-auto px-4 -mx-4 hide-scrollbar snap-x snap-mandatory scroll-smooth"
            >
              {([...skills].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || []).map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : index * 0.04,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  className="shrink-0 w-44 snap-center select-none h-full"
                >
                  <div className="feature-hover-card p-6 rounded-2xl bg-surface-2 border border-border/70 shadow-card flex flex-col items-center text-center group h-full relative overflow-hidden">
                    <div className="feature-hover-card-icon tech-icon-bg w-14 h-14 shrink-0 rounded-xl bg-surface-3 flex items-center justify-center mb-4 relative z-10">
                      <TechStackIcon stack={skill} className="w-7 h-7 text-accent" fallback={Layers} />
                    </div>
                    <h4 className="font-display font-bold text-sm text-text-primary mb-1 relative z-10">
                      {skill.name}
                    </h4>
                    <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider relative z-10">
                      {skill.classification || 'General'}
                    </div>
                  </div>
                </motion.div>
              ))}
              {skills.length === 0 && (
                <div className="w-full flex justify-center py-12">
                  <EmptyState icon={Layers} title="No Tech Stacks Cataloged" description="The engineering tech stack matrix is currently empty." />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA Section (Requirement 5: Attractive Full-width Rounded Banner with Gradient and Ambient Patterns) */}
      <section className={cn('py-16 md:py-24', ctaBg)}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55 }}
            className="relative rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-br from-surface-2 via-surface-1 to-surface-2 dark:from-surface-2 dark:via-surface-3/60 dark:to-surface-2 shadow-card p-8 sm:p-14 md:p-20 text-center"
          >
            {/* Soft decorative blurred shapes & pattern */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:24px_24px]" />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <div className="mb-6">
                <SectionCaption text="GET STARTED" />
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
                Ready to engineer your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-indigo-500 dark:from-accent dark:to-sky-400">
                  digital edge?
                </span>
              </h2>

              <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed font-normal">
                Join our network of precision-built applications. We transform complex technical requirements into high-performance digital experiences.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full px-8 py-3.5 h-12 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 font-semibold cursor-pointer inline-flex items-center justify-center gap-2 group/cta"
                  onClick={() => navigate('/contact')}
                >
                  <span>Start Project Inquiry</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/cta:translate-x-1 will-change-transform" />
                </Button>
                <Button 
                  variant="glass" 
                  size="lg" 
                  className="w-full sm:w-auto rounded-full px-8 py-3.5 h-12 hover:-translate-y-0.5 transition-all duration-300 font-medium cursor-pointer"
                  onClick={() => navigate('/services')}
                >
                  Explore Services
                </Button>
              </div>

              <div className="mt-12 pt-8 border-t border-border/40 w-full flex flex-wrap items-center justify-center gap-6 text-text-muted text-xs font-medium">
                <div className="inline-flex items-center gap-2">
                  <LucideIcons.CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Industry Standards Verified</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
                <div className="inline-flex items-center gap-2">
                  <LucideIcons.ShieldAlert className="w-4 h-4 text-accent" />
                  <span>Secure by Design</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
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
  const services = [...servicesData]
    .filter((s) => s.active !== false && s.isActive !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
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
    return products
      .filter((p: Product) => p.active !== false && p.isActive !== false)
      .filter((p: Product) => filter === 'all' || p.parentService === filter || p.serviceId === filter)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
            {s.title || s.name}
          </Button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState 
          icon={ShoppingBag}
          title="No Projects Found"
          description={filter === 'all' ? "The engineering showcase is currently empty." : "No projects currently associated with this service category."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {filteredProducts.map((p) => {
            const parentSrv = services.find((s) => s.id === (p.parentService || p.serviceId));
            return (
              <ProjectCard
                key={p.id}
                project={p}
                parentServiceName={parentSrv ? (parentSrv.title || (parentSrv as any).name) : undefined}
                showTags={true}
              />
            );
          })}
        </div>
      )}
    </Section>
    </div>
  );
};

export const TechStacksPage = () => {
  const techStacks = useAppStore((state) => state.techStacks);
  
  const stackGroups = useMemo(() => {
    return techStacks.reduce((acc, stack) => {
      const cat = stack.classification || (stack as any).category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(stack);
      return acc;
    }, {} as Record<string, TechStack[]>);
  }, [techStacks]);

  return (
    <div className="flex flex-col">
      <SubPageHero 
        title={<>Tech <span className="text-primary">Stacks.</span></>}
        subtitle="The foundation of our precision engineering and digital craftsmanship, powered by industry-leading core technologies."
        badge="Capability Matrix"
      />
      <Section>
      {techStacks.length === 0 ? (
        <EmptyState 
          icon={Layers}
          title="No Tech Stacks Cataloged"
          description="Tech stack synchronization in progress. Loading expert capabilities."
        />
      ) : (
        <div className="space-y-20">
          {Object.entries(stackGroups).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-[11px] font-bold text-primary uppercase tracking-[0.4em] whitespace-nowrap px-4 py-1.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-full">
                  {category}
                </h2>
                <div className="h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {(items as TechStack[]).sort((a, b) => {
                  const orderA = a.order ?? 999;
                  const orderB = b.order ?? 999;
                  if (orderA !== orderB) return orderA - orderB;
                  return a.name.localeCompare(b.name);
                }).map(stack => (
                  <GlassCard key={stack.id} className="p-6 text-center group py-8">
                    <div className="w-14 h-14 bg-surface-4 border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-soft transition-colors shadow-xs">
                      <TechStackIcon stack={stack} className="w-7 h-7 text-text-muted group-hover:text-primary transition-colors" fallback={Layers} />
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-text-primary">{stack.name}</h3>
                    <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                      {stack.classification || 'General'}
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

export const SkillsPage = TechStacksPage;

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
            className="w-20 h-20 bg-gradient-brand rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-glow transition-transform hover:scale-110 duration-500 relative z-10 transform-gpu [backface-visibility:hidden]"
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

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <InputBlock
            label="Identity Vector (Email)"
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            placeholder="operator@wisebyte.concepts"
            disabled={loading}
            startIcon={<Mail className="w-4 h-4" />}
            autoFocus
          />
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-0.5">
              <Label className="mb-0 text-xs font-semibold">Access Cipher (Password)</Label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 tracking-wider"
              >
                {resetLoading ? 'Decrypting...' : 'Reset Key'}
              </button>
            </div>
            <PasswordInputBlock
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              startIcon={<Lock className="w-4 h-4" />}
            />
          </div>
          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-12 text-sm font-bold shadow-glow-primary rounded-xl mt-2"
          >
            {loading ? 'Authenticating...' : 'Authorize Access'}
          </Button>
        </form>
        
        <div className="mt-10 pt-6 border-t border-divider flex justify-between items-center text-[10px] font-mono text-text-muted uppercase tracking-widest">
          <span>SEC: FIREBASE v11+</span>
          <button onClick={() => navigate('/')} className="hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer">
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
              Total Tech Stacks
            </h3>
            <Layers className="w-4 h-4 text-purple-400 opacity-50" />
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

export const AdminServicesPage = () => {
  const { services, deleteService, reorderServices, updateService } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();

  const handleToggleActive = async (s: Service, currentActive: boolean) => {
    const next = !currentActive;
    const previous = { ...s };
    // Optimistic update
    useAppStore.setState((state) => ({
      services: state.services.map((item) =>
        item.id === s.id ? { ...item, active: next, isActive: next } : item
      ),
    }));

    try {
      await updateService({ ...s, active: next, isActive: next });
      addToast(`Service "${s.title || s.name || ''}" is now ${next ? 'Active' : 'Hidden'}`, 'success');
    } catch (error: any) {
      // Revert plus error toast on failure
      useAppStore.setState((state) => ({
        services: state.services.map((item) =>
          item.id === s.id ? previous : item
        ),
      }));
      addToast('Failed to update service status. Reverted.', 'error');
    }
  };

  const openAdd = () => {
    navigate('/admin/services/new');
  };

  const openEdit = (s: Service) => {
    navigate(`/admin/services/edit/${s.id}`);
  };

  const handleDelete = async (s: Service) => {
    const title = s.title || s.name || "Untitled Service";
    if (!confirm(`Delete service "${title}"?`)) return;
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
              <TableHead>Title / Slug</TableHead>
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
            {ordered.map((s, index) => {
              const title = s.title || s.name || "Untitled Service";
              const isAct = s.active !== undefined ? s.active : (s.isActive !== undefined ? s.isActive : true);
              const isFeat = s.featured !== undefined ? s.featured : (s.isFeatured !== undefined ? s.isFeatured : false);
              return (
                <SortableRow key={s.id} id={s.id}>
                  {() => (
                    <>
                      <TableCell className="text-muted-foreground font-mono text-xs">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-bold flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-surface-4 border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {s.iconType === 'image' && s.iconImage ? (
                              <img src={s.iconImage} alt={title} className="w-5 h-5 object-contain" />
                            ) : (
                              <DynamicIcon name={s.icon} className="w-4 h-4 text-accent" fallback={Zap} />
                            )}
                          </div>
                          <span className="truncate">{title}</span>
                          {isFeat && <Star className="h-3.5 w-3.5 fill-accent text-accent shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text-muted font-mono lowercase tracking-tighter">/{String(s.slug || s.id).toLowerCase()}</span>
                          {formatServicePrice(s) && (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {formatServicePrice(s)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="capitalize font-mono text-[10px]">{s.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(s.tags ?? []).slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] bg-surface-4 border border-border px-2 py-0.5 rounded text-text-secondary">#{t}</span>
                          ))}
                          {(s.tags?.length ?? 0) > 2 && (
                            <span className="text-[10px] text-text-muted">+{s.tags!.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={Boolean(isAct)}
                            onCheckedChange={() => handleToggleActive(s, Boolean(isAct))}
                          />
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isAct ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isAct ? 'Active' : 'Hidden'}
                          </span>
                        </div>
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
              );
            })}
          </TableBody>
        </SortableList>
      </CrudPageShell>
    </div>
  );
};

export const AdminProductsPage = () => {
  const { products, services, deleteProduct, reorderProducts, updateProduct } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();

  const handleToggleActive = async (p: Product, currentActive: boolean) => {
    const next = !currentActive;
    const previous = { ...p };
    // Optimistic update
    useAppStore.setState((state) => ({
      products: state.products.map((item) =>
        item.id === p.id ? { ...item, active: next, isActive: next } : item
      ),
    }));

    try {
      await updateProduct({ ...p, active: next, isActive: next });
      addToast(`Project "${p.title || p.name || ''}" is now ${next ? 'Active' : 'Hidden'}`, 'success');
    } catch (error: any) {
      // Revert plus error toast on failure
      useAppStore.setState((state) => ({
        products: state.products.map((item) =>
          item.id === p.id ? previous : item
        ),
      }));
      addToast('Failed to update project status. Reverted.', 'error');
    }
  };

  const openAdd = () => {
    navigate('/admin/products/new');
  };

  const openEdit = (p: Product) => {
    navigate(`/admin/products/edit/${p.id}`);
  };

  const handleDelete = async (p: Product) => {
    const title = p.title || p.name || 'Untitled Project';
    if (!confirm(`Remove project "${title}"?`)) return;
    try {
      await deleteProduct(p.id);
      addToast("Project removed", "success");
    } catch (error: any) {
      addToast("Delete failed", "error");
    }
  };

  const ordered = [...products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CrudPageShell
        title="Projects"
        description="Register and showcase your completed technical projects, case studies, and live deliverables"
        onAdd={openAdd}
        addLabel="Register Project"
        count={products.length}
      >
        <SortableList items={ordered} onReorder={reorderProducts}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead className="w-20">Preview</TableHead>
              <TableHead>Project Title & Slug</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden md:table-cell">Associated Service</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-[120px] text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center text-sm text-muted-foreground font-mono uppercase tracking-widest bg-muted/10">
                   No_Project_Nodes_Found
                </TableCell>
              </TableRow>
            )}
            {ordered.map((p) => {
              const service = services.find(s => s.id === (p.parentService || p.serviceId));
              const title = p.title || p.name || 'Untitled Project';
              const img = p.displayPicture || p.imageUrl;
              const isAct = p.active !== false && p.isActive !== false;
              const isFeat = Boolean(p.featured || p.isFeatured);

              return (
                <SortableRow key={p.id} id={p.id}>
                  {() => (
                    <>
                      <TableCell>
                        <div className="w-12 h-12 rounded-xl bg-surface-4 border border-border overflow-hidden relative">
                          {img ? (
                            <img src={img} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-3">
                              {p.iconType === 'image' && p.iconImage ? (
                                <img src={p.iconImage} alt="" className="w-6 h-6 object-contain" />
                              ) : (
                                <DynamicIcon name={p.icon} className="w-6 h-6 text-text-muted" fallback={ShoppingBag} />
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold flex items-center gap-2 text-foreground">
                          {title}
                          {isFeat && (
                            <Badge variant="outline" className="text-[10px] font-mono border-amber-400/40 text-amber-500 bg-amber-400/10">
                              <Star className="w-2.5 h-2.5 mr-1 fill-amber-400" /> Featured
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono lowercase tracking-tighter">/{String(p.slug || p.id).toLowerCase()}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="capitalize font-mono text-[10px]">{p.category || 'General'}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {service ? (
                          <Badge variant="outline" className="font-mono text-[10px] border-primary/20 text-primary">{service.title || service.name}</Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono italic">Unmapped</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={Boolean(isAct)}
                            onCheckedChange={() => handleToggleActive(p, Boolean(isAct))}
                          />
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isAct ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isAct ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(p)} className="rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(p)} className="rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer">
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
    </div>
  );
};

export const AdminTechStacksPage = () => {
  const { techStacks, addTechStack, updateTechStack, deleteTechStack, reorderTechStacks } = useAppStore();
  const addToast = useToastStore((state) => state.addToast);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TechStack | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (s: TechStack) => {
    setEditing(s);
    setOpen(true);
  };

  const handleSave = async (data: TechStack) => {
    setIsSaving(true);
    try {
      if (editing) {
        await updateTechStack(data);
        addToast("Tech stack updated", "success");
      } else {
        await addTechStack(data);
        addToast("Tech stack added", "success");
      }
      setOpen(false);
    } catch (error: any) {
      addToast(error?.message || "Operation failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (s: TechStack) => {
    if (!confirm(`Delete tech stack "${s.name}"?`)) return;
    try {
      await deleteTechStack(s.id);
      addToast("Tech stack deleted", "success");
    } catch (error: any) {
      addToast(error?.message || "Delete failed", "error");
    }
  };

  const ordered = [...techStacks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CrudPageShell
        title="Tech Stacks"
        description="Manage technologies, frameworks, and engineering tools in your tech stack"
        onAdd={openAdd}
        addLabel="Add Tech Stack"
        count={techStacks.length}
      >
        <SortableList items={ordered} onReorder={reorderTechStacks}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead>Tech Stack Identity</TableHead>
              <TableHead className="hidden md:table-cell">Classification</TableHead>
              <TableHead className="hidden sm:table-cell">Icon Source</TableHead>
              <TableHead className="w-24 text-center">Order</TableHead>
              <TableHead className="w-[120px] text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center text-sm text-muted-foreground uppercase tracking-widest bg-muted/10">
                   No Tech Stacks Found
                </TableCell>
              </TableRow>
            )}
            {ordered.map((s) => (
              <SortableRow key={s.id} id={s.id}>
                {() => (
                  <>
                    <TableCell>
                      <div className="font-bold flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-4 border border-border flex items-center justify-center shrink-0 shadow-xs">
                           <TechStackIcon stack={s} className="w-5 h-5 text-primary" />
                        </div>
                        <span className="truncate max-w-[200px]">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {s.classification || s.category || 'Other'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground capitalize font-medium">
                        {s.iconType === 'link' ? 'Custom Link' : s.iconType === 'image' ? 'Media Image' : 'Library Icon'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      #{s.order ?? 0}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" onOpenChange={setOpen}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tech Stack" : "New Tech Stack"}</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <TechStackForm
              initialData={editing || undefined}
              onSubmit={handleSave}
              onCancel={() => setOpen(false)}
              isLoading={isSaving}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const AdminSkillsPage = AdminTechStacksPage;

export { ServiceDetailPage } from './ServiceDetailPage';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, services, techStacks } = useAppStore();
  const { user } = useAuthStore();
  const isAdmin = Boolean(user);
  
  const product = products.find(p => p.id === id || p.slug === id);
  const service = services.find(s => s.id === (product?.parentService || product?.serviceId));

  const parentServiceId = product?.parentService || (product as any)?.serviceId || service?.id;
  const productAny = product as any;
  const ctaButtonText = (
    product?.ctaButtonText ||
    productAny?.cta?.buttonText ||
    productAny?.cta?.ctaButtonText ||
    productAny?.cta?.label ||
    productAny?.ctaButton ||
    'Inquire About This Project'
  ).trim();
  const ctaContactUrl = parentServiceId
    ? `/contact?service=${encodeURIComponent(parentServiceId)}&project=${encodeURIComponent(product?.id || '')}`
    : `/contact?project=${encodeURIComponent(product?.id || '')}`;

  const handleInquireClick = () => {
    navigate(ctaContactUrl);
  };

  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);

  // SEO Synchronization
  useEffect(() => {
    if (product) {
      const projTitle = product.title || product.name || 'Project Details';
      document.title = `${projTitle} | Project Showcase | Wise Byte Concepts`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && (product.shortDescription || product.description)) {
        meta.setAttribute('content', product.shortDescription || product.description || '');
      }
    }
  }, [product]);

  const isInactive = product?.active === false || product?.isActive === false;

  if (!product || (isInactive && !isAdmin)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-surface-4 border border-border rounded-3xl flex items-center justify-center mb-8 shadow-xs">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Project Not Found</h1>
        <p className="text-muted-foreground max-w-md mb-8 text-sm">
          The requested project instance could not be retrieved or is currently not published to the public showcase.
        </p>
        <Button onClick={() => navigate('/products')} className="gap-2 rounded-xl cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Project Showcase
        </Button>
      </div>
    );
  }

  const title = product.title || product.name || 'Untitled Project';
  const heroBanner = product.bannerPicture || product.displayPicture || product.imageUrl;
  const isImageBadge = product.iconType === 'image' && Boolean(product.iconImage);

  // Value props metrics
  const deliveredWithin = product.deliveredWithin || { unit: 'Weeks', range: '3–6' };
  const deliveredWithinText = deliveredWithin.unit === 'Depends Upon Project'
    ? 'Depends Upon Project'
    : `${deliveredWithin.range ? `${deliveredWithin.range} ` : ''}${deliveredWithin.unit}`.trim();

  // Core Features & Deliverables
  const coreFeatures = Array.isArray(product.coreFeatures) ? product.coreFeatures : [];
  const deliverables = Array.isArray(product.deliverables) ? product.deliverables : [];

  // Technologies
  const projectTechStackIds = product.techStacks || product.technologies || [];
  const mappedTechStacks = projectTechStackIds.map(ref => {
    return techStacks.find(t => t.id === ref || t.name === ref) || {
      id: ref,
      name: ref,
      classification: 'Stack Component',
      iconType: 'icon' as const,
      icon: 'Cpu'
    };
  });

  // Showcase Gallery
  const gallery = Array.isArray(product.gallery) ? product.gallery.filter(Boolean) : [];
  const liveLink = product.liveLink || product.demoUrl;
  const gitRepo = product.gitRepository || product.repoUrl;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 border-b border-border/60 overflow-hidden bg-surface-1/40">
        {heroBanner && (
          <div className="absolute inset-0 z-0 opacity-15 dark:opacity-20 pointer-events-none">
            <img 
              src={heroBanner} 
              alt={title} 
              className="w-full h-full object-cover blur-md scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>
        )}

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => navigate('/products')}
              className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em] cursor-pointer"
            >
              <ArrowLeft className="mr-2 w-3.5 h-3.5" /> Back to Showcase
            </button>

            {isInactive && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[11px] font-mono">
                Admin Preview (Inactive Project)
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold tracking-[0.25em] uppercase rounded-full font-mono">
                  Project Case Study
                </span>
                {product.category && (
                  <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider font-semibold">
                    {product.category}
                  </Badge>
                )}
                {service && (
                  <Link 
                    to={`/services/${service.slug || service.id}`}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors uppercase font-mono tracking-wider flex items-center gap-1"
                  >
                    <span>Discipline:</span>
                    <strong className="text-foreground hover:underline">{service.title || service.name}</strong>
                  </Link>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center shrink-0 shadow-glow-sm">
                  {isImageBadge ? (
                    <img src={product.iconImage} alt="" className="w-7 h-7 object-contain rounded-lg" />
                  ) : (
                    <DynamicIcon name={product.icon} className="w-7 h-7 text-primary shadow-glow-primary" fallback={ShoppingBag} />
                  )}
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                    {title}
                  </h1>
                  {product.caption && (
                    <p className="text-base md:text-lg font-medium text-primary/90 mt-2 font-display">
                      {product.caption}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {product.shortDescription || product.description}
              </p>

              {/* Deployment & Inquire Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Button 
                  size="lg" 
                  onClick={handleInquireClick}
                  className="rounded-xl px-7 gap-2 shadow-glow-primary font-semibold cursor-pointer"
                >
                  <span>{ctaButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                {liveLink && (
                  <a href={liveLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="glass" size="lg" className="rounded-xl px-6 gap-2 font-semibold cursor-pointer">
                      <Globe className="w-4 h-4" /> Live Application <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </Button>
                  </a>
                )}
                {gitRepo && (
                  <a href={gitRepo} target="_blank" rel="noopener noreferrer">
                    <Button variant="glass" size="lg" className="rounded-xl px-6 gap-2 font-semibold cursor-pointer">
                      <Github className="w-4 h-4" /> Source Repository <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Hero Main Screenshot Display */}
            <div className="lg:col-span-5">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition duration-700" />
                <div className="aspect-[16/10] bg-surface-2 border border-border/80 rounded-2xl overflow-hidden shadow-card relative">
                  {heroBanner ? (
                    <img 
                      src={heroBanner} 
                      alt={title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-surface-3">
                      <DynamicIcon name={product.icon} className="w-12 h-12 mb-3 text-muted-foreground/40" fallback={ShoppingBag} />
                      <p className="text-xs font-mono uppercase tracking-wider">No Preview Image Uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 pt-8 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-2/60 border border-border/40">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> Delivery Timeframe
              </div>
              <div className="text-sm font-bold text-foreground">{deliveredWithinText}</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-2/60 border border-border/40">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" /> Category
              </div>
              <div className="text-sm font-bold text-foreground">{product.category || 'Web Application'}</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-2/60 border border-border/40">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-primary" /> Tech Components
              </div>
              <div className="text-sm font-bold text-foreground">{mappedTechStacks.length} Modules</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-2/60 border border-border/40">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Deliverables
              </div>
              <div className="text-sm font-bold text-foreground">{deliverables.length} Key Outputs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Architecture Specifications */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left 8 Columns: Markdown Case Study, Core Features, Deliverables, Gallery */}
            <div className="lg:col-span-8 space-y-14">
              {/* Markdown Documentation */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 pb-2 border-b border-border/60 w-full">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">01 / Specifications</span>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Project Case Study & Documentation</h2>
                </div>

                <div className="p-6 md:p-8 rounded-2xl bg-surface-1 border border-border/60">
                  <MarkdownContent 
                    content={product.fullDescription || product.shortDescription || product.description || ''} 
                    className="text-foreground/90 leading-relaxed text-sm md:text-base space-y-4"
                  />
                </div>
              </div>

              {/* Core Features */}
              {coreFeatures.length > 0 && (
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 pb-2 border-b border-border/60 w-full">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">02 / Capabilities</span>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">Core Engineered Capabilities</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coreFeatures.map((feat, index) => (
                      <div key={index} className="p-5 rounded-2xl bg-surface-1 border border-border/60 hover:border-primary/40 transition-colors shadow-xs space-y-2.5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                          <DynamicIcon name={feat.icon} className="w-5 h-5" fallback={CheckCircle2} />
                        </div>
                        <h3 className="font-bold text-base text-foreground">{feat.title}</h3>
                        {feat.description && (
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {feat.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliverables */}
              {deliverables.length > 0 && (
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 pb-2 border-b border-border/60 w-full">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent">03 / Handover</span>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">Deliverables & Key Outputs</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {deliverables.map((deliv, index) => (
                      <div key={index} className="p-5 rounded-2xl bg-surface-1 border border-border/60 hover:border-accent/40 transition-colors shadow-xs space-y-2.5">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                          <DynamicIcon name={deliv.icon} className="w-5 h-5" fallback={CheckCircle2} />
                        </div>
                        <h3 className="font-bold text-base text-foreground">{deliv.title}</h3>
                        {deliv.description && (
                          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                            {deliv.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Showcase Gallery */}
              {gallery.length > 0 && (
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 pb-2 border-b border-border/60 w-full">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">04 / Artifacts</span>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">Visual Gallery & UI Artifacts</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((imgUrl, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveGalleryIndex(index)}
                        className="group aspect-[16/10] rounded-xl overflow-hidden bg-surface-2 border border-border/60 relative cursor-pointer hover:border-primary transition-all shadow-xs"
                      >
                        <img 
                          src={imgUrl} 
                          alt={`${title} screenshot ${index + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1 rounded-lg bg-background/90 text-[11px] font-bold text-foreground shadow-sm">
                            Enlarge View
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Columns: Sidebar, Tech Stacks, Links, Parent Service Card */}
            <div className="lg:col-span-4 space-y-6">
              {/* Production Access Card */}
              {(liveLink || gitRepo) && (
                <div className="p-6 rounded-2xl bg-surface-1 border border-border/60 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> Production Deployment
                  </h3>

                  <div className="space-y-3">
                    {liveLink && (
                      <a href={liveLink} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="w-full justify-between rounded-xl h-11 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Live Application
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </Button>
                      </a>
                    )}
                    {gitRepo && (
                      <a href={gitRepo} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="glass" className="w-full justify-between rounded-xl h-11 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <Github className="w-4 h-4" /> Git Repository
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Technologies Employed */}
              {mappedTechStacks.length > 0 && (
                <div className="p-6 rounded-2xl bg-surface-1 border border-border/60 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Technologies Used
                  </h3>

                  <div className="grid grid-cols-1 gap-2.5">
                    {mappedTechStacks.map((stk) => (
                      <div 
                        key={stk.id} 
                        className="p-2.5 rounded-xl bg-surface-2/60 border border-border/40 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
                          <TechStackIcon stack={stk} className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">{stk.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground uppercase">{stk.classification}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="p-6 rounded-2xl bg-surface-1 border border-border/60 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-foreground">
                    Project Keywords
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-md bg-surface-2 text-xs font-mono text-muted-foreground border border-border/40">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Parent Service Card */}
              {service && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-surface-1 to-surface-2 border border-primary/20 space-y-4">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                    Parent Service Capability
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <DynamicIcon name={service.icon} className="w-5 h-5" fallback={Briefcase} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-snug">{service.title || service.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {service.shortDescription || service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="glass" 
                      className="flex-1 justify-between rounded-xl text-xs cursor-pointer"
                      onClick={() => navigate(`/services/${service.slug || service.id}`)}
                    >
                      <span>Explore Service</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                    <Button 
                      className="flex-1 justify-between rounded-xl text-xs cursor-pointer shadow-xs"
                      onClick={handleInquireClick}
                    >
                      <span>Scope Project</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action Section */}
      <section className="py-16 md:py-20 border-t border-border/50 bg-surface-1/40">
        <div className="container mx-auto px-6">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-surface-1 via-surface-2 to-primary/5 p-8 sm:p-12 md:p-16 text-center shadow-xl relative overflow-hidden max-w-4xl mx-auto">
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                {product.ctaHeading || productAny?.cta?.heading || 'Ready to engineer a similar solution for your organization?'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {product.ctaText || productAny?.cta?.text || productAny?.cta?.description || 'Connect with our engineering leads to discuss your scope, deliverables, and production roadmap.'}
              </p>
              <div className="pt-2 flex justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate(ctaContactUrl)}
                  className="rounded-xl px-8 h-12 text-sm font-bold shadow-glow-primary gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <span>{ctaButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Gallery Lightbox Modal */}
      {activeGalleryIndex !== null && gallery[activeGalleryIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setActiveGalleryIndex(null)}
        >
          <div 
            className="max-w-5xl w-full max-h-[90vh] bg-surface-1 border border-border rounded-2xl overflow-hidden shadow-2xl relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                Artifact {activeGalleryIndex + 1} of {gallery.length}
              </span>
              <button 
                type="button" 
                onClick={() => setActiveGalleryIndex(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 cursor-pointer transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-2 flex-1 overflow-auto flex items-center justify-center bg-surface-0 min-h-[300px]">
              <img 
                src={gallery[activeGalleryIndex]} 
                alt={`${title} enlarged`} 
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ContactPage } from './ContactPage';
export { AdminQueriesPage } from './AdminQueriesPage';

export * from './NotFoundPage';
export * from './AdminMediaPage';
export * from './AdminServiceEditPage';
export * from './AdminProductEditPage';

