export type MediaType = 'image' | 'video' | 'file' | 'web-image';

export interface MediaVersion {
  id: string;
  version: number;
  url: string;
  size: number;
  replacedAt: string;
  replacedBy: string;
}

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  originalUrl?: string;
  originalFormat?: string;
  optimizedFormat?: 'webp' | 'avif' | 'original';
  altText: string;
  caption?: string;
  folderId: string | null;
  tags: string[];
  size: number; // bytes
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  videoProvider?: 'upload' | 'youtube' | 'vimeo' | 'embed';
  embedUrl?: string;
  duration?: number; // in seconds for videos
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  versionHistory?: MediaVersion[];
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  createdAt: string;
}

export interface MediaCollection {
  id: string;
  name: string;
  description?: string;
  mediaIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaAuditLog {
  id: string;
  action: 'upload' | 'replace' | 'delete' | 'move' | 'rename' | 'bulk_delete' | 'optimize' | 'create_folder';
  mediaId?: string;
  mediaName: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface MediaUsage {
  locationType: 'service' | 'product' | 'course' | 'coach' | 'blog' | 'quote' | 'other';
  locationId: string;
  locationTitle: string;
  field: string;
  url: string;
}
