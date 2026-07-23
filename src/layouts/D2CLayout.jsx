import React, { useState, useEffect } from 'react';
import { t } from '../utils/i18n';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Coffee,
  ShoppingBag,
  User,
  Home,
  X,
  Menu,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react';
import './D2CLayout.css';

const D2CLayout = () => {
  const cartItems = useCartStore((state) => state.items);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/store', label: 'Home', end: true },
    { to: '/store/catalog', label: 'Shop' },
    { to: '/store/subscription', label: 'Subscriptions' },
    { to: '/store/about', label: 'About' },
    { to: '/store/contact', label: 'Contact' },
  ];

  return (
    <div className="d2c-layout">

      {/* ─── Announcement Bar ─── */}
      <div className="announcement-bar">
        <div className="announcement-inner">
          <span className="ann-dot">✦</span>
          <span>{t('layout.freeShipping', 'Free delivery on orders over ₹999')}</span>
          <span className="ann-divider">·</span>
          <span>Use <strong>WELCOME20</strong> for 20% off your first order</span>
          <span className="ann-dot">✦</span>
        </div>
      </div>

      {/* ─── Header ─── */}
      <header className={`d2c-header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-inner">

          {/* Logo */}
          <Link to="/store" className="brand-logo" aria-label="Digital Coffee — Home">
            <div className="logo-icon-wrap">
              <Coffee size={18} strokeWidth={2.5} />
            </div>
            <span className="logo-wordmark">{t('layout.brandName', 'Digital Coffee')}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Cart */}
            <Link to="/store/cart" className="cart-btn" aria-label={`Cart — ${cartCount} items`} id="cart-button">
              <ShoppingBag size={19} strokeWidth={2} />
              <AnimatePresence mode="wait">
                {cartCount > 0 && (
                  <motion.span
                    className="cart-badge"
                    key={cartCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Auth */}
            {user ? (
              <Link to="/store/profile" className="account-btn" id="account-button">
                <User size={16} strokeWidth={2.5} />
                <span>{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link to="/store/login" className="signin-btn" id="signin-button">
                {t('layout.signIn', 'Sign In')}
              </Link>
            )}

            {/* Mobile Hamburger [COMMENTED OUT] */}
            {/* <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button> */}
          </div>
        </div>
      </header>

      {/* ─── Mobile Drawer [COMMENTED OUT] ─── */}
      {/* <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              className="mobile-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              aria-label="Mobile navigation"
            >
              <div className="drawer-head">
                <Link to="/store" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
                  <div className="logo-icon-wrap"><Coffee size={18} /></div>
                  <span className="logo-wordmark">{t('layout.brandName', 'Digital Coffee')}</span>
                </Link>
                <button
                  className="drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="drawer-nav">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={15} />
                  </NavLink>
                ))}
              </nav>

              <div className="drawer-footer">
                {user ? (
                  <div className="drawer-user">
                    <Link to="/store/profile" className="drawer-profile-btn" onClick={() => setMobileMenuOpen(false)}>
                      <User size={16} />
                      <span>{user.name}</span>
                    </Link>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="drawer-logout">
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link to="/store/login" className="drawer-signin" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence> */}

      {/* ─── Page Content ─── */}
      <main className="d2c-main">
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      <footer className="d2c-footer">
        <div className="footer-top">
          <div className="footer-container">

            {/* Brand Column */}
            <div className="footer-brand-col">
              <Link to="/store" className="footer-logo">
                <div className="footer-logo-icon"><Coffee size={16} strokeWidth={2.5} /></div>
                <span className="footer-logo-text">{t('layout.brandName', 'Digital Coffee')}</span>
              </Link>
              <p className="footer-tagline">
                {t('layout.footerTagline', 'Premium specialty coffee, slow-brewed concentrates, and artisanal gear — delivered fresh across Bengaluru.')}
              </p>
              <div className="footer-socials">
                <a href="#" className="social-icon" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
                </a>
                <a href="#" className="social-icon" aria-label="Twitter / X">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46L20 4"/></svg>
                </a>
                <a href="#" className="social-icon" aria-label="YouTube">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c0-1.1.9-2 2-2h1.5l1-3h1l-1 3h3l1-3h1l-1 3H14l1-3h1l-1 3h1.5c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-6z"/><circle cx="9" cy="12" r="2"/></svg>
                </a>
                <a href="mailto:hello@digitalcoffee.in" className="social-icon" aria-label="Email">
                  <Mail size={16} />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="footer-links-grid">
              <div className="footer-col">
                <h4>Shop</h4>
                <Link to="/store/catalog">All Products</Link>
                <Link to="/store/subscription">Subscriptions</Link>
                <Link to="/store/collections">Collections</Link>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <Link to="/store/about">About Us</Link>
                <Link to="/store/contact">Contact</Link>
                <a href="#">Careers</a>
              </div>
              <div className="footer-col">
                <h4>Support</h4>
                <a href="#">Shipping</a>
                <a href="#">Returns</a>
                <a href="#">FAQ</a>
                <Link to="/store/contact">Get Help</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Strip */}
        <div className="footer-newsletter-strip">
          <div className="newsletter-strip-inner footer-container">
            <div className="newsletter-text">
              <strong>Stay in the loop</strong>
              <span>Join 12,000+ coffee lovers. New arrivals, offers, and brewing tips.</span>
            </div>
            <form className="newsletter-form-footer" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="newsletter-input-footer"
                aria-label="Email for newsletter"
              />
              <button type="submit" className="newsletter-btn-footer">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-container footer-bottom-inner">
            <p>© {new Date().getFullYear()} Digital Coffee Pvt. Ltd. All rights reserved.</p>
            <div className="footer-legal-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
        <NavLink to="/store" end className={({ isActive }) => `mob-item ${isActive ? 'active' : ''}`} id="mob-nav-home">
          <Home size={20} strokeWidth={2} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/store/catalog" className={({ isActive }) => `mob-item ${isActive ? 'active' : ''}`} id="mob-nav-shop">
          <Coffee size={20} strokeWidth={2} />
          <span>Shop</span>
        </NavLink>
        <NavLink to="/store/cart" className={({ isActive }) => `mob-item mob-cart ${isActive ? 'active' : ''}`} id="mob-nav-cart">
          <div className="mob-cart-icon">
            <ShoppingBag size={20} strokeWidth={2} />
            {cartCount > 0 && <span className="mob-cart-badge">{cartCount}</span>}
          </div>
          <span>Cart</span>
        </NavLink>
        <NavLink to="/store/profile" className={({ isActive }) => `mob-item ${isActive ? 'active' : ''}`} id="mob-nav-account">
          <User size={20} strokeWidth={2} />
          <span>Account</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default D2CLayout;
