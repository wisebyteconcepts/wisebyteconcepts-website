import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Code } from 'lucide-react';
import { Service } from '@/types';
import { Icon } from '@/components/ui/Icon';
import { CategoryBadge } from '@/components/CategoryBadge';
import { cn } from '@/lib/utils';

export interface ServiceCardProps {
  service: Service;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const title = service.title || (service as any).name || 'Untitled Service';
  const img = service.displayPicture || (service as any).thumbnail;
  const link = `/services/${service.slug || service.id}`;
  const desc = service.shortDescription || service.description || 'Specialized digital service engineered to achieve high impact and scalable results.';

  useEffect(() => {
    if (!imgRef.current || !cardRef.current) return;
    const updateHeight = () => {
      if (imgRef.current && cardRef.current) {
        cardRef.current.style.setProperty('--card-img-height', `${imgRef.current.offsetHeight}px`);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "app-card relative rounded-2xl bg-surface-2 border border-border/70",
        "flex flex-col h-full overflow-visible origin-center [container-type:inline-size]",
        className
      )}
    >
      {/* 1. Image Wrapper: overflow-hidden is ONLY on the image container for the zoom */}
      <div
        ref={imgRef}
        className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-surface-3 isolate"
      >
        {img ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="app-card-image w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-3 to-surface-4">
            <Icon value={service.icon} className="w-12 h-12 text-accent/30" fallback={Code} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-transparent to-transparent opacity-60 pointer-events-none z-10" />
      </div>

      {/* 2. Floating Icon Badge: Direct child of card root, positioned absolutely at right: 24px (no border/ring/outline, solid background, soft colored shadow) */}
      <div
        className="absolute z-20 right-6 w-12 h-12 shrink-0 rounded-xl bg-accent-strong flex items-center justify-center text-on-accent shadow-md shadow-accent/20 [transform:translateZ(0)] [backface-visibility:hidden] pointer-events-none"
        style={{
          top: 'calc(var(--card-img-height, 62.5cqw) - 24px)',
        }}
      >
        {service.iconType === 'image' && service.iconImage ? (
          <img src={service.iconImage} alt="" className="w-6 h-6 object-contain" />
        ) : (
          <Icon value={service.icon} className="w-6 h-6 text-on-accent" fallback={Briefcase} />
        )}
      </div>

      {/* 3. Content Section: ample top padding and right padding to ensure title, category pill & description never collide */}
      <div className="p-6 sm:p-8 pt-9 sm:pt-10 flex-1 flex flex-col rounded-b-2xl">
        {service.category && (
          <div className="mb-2.5 max-w-[calc(100%-3.5rem)]">
            <CategoryBadge text={service.category} />
          </div>
        )}
        <Link to={link} className="block group/title">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-text-primary group-hover/title:text-accent transition-colors duration-300 mb-2.5 line-clamp-2">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-text-secondary leading-relaxed mb-6 line-clamp-3">
          {desc}
        </p>

        {/* Card Footer: View Details link with smooth CSS hover arrow translation */}
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-end">
          <Link
            to={link}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent hover:text-accent-strong transition-colors duration-300 py-1"
          >
            <span>View Details</span>
            <ArrowRight className="app-card-arrow w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
