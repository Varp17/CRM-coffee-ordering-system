import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowLeft, ArrowRight, ShoppingCart, Video, Camera, Sparkles, Droplets, Milk as MilkIcon, Coffee } from 'lucide-react';
import { useCartStore } from '../../../store/useCartStore';
import CupAnimation from '../../../components/CupAnimation/CupAnimation';
import { DRINK_OPTIONS, INGREDIENT_VISUALS } from '../../../components/CupAnimation/ingredientVisuals';
import { findMatchingRecipe } from '../../../components/CupAnimation/recipeVideos';

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

const categoryIcons = {
  bases: Coffee,
  milks: MilkIcon,
  sweeteners: Droplets,
  toppings: Sparkles,
};

const DrinkBuilder = ({ onClose, onAddToCart: externalAddToCart, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    base: DRINK_OPTIONS.bases[0],
    milk: DRINK_OPTIONS.milks[0],
    sweetener: DRINK_OPTIONS.sweeteners[0],
    toppings: [],
  });
  const [videoBlob, setVideoBlob] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const addItemInternal = useCartStore((state) => state.addItem);

  const totalPrice = useMemo(() => {
    let sum = selections.base.price + selections.milk.price + selections.sweetener.price;
    selections.toppings.forEach(t => sum += t.price);
    return sum;
  }, [selections]);

  const handleSelect = useCallback((category, item) => {
    if (category === 'toppings') {
      setSelections(prev => {
        const exists = prev.toppings.find(t => t.id === item.id);
        return {
          ...prev,
          toppings: exists
            ? prev.toppings.filter(t => t.id !== item.id)
            : [...prev.toppings, item],
        };
      });
    } else {
      setSelections(prev => ({ ...prev, [category]: item }));
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

  const handleRecordComplete = useCallback((blob) => {
    setVideoBlob(blob);
    setShowVideoModal(true);
  }, []);

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
    const Icon = categoryIcons[category] || Sparkles;
    const isMulti = category === 'toppings';

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const isSelected = isMulti
            ? selections.toppings.some(t => t.id === item.id)
            : selections[category]?.id === item.id;
          const swatchColor = getSwatchColor(item.id, category);

          return (
            <motion.div
              key={item.id}
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(category, item)}
              className={`relative cursor-pointer rounded-xl border-2 p-3.5 transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/20 shadow-md'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              {item.badge && (
                <span className={`absolute -top-2.5 left-3 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm z-10 ${
                  item.badge === 'recommended'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  {item.badgeText}
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: swatchColor + '30' }}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-white/30"
                    style={{ backgroundColor: swatchColor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 truncate">
                      {item.icon || ''} {item.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                  </div>
                  {item.desc && (
                    <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{item.desc}</p>
                  )}
                  {item.volume && (
                    <p className="text-[10px] text-neutral-400 mt-1">{item.volume}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className={`text-xs font-bold ${item.price > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
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
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 p-6 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            {(onBack || onClose) && (
              <button
                onClick={onBack || onClose}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Create Your Own Drink</h2>
              <p className="text-sm text-neutral-500">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-400">Total</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-500">₹{totalPrice}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 my-5">
          {STEPS.map((s, idx) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                idx <= currentStep
                  ? 'bg-amber-600 dark:bg-amber-500'
                  : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative min-h-[320px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 overflow-y-auto pr-1"
            >
              {currentStep === 0 && renderOptions(DRINK_OPTIONS.bases, 'bases', 'base')}
              {currentStep === 1 && renderOptions(DRINK_OPTIONS.milks, 'milks', 'milk')}
              {currentStep === 2 && renderOptions(DRINK_OPTIONS.sweeteners, 'sweeteners', 'sweetener')}
              {currentStep === 3 && renderOptions(DRINK_OPTIONS.toppings, 'toppings', 'toppings')}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4">
          <button
            onClick={() => paginate(-1)}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              currentStep === 0
                ? 'text-neutral-300 border-neutral-200 dark:text-neutral-700 dark:border-neutral-800 cursor-not-allowed'
                : 'text-neutral-700 border-neutral-300 dark:text-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep === STEPS.length - 1 ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setStep([0, 0]);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Sparkles className="w-4 h-4" />
                Recipe
              </button>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-amber-600 dark:bg-amber-500 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          ) : (
            <button
              onClick={() => paginate(1)}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-6 py-2 rounded-xl text-sm font-semibold shadow"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="lg:w-72 flex flex-col items-center justify-center gap-4 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xl">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Live Preview</div>
        <CupAnimation
          selections={selectionForPreview}
          size={240}
          autoPlay
          recordingEnabled
          onRecordComplete={handleRecordComplete}
        />
        <div className="text-center">
          {matchedRecipe ? (
            <>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                  ★ Signature
                </span>
              </div>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {matchedRecipe.name}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {selections.base.name}
              </div>
              <div className="text-xs text-neutral-400">
                {selections.milk.name} · {selections.sweetener.name}
              </div>
            </>
          )}
          {selections.toppings.length > 0 && (
            <div className="text-xs text-neutral-400 mt-0.5">
              +{selections.toppings.map(t => t.name).join(', ')}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setShowVideoModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all mt-2"
        >
          <Video className="w-3.5 h-3.5" />
          Watch Preview
        </button>
      </div>

      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-neutral-200 dark:border-neutral-800"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1">Your Drink Preview</h3>
              <p className="text-sm text-neutral-400 mb-4">Watch the full animation or download as video</p>

              <div className="flex justify-center mb-4">
                <CupAnimation
                  selections={selectionForPreview}
                  size={280}
                  autoPlay
                  recordingEnabled
                  onRecordComplete={handleRecordComplete}
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold">{selections.base.name} + {selections.milk.name}</div>
                  <div className="text-xs text-neutral-400">₹{totalPrice}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowVideoModal(false);
                      setVideoBlob(null);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                  >
                    Close
                  </button>
                  {videoBlob && (
                    <a
                      href={URL.createObjectURL(videoBlob)}
                      download={`custom-coffee-${Date.now()}.webm`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Camera className="w-4 h-4" />
                      Download Video
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrinkBuilder;
