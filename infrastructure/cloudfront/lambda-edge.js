/**
 * AWS Lambda@Edge function for CloudFront
 * Handles image optimization and caching at edge locations
 */

'use strict';

const querystring = require('querystring');

// Supported image formats
const WEBP_ACCEPT = 'image/webp';
const AVIF_ACCEPT = 'image/avif';

exports.viewerRequest = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  
  // Extract query parameters
  const params = querystring.parse(request.querystring);
  
  // Check Accept header for format support
  const accept = headers.accept ? headers.accept[0].value : '';
  const supportsWebP = accept.includes(WEBP_ACCEPT);
  const supportsAVIF = accept.includes(AVIF_ACCEPT);
  
  // Normalize image request
  if (request.uri.match(/\.(jpg|jpeg|png|gif)$/i)) {
    // Add format preference to cache key
    if (supportsAVIF) {
      request.headers['x-image-format'] = [{ key: 'X-Image-Format', value: 'avif' }];
    } else if (supportsWebP) {
      request.headers['x-image-format'] = [{ key: 'X-Image-Format', value: 'webp' }];
    }
    
    // Add size parameter to cache key if present
    if (params.w || params.width) {
      const width = params.w || params.width;
      request.headers['x-image-width'] = [{ key: 'X-Image-Width', value: width }];
    }
    
    // Add quality parameter
    if (params.q || params.quality) {
      const quality = params.q || params.quality;
      request.headers['x-image-quality'] = [{ key: 'X-Image-Quality', value: quality }];
    }
  }
  
  return request;
};

exports.originRequest = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  
  // Rewrite URI based on image format preference
  if (request.uri.match(/\.(jpg|jpeg|png|gif)$/i)) {
    const format = headers['x-image-format'] ? headers['x-image-format'][0].value : null;
    const width = headers['x-image-width'] ? headers['x-image-width'][0].value : null;
    
    if (format && width) {
      // Rewrite to optimized version if available
      const basePath = request.uri.replace(/\.[^.]+$/, '');
      const newUri = `${basePath}-${width}.${format}`;
      
      // Check if optimized version exists (would need S3 head request in real implementation)
      request.uri = newUri;
    }
  }
  
  return request;
};

exports.originResponse = async (event) => {
  const response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;
  const headers = response.headers;
  
  // Add cache control headers for images
  if (request.uri.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
    headers['cache-control'] = [{
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable'
    }];
    
    // Add vary header for content negotiation
    headers['vary'] = [{
      key: 'Vary',
      value: 'Accept, Accept-Encoding'
    }];
  }
  
  // Add security headers
  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }];
  
  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];
  
  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];
  
  headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }];
  
  // Add timing header for performance monitoring
  headers['server-timing'] = [{
    key: 'Server-Timing',
    value: `cdn-cache;desc="${response.status === 304 ? 'HIT' : 'MISS'}"`
  }];
  
  return response;
};

exports.viewerResponse = async (event) => {
  const response = event.Records[0].cf.response;
  const request = event.Records[0].cf.request;
  
  // Add client hints for responsive images
  if (!response.headers['accept-ch']) {
    response.headers['accept-ch'] = [{
      key: 'Accept-CH',
      value: 'DPR, Width, Viewport-Width, Save-Data'
    }];
  }
  
  // Add permissions policy
  response.headers['permissions-policy'] = [{
    key: 'Permissions-Policy',
    value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  }];
  
  // Log performance metrics
  const cloudFrontId = request.headers['cloudfront-viewer-country']
    ? request.headers['cloudfront-viewer-country'][0].value
    : 'unknown';
    
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    uri: request.uri,
    status: response.status,
    country: cloudFrontId,
    cacheStatus: response.headers['x-cache'] ? response.headers['x-cache'][0].value : 'unknown'
  }));
  
  return response;
};
