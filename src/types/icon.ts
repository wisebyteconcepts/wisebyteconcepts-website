export type IconLibrary = 'lucide' | 'remix' | 'hero';
export type IconVariant = 'outline' | 'solid' | 'line' | 'fill';

export interface IconValue {
  library: IconLibrary;
  name: string;
  variant?: IconVariant;
}

/**
 * Normalizes any icon input format (legacy string, JSON string, or IconValue object)
 * into a standard IconValue object.
 */
export function normalizeIcon(input: unknown): IconValue | null {
  if (!input) return null;

  // If already an object matching IconValue
  if (typeof input === 'object' && input !== null) {
    const obj = input as Record<string, any>;
    if (typeof obj.name === 'string' && obj.name.trim()) {
      let lib: IconLibrary = 'lucide';
      if (obj.library === 'remix' || obj.library === 'hero' || obj.library === 'lucide') {
        lib = obj.library;
      }
      let variant: IconVariant | undefined = undefined;
      if (['outline', 'solid', 'line', 'fill'].includes(obj.variant)) {
        variant = obj.variant as IconVariant;
      }
      const resolvedVariant = variant || (lib === 'hero' ? 'outline' : lib === 'remix' ? 'line' : undefined);
      const res: IconValue = {
        library: lib,
        name: obj.name.trim(),
      };
      if (resolvedVariant) {
        res.variant = resolvedVariant;
      }
      return res;
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
        // Not valid JSON, continue with string heuristics
      }
    }

    // Check if external URL or path
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.includes('/')) {
      return {
        library: 'lucide',
        name: trimmed, // Handled as custom asset
      };
    }

    // Heuristics for legacy icon strings:
    // 1. Remix Icon prefixed with Ri
    if (trimmed.startsWith('Ri')) {
      const isFill = trimmed.endsWith('Fill');
      return {
        library: 'remix',
        name: trimmed,
        variant: isFill ? 'fill' : 'line',
      };
    }

    // 2. Heroicons prefixed with HiOutline or Hi
    if (trimmed.startsWith('HiOutline')) {
      const base = trimmed.replace(/^HiOutline/, '');
      return {
        library: 'hero',
        name: base.endsWith('Icon') ? base : `${base}Icon`,
        variant: 'outline',
      };
    }

    if (trimmed.startsWith('Hi')) {
      const base = trimmed.replace(/^Hi/, '');
      return {
        library: 'hero',
        name: base.endsWith('Icon') ? base : `${base}Icon`,
        variant: 'solid',
      };
    }

    // 3. Heroicon ending in Icon (e.g. ArrowRightIcon)
    if (trimmed.endsWith('Icon') && !trimmed.startsWith('Ri') && !trimmed.startsWith('Lucide')) {
      return {
        library: 'hero',
        name: trimmed,
        variant: 'outline',
      };
    }

    // 4. Default legacy is Lucide (e.g. "Briefcase", "ShoppingBag", "Code", "Zap")
    return {
      library: 'lucide',
      name: trimmed,
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
  const libName = norm.library === 'hero' ? 'Heroicons' : norm.library === 'remix' ? 'Remix' : 'Lucide';
  const variantPart = norm.variant ? ` (${norm.variant})` : '';
  return `${norm.name} · ${libName}${variantPart}`;
}
