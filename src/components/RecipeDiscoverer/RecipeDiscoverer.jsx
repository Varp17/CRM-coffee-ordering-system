import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Coffee, Sparkles, Heart, Play, ShoppingBag, Eye } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import toast from 'react-hot-toast';
import './RecipeDiscoverer.css';

const RECIPES = {
  light: {
    id: 'prod-002',
    name: 'Cold Brew Tonic',
    price: 160,
    originalPrice: 200,
    rating: 4.8,
    reviews: 22,
    beanType: 'Arabica & Robusta',
    roast: 'Light & Crispy',
    prepTime: '2 Min',
    sweetness: 'Clean & Bitter-Sweet',
    description: 'Classic layered cold brew with premium tonic water. Crisp and clean.',
    image: '/images/products/iced-coffee.png',
    ingredients: [
      { name: 'Cold Brew', amount: '90 ml', type: 'Slow drip' },
      { name: 'Tonic Water', amount: '130 ml', type: 'Premium mixer' },
      { name: 'Ice Cubes', amount: '5 pcs', type: 'Slow melt' }
    ]
  },
  medium: {
    id: 'prod-001',
    name: 'Cold Brew Orange',
    price: 180,
    originalPrice: 220,
    rating: 4.9,
    reviews: 15,
    beanType: 'Arabica',
    roast: 'Medium Roast',
    prepTime: '3 Min',
    sweetness: 'Honey & Orange',
    description: 'Refreshing cold brew with fresh orange juice and honey. Perfect for a sunny Saturday.',
    image: '/images/products/cold-brew.png',
    ingredients: [
      { name: 'Cold Brew Concentrate', amount: '100 ml', type: 'Signature' },
      { name: 'Fresh Orange Juice', amount: '30 ml', type: 'Citrus' },
      { name: 'Lemon Juice', amount: '5 ml', type: 'Zesty' },
      { name: 'Honey', amount: '20 ml', type: 'Organic Sweetener' },
      { name: 'Plain Soda Water', amount: '95 ml', type: 'Sparkling' }
    ]
  },
  strong: {
    id: 'prod-005',
    name: 'SIF on the Rocks',
    price: 170,
    originalPrice: 210,
    rating: 4.9,
    reviews: 30,
    beanType: 'Peaberry (70:30 chicory)',
    roast: 'Dark & Intense',
    prepTime: '2 Min',
    sweetness: 'Condensed Milk',
    description: 'South Indian Filter coffee concentrate with condensed milk on ice. Strong and creamy.',
    image: '/images/products/filter-coffee.png',
    ingredients: [
      { name: 'Chicory Concentrate', amount: '135 ml', type: 'Traditional extract' },
      { name: 'Condensed Milk', amount: '30 ml', type: 'Sweetened milk' },
      { name: 'Nandini Milk', amount: '40 ml', type: 'Dairy base' }
    ]
  }
};

const RecipeDiscoverer = () => {
  const [strength, setStrength] = useState('medium');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const addItemToCart = useCartStore((state) => state.addItem);

  const activeRecipe = RECIPES[strength];

  const handleBrewAndCart = () => {
    const product = {
      id: activeRecipe.id,
      name: activeRecipe.name,
      price: activeRecipe.price,
      original_price: activeRecipe.originalPrice,
      image_url: activeRecipe.image,
      rating: activeRecipe.rating,
      review_count: activeRecipe.reviews,
      tags: [strength.toUpperCase(), activeRecipe.roast],
      in_stock: true
    };
    
    const variant = {
      id: `${activeRecipe.id}-standard`,
      name: 'Standard (360ml)',
      price: activeRecipe.price
    };

    addItemToCart(product, variant, 1);
    toast.success(`${activeRecipe.name} brewed and added to cart! ☕✨`);
  };

  return (
    <section className="discoverer-wrapper">
      <div className="discoverer-bg-details">
        <div className="bg-blur blur-1" />
        <div className="bg-blur blur-2" />
      </div>

      <div className="section-container discoverer-layout">
        {/* Left Interactive Wizard Column */}
        <div className="wizard-panel">
          <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>
            <Sparkles size={12} style={{ marginRight: '6px', color: 'var(--color-accent)' }} />
            Artisanal Assistant
          </span>
          <h2 className="wizard-title">
            How do you <em className="italic-accent">like</em> your coffee?
          </h2>
          <p className="wizard-subtitle">
            Choose your signature profile below. Our assistant will instantly configure the volumetric balance, bean origin, and recipe guidelines.
          </p>

          <div className="strength-selector-container">
            <span className="selector-label">SELECT COFFEE STRENGTH</span>
            <div className="strength-buttons">
              {['light', 'medium', 'strong'].map((level) => (
                <button
                  key={level}
                  onClick={() => setStrength(level)}
                  className={`strength-btn ${strength === level ? 'active' : ''}`}
                >
                  <span className="btn-indicator" />
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="pro-insights-card">
            <div className="insight-icon">
              <Coffee size={18} />
            </div>
            <div className="insight-text">
              <strong>Barista's Pairing Tip</strong>
              <p>
                {strength === 'light' && 'Best paired with our premium measured pourer and premium shaker glass. Perfect for late mornings.'}
                {strength === 'medium' && 'Excellent as an everyday refresher. Tastes best with organic oat milk or honey sweeteners.'}
                {strength === 'strong' && 'Ideal with a standard 360ml tall standard cup. Our Peaberry blend will power up your focus instantly.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup Column */}
        <div className="phone-mockup-panel">
          <div className="phone-device">
            {/* Dynamic notch */}
            <div className="phone-notch" />
            
            {/* Screen Header */}
            <div className="phone-screen-header">
              <div className="user-avatar-row">
                <div className="mini-avatar">☕</div>
                <div>
                  <span className="avatar-welcome">Brewing Now</span>
                  <strong className="avatar-name">Signature Recipe</strong>
                </div>
              </div>
              <button className="like-btn" aria-label="Add to favorites">
                <Heart size={14} fill="#EF4444" stroke="#EF4444" />
              </button>
            </div>

            {/* Screen Content */}
            <div className="phone-screen-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={strength}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="recipe-details"
                >
                  {/* Glass image display */}
                  <div className="recipe-image-wrap">
                    <img src={activeRecipe.image} alt={activeRecipe.name} className="recipe-image" />
                    <div className="recipe-badge-tag">{activeRecipe.roast}</div>
                  </div>

                  {/* Title & Rating */}
                  <div className="recipe-meta">
                    <div>
                      <h3 className="recipe-name">{activeRecipe.name}</h3>
                      <span className="recipe-sweet-flag">{activeRecipe.sweetness}</span>
                    </div>
                    <div className="recipe-rating">
                      <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                      <strong>{activeRecipe.rating}</strong>
                    </div>
                  </div>

                  {/* Attributes Bar */}
                  <div className="attributes-grid">
                    <div className="attr-pill">
                      <strong className="attr-val">{activeRecipe.beanType}</strong>
                      <span className="attr-lbl">Beans</span>
                    </div>
                    <div className="attr-pill">
                      <div className="attr-flex">
                        <Clock size={12} />
                        <strong className="attr-val">{activeRecipe.prepTime}</strong>
                      </div>
                      <span className="attr-lbl">Duration</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="recipe-description-box">
                    <h4>Description</h4>
                    <p>{activeRecipe.description}</p>
                  </div>

                  {/* Ingredients */}
                  <div className="ingredients-box">
                    <h4>Volumetric Recipe</h4>
                    <div className="ingredients-list">
                      {activeRecipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="ingredient-item">
                          <div>
                            <span className="ing-name">{ing.name}</span>
                            <span className="ing-type">{ing.type}</span>
                          </div>
                          <strong className="ing-amount">{ing.amount}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Screen Sticky Bottom Actions */}
            <div className="phone-screen-footer">
              <button className="watch-tutorial-btn" onClick={() => setShowVideoModal(true)}>
                <Play size={10} fill="currentColor" />
                Watch Tutorial
              </button>
              <button className="brew-now-btn" onClick={handleBrewAndCart}>
                <ShoppingBag size={14} />
                <span>Brew & Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightweight Local Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <div className="local-modal-overlay" onClick={() => setShowVideoModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="local-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{activeRecipe.name} — Crafting Video</h3>
                <button className="close-modal-btn" onClick={() => setShowVideoModal(false)}>×</button>
              </div>
              <div className="video-player-container">
                <div className="mock-video-player">
                  <div className="player-overlay">
                    <Play size={44} className="play-icon-glow" />
                    <span>Barista Volumetric Demonstration</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <p>Learn to aerate and frothed standard standard milk cup configurations at home using premium measured pourers.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default RecipeDiscoverer;
