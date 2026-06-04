import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Home.css';

const Home = ({ onStart, onQrScan }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoLoaded(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const wordEasing = [0.16, 1, 0.3, 1];

  const wordContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const wordItemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        ease: wordEasing
      }
    }
  };

  return (
    <div className="kiosk-home">
      {/* Background Media System */}
      <div className="kiosk-bg-video-container">
        <video 
          className={`kiosk-bg-video ${videoLoaded ? 'loaded' : ''}`}
          autoPlay 
          muted 
          loop 
          playsInline
          onCanPlayThrough={() => setVideoLoaded(true)}
        >
          <source 
            src="https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-cup-of-freshly-brewed-coffee-34139-large.mp4" 
            type="video/mp4" 
          />
        </video>
        <div className="kiosk-grain-overlay"></div>
      </div>

      {/* Layered Statistics / Telemetry */}
      <motion.div 
        className="kiosk-telemetry-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 1, ease: wordEasing }}
      >
        <div className="telemetry-item">
          <span>EXTRACTION CONSISTENCY</span>
          <span className="telemetry-val">99.4% // 9.2 BAR</span>
        </div>
        <div className="telemetry-item">
          <span>WATER COMPOSITION</span>
          <span className="telemetry-val">0.02 PPM // DEIONIZED</span>
        </div>
        <div className="telemetry-item">
          <span>ESTIMATED QUEUE DELAY</span>
          <span className="telemetry-val">~4 MIN WAIT TIME</span>
        </div>
      </motion.div>

      <div className="kiosk-content">
        {/* Editorial Composition */}
        <motion.div 
          className="editorial-text-wrapper"
          variants={wordContainerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.span className="editorial-word" variants={wordItemVariants}>
            brew
          </motion.span>
          <motion.span className="editorial-word" variants={wordItemVariants}>
            beyond
          </motion.span>
          <motion.span className="editorial-word" variants={wordItemVariants}>
            ordinary.
          </motion.span>
        </motion.div>

        {/* Dynamic CTA */}
        <div className="home-cta-container">
          <motion.button 
            className="massive-btn-kiosk" 
            onClick={onStart}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: wordEasing }}
          >
            <span>TAP TO START</span>
          </motion.button>
          
          <motion.button 
            className="qr-btn-kiosk" 
            onClick={onQrScan}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.8, ease: wordEasing }}
          >
            <span>[ORDER VIA SMARTPHONE]</span>
          </motion.button>

          <span className="brand-footer-kiosk">
            SECURE TOUCH TERMINAL OPERATIONAL SYSTEM
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
