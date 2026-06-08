import React from 'react';
import { motion } from 'framer-motion';
import './Home.css';

const Home = ({ onStart, onQrScan }) => {
  const wordEasing = [0.16, 1, 0.3, 1];

  // Safe unicode encoding for: /images/hero/A_rotating_°_showcase  _ _o.mp4
  const videoSrc = "/images/hero/A_rotating_°_showcase\u00a0\u00a0_\u00a0_o.mp4";

  return (
    <div className="kiosk-home">
      {/* Background Media System */}
      <div className="kiosk-bg-video-container">
        <video 
          className="kiosk-bg-video active"
          src={videoSrc}
          autoPlay
          muted 
          loop 
          playsInline
        />
        <div className="kiosk-grain-overlay"></div>
      </div>

      {/* Floating Atmospheric Redesign Elements */}
      <div className="kiosk-floating-elements">
        <div className="kiosk-floating-particle gold-particle-1">✦</div>
        <div className="kiosk-floating-particle gold-particle-2">✦</div>
        <div className="kiosk-floating-particle gold-particle-3">✦</div>
        <div className="kiosk-floating-particle gold-leaf-1">🍂</div>
        <div className="kiosk-floating-particle gold-leaf-2">🍃</div>
        <div className="kiosk-glow-orb target-teal"></div>
        <div className="kiosk-glow-orb target-brown"></div>
      </div>

      {/* Luxury Telemetry Panel */}
      <div className="kiosk-telemetry-panel">
        <div className="telemetry-item">
          <span className="telemetry-label">EXTRACTION</span>
          <span className="telemetry-val">COLD BREW 18H</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">BEAN VARIETY</span>
          <span className="telemetry-val">100% ARABICA</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">SERVE TEMP</span>
          <span className="telemetry-val">2°C CHILLED</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">SYSTEM STATE</span>
          <span className="telemetry-val">SECURE / ACTIVE</span>
        </div>
      </div>

      {/* Subtle Bottom Right Watermark */}
      <div className="kiosk-watermark">
        <span className="kiosk-watermark-dot"></span>
        <span>ESPRESSO RESERVE • SYSTEM STABLE</span>
      </div>

      <div className="kiosk-content">
        {/* Editorial Composition */}
        <motion.div 
          className="kiosk-editorial-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: wordEasing }}
        >
          <span className="kiosk-eyebrow">Vasify Specialty Coffee</span>
          <h1 className="kiosk-main-title">
            Chilled Concentrate.<br />
            <span className="kiosk-title-highlight">Perfected Daily.</span>
          </h1>
          <p className="kiosk-main-subtitle">
            Experience premium cold brews crafted with 100% single-origin Arabica beans. Custom-tailor your blend or order instantly.
          </p>
        </motion.div>

        {/* Dynamic CTA */}
        <div className="home-cta-container">
          <motion.button 
            className="massive-btn-kiosk" 
            onClick={onStart}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: wordEasing }}
          >
            <span>TAP TO START</span>
          </motion.button>
          
          <motion.button 
            className="qr-btn-kiosk" 
            onClick={onQrScan}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.8, ease: wordEasing }}
          >
            <span>Scan QR to Order</span>
          </motion.button>

          <span className="brand-footer-kiosk">
            TOOF Kiosk
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
