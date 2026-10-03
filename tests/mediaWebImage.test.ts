import { describe, it, expect } from 'vitest';
import { 
  isValidHttpUrl, 
  extractFilenameFromUrl, 
  validateImageUrl 
} from '../src/utils/mediaOptimizer';
import { MediaItem } from '../src/types/media';

describe('Media Web Image URL Validation & Helpers', () => {
  it('validates HTTP and HTTPS URLs correctly', () => {
    expect(isValidHttpUrl('https://example.com/photo.jpg')).toBe(true);
    expect(isValidHttpUrl('http://subdomain.example.org/assets/banner.png?v=1')).toBe(true);
    expect(isValidHttpUrl('https://images.unsplash.com/photo-1536240478700-b869070f9279')).toBe(true);

    // Invalid URLs
    expect(isValidHttpUrl('ftp://example.com/photo.jpg')).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
    expect(isValidHttpUrl('not-a-valid-url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });

  it('extracts human-readable filenames from various URL structures', () => {
    expect(extractFilenameFromUrl('https://example.com/images/hero-banner-2026.png')).toBe('Hero banner 2026');
    expect(extractFilenameFromUrl('https://example.com/photo_profile.jpg?token=abc')).toBe('Photo profile');
    expect(extractFilenameFromUrl('https://example.com/simple')).toBe('Simple');
    expect(extractFilenameFromUrl('https://example.com/')).toBe('Web Image');
  });

  it('returns "Invalid URL" error when validating non-http strings', async () => {
    const result = await validateImageUrl('ftp://invalid-domain.com/test.png');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid URL');
  });

  it('constructs a valid MediaItem of type web-image', () => {
    const rawUrl = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200';
    const webMediaItem: MediaItem = {
      id: 'media-web-test-123',
      name: 'Unsplash Scenic',
      type: 'web-image',
      url: rawUrl,
      thumbnailUrl: rawUrl,
      mediumUrl: rawUrl,
      largeUrl: rawUrl,
      altText: 'Scenic photography',
      folderId: null,
      tags: ['web-image', 'scenic'],
      size: 0,
      mimeType: 'image/web',
      uploadedBy: 'test@wisebyteconcepts.com',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(webMediaItem.type).toBe('web-image');
    expect(webMediaItem.url).toBe(rawUrl);
    expect(webMediaItem.size).toBe(0);
    expect(webMediaItem.mimeType).toBe('image/web');
  });
});

describe('Media Filter Compatibility for Web Images', () => {
  const mockMediaList: MediaItem[] = [
    {
      id: '1',
      name: 'Local Upload',
      type: 'image',
      url: '/uploads/local.jpg',
      altText: 'Local',
      folderId: null,
      tags: [],
      size: 1024,
      mimeType: 'image/jpeg',
      uploadedBy: 'admin',
      uploadedAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      name: 'Remote Web Image',
      type: 'web-image',
      url: 'https://example.com/remote.png',
      altText: 'Remote',
      folderId: null,
      tags: ['web-image'],
      size: 0,
      mimeType: 'image/web',
      uploadedBy: 'admin',
      uploadedAt: '',
      updatedAt: '',
    },
    {
      id: '3',
      name: 'Video',
      type: 'video',
      url: 'https://youtube.com/watch?v=123',
      altText: 'Video',
      folderId: null,
      tags: [],
      size: 0,
      mimeType: 'video/embed',
      uploadedBy: 'admin',
      uploadedAt: '',
      updatedAt: '',
    },
  ];

  it('includes web-image when filtering by image category', () => {
    const imagesTab = mockMediaList.filter((item) => item.type === 'image' || item.type === 'web-image');
    expect(imagesTab.length).toBe(2);
    expect(imagesTab.map((i) => i.id)).toEqual(['1', '2']);
  });

  it('filters specifically by web-image tab', () => {
    const webOnly = mockMediaList.filter((item) => item.type === 'web-image');
    expect(webOnly.length).toBe(1);
    expect(webOnly[0].id).toBe('2');
  });

  it('allows web-image when allowedTypes includes image', () => {
    const allowedTypes = ['image'];
    const selectableItems = mockMediaList.filter(
      (item) => allowedTypes.includes(item.type) || (allowedTypes.includes('image') && item.type === 'web-image')
    );
    expect(selectableItems.length).toBe(2);
    expect(selectableItems.some((i) => i.type === 'web-image')).toBe(true);
  });
});
