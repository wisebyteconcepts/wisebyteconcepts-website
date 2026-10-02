import React from 'react';
import * as LucideIcons from 'lucide-react';
import * as RemixIcons from '@remixicon/react';
import * as HeroOutline from '@heroicons/react/24/outline';
import * as HeroSolid from '@heroicons/react/24/solid';
import { IconLibrary, IconVariant, IconValue, normalizeIcon } from '@/types/icon';
import { cn } from '@/lib/utils';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  library?: IconLibrary;
  name?: string;
  variant?: IconVariant;
  value?: IconValue | string | null;
  className?: string;
  fallback?: React.ComponentType<{ className?: string }>;
  size?: number | string;
}

/**
 * Graceful Missing Icon Placeholder
 */
export const MissingIconPlaceholder: React.FC<{ className?: string; title?: string }> = ({
  className,
  title = "Missing Icon"
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("w-5 h-5 opacity-40 text-muted-foreground shrink-0", className)}
    aria-label={title}
  >
    <rect x="3" y="3" width="18" height="18" rx="4" strokeDasharray="3 3" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/**
 * Universal Icon Component
 * Renders an icon from Lucide, Remix Icon, or Heroicons with backward-compatibility,
 * support for custom asset URLs, and a graceful missing-icon placeholder.
 */
export const Icon: React.FC<IconProps> = ({
  library: propLibrary,
  name: propName,
  variant: propVariant,
  value,
  className,
  fallback: Fallback,
  size,
  ...rest
}) => {
  // Normalize parameters
  let lib: IconLibrary = propLibrary || 'lucide';
  let iconName: string = propName || '';
  let variant: IconVariant | undefined = propVariant;

  if (value) {
    const norm = normalizeIcon(value);
    if (norm) {
      lib = norm.library;
      iconName = norm.name;
      variant = norm.variant || variant;
    } else if (typeof value === 'string') {
      iconName = value;
    }
  }

  // Handle empty or missing icon name
  if (!iconName) {
    if (Fallback) return <Fallback className={className} />;
    return <MissingIconPlaceholder className={className} />;
  }

  // Handle URL / Image asset
  const isUrl =
    iconName.startsWith('http://') ||
    iconName.startsWith('https://') ||
    iconName.startsWith('data:') ||
    iconName.startsWith('/') ||
    iconName.includes('.');

  if (isUrl) {
    return (
      <img
        src={iconName}
        alt="icon"
        className={cn("object-contain shrink-0", className)}
        referrerPolicy="no-referrer"
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  // 1. Heroicons
  if (lib === 'hero') {
    let key = iconName;
    if (!key.endsWith('Icon')) {
      key = `${key}Icon`;
    }
    // Remove Hi or HiOutline prefix if present
    key = key.replace(/^HiOutline|^Hi/, '');
    if (!key.endsWith('Icon')) {
      key = `${key}Icon`;
    }

    const isSolid = variant === 'solid';
    const Component = isSolid
      ? (HeroSolid as any)[key] || (HeroOutline as any)[key]
      : (HeroOutline as any)[key] || (HeroSolid as any)[key];

    if (Component) {
      return (
        <Component
          className={cn("shrink-0", className)}
          style={size ? { width: size, height: size } : undefined}
          {...(rest as any)}
        />
      );
    }
  }

  // 2. Remix Icons
  if (lib === 'remix') {
    let key = iconName;
    if (!key.startsWith('Ri')) {
      key = `Ri${key}`;
    }

    // Handle variant Line / Fill
    if (variant === 'fill') {
      if (key.endsWith('Line')) {
        key = `${key.slice(0, -4)}Fill`;
      } else if (!key.endsWith('Fill')) {
        key = `${key}Fill`;
      }
    } else if (variant === 'line') {
      if (key.endsWith('Fill')) {
        key = `${key.slice(0, -4)}Line`;
      } else if (!key.endsWith('Line')) {
        key = `${key}Line`;
      }
    }

    let Component = (RemixIcons as any)[key];

    // If specific variant not found, try the other variant
    if (!Component) {
      if (key.endsWith('Line')) {
        Component = (RemixIcons as any)[`${key.slice(0, -4)}Fill`];
      } else if (key.endsWith('Fill')) {
        Component = (RemixIcons as any)[`${key.slice(0, -4)}Line`];
      }
    }

    // Direct lookup as fallback
    if (!Component) {
      Component = (RemixIcons as any)[iconName];
    }

    if (Component) {
      return (
        <Component
          className={cn("shrink-0", className)}
          style={size ? { width: size, height: size } : undefined}
          {...(rest as any)}
        />
      );
    }
  }

  // 3. Lucide Icons (or fallback lookup)
  let lucideKey = iconName;
  // Capitalize first letter if lowercase
  if (lucideKey.length > 0 && /^[a-z]/.test(lucideKey)) {
    lucideKey = lucideKey.charAt(0).toUpperCase() + lucideKey.slice(1);
  }

  let LucideComponent = (LucideIcons as any)[lucideKey];

  // Try case-insensitive lookup in Lucide if not found directly
  if (!LucideComponent) {
    const foundKey = Object.keys(LucideIcons).find(
      k => k.toLowerCase() === iconName.toLowerCase()
    );
    if (foundKey) {
      LucideComponent = (LucideIcons as any)[foundKey];
    }
  }

  if (LucideComponent && typeof LucideComponent === 'function') {
    return (
      <LucideComponent
        className={cn("shrink-0", className)}
        style={size ? { width: size, height: size } : undefined}
        {...(rest as any)}
      />
    );
  }

  // Cross-library lookup before giving up (if library mismatch)
  // Check Heroicons
  const heroKey = iconName.endsWith('Icon') ? iconName : `${iconName}Icon`;
  if ((HeroOutline as any)[heroKey]) {
    const Comp = (HeroOutline as any)[heroKey];
    return <Comp className={cn("shrink-0", className)} style={size ? { width: size, height: size } : undefined} {...(rest as any)} />;
  }

  // Check Remix
  const riKey = iconName.startsWith('Ri') ? iconName : `Ri${iconName}Line`;
  if ((RemixIcons as any)[riKey]) {
    const Comp = (RemixIcons as any)[riKey];
    return <Comp className={cn("shrink-0", className)} style={size ? { width: size, height: size } : undefined} {...(rest as any)} />;
  }

  // Final fallback
  if (Fallback) {
    return <Fallback className={className} />;
  }

  return <MissingIconPlaceholder className={className} title={`Icon not found: ${iconName}`} />;
};

export default Icon;
