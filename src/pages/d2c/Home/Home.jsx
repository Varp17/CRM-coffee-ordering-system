import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, ChevronDown, Leaf, Timer, Target,
  ShoppingBag, Star, Quote, Send, Coffee, Sparkles
} from 'lucide-react';
import './Home.css';
import Button from '../../../components/Button/Button';
import Card from '../../../components/Card/Card';
import SectionHeader from '../../../components/SectionHeader/SectionHeader';
import StarRating from '../../../components/StarRating/StarRating';
import CupAnimation from '../../../components/CupAnimation/CupAnimation';
import { d2cService } from '../../../services/d2cService';
import { cmsService } from '../../../services/cms';
import { useCartStore } from '../../../store/useCartStore';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';
import SensoryProfiler from '../../../components/SensoryProfiler/SensoryProfiler';
import InlineDrinkBuilder from '../../../components/InlineDrinkBuilder/InlineDrinkBuilder';
import LoyaltyClub from '../../../components/LoyaltyClub/LoyaltyClub';
import AromaParticles from '../../../components/system/AromaParticles';
import RoastProfileSlider from '../../../components/system/RoastProfileSlider';
import BrewMethodGuide from '../../../components/system/BrewMethodGuide';


// Scroll-triggered section wrapper
const ScrollReveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Stagger children wrapper
const StaggerContainer = ({ children, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {children}
    </motion.div>
  );
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const SOCIAL_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80',
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80',
  'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=400&q=80',
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const navigate = useNavigate();
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await d2cService.getCatalog();
        const prodList = prodRes.products || prodRes.data?.products || prodRes.data || prodRes || [];
        setFeaturedProducts(prodList.slice(0, 4));

        const testRes = await cmsService.getTestimonials();
        const testList = testRes.data || testRes || [];
        setTestimonials(testList);
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials]);

  const handleAddToCart = (product) => {
    const defaultVariant = product.variants?.length > 0
      ? product.variants[0]
      : { id: 'default', name: 'Standard', price: product.price };
    addItemToCart(product, defaultVariant, 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="home-page">
      {/* SECTION 1: HERO */}
      <section className="hero-section">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1447933601403-56dc2df4e0e4?w=1800&q=85&auto=format"
            alt=""
            className="hero-bg-image"
            loading="eager"
          />
          <div className="hero-overlay" />
          <AromaParticles />

          {/* Background video layer */}
          <video
            className="hero-bg-video"
            src="/images/hero/coffee cup with beans-Picsart-BackgroundRemover.webm"
            autoPlay
            loop
            muted
            playsInline
            poster="/images/hero/hero-cup.png"
          />
        </div>

        <div className="hero-content section-container">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hero-badge">
              <Sparkles size={12} />
              {t('home.heroBadge', 'Premium Beverage Platform')}
            </span>

            <h1 className="hero-title">
              {t('home.heroTitleDiscover', 'Discover The')}{' '}
              <em className="hero-title-italic">{t('home.heroTitleArt', 'Art of')}</em>{' '}
              <span className="hero-title-accent">{t('home.heroTitlePerfect', 'Perfect Coffee')}</span>
            </h1>

            <p className="hero-subtitle">
              {t('home.heroSubtitle', 'Experience the rich and bold flavors of our exquisite coffee blends, crafted to awaken your senses — single-origin, slow-brewed, and delivered fresh across Bengaluru.')}
            </p>

            <div className="hero-actions">
              <Button variant="accent" size="large" onClick={() => navigate('/store/catalog')}>
                {t('home.orderNow', 'Order Now')}
                <ArrowRight size={18} />
              </Button>
              <Button variant="outline" size="large" onClick={() => navigate('/store/catalog')} className="hero-outline-btn">
                {t('home.exploreMenu', 'Explore Menu')}
              </Button>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>50+</strong>
                <span>{t('home.statCoffeeItems', 'Items of Coffee')}</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>20+</strong>
                <span>{t('home.statOrdersRunning', 'Orders Running')}</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <strong>12K+</strong>
                <span>{t('home.statHappyCustomers', 'Happy Customers')}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glow ring */}
            <div className="hero-glow-ring" />

            {/* Main product */}
            <div className="hero-product-showcase">
              <img
                src="/images/hero/image 1.png"
                alt="Iced Caramel Latte"
                className="hero-product-img"
              />
            </div>

            {/* Floating Glass Card: Rating */}
            <div className="floating-glass-card glass-rating">
              <div className="glass-rating-stars">
                <Star size={14} fill="#F59E0B" stroke="#F59E0B" />
                <span className="glass-rating-num">4.9</span>
              </div>
              <span className="glass-rating-label">{t('home.ratingTopRated', 'Top Rated')}</span>
            </div>

            {/* Floating Glass Card: Product Name */}
            <div className="floating-glass-card glass-product-tag">
              <Coffee size={16} />
              <span>{t('home.featuredProductTitle', 'Iced Caramel Latte')}</span>
            </div>

            {/* Floating Glass Card: Live Orders */}
            <div className="floating-glass-card glass-live-orders">
              <div className="live-dot" />
              <span className="live-count">23</span>
              <span className="live-label">{t('home.liveOrdersLabel', 'orders today')}</span>
            </div>

            {/* Floating Glass Card: Price */}
            <div className="floating-glass-card glass-price-tag">
              <span className="price-from">{t('home.priceFrom', 'from')}</span>
              <span className="price-amount">₹249</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* BRAND PARTNER MARQUEE */}
      <section className="brand-marquee-section">
        <div className="marquee-container">
          <div className="marquee-content">
            {Array(2).fill([
              { name: 'Tim Hortons', font: 'Playfair Display' },
              { name: 'COSTA COFFEE', font: 'Outfit' },
              { name: 'NORTH END', font: 'Inter' },
              { name: 'DUNKIN\'', font: 'Outfit' },
              { name: 'BLUE TOKAI', font: 'Inter' },
              { name: 'Starbucks', font: 'Playfair Display' }
            ]).flat().map((brand, idx) => (
              <span key={idx} className="marquee-brand" style={{ fontFamily: `var(--font-${brand.font.toLowerCase().replace(' ', '-')}, sans-serif)` }}>
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SENSORY TASTE PROFILER */}
      <SensoryProfiler />

      {/* SECTION 2: BRAND PILLARS */}
      <section className="pillars-section">
        <div className="section-container">
          <ScrollReveal>
            <SectionHeader
              eyebrow={t('home.pillarsEyebrow', 'Why Choose Us')}
              title={t('home.pillarsTitle', 'Crafted with Intention')}
              subtitle={t('home.pillarsSubtitle', 'Every cup tells a story — from ethically sourced estates to your doorstep.')}
            />
          </ScrollReveal>

          <StaggerContainer className="pillars-grid">
            {[
              { icon: Leaf, title: t('home.pillar1Title', '100% Single-Origin'), desc: t('home.pillar1Desc', 'Sourced ethically from premium high-altitude estates in Chikmagalur and Coorg. Every bean is hand-selected.') },
              { icon: Timer, title: t('home.pillar2Title', '18-Hour Slow Brew'), desc: t('home.pillar2Desc', 'Cold-extracted for 18 hours to eliminate acidity, capturing dense caramel and chocolate tones.') },
              { icon: Target, title: t('home.pillar3Title', 'Precision Customized'), desc: t('home.pillar3Desc', 'Adjust sweetness, milk bases, toppings, and cup sizes — crafted exactly to your recipe.') },
            ].map((pillar, i) => (
              <motion.div className="pillar-card" key={i} variants={staggerItem}>
                <div className="pillar-icon-wrap">
                  <pillar.icon size={24} strokeWidth={1.8} />
                </div>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ROAST PROFILE SELECTOR */}
      <ScrollReveal>
        <RoastProfileSlider />
      </ScrollReveal>

      {/* GAMIFIED LOYALTY CLUB */}
      <LoyaltyClub />

      {/* SECTION 3: FEATURED PRODUCTS */}
      <section className="featured-section">
        <div className="section-container">
          <ScrollReveal>
            <SectionHeader
              eyebrow={t('home.featuredEyebrow', 'Our Bestsellers')}
              title={t('home.featuredTitle', 'Featured Concentrates')}
              subtitle={t('home.featuredSubtitle', 'Award-winning signatures. Pure extracts designed to craft cafe-style cups at home.')}
              ctaText={t('home.featuredCta', 'View All Products')}
              ctaLink="/store/catalog"
            />
          </ScrollReveal>

          <div className="products-grid">
            {loading ? (
              Array(4).fill(0).map((_, idx) => (
                <Card key={idx} isLoading={true} />
              ))
            ) : (
              featuredProducts.map((product, idx) => (
                <ScrollReveal key={product.id} delay={idx * 0.08}>
                  <Card
                    id={product.id}
                    title={product.name}
                    description={product.description}
                    price={product.price}
                    originalPrice={product.original_price}
                    imageUrl={product.image_url}
                    rating={product.rating || 4.8}
                    reviewCount={product.review_count || 120}
                    tags={Array.isArray(product.tags) ? product.tags : (typeof product.tags === 'string' ? JSON.parse(product.tags) : [])}
                    inStock={product.in_stock === 1 || product.in_stock === true}
                    actionText={t('home.quickAdd', 'Quick Add')}
                    onAction={() => handleAddToCart(product)}
                  />
                </ScrollReveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: FULL INTERACTIVE DRINK BUILDER */}
      <section className="builder-section dark-section">
        <div className="section-container">
          <ScrollReveal>
            <InlineDrinkBuilder />
          </ScrollReveal>
        </div>
      </section>

      {/* CAMPAIGN BANNER: SIPS WORTH SHARING */}
      <section className="sips-campaign-section">
        <div className="section-container">
          <div className="sips-campaign-card">
            <div className="sips-image-side">
              <img src="/images/hero/cold-brew.png" alt="Sips Worth Sharing" className="sips-hero-img" />
              <div className="sips-quote-floating glass-card-dark">
                <p>"Because great coffee isn't just a drink — it's a shared experience."</p>
              </div>
            </div>
            <div className="sips-text-side">
              <span className="eyebrow" style={{ color: 'var(--color-accent)' }}>Forest Campaign</span>
              <h2>SIPS WORTH<br /><span className="italic-accent-green">SHARING</span></h2>
              <p>
                From aerating standard recipes to sharing a freshly crafted shaker glass of cold brew concentrate with your colleagues — we brew for the moments that bring people together.
              </p>
              <div className="sips-features-grid">
                <div className="sips-feat-item">
                  <span className="feat-num">100%</span>
                  <span className="feat-lbl">Traceable Beans</span>
                </div>
                <div className="sips-feat-item">
                  <span className="feat-num">₹0</span>
                  <span className="feat-lbl">Delivery over ₹999</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BREW METHOD GUIDE */}
      <ScrollReveal>
        <BrewMethodGuide />
      </ScrollReveal>

      {/* SECTION 5: TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="testimonials-section">
          <div className="section-container">
            <ScrollReveal>
              <SectionHeader
                eyebrow={t('home.testiEyebrow', 'What People Say')}
                title={t('home.testiTitle', 'Loved by Coffee Enthusiasts')}
                subtitle={t('home.testiSubtitle', 'Join thousands of customers who\'ve upgraded their daily cup.')}
              />
            </ScrollReveal>

            <ScrollReveal>
              <div className="testimonial-carousel">
                {testimonials.map((t, idx) => (
                  <div
                    key={t.uuid || t.id}
                    className={`testimonial-card ${idx === activeTestimonial ? 'active' : ''}`}
                  >
                    <Quote size={24} className="testimonial-quote-icon" />
                    <p className="testimonial-text">{t.text}</p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">{t.avatar || 'U'}</div>
                      <div>
                        <strong>{t.name}</strong>
                        <StarRating rating={t.rating || 5} showCount={false} size={12} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="testimonial-dots">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      className={`dot ${idx === activeTestimonial ? 'active' : ''}`}
                      onClick={() => setActiveTestimonial(idx)}
                      aria-label={`Testimonial ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* SECTION 6: SUBSCRIPTION BANNER */}
      <section className="sub-banner-section cream-section">
        <div className="section-container">
          <ScrollReveal>
            <div className="sub-banner">
              <div className="sub-banner-content">
                <span className="eyebrow">{t('home.subEyebrow', 'Coffee Plans')}</span>
                <h2>{t('home.subTitle', 'Never Run Out of Fresh Coffee')}</h2>
                <p>
                  {t('home.subDesc', 'Set up a recurring weekly or monthly schedule. Customize bottle counts, pause anytime, and enjoy up to 15% discount + free express shipping.')}
                </p>
                <div className="sub-features">
                  <span className="sub-feature">{t('home.subFeat1', '✓ Free Delivery')}</span>
                  <span className="sub-feature">{t('home.subFeat2', '✓ Pause Anytime')}</span>
                  <span className="sub-feature">{t('home.subFeat3', '✓ Up to 15% Off')}</span>
                </div>
                <Button variant="primary" size="large" onClick={() => navigate('/store/subscription')}>
                  {t('home.subCta', 'Build Your Coffee Plan')}
                  <ArrowRight size={18} />
                </Button>
              </div>
              <div className="sub-banner-image">
                <img
                  src="/images/hero/beans.png"
                  alt="Fresh Coffee Beans"
                  loading="lazy"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 7: SOCIAL PROOF GRID */}
      <section className="social-section">
        <div className="section-container">
          <ScrollReveal>
            <SectionHeader
              eyebrow={t('home.socialEyebrow', '@digitalcoffee')}
              title={t('home.socialTitle', 'From Our Community')}
              subtitle={t('home.socialSubtitle', 'Tag us in your daily brew moments.')}
            />
          </ScrollReveal>

          <StaggerContainer className="social-grid">
            {SOCIAL_IMAGES.map((img, i) => (
              <motion.div key={i} className="social-card" variants={staggerItem}>
                <img src={img} alt={`Community photo ${i + 1}`} loading="lazy" />
                <div className="social-overlay">
                  <span>@digitalcoffee</span>
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* SECTION 8: NEWSLETTER */}
      <section className="newsletter-section dark-section">
        <div className="section-container">
          <ScrollReveal>
            <div className="newsletter-block">
              <h2>{t('home.newsTitle', 'Stay in the Loop')}</h2>
              <p>{t('home.newsDesc', 'Join 12,000+ coffee lovers. Get exclusive deals, new arrivals, and brewing tips delivered to your inbox.')}</p>
              <form className="newsletter-form-hero" onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed! Welcome aboard.'); }}>
                <input type="email" placeholder="Enter your email" required />
                <button type="submit">
                  {t('home.subscribe', 'Subscribe')}
                  <Send size={14} />
                </button>
              </form>
              <span className="newsletter-note">{t('home.newsletterNote', 'No spam. Unsubscribe anytime.')}</span>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
