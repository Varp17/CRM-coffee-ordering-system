import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Catalog.css';
import Button from '../../../components/Button/Button';
import AnimatedCard from '../../../components/Motion/AnimatedCard';
import { productService } from '../../../services/products';
import { unwrapList } from '../../../utils/apiResponse';
import { formatCurrency } from '../../../utils/formatters';
import OrderCardSkeleton from '../../../components/skeletons/OrderCardSkeleton';

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
    // Basic conversion for POS cart format
    setCart([...cart, { ...product, name: product.title || product.name }]);
    
    // Tactile micro-interaction state
    setRecentlyAdded(product.id);
    setTimeout(() => setRecentlyAdded(null), 600);
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="kiosk-catalog">
      <div className="catalog-sidebar">
        <div className="categories-list">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-main">
        <div className="catalog-header flex-between">
          <h2>Select Your Items</h2>
          <div style={{ display: 'flex', gap: '16px' }}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" size="large" onClick={onCreateCustom}>✨ Custom Drink</Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="secondary" size="large" onClick={onLogin}>Member Login</Button>
            </motion.div>
          </div>
        </div>
        
        <motion.div 
          className="products-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={selectedCategory} // Force re-render animation when category changes
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <OrderCardSkeleton key={idx} />
            ))
          ) : (
            filteredProducts.map(product => (
              <motion.div variants={itemVariants} key={product.id}>
                <AnimatedCard className="kiosk-product-card" layout={false}>
                  <div 
                    className="product-image" 
                    style={{ backgroundImage: `url(${product.image_url || product.image || product.imageUrl || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'})` }}
                  ></div>
                  <div className="product-details">
                    <h3>{product.title || product.name}</h3>
                    <span className="price">{formatCurrency(product.price || product.base_price || 0)}</span>
                    
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      className={`btn btn-large btn-full-width ${recentlyAdded === product.id ? 'btn-success' : 'btn-primary'}`}
                      onClick={() => addToCart(product)}
                    >
                      {recentlyAdded === product.id ? '✓ Added' : '+ Add to Order'}
                    </motion.button>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      <div className="catalog-cart-summary">
        <h3>Your Order</h3>
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-msg">Tap 'Add to Order' to begin</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence>
                {cart.map((item, index) => (
                  <motion.li 
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
        
        <motion.div layout className="cart-total">
          <span>Total:</span>
          <motion.span 
            key={total}
            initial={{ scale: 1.1, color: 'var(--color-primary)' }}
            animate={{ scale: 1, color: 'var(--color-text)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {formatCurrency(total)}
          </motion.span>
        </motion.div>
        
        <motion.div whileHover={cart.length > 0 ? { scale: 1.02 } : {}} whileTap={cart.length > 0 ? { scale: 0.98 } : {}}>
          <Button 
            variant="primary" 
            size="large" 
            disabled={cart.length === 0} 
            onClick={() => onCheckout(cart, total)}
            className="btn-full-width"
          >
            Proceed to Checkout
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Catalog;
