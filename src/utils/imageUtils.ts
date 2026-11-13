/**
 * Image & Video Thumbnail Utilities
 * Handles compression for local uploads (preventing localStorage quota crashes)
 * and intelligent extraction of YouTube/Vimeo posters.
 */

// Default high-resolution fallback posters for studio categories
export const DEFAULT_VIDEO_POSTER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
export const DEFAULT_DESIGN_POSTER = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80';
export const DEFAULT_WEB_POSTER = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

/**
 * Gets YouTube Max Resolution or High Quality thumbnail URL
 */
export function getYouTubeThumbnail(url: string, quality: 'maxres' | 'hq' = 'hq'): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  // 'hqdefault' is guaranteed to exist for 100% of YouTube videos (maxres default often returns 404 for 720p/lower uploads)
  return quality === 'maxres'
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Normalizes any image or cloud storage link so it displays directly in <img> tags:
 * - Google Drive links (/file/d/..., open?id=..., uc?id=...) -> converted to high-speed lh3.googleusercontent.com stream
 * - Dropbox links (dl=0) -> converted to dl.dropboxusercontent.com direct raw stream
 * - Imgur page links (imgur.com/xyz) -> converted to direct i.imgur.com/xyz.jpg
 * - YouTube links pasted into picture field -> converted to video thumbnail
 * - Google Image search redirect URLs (google.com/imgres?imgurl=...) -> extracts decoded image source
 * - Unsplash page URLs -> converted to direct images.unsplash.com CDN URL
 * - Trims quotes, whitespaces, and upgrades insecure http:// to https://
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  let trimmed = url.trim();

  // Strip wrapping single/double quotes or backticks if user copied with quotes
  trimmed = trimmed.replace(/^["'`]|["'`]$/g, '').trim();

  // If it's already a base64 data URI, keep as is
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 1. YouTube video URL accidentally pasted in picture/thumbnail field
  const ytThumb = getYouTubeThumbnail(trimmed, 'hq');
  if (ytThumb) return ytThumb;

  // 2. Google Drive Link:
  // e.g. https://drive.google.com/file/d/1X_yZ123/view?usp=sharing
  // e.g. https://drive.google.com/open?id=1X_yZ123
  // e.g. https://drive.google.com/uc?id=1X_yZ123&export=download
  // e.g. https://docs.google.com/file/d/1X_yZ123/edit
  const gDriveMatch = trimmed.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=[^&]+&)?id=)([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 3. Dropbox Link:
  // e.g. https://www.dropbox.com/s/abcdef123/photo.png?dl=0
  // e.g. https://www.dropbox.com/scl/fi/abcdef123/photo.png?rlkey=xyz&dl=0
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('?dl=0') || trimmed.includes('&dl=0')) {
      return trimmed.replace(/[?&]dl=0/g, trimmed.includes('?') ? '?raw=1' : '&raw=1');
    }
    if (!trimmed.includes('raw=1')) {
      return trimmed + (trimmed.includes('?') ? '&raw=1' : '?raw=1');
    }
    return trimmed.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  // 4. Imgur Page Link:
  // e.g. https://imgur.com/abc1234 -> https://i.imgur.com/abc1234.jpg
  const imgurMatch = trimmed.match(/^https?:\/\/(?:www\.|m\.)?imgur\.com\/([a-zA-Z0-9]+)$/i);
  if (imgurMatch && imgurMatch[1] && imgurMatch[1] !== 'a' && imgurMatch[1] !== 'gallery') {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // 5. Google Images search redirect URL:
  // e.g. https://www.google.com/imgres?imgurl=https%3A%2F%2Fexample.com%2Fphoto.jpg...
  if (trimmed.includes('google.') && (trimmed.includes('imgurl=') || trimmed.includes('imgrefurl='))) {
    const match = trimmed.match(/[?&]imgurl=([^&]+)/i);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {}
    }
  }

  // 6. Unsplash page link:
  // e.g. https://unsplash.com/photos/a-white-building-with-many-windows-rENmD6...
  const unsplashMatch = trimmed.match(/unsplash\.com\/photos\/(?:[\w-]+-)?([a-zA-Z0-9_-]{10,})/i);
  if (unsplashMatch && unsplashMatch[1]) {
    return `https://images.unsplash.com/photo-${unsplashMatch[1]}?auto=format&fit=crop&w=1200&q=80`;
  }

  // 7. Upgrade insecure http:// to https:// to prevent Mixed Content blocking in modern browsers
  if (trimmed.startsWith('http://') && !trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
    trimmed = trimmed.replace('http://', 'https://');
  }

  return trimmed;
}

/**
 * Resolves the best thumbnail / poster image for a project:
 * - Automatically normalizes Google Drive, Dropbox, YouTube, Imgur, or direct image links
 * - Falls back to category-specific default poster if empty
 */
export function resolveThumbnailUrl(
  imageUrl?: string,
  videoUrl?: string,
  category = '3D Video Animation'
): string {
  const normalized = normalizeImageUrl(imageUrl || '');

  // If user provided an image link
  if (normalized) {
    return normalized;
  }

  // If user provided a video URL that is YouTube, auto-fetch the YouTube HQ thumbnail!
  if (videoUrl) {
    const ytThumb = getYouTubeThumbnail(videoUrl.trim(), 'hq');
    if (ytThumb) return ytThumb;
  }

  // Category fallback
  const isVideo = category === '3D Video Animation' || category.toLowerCase().includes('video') || category.toLowerCase().includes('animation');
  const isDesign = category === 'Graphic Design' || category.toLowerCase().includes('design');

  if (isVideo) return DEFAULT_VIDEO_POSTER;
  if (isDesign) return DEFAULT_DESIGN_POSTER;
  return DEFAULT_WEB_POSTER;
}

/**
 * Smart error handler for image tags:
 * If an image fails to load, attempts secondary CDN mirrors (e.g. Google Drive thumbnail, YouTube HQ) before falling back to default poster.
 */
export function getFallbackImage(
  failedUrl: string,
  category = 'Web Development',
  videoUrl?: string
): string {
  // 1. If Google Drive lh3 failed, try drive.google.com/thumbnail
  const gDriveMatch = failedUrl.match(/(?:lh3\.googleusercontent\.com\/d\/|id=)([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch && gDriveMatch[1] && !failedUrl.includes('drive.google.com/thumbnail')) {
    return `https://drive.google.com/thumbnail?id=${gDriveMatch[1]}&sz=w1200`;
  }

  // 2. If YouTube maxres failed, try hqdefault
  const ytMatch = failedUrl.match(/img\.youtube\.com\/vi\/([a-zA-Z0-9_-]{11})\/maxresdefault\.jpg/i);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // 3. If videoUrl is provided and is YouTube, try its thumbnail
  if (videoUrl) {
    const yt = getYouTubeThumbnail(videoUrl, 'hq');
    if (yt && yt !== failedUrl) return yt;
  }

  const isVideo = category === '3D Video Animation' || category.toLowerCase().includes('video') || category.toLowerCase().includes('animation');
  const isDesign = category === 'Graphic Design' || category.toLowerCase().includes('design');
  if (isVideo) return DEFAULT_VIDEO_POSTER;
  if (isDesign) return DEFAULT_DESIGN_POSTER;
  return DEFAULT_WEB_POSTER;
}

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Resizes down to maxWidth x maxHeight and compresses to JPEG (quality ~0.82).
 * A typical 5MB phone photo compresses down to ~40KB - 80KB, preventing
 * browser localStorage QuotaExceededError and ensuring instant loading.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, return raw data url
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw and compress to lightweight JPEG
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.onerror = () => {
        resolve(event.target?.result as string);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
