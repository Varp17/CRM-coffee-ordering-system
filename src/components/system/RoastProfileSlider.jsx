import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RoastProfileSlider.css';

const ROASTS = [
  {
    id: 'light',
    name: 'LIGHT ROAST',
    temp: '196°C - 205°C',
    acidity: 'High / Bright Citrus',
    body: 'Light / Tea-like',
    sweetness: 'Floral / Honey',
    color: '#a0785a',
    desc: 'Lightly roasted to preserve the original high-altitude estate characteristics. Expect vibrant acidity, crisp jasmine notes, and subtle stone fruit sweetness.',
    acidityVal: 90,
    bodyVal: 30,
    sweetVal: 70
  },
  {
    id: 'medium',
    name: 'MEDIUM ROAST',
    temp: '210°C - 219°C',
    acidity: 'Balanced / Crisp Apple',
    body: 'Medium / Creamy',
    sweetness: 'Rich Caramel / Chocolate',
    color: '#6F4E37',
    desc: 'Our signature roasting level. Perfectly balances the crisp origin notes with a dense, creamy mouthfeel and deep, slow-cooked caramel sweetness.',
    acidityVal: 60,
    bodyVal: 65,
    sweetVal: 85
  },
  {
    id: 'dark',
    name: 'DARK ROAST',
    temp: '225°C - 235°C',
    acidity: 'Very Low / Subdued',
    body: 'Heavy / Full-bodied',
    sweetness: 'Bittersweet Cocoa / Toasted Nut',
    color: '#3b1f13',
    desc: 'Slowly roasted into the second crack. Highlights bold, chocolatey characteristics, low acidity, and toasted nut flavors with maximum body density.',
    acidityVal: 20,
    bodyVal: 95,
    sweetVal: 50
  }
];

const RoastProfileSlider = () => {
  const [activeRoast, setActiveRoast] = useState(ROASTS[1]);

  return (
    <section className="roast-slider-section">
      <div className="section-container">
        <div className="roast-slider-card">
          {/* Left panel: visual illustration */}
          <div className="roast-visuals">
            <div 
              className="roast-bean-glow" 
              style={{ backgroundColor: activeRoast.color }}
            />
            {/* Draw a vector coffee bean that dynamically shifts color/scale */}
            <motion.svg 
              viewBox="0 0 100 100" 
              width="180" 
              height="180"
              style={{ fill: activeRoast.color, filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.15))' }}
              animate={{ rotate: activeRoast.id === 'light' ? 0 : activeRoast.id === 'medium' ? 12 : -15 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <path d="M 30,50 C 30,25 70,25 70,50 C 70,75 30,75 30,50 Z" />
              {/* Spline split */}
              <path 
                d="M 35,50 C 50,42 50,58 65,50" 
                stroke="#2a1005" 
                strokeWidth="2.5" 
                fill="none" 
                strokeLinecap="round"
              />
            </motion.svg>
          </div>

          {/* Right panel: Details and specifications */}
          <div className="roast-control-details">
            <span className="roast-info-meta">SPECIALTY ROASTING ENGINE</span>
            
            <div className="roast-selector-buttons">
              {ROASTS.map(roast => (
                <button 
                  key={roast.id}
                  className={`roast-selector-btn ${activeRoast.id === roast.id ? 'active' : ''}`}
                  onClick={() => setActiveRoast(roast)}
                >
                  {roast.name}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeRoast.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <h3 className="roast-info-title">{activeRoast.name}</h3>
                <p className="roast-info-desc">{activeRoast.desc}</p>

                <div className="roast-specs-grid">
                  {/* Acidity */}
                  <div className="spec-progress-bar-wrap">
                    <div className="spec-progress-label">
                      <span>ACIDITY</span>
                      <span>{activeRoast.acidity}</span>
                    </div>
                    <div className="spec-progress-bar-bg">
                      <div className="spec-progress-bar-fill" style={{ width: `${activeRoast.acidityVal}%` }} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="spec-progress-bar-wrap">
                    <div className="spec-progress-label">
                      <span>BODY</span>
                      <span>{activeRoast.body}</span>
                    </div>
                    <div className="spec-progress-bar-bg">
                      <div className="spec-progress-bar-fill" style={{ width: `${activeRoast.bodyVal}%` }} />
                    </div>
                  </div>

                  {/* Sweetness */}
                  <div className="spec-progress-bar-wrap">
                    <div className="spec-progress-label">
                      <span>SWEETNESS</span>
                      <span>{activeRoast.sweetness}</span>
                    </div>
                    <div className="spec-progress-bar-bg">
                      <div className="spec-progress-bar-fill" style={{ width: `${activeRoast.sweetVal}%` }} />
                    </div>
                  </div>

                  {/* Temp */}
                  <div className="spec-progress-bar-wrap">
                    <div className="spec-progress-label">
                      <span>ROAST TEMP</span>
                      <span>{activeRoast.temp}</span>
                    </div>
                    <div className="spec-progress-bar-bg">
                      <div className="spec-progress-bar-fill" style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    </div>
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

export default RoastProfileSlider;
