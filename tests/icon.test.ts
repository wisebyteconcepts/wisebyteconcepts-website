import { describe, it, expect } from 'vitest';
import { normalizeIcon, formatIconLabel, IconValue } from '../src/types/icon';
import { exportToKebab, kebabToExport, getHugeIconDefinition } from '../src/utils/hugeicons';

describe('Hugeicons Normalizer & Kebab-Case Utilities', () => {
  it('converts PascalCase Hugeicons exports to kebab-case', () => {
    expect(exportToKebab('Home01Icon')).toBe('home-01');
    expect(exportToKebab('ArrowRight01Icon')).toBe('arrow-right-01');
    expect(exportToKebab('UserIcon')).toBe('user');
    expect(exportToKebab('CheckmarkCircle02Icon')).toBe('checkmark-circle-02');
    expect(exportToKebab('AArrowDownIcon')).toBe('a-arrow-down');
  });

  it('converts kebab-case Hugeicons names to export keys', () => {
    expect(kebabToExport('home-01')).toBe('Home01Icon');
    expect(kebabToExport('arrow-right-01')).toBe('ArrowRight01Icon');
    expect(kebabToExport('user')).toBe('UserIcon');
    expect(kebabToExport('checkmark-circle-02')).toBe('CheckmarkCircle02Icon');
  });

  it('resolves Hugeicons definition by kebab-case or PascalCase name', async () => {
    const mod = await import('@hugeicons/core-free-icons');
    const def = getHugeIconDefinition('home-01', mod);
    expect(def).toBeDefined();
    expect(Array.isArray(def)).toBe(true);
  });

  it('normalizes modern Hugeicons { name } object', () => {
    const input: IconValue = {
      name: 'home-01',
    };
    const result = normalizeIcon(input);
    expect(result).toEqual({
      name: 'home-01',
      library: 'huge',
    });
  });

  it('normalizes kebab-case string to Hugeicons', () => {
    expect(normalizeIcon('home-01')).toEqual({
      name: 'home-01',
      library: 'huge',
    });
    expect(normalizeIcon('huge:settings-02')).toEqual({
      name: 'settings-02',
      library: 'huge',
    });
  });

  it('preserves legacy Lucide icon strings without breaking', () => {
    expect(normalizeIcon('Briefcase')).toEqual({
      name: 'Briefcase',
      library: 'lucide',
    });
    expect(normalizeIcon('ShoppingBag')).toEqual({
      name: 'ShoppingBag',
      library: 'lucide',
    });
  });

  it('preserves legacy Lucide IconValue objects', () => {
    const legacy: IconValue = {
      name: 'Zap',
      library: 'lucide',
    };
    expect(normalizeIcon(legacy)).toEqual({
      name: 'Zap',
      library: 'lucide',
    });
  });

  it('preserves legacy Remix and Heroicon values gracefully', () => {
    expect(normalizeIcon('RiCodeLine')).toEqual({
      name: 'RiCodeLine',
      library: 'remix',
      variant: 'line',
    });
    expect(normalizeIcon('HiOutlineHome')).toEqual({
      name: 'HomeIcon',
      library: 'hero',
      variant: 'outline',
    });
  });

  it('formats display labels accurately for modern Hugeicons and legacy icons', () => {
    expect(formatIconLabel({ name: 'home-01' })).toBe('home-01 · Hugeicons');
    expect(formatIconLabel({ name: 'home-01', library: 'huge' })).toBe('home-01 · Hugeicons');
    expect(formatIconLabel({ name: 'Briefcase', library: 'lucide' })).toBe('Briefcase · Legacy icon (lucide)');
  });
});

describe('Hugeicons Search Ranking (Exact -> Prefix -> Substring -> Alphabetical)', () => {
  function rankIcons(icons: string[], query: string): string[] {
    const q = query.toLowerCase().trim();
    if (!q) return icons;

    interface Scored {
      name: string;
      tier: number;
    }

    const scored: Scored[] = [];
    for (const name of icons) {
      const n = name.toLowerCase();

      if (n === q) {
        scored.push({ name, tier: 0 }); // Exact
      } else if (n.startsWith(q)) {
        scored.push({ name, tier: 1 }); // Prefix
      } else if (n.includes(q)) {
        scored.push({ name, tier: 2 }); // Substring
      }
    }

    scored.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    });

    return scored.map((s) => s.name);
  }

  const sampleIcons = [
    'smart-home',
    'home-01',
    'home',
    'at-home-wifi',
    'home-wifi',
    'home-02',
  ];

  it('ranks exact match first, then prefix, then substring, then alphabetical', () => {
    const results = rankIcons(sampleIcons, 'home');

    // Exact match
    expect(results[0]).toBe('home');

    // Prefix matches (sorted alphabetically)
    expect(results[1]).toBe('home-01');
    expect(results[2]).toBe('home-02');
    expect(results[3]).toBe('home-wifi');

    // Substring matches (sorted alphabetically)
    expect(results[4]).toBe('at-home-wifi');
    expect(results[5]).toBe('smart-home');
  });
});

describe('Keyboard Navigation Responsive Columns', () => {
  function getColumnCount(width: number): number {
    if (width < 640) return 4;
    if (width < 768) return 6;
    if (width < 1024) return 8;
    return 10;
  }

  it('computes correct column jumps for arrow key navigation across breakpoints', () => {
    expect(getColumnCount(375)).toBe(4);
    expect(getColumnCount(680)).toBe(6);
    expect(getColumnCount(850)).toBe(8);
    expect(getColumnCount(1280)).toBe(10);
  });
});
