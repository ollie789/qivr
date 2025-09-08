import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { Box, Skeleton, SxProps, Theme } from '@mui/material';

interface ImageSource {
  src: string;
  type?: string;
  media?: string;
}

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  blurDataURL?: string;
  quality?: number;
  formats?: ('webp' | 'avif')[];
  responsive?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  sx?: SxProps<Theme>;
  fallbackSrc?: string;
  aspectRatio?: number;
  cloudflareOptimize?: boolean;
}

/**
 * OptimizedImage Component
 * Features:
 * - Automatic WebP/AVIF format selection
 * - Lazy loading with Intersection Observer
 * - Responsive image sizes
 * - Blur placeholder support
 * - CloudFlare image optimization
 * - Fallback handling
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  sizes,
  loading = 'lazy',
  priority = false,
  placeholder = 'skeleton',
  blurDataURL,
  quality = 85,
  formats = ['avif', 'webp'],
  responsive = true,
  objectFit = 'cover',
  onLoad,
  onError,
  sx,
  fallbackSrc = '/images/placeholder.jpg',
  aspectRatio,
  cloudflareOptimize = true,
  className,
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate aspect ratio if height and width are provided
  const calculatedAspectRatio = aspectRatio || 
    (width && height ? (Number(height) / Number(width)) * 100 : undefined);

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager' || !containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority, loading]);

  // Generate CloudFlare optimized URL
  const getOptimizedUrl = (url: string, format?: string) => {
    if (!cloudflareOptimize || !url.startsWith('http')) {
      return url;
    }

    const baseUrl = new URL(url);
    const params = new URLSearchParams();

    // Add format parameter
    if (format) {
      params.append('format', format);
    }

    // Add quality parameter
    params.append('quality', quality.toString());

    // Add size parameters for responsive images
    if (responsive && width) {
      params.append('width', width.toString());
      if (height) {
        params.append('height', height.toString());
      }
    }

    // Construct CloudFlare Image Resizing URL
    const cfUrl = `${baseUrl.origin}/cdn-cgi/image/${params.toString()}${baseUrl.pathname}`;
    return cfUrl;
  };

  // Generate source set for different formats
  const generateSources = (): ImageSource[] => {
    const sources: ImageSource[] = [];

    // Add AVIF source if supported
    if (formats.includes('avif')) {
      sources.push({
        src: getOptimizedUrl(src, 'avif'),
        type: 'image/avif'
      });
    }

    // Add WebP source if supported
    if (formats.includes('webp')) {
      sources.push({
        src: getOptimizedUrl(src, 'webp'),
        type: 'image/webp'
      });
    }

    return sources;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (format?: string): string => {
    if (!responsive) {
      return '';
    }

    const widths = [320, 640, 768, 1024, 1280, 1536, 1920];
    return widths
      .map(w => {
        const url = getOptimizedUrl(src.replace(/width=\d+/, `width=${w}`), format);
        return `${url} ${w}w`;
      })
      .join(', ');
  };

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder === 'none') return null;

    if (placeholder === 'blur' && blurDataURL) {
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: objectFit,
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            ...sx
          }}
        />
      );
    }

    if (placeholder === 'skeleton') {
      return (
        <Skeleton
          variant="rectangular"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            ...sx
          }}
        />
      );
    }

    return null;
  };

  const sources = generateSources();

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        paddingBottom: calculatedAspectRatio ? `${calculatedAspectRatio}%` : undefined,
        overflow: 'hidden',
        ...sx
      }}
      className={className}
    >
      {renderPlaceholder()}
      
      {isInView && (
        <picture>
          {sources.map((source, index) => (
            <source
              key={index}
              srcSet={generateSrcSet(source.src.includes('avif') ? 'avif' : 'webp')}
              type={source.type}
              media={source.media}
              sizes={sizes}
            />
          ))}
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            loading={priority ? 'eager' : loading}
            onLoad={handleLoad}
            onError={handleError}
            sizes={sizes}
            style={{
              position: calculatedAspectRatio ? 'absolute' : 'relative',
              top: 0,
              left: 0,
              width: '100%',
              height: calculatedAspectRatio ? '100%' : height || 'auto',
              objectFit,
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
            {...imgProps}
          />
        </picture>
      )}
    </Box>
  );
};

/**
 * Hook for preloading images
 */
export const useImagePreloader = (urls: string[]) => {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoaded(prev => ({ ...prev, [url]: true }));
          resolve();
        };
        img.onerror = () => {
          setLoaded(prev => ({ ...prev, [url]: false }));
          reject();
        };
        img.src = url;
      });
    };

    Promise.all(urls.map(loadImage));
  }, [urls]);

  return loaded;
};

/**
 * Hook for detecting WebP/AVIF support
 */
export const useImageFormatSupport = () => {
  const [support, setSupport] = useState({
    webp: false,
    avif: false
  });

  useEffect(() => {
    // Check WebP support
    const checkWebP = new Promise<boolean>((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });

    // Check AVIF support
    const checkAVIF = new Promise<boolean>((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A==';
    });

    Promise.all([checkWebP, checkAVIF]).then(([webp, avif]) => {
      setSupport({ webp, avif });
    });
  }, []);

  return support;
};
