/**
 * CDN Configuration for Qivr Healthcare Platform
 * Manages CloudFront distribution URLs and asset optimization
 */

export interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  imageUrl: string;
  staticUrl: string;
  optimizationEnabled: boolean;
  supportedFormats: string[];
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isStaging = process.env.VITE_ENVIRONMENT === 'staging';
const isProduction = process.env.NODE_ENV === 'production' && !isStaging;

// CloudFront distribution URLs (will be updated after deployment)
const CLOUDFRONT_DOMAIN = process.env.VITE_CDN_URL || 'https://cdn.qivr.health';
const CLOUDFRONT_DISTRIBUTION_ID = process.env.VITE_CLOUDFRONT_ID || '';

export const cdnConfig: CDNConfig = {
  enabled: !isDevelopment && !!CLOUDFRONT_DOMAIN,
  baseUrl: CLOUDFRONT_DOMAIN,
  imageUrl: `${CLOUDFRONT_DOMAIN}/images`,
  staticUrl: `${CLOUDFRONT_DOMAIN}/static`,
  optimizationEnabled: true,
  supportedFormats: ['avif', 'webp', 'jpg', 'jpeg', 'png']
};

/**
 * Get the CDN URL for an asset
 */
export function getCDNUrl(path: string): string {
  if (!cdnConfig.enabled) {
    return path;
  }
  
  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Determine the appropriate base URL
  if (cleanPath.startsWith('images/')) {
    return `${cdnConfig.imageUrl}/${cleanPath.replace('images/', '')}`;
  } else if (cleanPath.startsWith('static/')) {
    return `${cdnConfig.staticUrl}/${cleanPath.replace('static/', '')}`;
  }
  
  return `${cdnConfig.baseUrl}/${cleanPath}`;
}

/**
 * Get optimized image URL with format negotiation
 */
export function getOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    format?: 'avif' | 'webp' | 'auto';
    quality?: number;
  } = {}
): string {
  if (!cdnConfig.enabled || !cdnConfig.optimizationEnabled) {
    return src;
  }
  
  const { width, format = 'auto', quality = 85 } = options;
  
  // Build query parameters
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (quality !== 85) params.append('q', quality.toString());
  if (format !== 'auto') params.append('f', format);
  
  const cdnUrl = getCDNUrl(src);
  const queryString = params.toString();
  
  return queryString ? `${cdnUrl}?${queryString}` : cdnUrl;
}

/**
 * Get responsive image srcset for picture element
 */
export function getResponsiveSrcSet(
  src: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1536, 1920]
): string {
  if (!cdnConfig.enabled) {
    return src;
  }
  
  return sizes
    .map(size => `${getOptimizedImageUrl(src, { width: size })} ${size}w`)
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options?: { as?: string; type?: string }): void {
  if (!cdnConfig.enabled) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = options?.as || 'image';
  link.href = getCDNUrl(src);
  
  if (options?.type) {
    link.type = options.type;
  }
  
  // Add imagesrcset for responsive images
  if (options?.as === 'image') {
    const srcset = getResponsiveSrcSet(src);
    if (srcset) {
      link.setAttribute('imagesrcset', srcset);
    }
  }
  
  document.head.appendChild(link);
}

/**
 * Configure CloudFront cache headers
 */
export function getCacheHeaders(assetType: 'image' | 'script' | 'style' | 'font'): HeadersInit {
  const headers: HeadersInit = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff'
  };
  
  switch (assetType) {
    case 'image':
      headers['Accept'] = 'image/avif,image/webp,image/*';
      break;
    case 'script':
      headers['Content-Type'] = 'application/javascript';
      break;
    case 'style':
      headers['Content-Type'] = 'text/css';
      break;
    case 'font':
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      break;
  }
  
  return headers;
}

/**
 * Invalidate CloudFront cache
 */
export async function invalidateCache(paths: string[]): Promise<void> {
  if (!CLOUDFRONT_DISTRIBUTION_ID) {
    console.warn('CloudFront distribution ID not configured');
    return;
  }
  
  try {
    const response = await fetch('/api/cdn/invalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        distributionId: CLOUDFRONT_DISTRIBUTION_ID,
        paths
      })
    });
    
    if (!response.ok) {
      throw new Error(`Invalidation failed: ${response.statusText}`);
    }
    
    console.log('CloudFront cache invalidated for paths:', paths);
  } catch (error) {
    console.error('Failed to invalidate CloudFront cache:', error);
  }
}

export default cdnConfig;
