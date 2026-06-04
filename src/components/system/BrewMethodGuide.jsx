import React from 'react';
import './BrewMethodGuide.css';

const METHODS = [
  {
    name: 'FRENCH PRESS',
    desc: 'Full immersion brewing. Produces a robust, full-bodied cup highlighting chocolatey notes.',
    ratio: '1:15 Ratio',
    time: '4:00 Mins',
    grind: 'Coarse',
    temp: '94°C'
  },
  {
    name: 'POUR OVER',
    desc: 'Paper filtered drip extraction. Captures bright citrus notes with absolute clarity.',
    ratio: '1:16 Ratio',
    time: '3:00 Mins',
    grind: 'Medium-Fine',
    temp: '92°C'
  },
  {
    name: 'AEROPRESS',
    desc: 'Syringe extraction using air pressure. Smooth, low-acidity coffee with sweet highlights.',
    ratio: '1:12 Ratio',
    time: '2:00 Mins',
    grind: 'Fine',
    temp: '88°C'
  },
  {
    name: 'COLD EXTRACTION',
    desc: 'Ethical slow cold brew extraction. Yields heavy chocolate sweetness with zero bitterness.',
    ratio: '1:8 Ratio',
    time: '18 Hours',
    grind: 'Very Coarse',
    temp: '4°C'
  }
];

const BrewMethodGuide = () => {
  return (
    <section className="brew-guide-section">
      <div className="section-container">
        <div className="section-header-wrap">
          <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>EXTRACTION ACADEMY</span>
          <h2 style={{ fontFamily: "'Readex Pro', sans-serif", fontSize: '2rem', fontWeight: 300, marginTop: '8px' }}>
            Choose Your Brewing Craft
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', maxWidth: '600px' }}>
            Learn the technical ratios, grind steps, and water temperature variables needed to unlock peak origin flavors.
          </p>
        </div>

        <div className="brew-guide-grid">
          {METHODS.map((method, idx) => (
            <div key={idx} className="brew-method-card">
              <div className="brew-icon-circle">☕</div>
              <h3 className="brew-method-name">{method.name}</h3>
              <p className="brew-method-desc">{method.desc}</p>
              
              <div className="brew-stats-wrap">
                <div className="brew-stat-row">
                  <span>RATIO</span>
                  <span>{method.ratio}</span>
                </div>
                <div className="brew-stat-row">
                  <span>TIME</span>
                  <span>{method.time}</span>
                </div>
                <div className="brew-stat-row">
                  <span>GRIND</span>
                  <span>{method.grind}</span>
                </div>
                <div className="brew-stat-row">
                  <span>WATER TEMP</span>
                  <span>{method.temp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrewMethodGuide;
