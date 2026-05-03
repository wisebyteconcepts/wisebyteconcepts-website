import React from 'react';
import * as LucideIcons from 'lucide-react';
import * as HeroIcons from '@heroicons/react/24/solid';
import * as HeroIconsOutline from '@heroicons/react/24/outline';

export type IconLibrary = 'lucide' | 'heroicon' | 'heroicon-outline' | 'custom';

export interface IconReference {
  library: IconLibrary;
  name: string;
}

export interface IconDefinition {
  library: IconLibrary;
  name: string;
  label: string;
}

// Get all Lucide icon names
export const LUCIDE_ICONS = Object.keys(LucideIcons).filter(
  (name) => typeof (LucideIcons as any)[name] === 'function' || typeof (LucideIcons as any)[name] === 'object'
);

// Get all Heroicons (solid) names
export const HEROICON_SOLID_ICONS = Object.keys(HeroIcons).filter(
  (name) => typeof (HeroIcons as any)[name] === 'function' || typeof (HeroIcons as any)[name] === 'object'
);

// Get all Heroicons (outline) names
export const HEROICON_OUTLINE_ICONS = Object.keys(HeroIconsOutline).filter(
  (name) => typeof (HeroIconsOutline as any)[name] === 'function' || typeof (HeroIconsOutline as any)[name] === 'object'
);

/**
 * Parse icon identifier string (e.g., "lucide:code" or "heroicon:code-bracket")
 */
export const parseIconIdentifier = (identifier: string): IconReference | null => {
  if (!identifier) return null;
  
  // Check if it's a URL or custom format
  if (identifier.startsWith('http') || identifier.startsWith('data:') || identifier.includes('/')) {
    return { library: 'custom', name: identifier };
  }
  
  // Parse library:name format
  if (identifier.includes(':')) {
    const [lib, name] = identifier.split(':', 2);
    if (['lucide', 'heroicon', 'heroicon-outline', 'custom'].includes(lib)) {
      return { library: lib as IconLibrary, name };
    }
  }
  
  // Default to lucide if no prefix
  return { library: 'lucide', name: identifier };
};

/**
 * Format icon reference as string (e.g., "lucide:code")
 */
export const formatIconIdentifier = (library: IconLibrary, name: string): string => {
  if (library === 'custom') return name;
  return `${library}:${name}`;
};

/**
 * Render icon component based on library and name
 */
export const renderIcon = (
  reference: IconReference,
  className?: string
): React.ReactNode => {
  const { library, name } = reference;

  try {
    switch (library) {
      case 'lucide': {
        const Icon = (LucideIcons as any)[name] as LucideIcons.LucideIcon;
        if (Icon) return React.createElement(Icon, { className });
        break;
      }
      case 'heroicon': {
        const Icon = (HeroIcons as any)[name];
        if (Icon) return React.createElement(Icon, { className });
        break;
      }
      case 'heroicon-outline': {
        const Icon = (HeroIconsOutline as any)[name];
        if (Icon) return React.createElement(Icon, { className });
        break;
      }
      case 'custom': {
        if (name.startsWith('http') || name.startsWith('data:')) {
          return React.createElement('img', {
            src: name,
            alt: 'icon',
            className: `object-contain ${className || ''}`,
            referrerPolicy: 'no-referrer',
          });
        }
        break;
      }
    }
  } catch (error) {
    console.warn(`Failed to render icon: ${library}:${name}`, error);
  }

  return null;
};

/**
 * Get icon by identifier string
 */
export const getIconComponent = (
  identifier: string,
  className?: string
): React.ReactNode => {
  const reference = parseIconIdentifier(identifier);
  if (!reference) return null;
  return renderIcon(reference, className);
};

/**
 * Format icon names for display (e.g., "codeBracket" -> "Code Bracket")
 */
export const formatIconName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Get sample icons from each library
 */
export const getSampleIcons = (): IconDefinition[] => {
  const samples: IconDefinition[] = [
    // Lucide samples
    { library: 'lucide', name: 'code', label: 'Code' },
    { library: 'lucide', name: 'zap', label: 'Zap' },
    { library: 'lucide', name: 'rocket', label: 'Rocket' },
    { library: 'lucide', name: 'star', label: 'Star' },
    { library: 'lucide', name: 'heart', label: 'Heart' },
    { library: 'lucide', name: 'settings', label: 'Settings' },
    
    // Heroicon solid samples
    { library: 'heroicon', name: 'CodeBracketIcon', label: 'Code (Solid)' },
    { library: 'heroicon', name: 'StarIcon', label: 'Star (Solid)' },
    { library: 'heroicon', name: 'LightBulbIcon', label: 'Light Bulb (Solid)' },
    { library: 'heroicon', name: 'SparklesIcon', label: 'Sparkles (Solid)' },
    { library: 'heroicon', name: 'RocketLaunchIcon', label: 'Rocket (Solid)' },
    
    // Heroicon outline samples
    { library: 'heroicon-outline', name: 'CodeBracketIcon', label: 'Code (Outline)' },
    { library: 'heroicon-outline', name: 'StarIcon', label: 'Star (Outline)' },
    { library: 'heroicon-outline', name: 'CheckIcon', label: 'Check (Outline)' },
  ];

  return samples;
};
