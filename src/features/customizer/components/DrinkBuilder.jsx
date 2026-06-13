import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, ShoppingCart, Video, Camera, Sparkles, Droplets, Milk as MilkIcon, Coffee } from 'lucide-react';
import { useCartStore } from '../../../store/useCartStore';
import CupAnimation from '../../../components/CupAnimation/CupAnimation';
import { DRINK_OPTIONS, INGREDIENT_VISUALS } from '../../../components/CupAnimation/ingredientVisuals';
import { findMatchingRecipe } from '../../../components/CupAnimation/recipeVideos';
import { 
  useCompatibility,
  getCompatibleMilksStatic, 
  isSweetenerCompatibleStatic, 
  isToppingCompatibleStatic 
} from '../../../utils/compatibility';
import './DrinkBuilder.css';

const STEPS = [
  { id: 'base', title: 'Choose Concentrate' },
  { id: 'milk', title: 'Select Milk' },
  { id: 'sweetener', title: 'Choose Sweetener' },
  { id: 'toppings', title: 'Toppings & Extras' },
];

function getSwatchColor(id, category) {
  const map = {
    bases: INGREDIENT_VISUALS.concentrates,
    milks: INGREDIENT_VISUALS.milks,
    sweeteners: INGREDIENT_VISUALS.sweeteners,
    toppings: INGREDIENT_VISUALS.toppings,
  };
  return map[category]?.[id]?.color || '#888';
}

const DrinkBuilder = ({ onClose, onAddToCart: externalAddToCart, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    base: DRINK_OPTIONS.bases[0],
    milk: DRINK_OPTIONS.milks[0],
    sweetener: DRINK_OPTIONS.sweeteners[0],
    toppings: [],
  });


  const addItemInternal = useCartStore((state) => state.addItem);

  // Hook selections for compatibility check
  const compatibilitySelections = useMemo(() => {
    return {
      milk: selections.milk?.id,
      sweetener: selections.sweetener?.id,
      syrups: [],
      toppings: selections.toppings.map(t => t.id),
    };
  }, [selections]);

  const {
    isMilkCompatible,
    isSweetenerCompatible,
    isToppingCompatible,
    getDisabledReason,
  } = useCompatibility(selections.base?.id, compatibilitySelections);

  const totalPrice = useMemo(() => {
    let sum = selections.base.price + selections.milk.price + selections.sweetener.price;
    selections.toppings.forEach(t => sum += t.price);
    return sum;
  }, [selections]);

  const handleSelect = useCallback((category, item) => {
    if (category === 'bases') {
      setSelections(prev => {
        const baseId = item.id;
        // Resolve compatible milk
        const compatibleMilks = getCompatibleMilksStatic(baseId);
        const currentMilkId = prev.milk?.id || 'none';
        const newMilkId = compatibleMilks.includes(currentMilkId) ? currentMilkId : (compatibleMilks[0] || 'none');
        const newMilk = DRINK_OPTIONS.milks.find(m => m.id === newMilkId) || DRINK_OPTIONS.milks[0];

        // Filter sweeteners
        const currentSweetenerId = prev.sweetener?.id || 'none';
        const newSweetenerId = isSweetenerCompatibleStatic(baseId, currentSweetenerId) ? currentSweetenerId : 'none';
        const newSweetener = DRINK_OPTIONS.sweeteners.find(s => s.id === newSweetenerId) || DRINK_OPTIONS.sweeteners[0];

        // Filter toppings
        const newToppings = prev.toppings.filter(t => isToppingCompatibleStatic(baseId, newMilkId, newSweetenerId, t.id));

        return {
          base: item,
          milk: newMilk,
          sweetener: newSweetener,
          toppings: newToppings,
        };
      });
    } else if (category === 'milks') {
      setSelections(prev => {
        const baseId = prev.base.id;
        const milkId = item.id;
        const sweetenerId = prev.sweetener?.id || 'none';
        const newToppings = prev.toppings.filter(t => isToppingCompatibleStatic(baseId, milkId, sweetenerId, t.id));
        return {
          ...prev,
          milk: item,
          toppings: newToppings,
        };
      });
    } else if (category === 'sweeteners') {
      setSelections(prev => {
        const baseId = prev.base.id;
        const milkId = prev.milk?.id || 'none';
        const sweetenerId = item.id;
        const newToppings = prev.toppings.filter(t => isToppingCompatibleStatic(baseId, milkId, sweetenerId, t.id));
        return {
          ...prev,
          sweetener: item,
          toppings: newToppings,
        };
      });
    } else if (category === 'toppings') {
      setSelections(prev => {
        const exists = prev.toppings.find(t => t.id === item.id);
        return {
          ...prev,
          toppings: exists
            ? prev.toppings.filter(t => t.id !== item.id)
            : [...prev.toppings, item],
        };
      });
    }
  }, []);

  const handleAddToCart = useCallback(() => {
    const matched = findMatchingRecipe(selections);
    const drinkName = matched
      ? matched.name
      : `${selections.base.name} + ${selections.milk.name}`;

    const customDrink = {
      id: `custom-${selections.base.id}-${selections.milk.id}-${Date.now()}`,
      name: drinkName,
      price: totalPrice,
      image_url: '/images/products/custom-brew.png',
      customization: {
        base: selections.base.id,
        milk: selections.milk.id,
        sweetener: selections.sweetener.id,
        toppings: selections.toppings.map(t => t.id),
        is_signature: !!matched,
        signature_name: matched?.name || null,
      },
    };

    if (externalAddToCart) {
      externalAddToCart(customDrink);
    } else {
      addItemInternal(
        { ...customDrink, image_url: customDrink.image_url },
        { id: `var-${Date.now()}`, name: `Custom`, price: totalPrice },
        1
      );
    }

    if (onClose) onClose();
  }, [selections, totalPrice, externalAddToCart, addItemInternal, onClose]);



  const matchedRecipe = useMemo(() => findMatchingRecipe(selections), [selections]);

  const selectionForPreview = useMemo(() => ({
    ...selections,
    totalPrice,
  }), [selections, totalPrice]);

  const [[step, direction], setStep] = useState([0, 0]);

  const paginate = useCallback((newDirection) => {
    const nextStep = currentStep + newDirection;
    if (nextStep >= 0 && nextStep < STEPS.length) {
      setStep([nextStep, newDirection]);
      setCurrentStep(nextStep);
    }
  }, [currentStep]);

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir < 0 ? 80 : -80, opacity: 0 }),
  };

  const renderOptions = (items, category, selectedField) => {
    const isMulti = category === 'toppings';

    return (
      <div className="options-grid">
        {items.map((item) => {
          let isCompatible = true;
          let disabledReason = null;

          if (category === 'milks') {
            isCompatible = isMilkCompatible(item.id);
            if (!isCompatible) disabledReason = getDisabledReason(item.id);
          } else if (category === 'sweeteners') {
            isCompatible = isSweetenerCompatible(item.id);
            if (!isCompatible) disabledReason = getDisabledReason(item.id);
          } else if (category === 'toppings') {
            isCompatible = isToppingCompatible(selections.milk?.id, selections.sweetener?.id, item.id);
            if (!isCompatible) disabledReason = getDisabledReason(item.id, selections.milk?.id, selections.sweetener?.id);
          }

          const isSelected = isMulti
            ? selections.toppings.some(t => t.id === item.id)
            : selections[selectedField]?.id === item.id;
          const swatchColor = getSwatchColor(item.id, category);

          return (
            <motion.div
              key={item.id}
              layout
              whileHover={isCompatible ? { scale: 1.02 } : {}}
              whileTap={isCompatible ? { scale: 0.98 } : {}}
              onClick={() => isCompatible && handleSelect(category, item)}
              className={`option-card ${isSelected ? 'selected' : ''} ${!isCompatible ? 'disabled' : ''}`}
            >
              {item.badge && (
                <span className={`option-badge ${item.badge}`}>
                  {item.badgeText}
                </span>
              )}

              <div className="option-card-main">
                <div
                  className="swatch-wrapper"
                  style={{ backgroundColor: swatchColor + '20' }}
                >
                  <div
                    className="swatch-circle"
                    style={{ backgroundColor: swatchColor }}
                  />
                </div>

                <div className="option-info">
                  <div className="option-title-row">
                    <span className="option-name">
                      {item.icon || ''} {item.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 check-icon" />}
                  </div>
                  {item.desc && (
                    <p className="option-desc">{item.desc}</p>
                  )}
                  {disabledReason && (
                    <p className="option-reason">{disabledReason}</p>
                  )}
                  {item.volume && (
                    <p className="option-volume">{item.volume}</p>
                  )}
                </div>
              </div>

              <div className="option-card-footer">
                <span className={`option-price ${item.price > 0 ? '' : 'free'}`}>
                  {item.price > 0 ? `₹${item.price}` : 'Free'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="drink-builder-container">
      <div className="builder-form-panel">
        <div className="builder-header">
          <div className="builder-header-left">
            {(onBack || onClose) && (
              <button
                onClick={onBack || onClose}
                className="back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="builder-title">Create Your Own Drink</h2>
              <p className="builder-subtitle">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
              </p>
            </div>
          </div>
          <div className="builder-header-right">
            <div className="total-label">Total</div>
            <div className="total-value">₹{totalPrice}</div>
          </div>
        </div>

        <div className="steps-progress">
          {STEPS.map((s, idx) => (
            <div
              key={s.id}
              className={`progress-bar-segment ${idx <= currentStep ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="options-scrollbox">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ minHeight: '100%' }}
            >
              {currentStep === 0 && renderOptions(DRINK_OPTIONS.bases, 'bases', 'base')}
              {currentStep === 1 && renderOptions(DRINK_OPTIONS.milks, 'milks', 'milk')}
              {currentStep === 2 && renderOptions(DRINK_OPTIONS.sweeteners, 'sweeteners', 'sweetener')}
              {currentStep === 3 && renderOptions(DRINK_OPTIONS.toppings, 'toppings', 'toppings')}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="builder-controls">
          <button
            onClick={() => paginate(-1)}
            disabled={currentStep === 0}
            className="nav-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep === STEPS.length - 1 ? (
            <div className="finish-buttons-group">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setStep([0, 0]);
                }}
                className="nav-btn"
              >
                <Sparkles className="w-4 h-4" />
                Restart
              </button>
              <button
                onClick={handleAddToCart}
                className="action-btn action-btn-primary"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          ) : (
            <button
              onClick={() => paginate(1)}
              className="nav-btn nav-btn-next"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="builder-preview-panel">
        <div className="preview-label">Live Preview</div>
        <CupAnimation
          selections={selectionForPreview}
          size={220}
          autoPlay
        />
        <div className="preview-drink-info">
          {matchedRecipe ? (
            <>
              <div className="signature-badge">
                ★ Signature Match
              </div>
              <div className="preview-drink-name">
                {matchedRecipe.name}
              </div>
            </>
          ) : (
            <>
              <div className="preview-drink-name">
                {selections.base.name}
              </div>
              <div className="preview-drink-sub">
                {selections.milk.name} · {selections.sweetener.name}
              </div>
            </>
          )}
          {selections.toppings.length > 0 && (
            <div className="preview-drink-sub" style={{ marginTop: '4px', fontWeight: 600 }}>
              +{selections.toppings.map(t => t.name).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrinkBuilder;
