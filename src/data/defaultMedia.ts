import { MediaItem, MediaFolder, MediaCollection } from '@/types/media';

/**
 * Clean initial media defaults for production.
 * Pre-seeded mock data has been removed. Media items, folders, and collections
 * are populated dynamically through user uploads or database records.
 */
export const DEFAULT_FOLDERS: MediaFolder[] = [];

export const DEFAULT_MEDIA_ITEMS: MediaItem[] = [];

export const DEFAULT_COLLECTIONS: MediaCollection[] = [];
