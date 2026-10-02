import { TechStack, TechStackIconType, Skill } from '@/types';
import { normalizeIcon } from '@/types/icon';

export const DEFAULT_CLASSIFICATIONS = [
  'Frontend',
  'Backend',
  'Tools',
  'Database',
  'DevOps',
  'Mobile',
  'Design',
  'Other',
];

/**
 * Normalizes any legacy Skill or TechStack record into the standard TechStack format
 */
export function normalizeTechStack(item: Partial<Skill & TechStack>): TechStack {
  const name = item.name?.trim() || 'Untitled Tech Stack';
  
  // Format classification from new field or old category
  let rawCategory = item.classification || (item as any).category || 'Other';
  // Capitalize properly
  let classification = rawCategory.trim();
  if (classification.length > 0) {
    classification = classification.charAt(0).toUpperCase() + classification.slice(1);
  } else {
    classification = 'Other';
  }

  // Determine icon source type
  let iconType: TechStackIconType = item.iconType || 'icon';
  let iconLink: string | undefined = item.iconLink;
  let imageUrl: string | undefined = item.imageUrl;
  let icon = item.icon;

  if (!item.iconType) {
    if (typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://'))) {
      iconType = 'link';
      iconLink = icon;
      icon = undefined;
    } else if (typeof icon === 'string' && (icon.startsWith('/media') || icon.startsWith('data:'))) {
      iconType = 'image';
      imageUrl = icon;
      icon = undefined;
    } else if (imageUrl) {
      iconType = 'image';
    } else if (iconLink) {
      iconType = 'link';
    } else {
      iconType = 'icon';
    }
  }

  // If iconType is 'icon', normalize it
  if (iconType === 'icon' && icon) {
    const norm = normalizeIcon(icon);
    if (norm) {
      icon = norm;
    }
  }

  const order = typeof item.order === 'number' ? item.order : 0;

  return {
    id: item.id || `ts_${Math.random().toString(36).substring(2, 9)}`,
    name,
    classification,
    iconType,
    icon: iconType === 'icon' ? (icon || 'Code') : undefined,
    iconLink: iconType === 'link' ? iconLink : undefined,
    imageUrl: iconType === 'image' ? imageUrl : undefined,
    order,
    // Keep legacy fields so old queries or display logic don't crash
    category: classification,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}
