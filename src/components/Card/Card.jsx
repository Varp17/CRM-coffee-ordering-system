import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import './Card.css';
import Button from '../Button/Button';
import StarRating from '../StarRating/StarRating';
import { formatCurrency } from '../../utils/formatters';
import ProductMedia from '../ProductMedia/ProductMedia';

const Card = ({ 
  id,
  title, 
  description, 
  price,
  originalPrice,
  imageUrl, 
  category,
  actionText = "Add to Cart", 
  onAction,
  tags = [],
  rating = null,
  reviewCount = 0,
  inStock = true,
  isLoading = false
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="product-card product-card-skeleton">
        <div className="card-image-skeleton shimmer"></div>
        <div className="card-content-skeleton">
          <div className="skeleton-line skeleton-title shimmer"></div>
          <div className="skeleton-line skeleton-text shimmer"></div>
          <div className="skeleton-line skeleton-short shimmer"></div>
          <div className="skeleton-footer-row">
            <div className="skeleton-line skeleton-price shimmer"></div>
            <div className="skeleton-line skeleton-button shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className={`product-card ${!inStock ? 'card-out-of-stock' : ''}`}>
      {/* Image Container */}
      <div className="card-image-container" onClick={() => id && navigate(`/catalog/${id}`)}>
        <ProductMedia
          imageUrl={imageUrl}
          productName={title}
          className="card-image-media"
        />
        <div className="card-image-overlay">
          <button className="quick-view-btn" onClick={(e) => { e.stopPropagation(); id && navigate(`/catalog/${id}`); }}>
            <Eye size={16} />
            <span>Quick View</span>
          </button>
        </div>
        {/* Tags */}
        <div className="card-tags">
          {tags.map((tag) => (
            <span key={tag} className={`card-tag tag-${tag}`}>
              {tag}
            </span>
          ))}
          {hasDiscount && (
            <span className="card-tag tag-sale">-{discountPercent}%</span>
          )}
        </div>
        {!inStock && <div className="out-of-stock-overlay">Out of Stock</div>}
      </div>

      {/* Content */}
      <div className="card-content">
        {rating && (
          <StarRating rating={rating} count={reviewCount} size={12} />
        )}
        
        <h3 className="card-title">{title}</h3>
        
        {description && <p className="card-description line-clamp-2">{description}</p>}

        <div className="card-footer">
          <div className="card-pricing">
            <span className="card-price">{formatCurrency(price)}</span>
            {hasDiscount && (
              <span className="card-original-price">{formatCurrency(originalPrice)}</span>
            )}
          </div>
          <Button 
            variant={inStock ? "primary" : "outline"} 
            size="small" 
            onClick={(e) => { e.stopPropagation(); onAction?.(); }}
            disabled={!inStock}
            icon={inStock ? <ShoppingBag size={13} /> : null}
          >
            {inStock ? actionText : "Unavailable"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Card;
