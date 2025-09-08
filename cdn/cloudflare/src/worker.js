/**
 * CloudFlare Worker for Qivr Edge Optimization
 * Features:
 * - Image format conversion (WebP/AVIF)
 * - Edge caching with KV storage
 * - DDoS protection
 * - Request optimization
 * - Security headers
 */

// Image processing settings
const IMAGE_FORMATS = {
  webp: 'image/webp',
  avif: 'image/avif',
  original: null
};

const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 320, height: 240 },
  medium: { width: 640, height: 480 },
  large: { width: 1280, height: 960 },
  xlarge: { width: 1920, height: 1440 }
};

// Cache settings
const CACHE_CONTROL = {
  static: 'public, max-age=31536000, immutable', // 1 year
  html: 'public, max-age=3600, must-revalidate',  // 1 hour
  api: 'private, max-age=0, must-revalidate',
  images: 'public, max-age=86400, stale-while-revalidate=604800' // 1 day, stale for 7 days
};

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// Rate limiting configuration
const RATE_LIMITS = {
  api: { requests: 100, window: 60 }, // 100 requests per minute
  static: { requests: 1000, window: 60 }, // 1000 requests per minute
  images: { requests: 500, window: 60 } // 500 requests per minute
};

export default {
  async fetch(request, env, ctx) {
    try {
      // Add security headers to all responses
      const response = await handleRequest(request, env, ctx);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Check rate limiting
  const rateLimitResult = await checkRateLimit(request, env);
  if (!rateLimitResult.allowed) {
    return new Response('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': rateLimitResult.retryAfter.toString()
      }
    });
  }
  
  // Handle different content types
  if (isImageRequest(path)) {
    return handleImageRequest(request, env, ctx);
  } else if (isApiRequest(path)) {
    return handleApiRequest(request, env, ctx);
  } else if (isStaticAsset(path)) {
    return handleStaticRequest(request, env, ctx);
  } else {
    return handleHtmlRequest(request, env, ctx);
  }
}

/**
 * Handle image requests with format conversion and resizing
 */
async function handleImageRequest(request, env, ctx) {
  const url = new URL(request.url);
  const accept = request.headers.get('Accept') || '';
  
  // Parse query parameters for image processing
  const format = url.searchParams.get('format') || detectBestFormat(accept);
  const size = url.searchParams.get('size') || 'original';
  const quality = parseInt(url.searchParams.get('quality') || '85');
  
  // Generate cache key
  const cacheKey = `image:${url.pathname}:${format}:${size}:${quality}`;
  
  // Check edge cache
  const cached = await env.IMAGES.get(cacheKey, { type: 'stream' });
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': IMAGE_FORMATS[format] || 'image/jpeg',
        'Cache-Control': CACHE_CONTROL.images,
        'X-Cache': 'HIT'
      }
    });
  }
  
  // Fetch original image
  const imageResponse = await fetch(request);
  if (!imageResponse.ok) {
    return imageResponse;
  }
  
  // Process image using CloudFlare Image Resizing API
  const processedImage = await processImage(imageResponse, {
    format,
    size: IMAGE_SIZES[size],
    quality
  });
  
  // Store in edge cache
  ctx.waitUntil(
    env.IMAGES.put(cacheKey, processedImage.clone(), {
      expirationTtl: 86400 // 24 hours
    })
  );
  
  return new Response(processedImage, {
    headers: {
      'Content-Type': IMAGE_FORMATS[format] || 'image/jpeg',
      'Cache-Control': CACHE_CONTROL.images,
      'X-Cache': 'MISS',
      'Vary': 'Accept'
    }
  });
}

/**
 * Process image with CloudFlare Image Resizing
 */
async function processImage(imageResponse, options) {
  const imageUrl = new URL(imageResponse.url);
  
  // Build CloudFlare Image Resizing URL
  const resizeUrl = new URL('/cdn-cgi/image/', imageUrl.origin);
  
  // Add processing options
  const params = [];
  if (options.format && options.format !== 'original') {
    params.push(`format=${options.format}`);
  }
  if (options.size && options.size.width) {
    params.push(`width=${options.size.width}`);
    params.push(`height=${options.size.height}`);
    params.push('fit=cover');
  }
  if (options.quality) {
    params.push(`quality=${options.quality}`);
  }
  
  resizeUrl.pathname += params.join(',') + imageUrl.pathname;
  
  // Fetch processed image
  return fetch(resizeUrl);
}

/**
 * Handle API requests with caching and optimization
 */
async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const cacheKey = `api:${url.pathname}:${url.search}`;
  
  // Only cache GET requests
  if (request.method === 'GET') {
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': CACHE_CONTROL.api,
          'X-Cache': 'HIT'
        }
      });
    }
  }
  
  // Forward to origin
  const apiResponse = await fetch(request, {
    headers: {
      ...request.headers,
      'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || ''
    }
  });
  
  // Cache successful GET responses
  if (request.method === 'GET' && apiResponse.ok) {
    const responseBody = await apiResponse.text();
    ctx.waitUntil(
      env.CACHE.put(cacheKey, responseBody, {
        expirationTtl: 300 // 5 minutes
      })
    );
    
    return new Response(responseBody, {
      status: apiResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': CACHE_CONTROL.api,
        'X-Cache': 'MISS'
      }
    });
  }
  
  return apiResponse;
}

/**
 * Handle static asset requests
 */
async function handleStaticRequest(request, env, ctx) {
  const response = await fetch(request);
  
  if (response.ok) {
    // Add aggressive caching for static assets
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', CACHE_CONTROL.static);
    
    // Enable CloudFlare features
    headers.set('CF-Cache-Status', 'HIT');
    headers.set('CDN-Cache-Control', CACHE_CONTROL.static);
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
  
  return response;
}

/**
 * Handle HTML requests
 */
async function handleHtmlRequest(request, env, ctx) {
  const response = await fetch(request);
  
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', CACHE_CONTROL.html);
    
    // Add Link headers for resource hints
    headers.append('Link', '</assets/vendor-react.js>; rel=preload; as=script');
    headers.append('Link', '</assets/vendor-mui.js>; rel=preload; as=script');
    headers.append('Link', '</assets/index.css>; rel=preload; as=style');
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
  
  return response;
}

/**
 * Rate limiting implementation
 */
async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const path = new URL(request.url).pathname;
  
  // Determine rate limit tier
  let limit = RATE_LIMITS.static;
  if (isApiRequest(path)) {
    limit = RATE_LIMITS.api;
  } else if (isImageRequest(path)) {
    limit = RATE_LIMITS.images;
  }
  
  const key = `ratelimit:${ip}:${Math.floor(Date.now() / (limit.window * 1000))}`;
  const current = parseInt(await env.CACHE.get(key) || '0');
  
  if (current >= limit.requests) {
    return {
      allowed: false,
      retryAfter: limit.window
    };
  }
  
  await env.CACHE.put(key, (current + 1).toString(), {
    expirationTtl: limit.window
  });
  
  return { allowed: true };
}

/**
 * Utility functions
 */
function isImageRequest(path) {
  return /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(path);
}

function isApiRequest(path) {
  return path.startsWith('/api/');
}

function isStaticAsset(path) {
  return /\.(js|css|woff|woff2|ttf|otf|eot)$/i.test(path);
}

function detectBestFormat(accept) {
  if (accept.includes('image/avif')) return 'avif';
  if (accept.includes('image/webp')) return 'webp';
  return 'original';
}

function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
