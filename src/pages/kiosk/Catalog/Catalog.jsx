import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Catalog.css';
import { productService } from '../../../services/products';
import { unwrapList } from '../../../utils/apiResponse';
import { formatCurrency } from '../../../utils/formatters';
import OrderCardSkeleton from '../../../components/skeletons/OrderCardSkeleton';
import ProductMedia from '../../../components/ProductMedia/ProductMedia';
import { getProductVideo } from '../../../constants/videoMap';


const Catalog = ({ onBack, onLogin, onCreateCustom, onCheckout, cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        const res = await productService.getAll();
        const items = unwrapList(res);
        setProducts(items);
        const catNames = items.map(p => {
          if (!p.category) return null;
          return typeof p.category === 'object' ? p.category.name : p.category;
        }).filter(Boolean);
        const uniqueCats = ['All', ...new Set(catNames)];
        setCategories(uniqueCats);
      } catch (err) {
        console.error('[KioskCatalog] Failed to load backend menu:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => {
        if (!p.category) return false;
        const catName = typeof p.category === 'object' ? p.category.name : p.category;
        return catName === selectedCategory;
      });

  const addToCart = (product) => {
    const itemPrice = parseFloat(product.price || product.base_price || 0);
    setCart([...cart, { 
      ...product, 
      name: product.title || product.name,
      price: itemPrice
    }]);
    setRecentlyAdded(product.id);
    setTimeout(() => setRecentlyAdded(null), 600);
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  // Framer Motion Custom Easing & Variants
  const transitionEase = [0.16, 1, 0.3, 1];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.04,
        ease: transitionEase
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: transitionEase 
      } 
    }
  };

  return (
    <div className="kiosk-catalog">
      {/* Sidebar Categories (Left panel) */}
      <div className="catalog-sidebar">
        <div className="categories-list">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              [ {cat.toUpperCase()} ]
            </button>
          ))}
        </div>
      </div>

      {/* Main Product Catalog (Center panel) */}
      <div className="catalog-main">
        <div className="catalog-header flex-between">
          <h2>{selectedCategory.toUpperCase()} COLLECTION</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="category-btn" onClick={onCreateCustom} style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}>
              🧪 CUSTOM LAB
            </button>
            <button className="category-btn" onClick={onLogin}>
              [ MEMBER SIGN IN ]
            </button>
          </div>
        </div>
        
        <motion.div 
          className="products-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={selectedCategory}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <OrderCardSkeleton key={idx} />
            ))
          ) : (
            filteredProducts.map(product => (
              <motion.div 
                variants={itemVariants} 
                key={product.id}
                className="kiosk-product-card"
              >
                <ProductMedia 
                  imageUrl={product.image_url || product.image || product.imageUrl}
                  videoUrl={getProductVideo(product)}
                  productName={product.title || product.name}
                  className="product-image"
                  autoPlay={true}
                  showPlayIcon={false}
                  aspectRatio="16/10"
                />
                <div className="product-details">
                  <h3>{product.title || product.name}</h3>
                  <span className="price">{formatCurrency(product.price || product.base_price || 0)}</span>
                  
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    className={`btn btn-large btn-full-width ${recentlyAdded === product.id ? 'btn-success' : 'btn-primary'}`}
                    onClick={() => addToCart(product)}
                  >
                    {recentlyAdded === product.id ? '✓ ADDED' : '+ ADD TO ORDER'}
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Cart Summary Right Panel */}
      <div className="catalog-cart-summary">
        <h3>CURRENT SELECTIONS</h3>
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-msg">Select items to begin composition</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence>
                {cart.map((item, index) => (
                  <motion.li 
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: transitionEase }}
                    className="cart-item-row"
                  >
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">{formatCurrency(item.price || 0)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
        
        <div className="cart-total">
          <span>TOTAL:</span>
          <motion.span 
            key={total}
            initial={{ opacity: 0.5, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {formatCurrency(total)}
          </motion.span>
        </div>
        
        <motion.button 
          whileTap={cart.length > 0 ? { scale: 0.98 } : {}}
          className="btn btn-primary btn-large btn-full-width"
          disabled={cart.length === 0} 
          onClick={() => onCheckout(cart, total)}
          style={{ opacity: cart.length === 0 ? 0.3 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          PROCEED TO CHECKOUT
        </motion.button>
      </div>
    </div>
  );
};

export default Catalog;
