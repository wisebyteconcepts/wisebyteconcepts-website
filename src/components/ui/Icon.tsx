import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { IconValue, normalizeIcon } from '@/types/icon';
import { getHugeIconsCache, loadHugeIcons, getHugeIconDefinition } from '@/utils/hugeicons';
import { cn } from '@/lib/utils';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  library?: string;
  name?: string;
  variant?: string;
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
  title = "Missing Icon",
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
 * Shared Icon Component
 * Primary renderer: Hugeicons Stroke Rounded (live component).
 * Minimal hidden fallback: Lucide for legacy records.
 * Graceful placeholder for missing/unsupported icons.
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
  let lib = propLibrary || 'huge';
  let iconName = propName || '';

  if (value) {
    const norm = normalizeIcon(value);
    if (norm) {
      lib = norm.library || 'huge';
      iconName = norm.name;
    } else if (typeof value === 'string') {
      iconName = value;
    }
  }

  // Handle Hugeicons lazy cache loading
  const [hugeCache, setHugeCache] = useState(() => getHugeIconsCache());

  useEffect(() => {
    if (lib === 'huge' && !hugeCache) {
      let isMounted = true;
      loadHugeIcons().then((c) => {
        if (isMounted) setHugeCache(c);
      });
      return () => {
        isMounted = false;
      };
    }
  }, [lib, hugeCache]);

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

  // 1. Hugeicons (Primary Set: Free Stroke Rounded)
  if (lib === 'huge') {
    const iconDef = getHugeIconDefinition(iconName, hugeCache);
    if (iconDef) {
      return (
        <HugeiconsIcon
          icon={iconDef}
          size={size}
          strokeWidth={1.5}
          className={cn("shrink-0", className)}
          style={size ? { width: size, height: size } : undefined}
          {...(rest as any)}
        />
      );
    }
  }

  // 2. Hidden Legacy Fallback: Lucide Icons (handles previous database records)
  if (lib === 'lucide' || (lib !== 'huge' && lib !== 'remix' && lib !== 'hero')) {
    let lucideKey = iconName;
    if (lucideKey.length > 0 && /^[a-z]/.test(lucideKey)) {
      lucideKey = lucideKey.charAt(0).toUpperCase() + lucideKey.slice(1);
    }

    let LucideComponent = (LucideIcons as any)[lucideKey];
    if (!LucideComponent) {
      const foundKey = Object.keys(LucideIcons).find(
        (k) => k.toLowerCase() === iconName.toLowerCase()
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
  }

  // Final fallback
  if (Fallback) {
    return <Fallback className={className} />;
  }

  return <MissingIconPlaceholder className={className} title={`Icon not found: ${iconName}`} />;
};

export default Icon;
