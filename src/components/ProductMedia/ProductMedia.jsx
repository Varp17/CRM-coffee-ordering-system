import React, { useState, useEffect, useRef } from 'react';
import './ProductMedia.css';

// Dynamic helper mapping categories and names to high-quality coffee preparation loop videos
export const getProductVideo = (name = '', category = '') => {
  const lowerName = name.toLowerCase();
  const lowerCat = category.toLowerCase();

  // Matcha
  if (lowerName.includes('matcha') || lowerCat.includes('matcha')) {
    return 'https://assets.mixkit.co/videos/preview/mixkit-preparing-matcha-tea-close-up-43036-large.mp4';
  }
  // Cold brew / Iced coffee / Concentrates / South Indian Filter
  if (
    lowerName.includes('cold brew') ||
    lowerName.includes('iced') ||
    lowerName.includes('chilled') ||
    lowerName.includes('filter') ||
    lowerCat.includes('concentrate') ||
    lowerCat.includes('chilled')
  ) {
    return 'https://assets.mixkit.co/videos/preview/mixkit-pouring-cold-brew-iced-coffee-in-a-glass-42490-large.mp4';
  }
  // Lattes / Cappuccino / Macchiato / Flat White
  if (
    lowerName.includes('latte') ||
    lowerName.includes('cappuccino') ||
    lowerName.includes('mocha') ||
    lowerName.includes('macchiato') ||
    lowerName.includes('flat white')
  ) {
    return 'https://assets.mixkit.co/videos/preview/mixkit-barista-pouring-milk-into-a-cup-of-coffee-34289-large.mp4';
  }
  // Espresso / Americana
  if (lowerName.includes('espresso') || lowerName.includes('americano')) {
    return 'https://assets.mixkit.co/videos/preview/mixkit-pouring-hot-espresso-coffee-into-a-cup-42488-large.mp4';
  }
  // Accessories / Pourers / Shakers
  if (lowerCat.includes('accessories') || lowerName.includes('pourer') || lowerName.includes('shaker')) {
    return 'https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-into-a-cup-42489-large.mp4';
  }
  // Default / Merchandise / General Coffee Beans Falling Loop
  return 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-falling-on-a-pile-39970-large.mp4';
};

const ProductMedia = ({ imageUrl, productName, category, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const hoverTimer = useRef(null);

  const videoUrl = getProductVideo(productName, category);
  const fallbackImage = imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&q=80';

  useEffect(() => {
    if (isHovered) {
      // 150ms delay to prevent aggressive video mounting/loading during rapid scroll/swipe
      hoverTimer.current = setTimeout(() => {
        setShouldPlayVideo(true);
      }, 150);
    } else {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
      setShouldPlayVideo(false);
      setIsVideoLoaded(false);
      setVideoError(false);
    }

    return () => {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }
    };
  }, [isHovered]);

  return (
    <div
      className={`product-media-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static Thumbnail Image */}
      <div
        className={`product-media-image ${shouldPlayVideo && isVideoLoaded ? 'fade-out' : ''}`}
        style={{ backgroundImage: `url(${fallbackImage})` }}
      />

      {/* Lazy Loaded Loop Video */}
      {shouldPlayVideo && !videoError && (
        <video
          src={videoUrl}
          className={`product-media-video ${isVideoLoaded ? 'fade-in' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setIsVideoLoaded(true)}
          onError={() => setVideoError(true)}
        />
      )}
    </div>
  );
};

export default ProductMedia;
