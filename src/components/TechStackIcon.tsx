import React, { useState } from 'react';
import { TechStack, TechStackIconType } from '@/types';
import { Icon } from '@/components/ui/Icon';
import { Layers, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TechStackIconProps {
  stack?: Partial<TechStack>;
  tech?: Partial<TechStack>;
  iconType?: TechStackIconType;
  icon?: any;
  iconLink?: string;
  imageUrl?: string;
  name?: string;
  className?: string;
  size?: number | string;
  fallback?: React.ComponentType<{ className?: string }>;
}

export const TechStackIcon: React.FC<TechStackIconProps> = ({
  stack: propStack,
  tech,
  iconType: propIconType,
  icon: propIcon,
  iconLink: propIconLink,
  imageUrl: propImageUrl,
  name,
  className,
  size,
  fallback: Fallback = Layers,
}) => {
  const stack = tech || propStack;
  const [imageError, setImageError] = useState(false);

  // Derive values from either stack prop or individual props
  const iconType = propIconType || stack?.iconType || 'icon';
  const icon = propIcon !== undefined ? propIcon : stack?.icon;
  const iconLink = propIconLink !== undefined ? propIconLink : stack?.iconLink;
  const imageUrl = propImageUrl !== undefined ? propImageUrl : stack?.imageUrl;
  const altText = name || stack?.name || 'Tech stack icon';

  // Handle custom URL link
  if (iconType === 'link') {
    if (!iconLink || imageError) {
      return (
        <div 
          className={cn("flex items-center justify-center text-muted-foreground/60 shrink-0", className)}
          title={imageError ? `Failed to load icon from: ${iconLink}` : 'No icon link'}
        >
          {Fallback ? <Fallback className={className} /> : <ImageOff className={cn("w-4 h-4", className)} />}
        </div>
      );
    }
    return (
      <img
        src={iconLink}
        alt={altText}
        className={cn("object-contain shrink-0", className)}
        style={size ? { width: size, height: size } : undefined}
        onError={() => setImageError(true)}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    );
  }

  // Handle media gallery image
  if (iconType === 'image') {
    if (!imageUrl || imageError) {
      return (
        <div 
          className={cn("flex items-center justify-center text-muted-foreground/60 shrink-0", className)}
          title={imageError ? `Failed to load image from: ${imageUrl}` : 'No media image'}
        >
          {Fallback ? <Fallback className={className} /> : <ImageOff className={cn("w-4 h-4", className)} />}
        </div>
      );
    }
    return (
      <img
        src={imageUrl}
        alt={altText}
        className={cn("object-contain shrink-0 rounded-sm", className)}
        style={size ? { width: size, height: size } : undefined}
        onError={() => setImageError(true)}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    );
  }

  // Default: Library Icon (or legacy string/url)
  return (
    <Icon
      value={icon}
      className={className}
      size={size}
      fallback={Fallback}
    />
  );
};

export default TechStackIcon;
