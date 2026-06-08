import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Droplets, Milk, Sparkles, Check, ShoppingBag, Eye, HelpCircle, Thermometer, Wind, Zap } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import toast from 'react-hot-toast';
import { useCompatibility, getCompatibleMilksStatic, isSweetenerCompatibleStatic, isToppingCompatibleStatic } from '../../utils/compatibility';
import './InlineDrinkBuilder.css';

// Rolling price counter
const RollingPrice = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 400;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="rolling-price-digits">
      ₹{displayValue}
    </span>
  );
};

const OPTIONS = {
  bases: [
    { id: '50-50', name: '50:50 BLEND', price: 180, color: '#1f0d04', label: 'arabica + robusta', temp: '04°C', texture: 'SMOOTH', extraction: '18 HOURS', aroma: '92 CRISP', ingredientId: 1 },
    { id: '70-30', name: '70:30 BLEND', price: 190, color: '#2a1509', label: 'bold arabica lead', temp: '04°C', texture: 'FULL', extraction: '18 HOURS', aroma: '94 BALANCED', ingredientId: 2 },
    { id: 'arabica', name: '100% ARABICA', price: 200, color: '#221007', label: 'bright & fruity', temp: '04°C', texture: 'SMOOTH', extraction: '18 HOURS', aroma: '95 CLEAN', ingredientId: 3 },
    { id: 'sif', name: 'SIF CONCENTRATE', price: 170, color: '#3b1f13', label: 'south indian filter', temp: '04°C', texture: 'STRONG', extraction: 'SLOW DRIP', aroma: '96 BOLD', ingredientId: 4 },
    { id: 'cascara', name: 'CASCARA', price: 150, color: '#5c3d2e', label: 'coffee cherry tea', temp: '04°C', texture: 'LIGHT', extraction: '18 HOURS', aroma: '90 FRUITY', ingredientId: 46 },
  ],
  milks: [
    { id: 'dairy', name: 'DAIRY MILK', price: 0, color: '#fff5e6', label: 'creamy frothed', ingredientId: 8 },
    { id: 'oat', name: 'OAT MILK', price: 25, color: '#f5e6d0', label: 'smooth plant', ingredientId: 9 },
    { id: 'almond', name: 'ALMOND MILK', price: 30, color: '#ede0d0', label: 'nutty & light', ingredientId: 10 },
    { id: 'coconut', name: 'COCONUT MILK', price: 20, color: '#f0e8d8', label: 'tropical touch', ingredientId: 11 },
    { id: 'none', name: 'NO MILK', price: 0, color: 'transparent', label: 'neat extraction' },
  ],
  sweeteners: [
    { id: 'sugar', name: 'SUGAR SYRUP', price: 0, desc: 'classic sweetener', ingredientId: 12 },
    { id: 'jaggery', name: 'JAGGERY SYRUP', price: 5, desc: 'unrefined cane sugar', ingredientId: 13 },
    { id: 'honey', name: 'HONEY', price: 10, desc: 'wild forest honey', ingredientId: 14 },
    { id: 'condensed', name: 'CONDENSED MILK', price: 15, desc: 'sweetened dairy', ingredientId: 15 },
    { id: 'vanilla', name: 'VANILLA SYRUP', price: 8, desc: 'madagascar vanilla', ingredientId: 17 },
  ],
  toppings: [
    { id: 'cinnamon', name: 'CINNAMON', price: 5, label: 'warm spice dust', ingredientId: 31 },
    { id: 'cacao', name: 'CACAO POWDER', price: 5, label: 'premium cacao', ingredientId: 30 },
    { id: 'nutmeg', name: 'NUTMEG', price: 5, label: 'aromatic sprinkle', ingredientId: 32 },
    { id: 'golden-cream', name: 'GOLDEN CREAM', price: 15, label: 'rich cream top', ingredientId: 26 },
    { id: 'whipped-cream', name: 'WHIPPED CREAM', price: 10, label: 'light dollop', ingredientId: 27 },
    { id: 'chocolate-drizzle', name: 'CHOC DRIZZLE', price: 10, label: 'rich chocolate', ingredientId: 21 },
    { id: 'hazelnut', name: 'HAZELNUT SYRUP', price: 10, label: 'nutty infusion', ingredientId: 18 },
    { id: 'honey-drizzle', name: 'HONEY DRIZZLE', price: 10, label: 'golden honey', ingredientId: 14 },
    { id: 'salted-caramel', name: 'SALTED CARAMEL', price: 8, label: 'sweet & salty', ingredientId: 16 },
    { id: 'coconut-flakes', name: 'COCONUT FLAKES', price: 8, label: 'toasted coconut', ingredientId: 36 },
    { id: 'almond-flakes', name: 'ALMOND FLAKES', price: 10, label: 'crunchy almond', ingredientId: 35 },
    { id: 'rainbow-sprinkles', name: 'SPRINKLES', price: 5, label: 'colorful crunch', ingredientId: 38 },
    { id: 'brown-sugar-dust', name: 'BROWN SUGAR', price: 3, label: 'sweet dust', ingredientId: 40 },
    { id: 'lemon-slice', name: 'LEMON', price: 5, label: 'citrus kick', ingredientId: 43 },
    { id: 'orange-slice', name: 'ORANGE', price: 5, label: 'zesty finish', ingredientId: 44 },
  ]
};

const getLiquidColor = (baseId, milkId) => {
  if (baseId === 'sif') {
    if (milkId === 'none') return '#3b1f13';
    return '#79503b';
  } else if (baseId === 'cascara') {
    if (milkId === 'none') return '#5c3d2e';
    return '#8ca973';
  } else if (baseId === '70-30') {
    if (milkId === 'none') return '#2a1509';
    return '#79503b';
  } else if (baseId === 'arabica') {
    if (milkId === 'none') return '#221007';
    return '#624131';
  } else {
    // 50-50
    if (milkId === 'none') return '#1d0b03';
    return '#624131';
  }
};

const InlineDrinkBuilder = () => {
  const [base, setBase] = useState('50-50');
  const [milk, setMilk] = useState('dairy');
  const [selectedSweetener, setSelectedSweetener] = useState('sugar');
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Brewing state machines
  const [isBrewing, setIsBrewing] = useState(false);
  const [brewStage, setBrewStage] = useState('stable'); // 'stable', 'dissolving', 'pouring', 'stabilizing'

  const activeBase = useMemo(() => OPTIONS.bases.find(b => b.id === base), [base]);
  const activeMilk = useMemo(() => OPTIONS.milks.find(m => m.id === milk), [milk]);
  const addItemToCart = useCartStore((state) => state.addItem);

  const { isMilkCompatible, isSweetenerCompatible, isToppingCompatible, getCompatibleMilks } = useCompatibility(base, { milk, sweetener: selectedSweetener, toppings: selectedToppings });

  const canvasRef = useRef(null);
  const colorLerpRef = useRef({ r: 59, g: 31, b: 19 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // State refs for animation loop
  const isBrewingRef = useRef(false);
  const brewStageRef = useRef('stable');
  const baseRef = useRef(base);
  const milkRef = useRef(milk);
  const selectedSweetenerRef = useRef(selectedSweetener);
  const selectedToppingsRef = useRef(selectedToppings);

  // Keep refs in sync to avoid canvas closure stale states
  useEffect(() => {
    isBrewingRef.current = isBrewing;
    brewStageRef.current = brewStage;
    baseRef.current = base;
    milkRef.current = milk;
    selectedSweetenerRef.current = selectedSweetener;
    selectedToppingsRef.current = selectedToppings;
  }, [isBrewing, brewStage, base, milk, selectedSweetener, selectedToppings]);

  const priceTotal = useMemo(() => {
    let sum = activeBase.price + activeMilk.price;
    const sweetener = OPTIONS.sweeteners.find(item => item.id === selectedSweetener);
    if (sweetener) sum += sweetener.price;
    selectedToppings.forEach(id => {
      const t = OPTIONS.toppings.find(item => item.id === id);
      if (t) sum += t.price;
    });
    return sum;
  }, [activeBase, activeMilk, selectedSweetener, selectedToppings]);

  const handleSweetenerChange = (id) => {
    setSelectedSweetener(id);
    triggerBrewCycle();
  };

  const toggleTopping = (id) => {
    triggerBrewCycle();
    setSelectedToppings(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const triggerBrewCycle = () => {
    setIsBrewing(true);
    setBrewStage('dissolving');
    setTimeout(() => {
      setBrewStage('pouring');
      setTimeout(() => {
        setBrewStage('stabilizing');
        setTimeout(() => {
          setBrewStage('stable');
          setIsBrewing(false);
        }, 800);
      }, 1000);
    }, 400);
  };

  const handleBaseChange = (newBase) => {
    const compatibleMilks = getCompatibleMilksStatic(newBase);
    const newMilk = compatibleMilks.includes(milk) ? milk : compatibleMilks[0];
    const newSweetener = isSweetenerCompatibleStatic(newBase, selectedSweetener) ? selectedSweetener : 'sugar';
    setBase(newBase);
    setMilk(newMilk);
    setSelectedSweetener(newSweetener);
    setSelectedToppings((prev) => prev.filter((t) => isToppingCompatibleStatic(newBase, newMilk, newSweetener, t)));
    triggerBrewCycle();
  };

  const handleMilkChange = (newMilk) => {
    setMilk(newMilk);
    setSelectedToppings((prev) => prev.filter((t) => isToppingCompatibleStatic(base, newMilk, selectedSweetener, t)));
    triggerBrewCycle();
  };

  // 3D Card Hover Physics
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateX = ((yc - y) / yc) * 8;
    const rotateY = ((x - xc) / xc) * 8;
    card.style.setProperty('--rx', `${rotateX}deg`);
    card.style.setProperty('--ry', `${rotateY}deg`);
    card.style.setProperty('--tz', `10px`);
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', `0deg`);
    card.style.setProperty('--ry', `0deg`);
    card.style.setProperty('--tz', `0px`);
  };

  // Cinematic Camera Drift
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mousePosRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const hasMilk = milk !== 'none';
  const hasIce = selectedToppings.includes('ice');
  const hasFoam = selectedToppings.some(id => id === 'whipped-cream');
  const activeFoamType = selectedToppings.find(id => id === 'whipped-cream');

  // Fluid Dynamics, Glass refraction & Particle physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let frameId;
    let waveTime = 0;
    let particles = [];
    let backgroundMotes = [];
    let pourStreamY = 0;
    let ripples = [];

    // Initialize background volumetric motes
    for (let i = 0; i < 20; i++) {
      backgroundMotes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        speedY: Math.random() * 0.3 + 0.1,
        speedX: Math.random() * 0.2 - 0.1
      });
    }

    const parseHex = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const animate = () => {
      waveTime += 0.05;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Current config details
      const activeBaseColor = baseRef.current;
      const activeMilkColor = milkRef.current;
      const targetHex = getLiquidColor(activeBaseColor, activeMilkColor);
      const targetRGB = parseHex(targetHex);

      // Lerp liquid color
      const curr = colorLerpRef.current;
      curr.r += (targetRGB.r - curr.r) * 0.08;
      curr.g += (targetRGB.g - curr.g) * 0.08;
      curr.b += (targetRGB.b - curr.b) * 0.08;

      const rgbStr = `rgb(${Math.round(curr.r)}, ${Math.round(curr.g)}, ${Math.round(curr.b)})`;

      // Fluid height physics
      let fillHeightPercent = 0.55;
      if (activeMilkColor !== 'none') fillHeightPercent += 0.18;
      if (selectedToppingsRef.current.includes('ice')) fillHeightPercent += 0.1;
      if (selectedToppingsRef.current.some(t => t === 'whipped-cream')) fillHeightPercent += 0.08;

      // Restrict height during transition
      let targetHeight = H * fillHeightPercent;
      if (brewStageRef.current === 'dissolving') {
        targetHeight = H * 0.1; // dissolves down
      } else if (brewStageRef.current === 'pouring') {
        targetHeight = H * fillHeightPercent * 0.7; // climbing
      }

      // Draw background ambient particles (volumetric depth)
      ctx.save();
      backgroundMotes.forEach(m => {
        m.y -= m.speedY;
        m.x += m.speedX;
        if (m.y < 0) {
          m.y = H;
          m.x = Math.random() * W;
        }
        ctx.fillStyle = `rgba(200, 169, 126, ${m.alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Viscosity wave configuration
      let waveAmplitude = 5;
      let waveFrequency = 0.02;
      if (activeBaseColor === '50-50' || activeBaseColor === 'arabica') {
        waveAmplitude = 3; // cold brew is thinner
      } else if (activeBaseColor === 'sif') {
        waveAmplitude = 6; // SIF concentrate is denser
        waveFrequency = 0.025;
      }
      if (brewStageRef.current === 'pouring' || brewStageRef.current === 'stabilizing') {
        waveAmplitude = 12; // high turbulence during pouring
      }

      // Draw Liquid Base Layer
      ctx.save();
      ctx.fillStyle = rgbStr;

      // Primary Wave
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) {
        const y = H - targetHeight + Math.sin(x * waveFrequency + waveTime) * waveAmplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Secondary translucent wave for depth
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) {
        const y = H - targetHeight + Math.sin(x * (waveFrequency * 1.5) - waveTime * 1.3) * (waveAmplitude * 0.7);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw Sweetener infusion ribbon inside the glass
      if (selectedSweetenerRef.current && selectedSweetenerRef.current !== 'none') {
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 180, 120, 0.3)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const startX = W * 0.35;
        ctx.moveTo(startX, H - targetHeight + 5);
        for (let y = H - targetHeight + 5; y < H - 20; y += 10) {
          const driftX = Math.sin(y * 0.05 + waveTime * 2) * 8;
          ctx.lineTo(startX + driftX, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw Pour Stream animation (Pouring sequence)
      if (brewStageRef.current === 'pouring') {
        ctx.save();
        // Liquid stream color matching new selection
        ctx.fillStyle = rgbStr;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        const streamX = W / 2;
        const streamWidth = 8;
        ctx.fillRect(streamX - streamWidth / 2, 0, streamWidth, H - targetHeight + 10);
        ctx.strokeRect(streamX - streamWidth / 2, 0, streamWidth, H - targetHeight + 10);

        // Splashes at stream contact point
        if (Math.random() > 0.3) {
          particles.push({
            x: streamX + (Math.random() - 0.5) * 12,
            y: H - targetHeight + 10,
            size: Math.random() * 3 + 1,
            alpha: 1,
            vx: (Math.random() - 0.5) * 4,
            vy: -(Math.random() * 3 + 3)
          });
        }
        ctx.restore();
      }

      // Render ripples & splashes
      ctx.save();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.alpha -= 0.02;

        if (p.alpha <= 0 || p.y > H) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(${Math.round(curr.r + 30)}, ${Math.round(curr.g + 30)}, ${Math.round(curr.b + 30)}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Dynamic Steam (cold brew bases are served cold, SIF/Cascara can be hot)
      const isHot = activeBaseColor === 'sif';
      if (isHot) {
        if (Math.random() > 0.7) {
          particles.push({
            x: Math.random() * W * 0.7 + W * 0.15,
            y: H - targetHeight + 5,
            size: Math.random() * 4 + 2,
            alpha: Math.random() * 0.25 + 0.05,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -(Math.random() * 0.8 + 0.6)
          });
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [base, milk, selectedSweetener, selectedToppings, brewStage]);

  const handleBrewNow = () => {
    if (isAdding) return;
    setIsAdding(true);

    const drinkName = `CUSTOM ${activeBase.name} BLEND`;
    const product = {
      id: `custom-d2c-${Date.now()}`,
      name: drinkName,
      price: priceTotal,
      image_url: '/images/products/cappuccino.png',
      rating: 5.0,
      review_count: 1,
      tags: ['CUSTOM', activeBase.name],
      in_stock: true
    };

    const variant = {
      id: `custom-d2c-${Date.now()}-standard`,
      name: 'Standard (360ml)',
      price: priceTotal
    };

    setTimeout(() => {
      addItemToCart(product, variant, 1);
      toast.success(`${drinkName} added to cart! ☕✨`);
      setIsAdding(false);
    }, 1200);
  };

  // Sub-telemetry computations based on actual state
  const computedTemp = useMemo(() => {
    if (hasIce) return '04°C';
    return activeBase.temp;
  }, [hasIce, activeBase]);

  const computedTexture = useMemo(() => {
    if (activeFoamType === 'whipped-cream') return 'VOLUMETRIC PEAK';
    return activeBase.texture;
  }, [activeFoamType, activeBase]);

  return (
    <div className="cinematic-coffee-lab" ref={containerRef}>
      {/* Background vignette & volumetric glow */}
      <div className="lab-stage-backdrop">
        <div className="spotlight-radial" />
        <div className="volumetric-smoke" />
      </div>

      {/* Left: 3D Product Stage */}
      <div className="lab-visualizer-column">
        {/* Telemetry metadata floating panels */}
        <div className="telemetry-hud HUD-top-left">
          <span className="hud-metric">TEMP</span>
          <strong className="hud-val">{computedTemp}</strong>
        </div>
        <div className="telemetry-hud HUD-top-right">
          <span className="hud-metric">TEXTURE</span>
          <strong className="hud-val">{computedTexture}</strong>
        </div>
        <div className="telemetry-hud HUD-bottom-left">
          <span className="hud-metric">EXTRACTION</span>
          <strong className="hud-val">{activeBase.extraction}</strong>
        </div>
        <div className="telemetry-hud HUD-bottom-right">
          <span className="hud-metric">AROMA PROFILE</span>
          <strong className="hud-val">{activeBase.aroma}</strong>
        </div>

        {/* Dynamic camera drifting container */}
        <div 
          className="museum-glass-platform"
          style={{
            transform: `translate(${mousePosRef.current.x * 20}px, ${mousePosRef.current.y * 20}px) rotateY(${mousePosRef.current.x * 12}deg) rotateX(${-mousePosRef.current.y * 12}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Real Glass Rendering container */}
          <div className="glass-refractive-cup">
            <div className="glass-curved-refraction" />
            <div className="glass-fresnel-highlight" />
            <div className="glass-specular-light" />
            <div className="glass-liquid-innerglow" style={{ background: `radial-gradient(circle, ${getLiquidColor(base, milk)} 0%, transparent 70%)` }} />

            {/* Whipped Cream or Cold Foam Swirl */}
            <AnimatePresence>
              {hasFoam && (
                <motion.div
                  key={activeFoamType}
                  className="foam-sculpture whipped-cream-mesh"
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </AnimatePresence>

            {/* Ice cubes floating layout */}
            <AnimatePresence>
              {hasIce && (
                <div className="glass-ice-cubes">
                  {[0, 1, 2].map((idx) => (
                    <motion.div
                      key={idx}
                      className={`ice-cube-block cube-${idx}`}
                      initial={{ opacity: 0, y: -120, rotate: -40 }}
                      animate={{ opacity: 0.9, y: 0, rotate: idx * 30 - 15 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 90, damping: 12, delay: idx * 0.08 }}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Fluid dynamics Canvas */}
            <div className="liquid-compositor-wrapper">
              <canvas ref={canvasRef} width="168" height="248" className="fluid-dynamics-canvas" />
            </div>

            {/* Creeping condensation water droplets */}
            {hasIce && (
              <div className="glass-condensation-droplets">
                <div className="drop drop-1" />
                <div className="drop drop-2" />
                <div className="drop drop-3" />
              </div>
            )}
          </div>
        </div>

        {/* Technical telemetry display */}
        <div className="telemetry-readout">
          <span className="mono-badge">INTELLIGENT CALIBRATION</span>
          <strong className="telemetry-title">{activeBase.name} + {activeMilk.name}</strong>
        </div>
      </div>

      {/* Right: Progressive Configurator Panel */}
      <div className="lab-configurator-column">
        <span className="mono-technical-tag">00 COMPOSER ENGINE</span>
        <h1 className="massive-editorial-title">
          Crafted<br />In Real Time
        </h1>
        <p className="lab-desc-copy">
          Select base extractions, milk blends, and frothed structures to engineer a personalized coffee ritual in real-time.
        </p>

        {/* STEP 1: BASE */}
        <div className="category-composition-section">
          <span className="mono-step-label">01 CHOOSE BASE EXTRACTION</span>
          <div className="asymmetric-chips-row">
            {OPTIONS.bases.map(b => (
              <button
                key={b.id}
                onClick={() => handleBaseChange(b.id)}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className={`tactile-card-chip ${base === b.id ? 'active' : ''}`}
                style={{
                  transform: 'perspective(600px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(var(--tz, 0px))'
                }}
              >
                <div className="tactile-chip-glow" />
                <Coffee size={14} className="lucide" />
                <div className="tactile-chip-text">
                  <strong>{b.name}</strong>
                  <span>{b.label}</span>
                </div>
                <span className="tactile-chip-price">₹{b.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2: MILK */}
        <div className="category-composition-section">
          <span className="mono-step-label">02 SELECT LIQUID BASE</span>
          <div className="asymmetric-chips-row">
            {OPTIONS.milks.map(m => {
              const disabled = !isMilkCompatible(base, m.id);
              return (
              <button
                key={m.id}
                onClick={() => handleMilkChange(m.id)}
                disabled={disabled}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className={`tactile-card-chip ${milk === m.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                style={{
                  transform: 'perspective(600px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(var(--tz, 0px))'
                }}
              >
                <div className="tactile-chip-glow" />
                <Milk size={14} className="lucide" />
                <div className="tactile-chip-text">
                  <strong>{m.name}</strong>
                  <span>{m.label}</span>
                </div>
                {m.price > 0 ? <span className="tactile-chip-price">+₹{m.price}</span> : <span className="tactile-chip-free">Free</span>}
              </button>
            );})}
          </div>
        </div>

        {/* STEP 3: SWEETENER & TOPPINGS */}
        <div className="dual-configuration-grid">
          <div className="category-composition-section">
            <span className="mono-step-label">03 SWEETENER</span>
            <div className="small-tactile-row">
              {OPTIONS.sweeteners.map(s => {
                const disabled = !isSweetenerCompatible(base, s.id);
                return (
                <button
                  key={s.id}
                  onClick={() => handleSweetenerChange(s.id)}
                  disabled={disabled}
                  className={`small-tactile-chip ${selectedSweetener === s.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                >
                  <Sparkles size={12} className="lucide" />
                  <span>{s.name}</span>
                  <span className="chip-price-badge">{s.price > 0 ? `+₹${s.price}` : 'FREE'}</span>
                </button>
              );})}
            </div>
          </div>

          <div className="category-composition-section">
            <span className="mono-step-label">04 CRAFT TOPPING</span>
            <div className="small-tactile-row">
              {OPTIONS.toppings.map(t => {
                const disabled = !isToppingCompatible(base, milk, selectedSweetener, t.id);
                return (
                <button
                  key={t.id}
                  onClick={() => toggleTopping(t.id)}
                  disabled={disabled}
                  className={`small-tactile-chip ${selectedToppings.includes(t.id) ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                >
                  <Sparkles size={12} className="lucide" />
                  <span>{t.name}</span>
                  {t.price > 0 && <span className="chip-price-badge">+₹{t.price}</span>}
                </button>
              );})}
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="lab-action-row">
          <div className="lab-price-metric">
            <span className="price-lbl">ESTIMATED COMPOSITION</span>
            <RollingPrice value={priceTotal} />
          </div>
          <button className="lab-finalize-btn" onClick={handleBrewNow} disabled={isAdding}>
            <div className="btn-shine-sweep" />
            {isAdding ? (
              <span>Composing...</span>
            ) : (
              <>
                <ShoppingBag size={18} className="lucide" />
                <span>Craft My Brew</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InlineDrinkBuilder;
