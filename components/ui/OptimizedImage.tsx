'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// CONFIGURATION
// ============================================

// Placeholder blur data URL (1x1 pixel gris très léger)
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==';

// Placeholder pour les images de profil
const PROFILE_PLACEHOLDER = '/images/placeholder.jpg';

// Placeholder pour les établissements
const ETABLISSEMENT_PLACEHOLDER = '/images/placeholder.jpg';

// Placeholder pour les événements
const EVENEMENT_PLACEHOLDER = '/images/placeholder.jpg';

// Tailles d'images optimisées (responsive)
export const imageSizes = {
  thumbnail: { width: 150, height: 150 },
  card: { width: 400, height: 300 },
  hero: { width: 1920, height: 600 },
  profile: { width: 200, height: 200 },
  full: { width: 1200, height: 800 },
};

// ============================================
// TYPES
// ============================================

export interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  /** Source de l'image */
  src: string | null | undefined;
  
  /** Type d'image pour sélectionner le placeholder approprié */
  type?: 'default' | 'profile' | 'etablissement' | 'evenement';
  
  /** Activer le placeholder avec blur */
  blur?: boolean;
  
  /** Afficher un skeleton pendant le chargement */
  skeleton?: boolean;
  
  /** Aspect ratio (ex: "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  
  /** Classes additionnelles pour le conteneur */
  containerClassName?: string;
  
  /** Callback en cas d'erreur */
  onError?: () => void;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function OptimizedImage({
  src,
  alt,
  type = 'default',
  blur = true,
  skeleton = true,
  aspectRatio,
  className,
  containerClassName,
  fill,
  width,
  height,
  priority = false,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  // Sélectionner le placeholder approprié
  const getPlaceholder = useCallback(() => {
    switch (type) {
      case 'profile':
        return PROFILE_PLACEHOLDER;
      case 'etablissement':
        return ETABLISSEMENT_PLACEHOLDER;
      case 'evenement':
        return EVENEMENT_PLACEHOLDER;
      default:
        return '/images/placeholder.jpg';
    }
  }, [type]);

  // URL source finale avec normalisation
  let normalizedSrc = src;
  if (normalizedSrc && typeof normalizedSrc === 'string' && 
      !normalizedSrc.startsWith('http') && 
      !normalizedSrc.startsWith('/') && 
      !normalizedSrc.startsWith('data:')) {
    normalizedSrc = `/${normalizedSrc}`;
  }

  const finalSrc = hasError || !normalizedSrc ? getPlaceholder() : normalizedSrc;

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    // Eviter la boucle infinie si le placeholder échoue aussi
    if (!hasError) {
        setHasError(true);
        setIsLoading(false);
        onError?.();
    }
  }, [onError, hasError]);

  // Conteneur avec aspect ratio
  if (aspectRatio) {
    return (
      <div 
        className={cn(
          'relative overflow-hidden bg-gray-100',
          containerClassName
        )}
        style={{ aspectRatio }}
      >
        {/* Skeleton loading */}
        {skeleton && isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        )}
        
        <Image
          src={finalSrc}
          alt={alt}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? undefined : 'lazy'}
          placeholder={blur ? 'blur' : undefined}
          blurDataURL={blur ? BLUR_DATA_URL : undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={hasError || process.env.NODE_ENV === 'development'}
          {...props}
        />
      </div>
    );
  }

  // Image avec fill
  if (fill) {
    return (
      <div className={cn('relative w-full h-full', containerClassName)}>
        {skeleton && isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-inherit" />
        )}
        
        <Image
          src={finalSrc}
          alt={alt}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? undefined : 'lazy'}
          placeholder={blur ? 'blur' : undefined}
          blurDataURL={blur ? BLUR_DATA_URL : undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={hasError || process.env.NODE_ENV === 'development'}
          {...props}
        />
      </div>
    );
  }

  // Image avec dimensions fixes
  return (
    <div className={cn('relative inline-block', containerClassName)}>
      {skeleton && isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      
      <Image
        src={finalSrc}
        alt={alt}
        width={width || imageSizes.card.width}
        height={height || imageSizes.card.height}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? undefined : 'lazy'}
        placeholder={blur ? 'blur' : undefined}
        blurDataURL={blur ? BLUR_DATA_URL : undefined}
        unoptimized={hasError || process.env.NODE_ENV === 'development'}
        {...props}
      />
    </div>
  );
}

// ============================================
// COMPOSANTS PRÉCONFIGURÉ
// ============================================

/**
 * Image de profil avec fallback
 */
export function ProfileImage({
  src,
  alt = 'Photo de profil',
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'type' | 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      type="profile"
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      {...props}
    />
  );
}

/**
 * Image de carte (établissement, événement, etc.)
 */
export function CardImage({
  src,
  alt,
  type = 'etablissement',
  aspectRatio = '16/9',
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      type={type}
      aspectRatio={aspectRatio}
      className={cn('group-hover:scale-105 transition-transform duration-300', className)}
      {...props}
    />
  );
}

/**
 * Image hero (grande, priorité haute)
 */
export function HeroImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'priority' | 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority
      className={cn('object-cover', className)}
      sizes="100vw"
      {...props}
    />
  );
}

/**
 * Avatar utilisateur avec initiales fallback
 */
export function UserAvatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const [showFallback, setShowFallback] = useState(!src);
  
  // Générer les initiales
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  if (showFallback || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] text-white font-bold',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <ProfileImage
      src={src}
      alt={name}
      size={size}
      className={className}
      onError={() => setShowFallback(true)}
    />
  );
}

// ============================================
// GALLERY / LIGHTBOX
// ============================================

export interface GalleryImage {
  src: string;
  alt: string;
  thumbnail?: string;
}

/**
 * Grille d'images avec lazy loading
 */
export function ImageGallery({
  images,
  columns = 3,
  gap = 4,
  className,
}: {
  images: GalleryImage[];
  columns?: 2 | 3 | 4;
  gap?: number;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn(`grid ${gridCols[columns]} gap-${gap}`, className)}>
      {images.map((image, index) => (
        <CardImage
          key={index}
          src={image.thumbnail || image.src}
          alt={image.alt}
          aspectRatio="1/1"
          containerClassName="rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        />
      ))}
    </div>
  );
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default OptimizedImage;
