import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Project } from '@/types';
import { Icon } from '@/components/ui/Icon';
import { CategoryBadge } from '@/components/CategoryBadge';
import { formatCardHook } from '@/config/card';
import { cn } from '@/lib/utils';

export interface ProjectCardProps {
  project: Project;
  className?: string;
  parentServiceName?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  className,
  parentServiceName,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const title = project.title || (project as any).name || 'Untitled Project';
  const img = project.displayPicture || (project as any).imageUrl;
  const link = `/products/${project.slug || project.id}`;
  const rawHook = project.caption?.trim() || project.shortDescription?.trim() || project.description?.trim() || '';
  const hookText = formatCardHook(rawHook);

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
        "card-elevate app-card relative rounded-2xl bg-surface-2 border border-border/70",
        "flex flex-col h-full overflow-visible origin-center [container-type:inline-size]",
        className
      )}
    >
      {/* 1. Image Wrapper: overflow-hidden is ONLY here to contain image zoom */}
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
            <Icon value={project.icon} className="w-12 h-12 text-accent/30" fallback={ShoppingBag} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-transparent to-transparent opacity-60 pointer-events-none z-10" />
      </div>

      {/* 2. Floating Icon Badge: Direct child of card root, positioned absolutely at right: 24px */}
      <div
        className="absolute z-20 right-6 w-12 h-12 shrink-0 rounded-xl bg-accent-strong flex items-center justify-center text-on-accent [transform:translateZ(0)] [backface-visibility:hidden] pointer-events-none"
        style={{
          top: 'calc(var(--card-img-height, 62.5cqw) - 24px)',
        }}
      >
        {project.iconType === 'image' && project.iconImage ? (
          <img src={project.iconImage} alt="" className="w-6 h-6 object-contain" />
        ) : (
          <Icon value={project.icon} className="w-6 h-6 text-on-accent" fallback={ShoppingBag} />
        )}
      </div>

      {/* 3. Content Section: ample top padding and right margin protection to prevent collision */}
      <div className="px-6 sm:px-8 pt-9 sm:pt-10 pb-[18px] flex-1 flex flex-col rounded-b-2xl">
        <div className="flex flex-wrap items-center gap-2 mb-2.5 max-w-[calc(100%-3.5rem)]">
          {project.category && (
            <CategoryBadge text={project.category} />
          )}
          {parentServiceName && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-3 border border-border/40 text-text-muted text-[10px] font-mono uppercase tracking-wider">
              {parentServiceName}
            </span>
          )}
        </div>

        <Link to={link} className="block group/title">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-text-primary group-hover/title:text-accent transition-colors duration-300 mb-2.5 line-clamp-2">
            {title}
          </h3>
        </Link>
        <p className="card-hook text-sm text-text-secondary leading-6 min-h-[4.5rem] mb-6">
          {hookText}
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
