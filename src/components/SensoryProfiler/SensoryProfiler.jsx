import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Eye, Star, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import toast from 'react-hot-toast';
import './SensoryProfiler.css';

const TASTE_PROFILES = [
  {
    id: 'bright-citrusy',
    label: 'BRIGHT & CITRUSY',
    name: 'Single-Origin Arabica (Chikmagalur)',
    price: 249,
    rating: 4.8,
    reviews: 154,
    notes: 'Peach, Crisp Jasmine, Lemon Zest',
    desc: 'Ethically harvested from high-altitude estates. A light roasting highlights original stone fruit sweetness and delicate floral aromas with clean acidity.',
    acidity: 90,
    body: 35,
    sweetness: 65,
    intensity: 40,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    tags: ['LIGHT ROAST', 'HONEY PROCESSED']
  },
  {
    id: 'sweet-balanced',
    label: 'SWEET & BALANCED',
    name: 'Signature Cold Brew Concentrate',
    price: 289,
    rating: 4.9,
    reviews: 218,
    notes: 'Caramel Fudge, Buttery Cocoa, Vanilla',
    desc: 'Slow cold-extracted for 18 hours to fully eliminate bitterness. Delivers heavy chocolate and rich molasses sweetness with a velvety texture.',
    acidity: 40,
    body: 70,
    sweetness: 90,
    intensity: 65,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
    tags: ['MEDIUM ROAST', '18H SLOW EXTRACT']
  },
  {
    id: 'bold-intense',
    label: 'BOLD & INTENSE',
    name: 'South Indian Peaberry Blend',
    price: 199,
    rating: 4.9,
    reviews: 342,
    notes: 'Dark Cocoa, Roasted Chicory, Brown Sugar',
    desc: 'Traditional 70:30 Peaberry and high-grade chicory formula. Yields a highly aromatic, dense body designed to froth with boiling milk.',
    acidity: 20,
    body: 95,
    sweetness: 50,
    intensity: 95,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80',
    tags: ['DARK ROAST', 'TRADITIONAL BLEND']
  }
];

const SensoryProfiler = () => {
  const [activeTab, setActiveTab] = useState(TASTE_PROFILES[0]);
  const addItemToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    const product = {
      id: activeTab.id,
      name: activeTab.name,
      price: activeTab.price,
      image_url: activeTab.image,
      rating: activeTab.rating,
      review_count: activeTab.reviews,
      tags: activeTab.tags,
      in_stock: true
    };
    const defaultVariant = {
      id: `${activeTab.id}-standard`,
      name: 'Standard Bottle (360ml)',
      price: activeTab.price
    };
    addItemToCart(product, defaultVariant, 1);
    toast.success(`${activeTab.name} added to cart! ☕✨`);
  };

  return (
    <section className="sensory-profiler-section">
      <div className="section-container">
        <div className="sensory-grid">
          {/* Left panel: Dial and selector */}
          <div className="sensory-control-panel">
            <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>
              <Sparkles size={12} style={{ marginRight: '6px', color: 'var(--color-accent)' }} />
              SENSORY PROFILE DISCOVERY
            </span>
            <h2 className="sensory-title">
              Match Your Taste <em className="italic-accent">Profile</em>
            </h2>
            <p className="sensory-subtitle">
              Select a taste category below. Our sensory engine will dynamically plot the flavor telemetry and curate the ideal specialty roast.
            </p>

            <div className="sensory-tabs">
              {TASTE_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setActiveTab(profile)}
                  className={`sensory-tab-btn ${activeTab.id === profile.id ? 'active' : ''}`}
                >
                  <span className="tab-indicator" />
                  {profile.label}
                </button>
              ))}
            </div>

            {/* Live telemetry progress bars */}
            <div className="telemetry-chart">
              <span className="chart-header">FLAVOR METADATA TELEMETRY</span>
              <div className="telemetry-bars">
                {[
                  { name: 'ACIDITY', val: activeTab.acidity },
                  { name: 'BODY / DENSITY', val: activeTab.body },
                  { name: 'SWEETNESS', val: activeTab.sweetness },
                  { name: 'INTENSITY', val: activeTab.intensity }
                ].map((stat) => (
                  <div key={stat.name} className="telemetry-item">
                    <div className="telemetry-label">
                      <span>{stat.name}</span>
                      <span>{stat.val}%</span>
                    </div>
                    <div className="telemetry-bar-bg">
                      <motion.div
                        className="telemetry-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.val}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Curated Match Card */}
          <div className="sensory-card-panel">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                className="sensory-match-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="match-image-wrap">
                  <img src={activeTab.image} alt={activeTab.name} className="match-image" />
                  <div className="match-tag-badge">RECOMMENDED MATCH</div>
                </div>

                <div className="match-details">
                  <div className="match-header-row">
                    <div>
                      <h3 className="match-product-name">{activeTab.name}</h3>
                      <span className="match-notes">{activeTab.notes}</span>
                    </div>
                    <div className="match-rating">
                      <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                      <span>{activeTab.rating}</span>
                    </div>
                  </div>

                  <p className="match-desc">{activeTab.desc}</p>

                  <div className="match-tags-row">
                    {activeTab.tags.map((tag) => (
                      <span key={tag} className="match-pill">{tag}</span>
                    ))}
                  </div>

                  <div className="match-action-row">
                    <div className="match-price">
                      <span className="price-lbl">Standard 360ml</span>
                      <strong className="price-amt">₹{activeTab.price}</strong>
                    </div>
                    <button className="match-buy-btn" onClick={handleAddToCart}>
                      <ShoppingBag size={16} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SensoryProfiler;
