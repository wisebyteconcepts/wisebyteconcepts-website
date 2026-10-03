/**
 * Hugeicons Stroke Rounded Lookup and Lazy-loading Utility
 * Free Stroke Rounded set from @hugeicons/core-free-icons & @hugeicons/react
 * Stores icon names in kebab-case (e.g. "home-01") and maps them to package exports.
 */

let hugeModuleCache: Record<string, any> | null = null;
let hugeModulePromise: Promise<Record<string, any>> | null = null;
let hugeIconNamesCache: string[] | null = null;

/**
 * Converts export name (e.g. "Home01Icon" or "Home01") to kebab-case (e.g. "home-01")
 */
export function exportToKebab(exportName: string): string {
  const base = exportName.replace(/Icon$/, '');
  return base
    .replace(/([a-zA-Z])(\d+)/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Converts kebab-case (e.g. "home-01" or "arrow-right-01") to export key ("Home01Icon")
 */
export function kebabToExport(kebabName: string): string {
  const clean = kebabName.replace(/Icon$/, '').replace(/^huge:/, '');
  const parts = clean.split('-');
  const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return `${pascal}Icon`;
}

/**
 * Returns currently cached module if already loaded
 */
export function getHugeIconsCache(): Record<string, any> | null {
  return hugeModuleCache;
}

/**
 * Dynamically loads the @hugeicons/core-free-icons icon package
 */
export async function loadHugeIcons(): Promise<Record<string, any>> {
  if (hugeModuleCache) return hugeModuleCache;
  if (!hugeModulePromise) {
    hugeModulePromise = import('@hugeicons/core-free-icons').then((mod) => {
      hugeModuleCache = mod;
      return mod;
    });
  }
  return hugeModulePromise;
}

/**
 * Returns a sorted array of all available kebab-case icon names in Hugeicons Stroke Rounded
 */
export async function getHugeIconList(): Promise<string[]> {
  if (hugeIconNamesCache) return hugeIconNamesCache;
  const mod = await loadHugeIcons();
  const keys = Object.keys(mod).filter((k) => k.endsWith('Icon') && !k.endsWith('FreeIcons'));
  const set = new Set<string>();
  for (const k of keys) {
    set.add(exportToKebab(k));
  }
  hugeIconNamesCache = Array.from(set).sort();
  return hugeIconNamesCache;
}

/**
 * Resolves an icon definition object for HugeiconsIcon component
 */
export function getHugeIconDefinition(
  name: string,
  cache?: Record<string, any> | null
): any {
  const c = cache || hugeModuleCache;
  if (!c || !name) return null;

  // 1. Direct kebab to export key (e.g. "home-01" -> "Home01Icon")
  const exportKey = kebabToExport(name);
  if (c[exportKey]) return c[exportKey];

  // 2. Direct name match if passed in PascalCase
  if (c[name]) return c[name];

  // 3. With Icon appended if PascalCase without Icon
  if (c[`${name}Icon`]) return c[`${name}Icon`];

  // 4. Case-insensitive fallback
  const lowerExport = exportKey.toLowerCase();
  const found = Object.keys(c).find((k) => k.toLowerCase() === lowerExport);
  if (found) return c[found];

  return null;
}
