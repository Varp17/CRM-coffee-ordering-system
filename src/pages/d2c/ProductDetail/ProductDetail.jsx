import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import Button from '../../../components/Button/Button';
import { cmsService } from '../../../services/cms';
import { useCartStore } from '../../../store/useCartStore';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';
import CustomizationModal from '../../../components/CustomizationModal/CustomizationModal';

const ProductDetail = () => {
  const { id } = useParams(); // id matches product slug
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const data = await cmsService.getD2CProductBySlug(id);
        if (data && !data.error) {
          setProduct(data);
          // Set initial image and variant
          setActiveImage(data.image_url || '');
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          } else {
            setSelectedVariant({ id: 'default', name: 'Standard', price: data.price });
          }
          
          // Get all products to filter related
          const allProds = await cmsService.getD2CProducts();
          const list = allProds.data || allProds || [];
          const related = list
            .filter((p) => p.category === data.category && p.slug !== data.slug)
            .slice(0, 3);
          setRelatedProducts(related);
        } else {
          toast.error('Product not found!');
          navigate('/store/catalog');
        }
      } catch (err) {
        console.error('Failed to load product details', err);
        toast.error('Failed to load product.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id, navigate]);

  const handleQuantityChange = (val) => {
    if (val < 1) return;
    setQuantity(val);
  };

  const handleAddToCart = () => {
    if (!product) return;
    setModalOpen(true);
  };

  const handleModalAddToCart = (customDrink, variant, modalQty) => {
    addItemToCart(customDrink, variant, modalQty);
    toast.success(`${customDrink.title} added to cart!`);
  };

  if (loading) {
    return (
      <div className="detail-page container loading-detail animate-pulse">
        <div className="skeleton-image-large shimmer"></div>
        <div className="skeleton-info-block">
          <div className="skeleton-line shimmer" style={{ width: '60%', height: '32px' }}></div>
          <div className="skeleton-line shimmer" style={{ width: '40%', height: '24px', marginTop: '1rem' }}></div>
          <div className="skeleton-line shimmer" style={{ width: '80%', height: '100px', marginTop: '2rem' }}></div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="detail-page animate-fade-in">
      <button className="back-btn" onClick={() => navigate('/store/catalog')}>
        {t('productDetail.back', '← Back to Catalog')}
      </button>

      <div className="detail-grid">
        {/* Gallery */}
        <div className="gallery-section">
          <div className="main-image-container">
            <img src={activeImage} alt={product.title} className="main-image" />
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="thumbnails-row">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumbnail-btn ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Thumb ${idx}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="info-section">
          <div className="info-header">
            {product.tags && product.tags.map((tag) => (
              <span key={tag} className={`detail-tag tag-${tag}`}>{tag}</span>
            ))}
            <h1 className="product-detail-title">{product.title}</h1>
            
            {product.rating && (
              <div className="detail-rating">
                <span className="star">⭐</span>
                <strong>{product.rating}</strong> 
                <span className="count">({product.review_count} {t('productDetail.reviewsText', 'customer reviews')})</span>
              </div>
            )}
          </div>

          <div className="detail-price-row">
            <span className="price-label">{t('productDetail.priceLabel', 'Price:')}</span>
            <span className="price-value">
              {formatCurrency(selectedVariant ? selectedVariant.price : product.price)}
            </span>
          </div>

          <p className="detail-description">{product.description}</p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="variants-section">
              <h3>{t('productDetail.selectSize', 'Select Bottle/Pack Size')}</h3>
              <div className="variants-grid">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`variant-option-btn ${selectedVariant?.id === v.id ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <span className="v-name">{v.name}</span>
                    <span className="v-price">{formatCurrency(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="purchase-controls-row">
            <div className="quantity-selector">
              <button onClick={() => handleQuantityChange(quantity - 1)}>-</button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange(quantity + 1)}>+</button>
            </div>
            
            <Button 
              variant="primary" 
              size="large" 
              onClick={handleAddToCart}
              disabled={!(product.in_stock === 1 || product.in_stock === true)}
              fullWidth={true}
            >
              {(product.in_stock === 1 || product.in_stock === true) ? t('productDetail.addToCart', 'Customize & Add to Cart 🛒') : t('productDetail.outOfStock', 'Out of Stock 🚫')}
            </Button>
          </div>

          <div className="delivery-trust-badge">
            {t('productDetail.deliveryBadge', '⚡ Express delivery available in Bengaluru (12-24 Hours)')}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="related-section">
          <h2>{t('productDetail.relatedTitle', 'You May Also Like')}</h2>
          <div className="related-grid">
            {relatedProducts.map((p) => (
              <div 
                key={p.id || p.uuid} 
                className="related-card-click"
                onClick={() => {
                  navigate(`/catalog/${p.slug || p.uuid}`);
                  window.scrollTo(0, 0);
                }}
              >
                <div className="related-img-container">
                  <img src={p.image_url} alt={p.title} />
                </div>
                <div className="related-card-info">
                  <h4>{p.title}</h4>
                  <span className="related-price">{formatCurrency(p.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customization Modal */}
      <CustomizationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={product}
        onAddToCart={handleModalAddToCart}
      />
    </div>
  );
};

export default ProductDetail;
