import { exportToKebab } from '@/utils/hugeicons';

export type IconLibrary = 'huge';
export type LegacyIconLibrary = 'lucide' | 'remix' | 'hero';

/**
 * Standard IconValue: { name: string, library?: 'huge' }
 * Keeps library: 'huge' as a constant for forward-compatibility.
 */
export interface IconValue {
  name: string;
  library?: 'huge' | LegacyIconLibrary;
  variant?: string;
}

/**
 * Normalizes any icon input format (kebab-case name, JSON string, or legacy object/string)
 * into a standard IconValue object.
 */
export function normalizeIcon(input: unknown): IconValue | null {
  if (!input) return null;

  // If already an object matching IconValue
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, any>;
    if (typeof obj.name === 'string' && obj.name.trim()) {
      const rawName = obj.name.trim();

      // Check if legacy library specified
      if (obj.library === 'lucide' || obj.library === 'remix' || obj.library === 'hero') {
        return {
          name: rawName,
          library: obj.library,
          variant: obj.variant,
        };
      }

      // Default or 'huge': ensure kebab-case name
      let cleanName = rawName;
      if (!cleanName.includes('-') && /^[A-Z]/.test(cleanName)) {
        cleanName = exportToKebab(cleanName);
      }

      return {
        name: cleanName,
        library: 'huge',
      };
    }
  }

  // If string
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Check if JSON serialized IconValue
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeIcon(parsed);
      } catch {
        // Continue with string heuristics
      }
    }

    // Check if external URL or custom asset path
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:') ||
      trimmed.includes('/')
    ) {
      return {
        name: trimmed,
        library: 'huge',
      };
    }

    // Explicit huge: prefix
    if (trimmed.startsWith('huge:')) {
      return {
        name: trimmed.replace(/^huge:/, '').trim(),
        library: 'huge',
      };
    }

    // Legacy Remix Icon prefixed with Ri
    if (trimmed.startsWith('Ri')) {
      return {
        name: trimmed,
        library: 'remix',
        variant: trimmed.endsWith('Fill') ? 'fill' : 'line',
      };
    }

    // Legacy Heroicons prefixed with HiOutline or Hi
    if (trimmed.startsWith('HiOutline')) {
      const base = trimmed.replace(/^HiOutline/, '');
      return {
        name: base.endsWith('Icon') ? base : `${base}Icon`,
        library: 'hero',
        variant: 'outline',
      };
    }

    if (trimmed.startsWith('Hi')) {
      const base = trimmed.replace(/^Hi/, '');
      return {
        name: base.endsWith('Icon') ? base : `${base}Icon`,
        library: 'hero',
        variant: 'solid',
      };
    }

    // Legacy Heroicon ending in Icon (e.g. ArrowRightIcon)
    if (trimmed.endsWith('Icon') && !trimmed.startsWith('Ri') && !trimmed.startsWith('Lucide')) {
      return {
        name: trimmed,
        library: 'hero',
        variant: 'outline',
      };
    }

    // Modern kebab-case icon strings (e.g. "home-01", "arrow-right-01") -> Hugeicons
    if (trimmed.includes('-') && !trimmed.startsWith('Ri') && !trimmed.startsWith('Hi')) {
      return {
        name: trimmed.toLowerCase(),
        library: 'huge',
      };
    }

    // Default legacy is Lucide (e.g. "Briefcase", "ShoppingBag", "Code", "Zap")
    return {
      name: trimmed,
      library: 'lucide',
    };
  }

  return null;
}

/**
 * Formats an icon value for display in labels or status text
 */
export function formatIconLabel(icon: IconValue | string | null | undefined): string {
  const norm = normalizeIcon(icon);
  if (!norm) return 'No icon selected';
  if (norm.name.startsWith('http') || norm.name.startsWith('data:') || norm.name.includes('/')) {
    return 'Custom Asset Vector';
  }
  if (norm.library === 'lucide' || norm.library === 'remix' || norm.library === 'hero') {
    return `${norm.name} · Legacy icon (${norm.library})`;
  }
  return `${norm.name} · Hugeicons`;
}
