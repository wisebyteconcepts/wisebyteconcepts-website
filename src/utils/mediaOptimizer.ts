/**
 * Client-side media processing and optimization utilities.
 * Supports image resizing, compression, WebP conversion,
 * thumbnail generation, and video embed parsing.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
  aspectRatio?: number; // width / height
}

export interface OptimizedResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface MultiResolutionResult {
  original: string;
  thumbnail: string; // ~200px
  medium: string;    // ~600px
  large: string;     // ~1200px
  width: number;
  height: number;
  size: number;
}

/**
 * Formats byte size into human readable string (e.g. 1.2 MB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Loads an image from a File or URL into an HTMLImageElement.
 */
export function loadImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Resize and compress an image using HTML5 Canvas.
 */
export async function optimizeImage(
  source: string | File,
  options: ResizeOptions = {}
): Promise<OptimizedResult> {
  const img = await loadImage(source);
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'image/webp',
    aspectRatio,
  } = options;

  let origWidth = img.naturalWidth || img.width;
  let origHeight = img.naturalHeight || img.height;

  let targetWidth = origWidth;
  let targetHeight = origHeight;

  // Handle aspect ratio crop if requested
  let sx = 0;
  let sy = 0;
  let sWidth = origWidth;
  let sHeight = origHeight;

  if (aspectRatio) {
    const currentRatio = origWidth / origHeight;
    if (currentRatio > aspectRatio) {
      // Too wide -> crop sides
      sWidth = origHeight * aspectRatio;
      sx = (origWidth - sWidth) / 2;
    } else {
      // Too tall -> crop top/bottom
      sHeight = origWidth / aspectRatio;
      sy = (origHeight - sHeight) / 2;
    }
    targetWidth = sWidth;
    targetHeight = sHeight;
  }

  // Constrain to maxWidth / maxHeight
  if (targetWidth > maxWidth) {
    targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
    targetWidth = maxWidth;
  }
  if (targetHeight > maxHeight) {
    targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
    targetHeight = maxHeight;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get 2d context for image optimization');
  }

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas to Blob conversion failed'));
          return;
        }
        const dataUrl = canvas.toDataURL(format, quality);
        resolve({
          dataUrl,
          blob,
          width: targetWidth,
          height: targetHeight,
          size: blob.size,
          format: format.replace('image/', ''),
        });
      },
      format,
      quality
    );
  });
}

/**
 * Generates thumbnail, medium, and large variants of an uploaded image.
 */
export async function generateMultiResolutions(
  fileOrUrl: File | string,
  autoConvertToWebP: boolean = true
): Promise<MultiResolutionResult> {
  const targetFormat = autoConvertToWebP ? 'image/webp' : 'image/jpeg';

  const [thumb, medium, large, full] = await Promise.all([
    optimizeImage(fileOrUrl, { maxWidth: 240, maxHeight: 240, quality: 0.8, format: targetFormat }),
    optimizeImage(fileOrUrl, { maxWidth: 640, maxHeight: 640, quality: 0.85, format: targetFormat }),
    optimizeImage(fileOrUrl, { maxWidth: 1280, maxHeight: 1280, quality: 0.88, format: targetFormat }),
    optimizeImage(fileOrUrl, { maxWidth: 2000, maxHeight: 2000, quality: 0.9, format: targetFormat }),
  ]);

  return {
    thumbnail: thumb.dataUrl,
    medium: medium.dataUrl,
    large: large.dataUrl,
    original: full.dataUrl,
    width: full.width,
    height: full.height,
    size: full.size,
  };
}

/**
 * Generates a video snapshot thumbnail from an uploaded HTML5 video file.
 */
export function generateVideoThumbnail(
  file: File,
  seekTimeSeconds: number = 1
): Promise<{ thumbnailDataUrl: string; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      video.currentTime = Math.min(seekTimeSeconds, duration > 1 ? 1 : 0);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth || 640, 640);
      canvas.height = Math.round((canvas.width * (video.videoHeight || 360)) / (video.videoWidth || 640));

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(url);
        resolve({ thumbnailDataUrl, duration: video.duration || 0 });
      } else {
        URL.revokeObjectURL(url);
        resolve({ thumbnailDataUrl: '', duration: video.duration || 0 });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ thumbnailDataUrl: '', duration: 0 });
    };
  });
}

/**
 * Parses video embed URLs (YouTube, Vimeo, etc.)
 */
export function parseVideoEmbed(url: string): {
  isValid: boolean;
  provider: 'youtube' | 'vimeo' | 'embed';
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  titleSuggestion?: string;
} {
  const trimmed = url.trim();

  // YouTube
  // Matches: youtube.com/watch?v=XXX, youtu.be/XXX, youtube.com/embed/XXX
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      isValid: true,
      provider: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      titleSuggestion: `YouTube Video (${videoId})`,
    };
  }

  // Vimeo
  // Matches: vimeo.com/XXX, player.vimeo.com/video/XXX
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      isValid: true,
      provider: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
      titleSuggestion: `Vimeo Video (${videoId})`,
    };
  }

  // Generic direct video link (mp4, webm)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return {
      isValid: true,
      provider: 'embed',
      embedUrl: trimmed,
      thumbnailUrl: '',
      titleSuggestion: trimmed.split('/').pop()?.split('?')[0] || 'Embedded Video',
    };
  }

  return { isValid: false, provider: 'embed' };
}

/**
 * Validates uploaded files by size and MIME type.
 */
export function validateMediaUpload(
  file: File,
  type: 'image' | 'video' | 'file'
): { isValid: boolean; error?: string } {
  const maxSizes = {
    image: 25 * 1024 * 1024, // 25 MB
    video: 100 * 1024 * 1024, // 100 MB
    file: 50 * 1024 * 1024,  // 50 MB
  };

  if (file.size > maxSizes[type]) {
    return {
      isValid: false,
      error: `File exceeds maximum limit of ${formatBytes(maxSizes[type])}. (Current: ${formatBytes(file.size)})`,
    };
  }

  if (type === 'image') {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif'];
    if (!allowed.includes(file.type) && !/\.(jpg|jpeg|png|webp|svg|gif|avif)$/i.test(file.name)) {
      return { isValid: false, error: 'Only JPG, PNG, WebP, SVG, GIF, and AVIF images are permitted.' };
    }
  } else if (type === 'video') {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowed.includes(file.type) && !/\.(mp4|webm|ogg|mov)$/i.test(file.name)) {
      return { isValid: false, error: 'Only MP4, WebM, and MOV video formats are allowed.' };
    }
  } else if (type === 'file') {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'text/plain',
      'text/csv',
    ];
    if (
      !allowed.includes(file.type) &&
      !/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|txt|csv)$/i.test(file.name)
    ) {
      return { isValid: false, error: 'Allowed files: PDF, DOC, DOCX, XLS, XLSX, PPT, ZIP, TXT, CSV.' };
    }
  }

  return { isValid: true };
}
