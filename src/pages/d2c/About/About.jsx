import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Timer, Shield, Heart, MapPin, Mail } from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-inner section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="eyebrow">Our Story</span>
            <h1 className="about-hero-title">Coffee Is Our Craft,<br />Not Our Product.</h1>
            <p className="about-hero-sub">
              We're a Bengaluru-based team obsessed with one thing — making the perfect cup accessible to every home in India.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Image */}
      <section className="about-image-break">
        <div className="section-container">
          <div className="about-story-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=85"
              alt="Coffee roasting at Digital Coffee"
              className="about-story-img"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="about-story section-pad">
        <div className="section-container">
          <div className="about-story-grid">
            <div className="about-story-text">
              <span className="eyebrow">Founded 2021</span>
              <h2>From Bengaluru with Love</h2>
              <p>
                Digital Coffee was born in a small apartment in Indiranagar. Our founder, an ex-software engineer turned coffee obsessive, was tired of paying ₹450 for average cold brew. So he started brewing his own.
              </p>
              <p>
                Eighteen months of iteration, 12 kilograms of beans wasted, and one very supportive partner later — Digital Coffee launched. Today, we deliver to over 200 pin codes across Bengaluru.
              </p>
            </div>
            <div className="about-values-col">
              {[
                { icon: Leaf,   title: 'Ethically Sourced', desc: 'We partner directly with 3 estates in Chikmagalur and Coorg.' },
                { icon: Timer,  title: '18-Hour Cold Brew', desc: 'Slow, cold, and uncompromised. No shortcuts, no bitterness.' },
                { icon: Shield, title: 'Quality Promise', desc: '30-day satisfaction guarantee. No questions asked.' },
                { icon: Heart,  title: 'Community First', desc: '2% of every order supports farmer welfare programs.' },
              ].map((v, i) => (
                <div className="about-value-card" key={i}>
                  <div className="about-value-icon">
                    <v.icon size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <strong>{v.title}</strong>
                    <p>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Brew Methods */}
      <section className="brew-section section-pad">
        <div className="section-container">
          <div className="section-header">
            <span className="eyebrow">How We Brew</span>
            <h2>The 18-Hour Process</h2>
            <p>Patience is the ingredient that makes our coffee exceptional.</p>
          </div>
          <div className="brew-steps">
            {[
              { step: '01', title: 'Select', desc: 'Single-origin beans, hand-sorted from high-altitude estates.' },
              { step: '02', title: 'Grind', desc: 'Coarse-ground to extract smoothness, not bitterness.' },
              { step: '03', title: 'Steep', desc: '18 hours in cold filtered water. Slow extraction, zero heat.' },
              { step: '04', title: 'Filter', desc: 'Triple-filtered for a silky, clear concentrate.' },
              { step: '05', title: 'Bottle', desc: 'Sealed fresh, delivered same-day or next-day.' },
            ].map((s, i) => (
              <div className="brew-step" key={i}>
                <span className="brew-step-num">{s.step}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <div className="section-container about-cta-inner">
          <h2>Ready to Taste the Difference?</h2>
          <p>Start with our bestselling cold brew concentrate. Free delivery on your first order.</p>
          <Link to="/store/catalog" className="hero-cta-primary" style={{ width: 'fit-content' }}>
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default About;
