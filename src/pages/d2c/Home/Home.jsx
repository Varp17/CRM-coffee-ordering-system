import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Leaf, Timer, Shield,
  Star, Send, Coffee, CheckCircle, Play, Volume2, VolumeX,
} from 'lucide-react';
import './Home.css';
import { d2cService } from '../../../services/d2cService';
import { cmsService } from '../../../services/cms';
import { useCartStore } from '../../../store/useCartStore';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import InlineDrinkBuilder from '../../../components/InlineDrinkBuilder/InlineDrinkBuilder';
import SensoryProfiler from '../../../components/SensoryProfiler/SensoryProfiler';
import RecipeDiscoverer from '../../../components/RecipeDiscoverer/RecipeDiscoverer';
import { PRODUCT_SHOWCASE_LIST } from '../../../constants/videoMap';

// Scroll-reveal wrapper
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Video showcase card — used in "Crafted Before Your Eyes" section
const VideoShowcaseCard = ({ item, onNavigate, onAddToCart }) => {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="vsc-card" ref={cardRef}>
      <div className="vsc-media">
        <img src={item.image} alt={item.name} className="vsc-poster" loading="lazy" />
        <video
          ref={videoRef}
          className={`vsc-video ${isPlaying ? 'playing' : ''}`}
          src={item.video}
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="vsc-gradient-overlay" />
      </div>
      <div className="vsc-info">
        <span className="vsc-badge">Signature</span>
        <h3 className="vsc-name">{item.name}</h3>
        <span className="vsc-price">{formatCurrency(item.price)}</span>
        <div className="vsc-actions">
          <button className="vsc-btn-add" onClick={(e) => { e.stopPropagation(); onAddToCart(); }}>
            Add to Cart
          </button>
          <button className="vsc-btn-view" onClick={onNavigate}>
            View <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [heroVideoLoaded, setHeroVideoLoaded] = useState(false);
  const [labTab, setLabTab] = useState('builder');
  const navigate = useNavigate();
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await d2cService.getCatalog();
        const prodList = prodRes.products || prodRes.data?.products || prodRes.data || prodRes || [];
        setFeaturedProducts(prodList.slice(0, 4));
        const testRes = await cmsService.getTestimonials();
        setTestimonials(testRes.data || testRes || []);
      } catch (err) {
        console.error('Home data error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!testimonials.length) return;
    const t = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(t);
  }, [testimonials]);

  const handleAddToCart = (product) => {
    const variant = product.variants?.[0] || { id: 'default', name: 'Standard', price: product.price };
    addItemToCart(product, variant, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="home-page">

      {/* ════════════════════════════════════════
          SECTION 1: HERO
      ════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-bg">
          <video
            className={`hero-bg-video ${heroVideoLoaded ? 'loaded' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            onCanPlayThrough={() => setHeroVideoLoaded(true)}
          >
            <source src="/images/hero/A_dark_moody_cinematic _ _ _s.mp4" type="video/mp4" />
          </video>
          <img
            src="https://images.unsplash.com/photo-1447933601403-56dc2df4e0e4?w=1800&q=85&auto=format"
            alt=""
            className="hero-bg-img"
            loading="eager"
          />
          <div className="hero-overlay" />
        </div>

        {/* Floating Atmospheric Redesign Elements */}
        <div className="hero-floating-elements">
          <div className="floating-bean bean-1">☕</div>
          <div className="floating-bean bean-2">🫘</div>
          <div className="floating-bean bean-3">☕</div>
          <div className="floating-glow glow-1" />
          <div className="floating-glow glow-2" />
        </div>

        <div className="hero-content section-container">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hero-eyebrow">
              <Coffee size={11} /> Crafted Before Your Eyes
            </span>

            <h1 className="hero-title">
              Swirling <br />
              <em className="hero-title-em">Perfection</em>
              <span className="hero-title-dot">.</span>
            </h1>

            <p className="hero-subtitle">
              Experience the dark, moody velvet of premium slow-motion coffee concentrates blending into creamy milk.
            </p>

            <div className="hero-cta-group">
              <button
                className="hero-cta-primary"
                onClick={() => navigate('/store/catalog')}
                id="hero-shop-now"
              >
                Shop Concentrate
                <ArrowRight size={16} />
              </button>
              <button
                className="hero-cta-secondary"
                onClick={() => navigate('/store/subscription')}
                id="hero-subscribe"
              >
                Subscribe & Save
              </button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>50+</strong>
                <span>Products</span>
              </div>
              <div className="hero-stat-sep" />
              <div className="hero-stat">
                <strong>12K+</strong>
                <span>Happy Customers</span>
              </div>
              <div className="hero-stat-sep" />
              <div className="hero-stat">
                <strong>4.9★</strong>
                <span>Rating</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.88, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hero-video-showcase-wrapper">
              <div className="glass-floating-card top-left animate-float">
                <span className="bullet-indicator" />
                <span>Slow-Brewed 18h</span>
              </div>
              <img
                src="/images/hero/image 1.png"
                alt="Iced Caramel Latte"
                className="hero-product-img"
              />
              <div className="glass-floating-card bottom-right animate-float-delayed">
                <span>Natural Arabica</span>
                <span className="bullet-indicator gold" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 2: TRUST BAR
      ════════════════════════════════════════ */}
      <section className="trust-bar">
        <div className="section-container trust-bar-inner">
          {[
            { icon: Leaf,         label: 'Single-Origin Beans' },
            { icon: Timer,        label: '18-Hour Cold Brew' },
            { icon: CheckCircle,  label: 'Free Delivery Over ₹999' },
            { icon: Shield,       label: 'Satisfaction Guarantee' },
          ].map((item, i) => (
            <div className="trust-item" key={i}>
              <item.icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3: FEATURED PRODUCTS
      ════════════════════════════════════════ */}
      <section className="featured-section section-pad">
        <div className="section-container">
          <Reveal>
            <div className="section-header">
              <span className="eyebrow">Our Bestsellers</span>
              <h2>Featured Coffees</h2>
              <p>Award-winning signatures. Crafted to brew café-style cups at home.</p>
            </div>
          </Reveal>

          <div className="products-grid">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="product-card product-card-skeleton">
                  <div className="pc-img-skeleton skeleton" />
                  <div className="pc-body">
                    <div className="skeleton" style={{ height: 14, borderRadius: 4, width: '70%' }} />
                    <div className="skeleton" style={{ height: 12, borderRadius: 4, width: '50%', marginTop: 8 }} />
                  </div>
                </div>
              ))
            ) : (
              featuredProducts.map((product, idx) => (
                <Reveal key={product.id} delay={idx * 0.08}>
                  <div
                    className="product-card"
                    onClick={() => navigate(`/store/catalog/${product.id}`)}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${product.name}`}
                  >
                    <div className="pc-img-wrap">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80'}
                        alt={product.name}
                        className="pc-img"
                        loading="lazy"
                      />
                      {product.in_stock === 0 || product.in_stock === false ? (
                        <span className="pc-out-badge">Out of Stock</span>
                      ) : null}
                    </div>
                    <div className="pc-body">
                      <div className="pc-meta">
                        <div className="pc-stars">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} size={11} fill={i < Math.round(product.rating || 5) ? '#C8853E' : 'none'} stroke="#C8853E" />
                          ))}
                          <span className="pc-rating-count">({product.review_count || 0})</span>
                        </div>
                      </div>
                      <h3 className="pc-name">{product.name}</h3>
                      <p className="pc-desc">{product.description?.slice(0, 72)}…</p>
                      <div className="pc-footer">
                        <div className="pc-price">
                          {product.original_price && product.original_price > product.price && (
                            <span className="pc-original">{formatCurrency(product.original_price)}</span>
                          )}
                          <span className="pc-current">{formatCurrency(product.price)}</span>
                        </div>
                        <button
                          className="pc-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          id={`add-to-cart-${product.id}`}
                          disabled={product.in_stock === 0 || product.in_stock === false}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))
            )}
          </div>

          <Reveal delay={0.2}>
            <div className="section-cta-row">
              <Link to="/store/catalog" className="btn-outline-espresso" id="view-all-products">
                View All Products <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3.5: CINEMATIC VIDEO SHOWCASE
      ════════════════════════════════════════ */}
      <section className="video-showcase-section">
        <div className="section-container">
          <Reveal>
            <div className="section-header">
              <span className="eyebrow">Signature Drinks</span>
              <h2>Crafted Before<br />Your Eyes</h2>
              <p>Watch each drink come to life — from pour to perfection.</p>
            </div>
          </Reveal>

          <div className="video-carousel-track">
            {PRODUCT_SHOWCASE_LIST.map((item, idx) => (
              <Reveal key={item.slug} delay={idx * 0.08}>
                <VideoShowcaseCard
                  item={item}
                  onNavigate={() => navigate(`/store/catalog/${item.slug}`)}
                  onAddToCart={() => {
                    const variant = { id: 'default', name: 'Regular', price: item.price };
                    addItemToCart({ id: item.slug, name: item.name, image_url: item.image, price: item.price }, variant, 1);
                    toast.success(`${item.name} added to cart!`);
                  }}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 3.6: THE EXPERIENCE LAB
      ════════════════════════════════════════ */}
      <section className="coffee-lab-section section-pad dark-section">
        <div className="section-container">
          <Reveal>
            <div className="section-header text-center" style={{ marginBottom: '40px' }}>
              <span className="eyebrow" style={{ color: 'var(--c-caramel-light)' }}>Interactive Lab</span>
              <h2 style={{ color: '#FFFFFF' }}>The Coffee Experience Lab</h2>
              <p style={{ color: 'rgba(240, 232, 219, 0.7)', maxWidth: '600px', margin: '0 auto' }}>
                Engage with our sensory engine, architect your volumetric cup layers, or explore standard barista formulas.
              </p>
            </div>
          </Reveal>

          {/* Interactive Lab Tabs */}
          <div className="lab-tabs-navigation">
            {[
              { id: 'builder', label: 'Volumetric Cup Architect' },
              { id: 'profiler', label: 'Sensory Matcher' },
              { id: 'recipes', label: 'Signature Formulations' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`lab-tab-nav-btn ${labTab === tab.id ? 'active' : ''}`}
                onClick={() => setLabTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="lab-tab-content">
            <Reveal key={labTab}>
              {labTab === 'builder' && <InlineDrinkBuilder />}
              {labTab === 'profiler' && <SensoryProfiler />}
              {labTab === 'recipes' && <RecipeDiscoverer />}
            </Reveal>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════
          SECTION 4: BRAND STORY
      ════════════════════════════════════════ */}
      <section className="story-section">
        <div className="section-container story-inner">
          <div className="story-image-col">
            <img
              src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80"
              alt="Barista crafting coffee"
              className="story-img"
              loading="lazy"
            />
          </div>
          <Reveal className="story-text-col">
            <span className="eyebrow">How It's Made</span>
            <h2>Single-Origin. <br />18-Hour Brew.</h2>
            <p>
              Sourced from high-altitude estates in Chikmagalur and Coorg. Cold-brewed for 18 hours. Smooth, bold, no bitterness.
            </p>
            <div className="story-pillars">
              {[
                { icon: Leaf,   title: 'Ethically Sourced', desc: 'Direct trade from farms' },
                { icon: Timer,  title: '18-Hour Cold Brew', desc: 'Zero acidity, maximum flavor' },
                { icon: Shield, title: 'Quality Guaranteed', desc: '30-day satisfaction promise' },
              ].map((p, i) => (
                <div className="story-pillar" key={i}>
                  <div className="story-pillar-icon">
                    <p.icon size={16} strokeWidth={1.8} />
                  </div>
                  <div>
                    <strong>{p.title}</strong>
                    <span>{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/store/about" className="btn-outline-espresso" id="learn-our-story">
              Full Story <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 4.5: CONCENTRATE SHOWCASE
      ════════════════════════════════════════ */}
      <section className="concentrate-showcase-section section-pad">
        <div className="section-container concentrate-inner">
          <Reveal className="concentrate-text-col">
            <span className="eyebrow">The Elixir</span>
            <h2>Pure Concentrate.<br />Infinite Possibilities.</h2>
            <p className="concentrate-p">
              We extract the deepest notes of our carefully selected single-origin beans, packing them into an ultra-concentrated brew that requires no equipment. Just add water or milk.
            </p>
            <div className="concentrate-perks">
              <div className="perk-item">
                <span className="perk-num">10x</span>
                <div>
                  <strong>High Yield Bottle</strong>
                  <span>One single bottle crafts up to 15 standard café-style beverages at home.</span>
                </div>
              </div>
              <div className="perk-item">
                <span className="perk-num">0%</span>
                <div>
                  <strong>Additive-Free</strong>
                  <span>Zero sugar, zero preservatives, zero artificial additives. Just pure cold brew essence.</span>
                </div>
              </div>
            </div>
          </Reveal>
          
          <div className="concentrate-visual-col">
            <div className="concentrate-video-wrapper">
              <video
                className="concentrate-zoom-video"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/images/hero/Prompt_—_Zoom_In_Hero.mp4" type="video/mp4" />
              </video>
              <div className="concentrate-overlay-shade" />
              
              {/* Floating Information Labels */}
              <div className="concentrate-floating-badge badge-top-left animate-float">
                <span className="badge-dot" />
                <div className="badge-info">
                  <strong>18h Steep</strong>
                  <span>Cold Extraction</span>
                </div>
              </div>
              
              <div className="concentrate-floating-badge badge-top-right animate-float-delayed">
                <span className="badge-dot gold" />
                <div className="badge-info">
                  <strong>100% Arabica</strong>
                  <span>Chikmagalur Specialty</span>
                </div>
              </div>
              
              <div className="concentrate-floating-badge badge-bottom-left animate-float">
                <span className="badge-dot" />
                <div className="badge-info">
                  <strong>Zero Sugar</strong>
                  <span>Natural sweetness</span>
                </div>
              </div>
              
              <div className="concentrate-floating-badge badge-bottom-right animate-float-delayed">
                <span className="badge-dot gold" />
                <div className="badge-info">
                  <strong>Fresh for 180 Days</strong>
                  <span>Keep chilled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 5: SUBSCRIPTION CTA
      ════════════════════════════════════════ */}
      <section className="sub-section section-pad">
        <div className="section-container">
          <Reveal>
            <div className="sub-card">
              <div className="sub-card-text">
                <span className="eyebrow" style={{ color: '#C8853E' }}>Subscribe</span>
                <h2>Never Run Out of<br />Fresh Coffee</h2>
                <p>Weekly or monthly. Pause anytime. Up to 15% off + free delivery.</p>
                <div className="sub-features">
                  <span><CheckCircle size={14} /> Free Delivery</span>
                  <span><CheckCircle size={14} /> Pause Anytime</span>
                  <span><CheckCircle size={14} /> Up to 15% Off</span>
                </div>
                <button
                  className="hero-cta-primary"
                  onClick={() => navigate('/store/subscription')}
                  id="subscription-cta"
                  style={{ marginTop: '24px' }}
                >
                  Build Your Plan <ArrowRight size={16} />
                </button>
              </div>
              <div className="sub-card-img">
                <img
                  src="/images/hero/beans.png"
                  alt="Coffee subscription"
                  loading="lazy"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 6: TESTIMONIALS
      ════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="testimonials-section section-pad">
          <div className="section-container">
            <Reveal>
              <div className="section-header">
                <span className="eyebrow">Reviews</span>
                <h2>What Our Customers Say</h2>
                <p>Real reviews from real coffee lovers.</p>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="testimonials-carousel">
                {testimonials.map((item, idx) => (
                  <div
                    key={item.uuid || item.id}
                     className={`testimonial-card ${idx === activeTestimonial ? 'active' : ''}`}
                   >
                    <p className="testi-text">{item.text}</p>
                    <div className="testi-author">
                      <div className="testi-avatar">{item.avatar || (item.name || 'U').charAt(0)}</div>
                      <div>
                        <strong>{item.name}</strong>
                        <div className="testi-stars">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} size={11} fill={i < (item.rating || 5) ? '#C8853E' : 'none'} stroke="#C8853E" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="testi-dots">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      className={`testi-dot ${idx === activeTestimonial ? 'active' : ''}`}
                      onClick={() => setActiveTestimonial(idx)}
                      aria-label={`Testimonial ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════
          SECTION 7: MISSION
      ════════════════════════════════════════ */}
      <section className="mission-section">
        <div className="section-container mission-inner">
          <Reveal>
            <span className="eyebrow" style={{ color: '#C8853E' }}>Our Promise</span>
            <h2>Good Coffee,<br />Done Right.</h2>
            <p className="mission-desc">
              Traceable beans, fair trade, and zero shortcuts. Every bottle is crafted with care.
            </p>
            <div className="mission-stats">
              <div className="mission-stat">
                <strong>100%</strong>
                <span>Traceable Beans</span>
              </div>
              <div className="mission-stat">
                <strong>12K+</strong>
                <span>Happy Customers</span>
              </div>
              <div className="mission-stat">
                <strong>₹0</strong>
                <span>Delivery Over ₹999</span>
              </div>
              <div className="mission-stat">
                <strong>4.9★</strong>
                <span>Average Rating</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECTION 8: NEWSLETTER
      ════════════════════════════════════════ */}
      <section className="newsletter-section">
        <div className="section-container">
          <Reveal>
            <div className="newsletter-block">
              <div className="newsletter-icon-wrap">
                <Coffee size={28} />
              </div>
              <h2>Stay Updated</h2>
              <p>Deals, new arrivals, and tips. No spam, unsubscribe anytime.</p>
              <form
                className="newsletter-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Subscribed! Welcome aboard ☕');
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email address"
                  required
                  className="newsletter-input"
                  id="newsletter-email"
                />
                <button type="submit" className="newsletter-submit" id="newsletter-submit">
                  Subscribe <Send size={14} />
                </button>
              </form>
              <span className="newsletter-note">No spam. Unsubscribe anytime.</span>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
};

export default Home;
