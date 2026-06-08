import { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Coffee, Droplets, IceCreamBowl, Milk, Sparkles, Star, Thermometer, Wind, Zap } from 'lucide-react';
import './CustomDrink.css';
import { formatCurrency } from '../../../utils/formatters';
import AnimatedCounter from '../../../components/Motion/AnimatedCounter';
import { useAuthStore } from '../../../store/useAuthStore';
import { customDrinkService } from '../../../services/customDrinks';
import toast from 'react-hot-toast';
import { useCompatibility, getCompatibleMilksStatic, isSweetenerCompatibleStatic, isToppingCompatibleStatic } from '../../../utils/compatibility';

const ASSETS = {
  finishedLatte: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&auto=format&fit=crop&q=88',
  icedLatte: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=900&auto=format&fit=crop&q=88',
  coldBrew: 'https://images.unsplash.com/photo-1461023235402-278239b9b242?w=900&auto=format&fit=crop&q=88',
  matcha: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=900&auto=format&fit=crop&q=88',
};

const INGREDIENTS = {
  sizes: [
    { id: 'S', name: 'SMALL', label: '250 ml', price: -30 },
    { id: 'M', name: 'REGULAR', label: '350 ml', price: 0 },
    { id: 'L', name: 'LARGE', label: '450 ml', price: 40 },
  ],
  bases: [
    { id: '50-50', name: '50:50 CONCENTRATE', price: 100, color: '#1f0d04', image: ASSETS.coldBrew, temp: '04°C', texture: 'SMOOTH', extraction: '18 HOURS', aroma: '92 CRISP', ingredientId: 1 },
    { id: '70-30', name: '70:30 CONCENTRATE', price: 120, color: '#2a1509', image: ASSETS.icedLatte, temp: '04°C', texture: 'FULL', extraction: '18 HOURS', aroma: '94 BALANCED', ingredientId: 2 },
    { id: 'sif', name: 'SIF CONCENTRATE', price: 130, color: '#3b1f13', image: ASSETS.finishedLatte, temp: '04°C', texture: 'STRONG', extraction: 'SLOW DRIP', aroma: '96 BOLD', ingredientId: 4 },
    { id: 'cascara', name: 'CASCARA CONCENTRATE', price: 150, color: '#5c3d2e', image: ASSETS.matcha, temp: '04°C', texture: 'LIGHT', extraction: '18 HOURS', aroma: '90 FRUITY', ingredientId: 46 },
    { id: 'arabica', name: '100% ARABICA', price: 140, color: '#221007', image: ASSETS.coldBrew, temp: '04°C', texture: 'SMOOTH', extraction: '18 HOURS', aroma: '95 CLEAN', ingredientId: 3 },
  ],
  milks: [
    { id: 'dairy', name: 'NANDINI MILK', price: 0, visual: '#fff6e8', ingredientId: 8 },
    { id: 'condensed', name: 'CONDENSED MILK', price: 20, visual: '#f0e0c1', ingredientId: 15 },
    { id: 'none', name: 'NO MILK', price: 0, visual: 'transparent' },
  ],
  syrups: [
    { id: 'sugar', name: 'SUGAR SYRUP', price: 15, ingredientId: 12 },
    { id: 'honey', name: 'HONEY', price: 20, ingredientId: 14 },
    { id: 'jaggery', name: 'JAGGERY SYRUP', price: 15, ingredientId: 13 },
  ],
  toppings: [
    { id: 'cinnamon', name: 'CINNAMON POWDER', price: 10, kind: 'powder', ingredientId: 31 },
    { id: 'whipped-cream', name: 'WHIPPED CREAM', price: 25, kind: 'foam', ingredientId: 27 },
    { id: 'chocolate-drizzle', name: 'CHOCOLATE DRIZZLE', price: 20, kind: 'drizzle', ingredientId: 21 },
    { id: 'ice', name: 'ICE', price: 0, kind: 'ice', ingredientId: 45 },
  ],
};

const defaultSelection = {
  size: 'M',
  base: '50-50',
  milk: 'dairy',
  syrups: [],
  toppings: [],
};

const getById = (items, id) => items.find((item) => item.id === id);

const getLiquidColor = (baseId, milkId) => {
  if (baseId === '50-50' || baseId === 'arabica') {
    if (milkId === 'none') return '#1d0b03';
    if (milkId === 'dairy') return '#624131';
    return '#6f4f3e';
  } else if (baseId === '70-30') {
    if (milkId === 'none') return '#2a1509';
    if (milkId === 'dairy') return '#79503b';
    return '#8c6754';
  } else if (baseId === 'sif') {
    if (milkId === 'none') return '#3b1f13';
    if (milkId === 'dairy') return '#79503b';
    return '#8c6754';
  } else {
    if (milkId === 'none') return '#5c3d2e';
    if (milkId === 'dairy') return '#8ca973';
    return '#97b37e';
  }
};

function DrinkPreview({ selection, total, stage, isAdding, brewStage, mousePos }) {
  const canvasRef = useRef(null);
  const colorLerpRef = useRef({ r: 59, g: 31, b: 19 });

  const base = getById(INGREDIENTS.bases, selection.base);
  const milk = getById(INGREDIENTS.milks, selection.milk);
  const hasMilk = milk?.id !== 'none';
  const hasIce = selection.toppings.includes('ice');
  const hasFoam = selection.toppings.some((id) => getById(INGREDIENTS.toppings, id)?.kind === 'foam');
  const activeFoamType = selection.toppings.find((id) => getById(INGREDIENTS.toppings, id)?.kind === 'foam');

  const transitionEase = [0.16, 1, 0.3, 1];

  // Fluid physics loop synced with inputs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let frameId;
    let waveTime = 0;
    let particles = [];
    let backgroundMotes = [];

    // Background volumetric motes
    for (let i = 0; i < 15; i++) {
      backgroundMotes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.35 + 0.1,
        speedY: Math.random() * 0.25 + 0.1,
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

      const targetHex = getLiquidColor(selection.base, selection.milk);
      const targetRGB = parseHex(targetHex);

      const curr = colorLerpRef.current;
      curr.r += (targetRGB.r - curr.r) * 0.08;
      curr.g += (targetRGB.g - curr.g) * 0.08;
      curr.b += (targetRGB.b - curr.b) * 0.08;

      const rgbStr = `rgb(${Math.round(curr.r)}, ${Math.round(curr.g)}, ${Math.round(curr.b)})`;

      // Fill height based on ingredients
      let fillHeightPercent = 0.55;
      if (selection.size === 'S') fillHeightPercent -= 0.08;
      if (selection.size === 'L') fillHeightPercent += 0.08;
      if (hasMilk) fillHeightPercent += 0.15;
      if (hasIce) fillHeightPercent += 0.08;
      if (hasFoam) fillHeightPercent += 0.06;

      let targetHeight = H * fillHeightPercent;
      if (brewStage === 'dissolving') {
        targetHeight = H * 0.1;
      } else if (brewStage === 'pouring') {
        targetHeight = H * fillHeightPercent * 0.7;
      }

      // Draw background ambient particles
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

      // Fluid viscosity
      let waveAmplitude = 5;
      let waveFrequency = 0.02;
      if (selection.base !== 'cascara') {
        waveAmplitude = 3;
      } else {
        waveAmplitude = 5;
      }
      if (brewStage === 'pouring') {
        waveAmplitude = 12;
      }

      // Liquid Base Layer
      ctx.save();
      ctx.fillStyle = rgbStr;

      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x++) {
        const y = H - targetHeight + Math.sin(x * waveFrequency + waveTime) * waveAmplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Second layer
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

      // Syrup infusions
      if (selection.syrups.length > 0) {
        ctx.save();
        selection.syrups.forEach((syrupId, sIdx) => {
          ctx.strokeStyle = syrupId === 'caramel' ? 'rgba(180, 110, 50, 0.35)' : 'rgba(220, 180, 120, 0.3)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          const startX = W * 0.3 + sIdx * 30;
          ctx.moveTo(startX, H - targetHeight + 5);
          for (let y = H - targetHeight + 5; y < H - 20; y += 10) {
            const driftX = Math.sin(y * 0.05 + waveTime * 2) * 8;
            ctx.lineTo(startX + driftX, y);
          }
          ctx.stroke();
        });
        ctx.restore();
      }

      // Pour stream animation
      if (brewStage === 'pouring') {
        ctx.save();
        ctx.fillStyle = rgbStr;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        const streamX = W / 2;
        const streamWidth = 8;
        ctx.fillRect(streamX - streamWidth / 2, 0, streamWidth, H - targetHeight + 10);
        ctx.strokeRect(streamX - streamWidth / 2, 0, streamWidth, H - targetHeight + 10);

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

      // Render ripples / splashes
      ctx.save();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
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

      // Dynamic steam (Hot vs Cold)
      const isHot = false;
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
  }, [selection, brewStage]);

  // Sub-telemetry tags calculations
  const computedTemp = useMemo(() => {
    if (hasIce) return '04°C';
    return base?.temp || '88°C';
  }, [hasIce, base]);

  const computedTexture = useMemo(() => {
    if (activeFoamType === 'whipped-cream') return 'VOLUMETRIC PEAK';
    return base?.texture || 'NEAT';
  }, [activeFoamType, base]);

  return (
    <div className="drink-preview-stage">
      {/* Background radial spotlight */}
      <div className="asset-backdrop" style={{ background: `radial-gradient(circle, rgba(200, 169, 126, 0.08) 0%, transparent 70%)` }} />

      {/* Floating HUD telemetry boxes around the stage */}
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
        <strong className="hud-val">{base?.extraction || '25 SEC'}</strong>
      </div>
      <div className="telemetry-hud HUD-bottom-right">
        <span className="hud-metric">AROMA PROFILE</span>
        <strong className="hud-val">{base?.aroma || '95 BOLD'}</strong>
      </div>

      <motion.div 
        className="real-drink-compositor" 
        style={{
          transform: `translate(${mousePos.x * 24}px, ${mousePos.y * 24}px) rotateY(${mousePos.x * 15}deg) rotateX(${-mousePos.y * 15}deg)`,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Real Glass Rendering elements */}
        <div className="glass-refractive-cup">
          <div className="glass-curved-refraction" />
          <div className="glass-fresnel-highlight" />
          <div className="glass-specular-light" />
          <div className="glass-liquid-innerglow" style={{ background: `radial-gradient(circle, ${getLiquidColor(selection.base, selection.milk)} 0%, transparent 70%)` }} />

          {/* Whipped Cream or Cold Foam Swirl */}
          <AnimatePresence>
            {hasFoam && hasMilk && (
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
      </motion.div>

      <div className="preview-step-card">
        <span>STEP {stage + 1}</span>
        <strong>{stage === 0 ? 'PICK BASE' : stage === 1 ? 'BLEND MILK' : 'FINISH'}</strong>
      </div>

      <motion.div className="live-price-tag" key={total} initial={{ y: 12 }} animate={{ y: 0 }}>
        <AnimatedCounter value={total} />
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            className="added-confirmation"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <Check size={34} />
            COMPOSED
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OptionButton({ active, disabled, item, onClick, icon: Icon }) {
  // 3D Card hover rotation handler
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
    card.style.setProperty('--tz', `8px`);
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', `0deg`);
    card.style.setProperty('--ry', `0deg`);
    card.style.setProperty('--tz', `0px`);
  };

  return (
    <button 
      className={`option-chip ${active ? 'active' : ''}`} 
      disabled={disabled} 
      onClick={onClick}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      style={{
        transform: 'perspective(600px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(var(--tz, 0px))',
        transformStyle: 'preserve-3d'
      }}
    >
      <div className="tactile-chip-glow" />
      {Icon && <Icon size={16} strokeWidth={2} style={{ transform: 'translateZ(10px)' }} />}
      <span style={{ transform: 'translateZ(10px)' }}>{item.name}</span>
      {item.label && <span className="chip-meta" style={{ transform: 'translateZ(10px)' }}>{item.label}</span>}
      {item.price !== 0 && (
        <span className="chip-price" style={{ transform: 'translateZ(10px)' }}>
          {item.price > 0 ? '+' : ''}{formatCurrency(item.price)}
        </span>
      )}
    </button>
  );
}

function StepPanel({ stage, selection, selectBase, selectMilk, setSelection, toggleListItem }) {
  const transitionEase = [0.16, 1, 0.3, 1];

  if (stage === 0) {
    return (
      <motion.div className="ingredient-category" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: transitionEase }}>
        <h3>CHOOSE BASE <span className="category-selection-hint">[REQUIRED]</span></h3>
        <div className="options-chip-list">
          {INGREDIENTS.bases.map((item) => (
            <OptionButton key={item.id} item={item} active={selection.base === item.id} onClick={() => selectBase(item.id)} icon={Coffee} />
          ))}
        </div>
      </motion.div>
    );
  }

  if (stage === 1) {
    return (
      <motion.div className="ingredient-category" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: transitionEase }}>
        <h3>CHOOSE MILK <span className="category-selection-hint">[REQUIRED]</span></h3>
        <div className="options-chip-list">
          {INGREDIENTS.milks.map((item) => {
            const disabled = !isMilkCompatible(selection.base, item.id);
            return (
              <OptionButton
                key={item.id}
                item={item}
                active={selection.milk === item.id}
                disabled={disabled}
                onClick={() => selectMilk(item.id)}
                icon={item.id === 'none' ? Droplets : Milk}
              />
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="finish-grid" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: transitionEase }}>
      <div className="ingredient-category">
        <h3>CUP SIZE</h3>
        <div className="options-chip-list">
          {INGREDIENTS.sizes.map((item) => (
            <OptionButton key={item.id} item={item} active={selection.size === item.id} onClick={() => setSelection((prev) => ({ ...prev, size: item.id }))} />
          ))}
        </div>
      </div>

      <div className="ingredient-category">
        <h3>ADD SYRUPS <span className="category-selection-hint">[OPTIONAL]</span></h3>
        <div className="options-chip-list">
          {INGREDIENTS.syrups.map((item) => {
            const disabled = !isSweetenerCompatible(selection.base, item.id);
            return (
              <OptionButton key={item.id} item={item} active={selection.syrups.includes(item.id)} disabled={disabled} onClick={() => toggleListItem('syrups', item.id)} icon={Sparkles} />
            );
          })}
        </div>
      </div>

      <div className="ingredient-category">
        <h3>ADD TOPPINGS <span className="category-selection-hint">[OPTIONAL]</span></h3>
        <div className="options-chip-list">
          {INGREDIENTS.toppings.map((item) => {
            const sweetener = selection.syrups.length > 0 ? selection.syrups[0] : null;
            const disabled = !isToppingCompatible(selection.base, selection.milk, sweetener, item.id);
            return (
              <OptionButton
                key={item.id}
                item={item}
                active={selection.toppings.includes(item.id)}
                disabled={disabled}
                onClick={() => toggleListItem('toppings', item.id)}
                icon={item.kind === 'ice' ? IceCreamBowl : Sparkles}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const CustomDrink = ({ onBack, onAddToCart }) => {
  const [drinkName, setDrinkName] = useState('CUSTOM LAB BREW');
  const [stage, setStage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [selection, setSelection] = useState(defaultSelection);
  const [freeRedosUsed, setFreeRedosUsed] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const [importingInfo, setImportingInfo] = useState(null);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  // Brewing transitions
  const [brewStage, setBrewStage] = useState('stable');

  // Camera drift coordinates
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const { isMilkCompatible, isSweetenerCompatible, isToppingCompatible, getCompatibleMilks } = useCompatibility(selection.base, selection);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const triggerBrewCycle = () => {
    setBrewStage('dissolving');
    setTimeout(() => {
      setBrewStage('pouring');
      setTimeout(() => {
        setBrewStage('stabilizing');
        setTimeout(() => {
          setBrewStage('stable');
        }, 600);
      }, 900);
    }, 350);
  };

  useEffect(() => {
    const loadSharedDrink = async () => {
      const params = new URLSearchParams(window.location.search);
      const sharedId = params.get('import') || params.get('custom');
      if (sharedId) {
        try {
          const res = await customDrinkService.getById(sharedId);
          if (res && res.ingredients) {
            const recipe = typeof res.ingredients === 'string' ? JSON.parse(res.ingredients) : res.ingredients;
            const newSelection = { ...defaultSelection };
            if (recipe.some(i => i.ingredient_id === 1)) newSelection.base = '50-50';
            else if (recipe.some(i => i.ingredient_id === 2)) newSelection.base = '70-30';
            else if (recipe.some(i => i.ingredient_id === 4)) newSelection.base = 'sif';
            else if (recipe.some(i => i.ingredient_id === 3)) newSelection.base = 'arabica';
            if (recipe.some(i => i.ingredient_id === 8)) newSelection.milk = 'dairy';
            else if (recipe.some(i => i.ingredient_id === 15)) newSelection.milk = 'condensed';
            else newSelection.milk = 'none';
            const syrups = [];
            if (recipe.some(i => i.ingredient_id === 12)) syrups.push('sugar');
            if (recipe.some(i => i.ingredient_id === 14)) syrups.push('honey');
            if (recipe.some(i => i.ingredient_id === 13)) syrups.push('jaggery');
            newSelection.syrups = syrups;
            const toppings = [];
            if (recipe.some(i => i.ingredient_id === 27)) toppings.push('whipped-cream');
            if (recipe.some(i => i.ingredient_id === 21)) toppings.push('chocolate-drizzle');
            if (recipe.some(i => i.ingredient_id === 45)) toppings.push('ice');
            newSelection.toppings = toppings;
            setSelection(newSelection);
            setDrinkName(res.name);
            setImportingInfo(`Importing Shared Coffee: "${res.name}"`);
            setStage(2);
            toast.success(`Loaded shared coffee recipe: "${res.name}"! ☕`);
            triggerBrewCycle();
          }
        } catch (err) {
          console.error('Failed to import custom drink:', err);
          toast.error('Could not load the shared coffee configuration.');
        }
      }
    };
    loadSharedDrink();
  }, []);

  const handleSaveFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save custom creations to your favorites! ⭐');
      return;
    }
    
    setIsSavingFavorite(true);
    try {
      const baseProductId = selection.base === '50-50' ? 27 : selection.base === '70-30' ? 28 : selection.base === 'sif' ? 29 : selection.base === 'cascara' ? 30 : 31;
      const ingredientsList = [];
      if (selection.base === '50-50') ingredientsList.push({ ingredient_id: 1, quantity: 120 });
      else if (selection.base === '70-30') ingredientsList.push({ ingredient_id: 2, quantity: 120 });
      else if (selection.base === 'sif') ingredientsList.push({ ingredient_id: 4, quantity: 135 });
      else if (selection.base === 'cascara') ingredientsList.push({ ingredient_id: 46, quantity: 120 });
      else ingredientsList.push({ ingredient_id: 3, quantity: 120 });
      if (selection.milk === 'dairy') ingredientsList.push({ ingredient_id: 8, quantity: 150 });
      else if (selection.milk === 'condensed') ingredientsList.push({ ingredient_id: 15, quantity: 30 });
      if (selection.syrups.includes('sugar')) ingredientsList.push({ ingredient_id: 12, quantity: 15 });
      if (selection.syrups.includes('honey')) ingredientsList.push({ ingredient_id: 14, quantity: 20 });
      if (selection.syrups.includes('jaggery')) ingredientsList.push({ ingredient_id: 13, quantity: 15 });
      if (selection.toppings.includes('whipped-cream')) ingredientsList.push({ ingredient_id: 27, quantity: 30 });
      if (selection.toppings.includes('chocolate-drizzle')) ingredientsList.push({ ingredient_id: 21, quantity: 20 });
      if (selection.toppings.includes('ice')) ingredientsList.push({ ingredient_id: 45, quantity: 3 });

      await customDrinkService.create({
        base_product_id: baseProductId,
        name: drinkName.trim() || 'My Favorite Brew',
        ingredients: ingredientsList
      });

      toast.success('Creation saved to your Favorites! ⭐');
    } catch (err) {
      console.error('Failed to save favorite:', err);
      toast.error(err.message || 'Error saving custom drink to favorites.');
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const base = getById(INGREDIENTS.bases, selection.base);
  const milk = getById(INGREDIENTS.milks, selection.milk);
  const requiredSelectionsMade = Boolean(base && milk && selection.size);

  const total = useMemo(() => {
    const sizePrice = getById(INGREDIENTS.sizes, selection.size)?.price || 0;
    const basePrice = getById(INGREDIENTS.bases, selection.base)?.price || 0;
    const milkPrice = getById(INGREDIENTS.milks, selection.milk)?.price || 0;
    const syrupsPrice = selection.syrups.reduce((sum, id) => sum + (getById(INGREDIENTS.syrups, id)?.price || 0), 0);
    const toppingsPrice = selection.toppings.reduce((sum, id) => sum + (getById(INGREDIENTS.toppings, id)?.price || 0), 0);
    return Math.max(0, sizePrice + basePrice + milkPrice + syrupsPrice + toppingsPrice);
  }, [selection]);

  const activeReceiptItems = useMemo(() => {
    const list = [];
    const baseItem = getById(INGREDIENTS.bases, selection.base);
    if (baseItem) {
      list.push({ name: `${baseItem.name} BASE`, price: baseItem.price });
    }
    const sizeItem = getById(INGREDIENTS.sizes, selection.size);
    if (sizeItem) {
      list.push({ name: `${sizeItem.name} SIZE`, price: sizeItem.price });
    }
    const milkItem = getById(INGREDIENTS.milks, selection.milk);
    if (milkItem && milkItem.id !== 'none') {
      list.push({ name: milkItem.name, price: milkItem.price });
    }
    selection.syrups.forEach(id => {
      const item = getById(INGREDIENTS.syrups, id);
      if (item) list.push({ name: item.name, price: item.price });
    });
    selection.toppings.forEach(id => {
      const item = getById(INGREDIENTS.toppings, id);
      if (item) list.push({ name: item.name, price: item.price });
    });
    return list;
  }, [selection]);

  const selectBase = (id) => {
    setSelection((prev) => {
      const compatibleMilks = getCompatibleMilksStatic(id);
      const newMilk = compatibleMilks.includes(prev.milk) ? prev.milk : compatibleMilks[0];
      const sweetener = prev.syrups.length > 0 ? prev.syrups[0] : null;
      return {
        ...prev,
        base: id,
        milk: newMilk,
        syrups: prev.syrups.filter((s) => isSweetenerCompatibleStatic(id, s)),
        toppings: prev.toppings.filter((t) => isToppingCompatibleStatic(id, newMilk, sweetener, t)),
      };
    });
    setStage(1);
    triggerBrewCycle();
  };

  const selectMilk = (id) => {
    setSelection((prev) => {
      const sweetener = prev.syrups.length > 0 ? prev.syrups[0] : null;
      return {
        ...prev,
        milk: id,
        toppings: prev.toppings.filter((toppingId) => isToppingCompatibleStatic(prev.base, id, sweetener, toppingId)),
      };
    });
    setStage(2);
    triggerBrewCycle();
  };

  const toggleListItem = (key, id) => {
    setSelection((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((itemId) => itemId !== id) : [...prev[key], id],
    }));
    setStage(2);
    triggerBrewCycle();
  };

  const addToOrder = () => {
    if (stage < 2 || !requiredSelectionsMade || isAdding) return;

    const cleanName = drinkName.trim() || `Custom ${base.name}`;
    const customization = {
      size: selection.size,
      base: base.name,
      milk: milk.name,
      syrups: selection.syrups.map((id) => getById(INGREDIENTS.syrups, id)?.name).filter(Boolean),
      toppings: selection.toppings.map((id) => getById(INGREDIENTS.toppings, id)?.name).filter(Boolean),
    };

    setIsAdding(true);
    window.setTimeout(() => {
      onAddToCart({
        id: `custom-${Date.now()}`,
        name: cleanName,
        price: total,
        qty: 1,
        isCustom: true,
        customization,
      });
    }, 650);
  };

  return (
    <div className="kiosk-custom-drink" ref={containerRef}>
      <aside className="custom-preview-panel">
        <DrinkPreview 
          selection={selection} 
          total={total} 
          stage={stage} 
          isAdding={isAdding} 
          brewStage={brewStage} 
          mousePos={mousePos}
        />
      </aside>

      <section className="custom-main">
        {importingInfo && (
          <div className="importing-banner">
            <Sparkles size={16} />
            <span>{importingInfo}</span>
          </div>
        )}

        <div className="custom-title-row">
          <div>
            <span className="eyebrow">LABORATORY ENGINE</span>
            <h2>Crafted In Real Time</h2>
          </div>
          <button className="category-btn" onClick={onBack}>[ RETURN TO GALLERY ]</button>
        </div>

        <div className="naming-section">
          <label htmlFor="custom-drink-name">CREATION TYPOGRAPHY IDENTIFIER</label>
          <input
            id="custom-drink-name"
            type="text"
            maxLength={36}
            value={drinkName}
            onChange={(event) => setDrinkName(event.target.value.toUpperCase())}
            className="drink-name-input"
            onFocus={(event) => event.target.select()}
          />
        </div>

        <div className="builder-stepper" aria-label="Customization progress">
          {['BASE', 'MILK', 'FINISH'].map((label, index) => (
            <button key={label} className={`step-pill ${stage >= index ? 'active' : ''}`} onClick={() => setStage(index)}>
              {index + 1}. {label}
            </button>
          ))}
        </div>

        <div className="ingredients-flow">
          <AnimatePresence mode="wait">
            <StepPanel
              key={stage}
              stage={stage}
              selection={selection}
              selectBase={selectBase}
              selectMilk={selectMilk}
              setSelection={setSelection}
              toggleListItem={toggleListItem}
            />
          </AnimatePresence>
        </div>

        {/* Detailed Recipe Pricing Breakdown */}
        <div className="receipt-breakdown-card">
          <div className="receipt-header">
            <span>COMPOSITION METADATA ANALYSIS</span>
          </div>
          <div className="receipt-items">
            {activeReceiptItems.map((item, index) => (
              <div key={index} className="receipt-item-row">
                <span className="receipt-item-name">{item.name}</span>
                <span className="receipt-item-dots"></span>
                <span className="receipt-item-price">
                  {item.price > 0 ? `+${formatCurrency(item.price)}` : item.price < 0 ? `-${formatCurrency(Math.abs(item.price))}` : 'INCLUDED'}
                </span>
              </div>
            ))}
            {activeReceiptItems.length === 0 && (
              <div className="receipt-empty">No ingredients composed.</div>
            )}
          </div>
        </div>

        <div className="build-actions">
          <span>TOTAL</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        {!isAdding && requiredSelectionsMade && freeRedosUsed < 1 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="discard-btn"
            onClick={() => {
              setSelection(defaultSelection);
              setStage(0);
              setDrinkName('CUSTOM LAB BREW');
              setFreeRedosUsed(prev => prev + 1);
              triggerBrewCycle();
              toast.success('Drink discarded! You have 1 free redo. Use it wisely. ☕');
            }}
          >
            {freeRedosUsed === 0 ? 'DISCARD & REDO (FREE)' : 'DISCARD & REDO'}
          </motion.button>
        )}

        <motion.button
          whileTap={requiredSelectionsMade ? { scale: 0.98 } : {}}
          className="add-order-btn"
          disabled={stage < 2 || !requiredSelectionsMade || isAdding}
          onClick={addToOrder}
        >
          {isAdding ? 'ADDING...' : stage < 2 ? 'FINISH STEPS' : 'ADD TO ORDER'}
        </motion.button>
      </section>
    </div>
  );
};

export default CustomDrink;
