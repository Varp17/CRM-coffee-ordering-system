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

  // Resolve video vs image if the imageUrl itself is a video
  let resolvedImageUrl = imageUrl;
  let resolvedVideoUrl = videoUrl;

  if (imageUrl && imageUrl.endsWith('.mp4')) {
    resolvedVideoUrl = imageUrl;
    
    // Map video paths to their corresponding static PNG images
    const videoToImageMap = {
      '/images/products/5 product video/Cold Brew Orange .mp4': '/images/products/Cold Brew Orange .png',
      '/images/products/5 product video/Cold Brew Tonic.mp4': '/images/products/Cold Brew Tonic.png',
      '/images/products/5 product video/Cold Brew Mint Tonic.mp4': '/images/products/Cold Brew Mint Tonic.png',
      '/images/products/5 product video/Ice Latte.mp4': '/images/products/Ice Latte.png',
      '/images/products/5 product video/SIFon the Rocks (South indian filter Coffee).mp4': '/images/products/SIFon the Rocks (South indian filter Coffee).png',
      '/images/products/Salted_Caramel_Jaggery_Bran.mp4': '/images/products/Salted Caramel Jaggery.png',
      '/images/products/Honey_Spiced_Latte_Brand_St.mp4': '/images/products/Honey Spiced Latte.png',
      '/images/products/Ice_Mocha_Brand_Story_Choco.mp4': '/images/products/Ice Mocha.png',
      '/images/products/Hazelnut_Cream_Kiosk_Video.mp4': '/images/products/Hazelnut_Cream_Kiosk_Video.png',
      '/images/products/Smoky_Jaggery_Latte_Kiosk.mp4': '/images/products/Smoky_Jaggery_Latte_Kiosk.png',
    };

    if (videoToImageMap[imageUrl]) {
      resolvedImageUrl = videoToImageMap[imageUrl];
    } else {
      // General fallback replace
      resolvedImageUrl = imageUrl.replace(/\.mp4$/i, '.png');
    }
  }

  const src = resolvedImageUrl || fallbackImg;
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (autoPlay && videoRef.current && resolvedVideoUrl) {
      videoRef.current.play().catch(() => {});
    }
  }, [autoPlay, resolvedVideoUrl]);

  const handleMouseEnter = () => {
    if (!autoPlay && resolvedVideoUrl) {
      setIsHovered(true);
      videoRef.current?.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (!autoPlay && resolvedVideoUrl) {
      setIsHovered(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  return (
    <div
      className={`product-media-container ${className} ${resolvedVideoUrl ? 'has-video' : ''}`}
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

      {resolvedVideoUrl && (
        <>
          <video
            ref={videoRef}
            className={`product-media-video ${(isHovered || autoPlay) && videoReady ? 'media-visible' : ''}`}
            src={resolvedVideoUrl}
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
