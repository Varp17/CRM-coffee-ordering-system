import React, { useRef, useState, useEffect } from 'react';
import './ProductMedia.css';

/**
 * ProductMedia — Shows product image with optional video overlay.
 * - Desktop: video plays on hover
 * - Kiosk/autoplay mode: video autoplays muted
 * - Handles fallback gracefully
 */
const ProductMedia = ({
  imageUrl,
  videoUrl,
  productName,
  className = '',
  autoPlay = false,       // For kiosk: always play
  showPlayIcon = true,    // Show ▶ indicator when video available
  aspectRatio = '4/3',
}) => {
  const fallbackImg = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&q=80';
  const src = imageUrl || fallbackImg;
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (autoPlay && videoRef.current && videoUrl) {
      videoRef.current.play().catch(() => {});
    }
  }, [autoPlay, videoUrl]);

  const handleMouseEnter = () => {
    if (!autoPlay && videoUrl) {
      setIsHovered(true);
      videoRef.current?.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (!autoPlay && videoUrl) {
      setIsHovered(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  return (
    <div
      className={`product-media-container ${className} ${videoUrl ? 'has-video' : ''}`}
      style={{ aspectRatio }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={src}
        alt={productName || 'Product'}
        className={`product-media-image ${(isHovered || autoPlay) && videoReady ? 'media-hidden' : ''}`}
        loading="lazy"
        onError={(e) => { e.target.src = fallbackImg; }}
      />

      {videoUrl && (
        <>
          <video
            ref={videoRef}
            className={`product-media-video ${(isHovered || autoPlay) && videoReady ? 'media-visible' : ''}`}
            src={videoUrl}
            muted
            loop
            playsInline
            preload={autoPlay ? 'auto' : 'metadata'}
            onCanPlay={() => setVideoReady(true)}
          />
          {showPlayIcon && !isHovered && !autoPlay && videoReady && (
            <div className="product-media-play-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductMedia;
