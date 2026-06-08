/**
 * Product Video Map
 * Maps product slugs to their video file paths in public/images/products/
 * Used by ProductMedia, Home video showcase, Kiosk, and ProductDetail.
 */

export const PRODUCT_VIDEO_MAP = {
  'cold-brew-orange':    '/images/products/5 product video/Cold Brew Orange .mp4',
  'cold-brew-tonic':     '/images/products/5 product video/Cold Brew Tonic.mp4',
  'cold-brew-mint-tonic':'/images/products/5 product video/Cold Brew Mint Tonic.mp4',
  'ice-latte':           '/images/products/5 product video/Ice Latte.mp4',
  'sif-on-the-rocks':    '/images/products/5 product video/SIFon the Rocks (South indian filter Coffee).mp4',
};

export const PRODUCT_IMAGE_MAP = {
  'cold-brew-orange':    '/images/products/Cold Brew Orange .png',
  'cold-brew-tonic':     '/images/products/Cold Brew Tonic.png',
  'cold-brew-mint-tonic':'/images/products/Cold Brew Mint Tonic.png',
  'ice-latte':           '/images/products/Ice Latte.png',
  'sif-on-the-rocks':    '/images/products/SIFon the Rocks (South indian filter Coffee).png',
};

/** Ordered list for carousels and kiosk cycling */
export const PRODUCT_SHOWCASE_LIST = [
  { slug: 'cold-brew-orange',     name: 'Cold Brew Orange',     price: 180, video: PRODUCT_VIDEO_MAP['cold-brew-orange'],     image: PRODUCT_IMAGE_MAP['cold-brew-orange'] },
  { slug: 'cold-brew-tonic',      name: 'Cold Brew Tonic',      price: 160, video: PRODUCT_VIDEO_MAP['cold-brew-tonic'],      image: PRODUCT_IMAGE_MAP['cold-brew-tonic'] },
  { slug: 'cold-brew-mint-tonic', name: 'Cold Brew Mint Tonic', price: 180, video: PRODUCT_VIDEO_MAP['cold-brew-mint-tonic'], image: PRODUCT_IMAGE_MAP['cold-brew-mint-tonic'] },
  { slug: 'ice-latte',            name: 'Ice Latte',            price: 150, video: PRODUCT_VIDEO_MAP['ice-latte'],            image: PRODUCT_IMAGE_MAP['ice-latte'] },
  { slug: 'sif-on-the-rocks',     name: 'SIF on the Rocks',     price: 170, video: PRODUCT_VIDEO_MAP['sif-on-the-rocks'],     image: PRODUCT_IMAGE_MAP['sif-on-the-rocks'] },
];

/**
 * Resolve video URL from a product object.
 * Checks slug, then name-based matching.
 */
export function getProductVideo(product) {
  if (!product) return null;
  const slug = product.slug || '';
  if (PRODUCT_VIDEO_MAP[slug]) return PRODUCT_VIDEO_MAP[slug];

  // Fallback: match by name
  const name = (product.name || product.title || '').toLowerCase();
  for (const item of PRODUCT_SHOWCASE_LIST) {
    if (name.includes(item.name.toLowerCase())) return item.video;
  }
  return null;
}
