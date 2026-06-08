import React, { useState, useMemo } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import './CustomizationModal.css';
import { formatCurrency } from '../../utils/formatters';
import { useCompatibility, getCompatibleMilksStatic, isSweetenerCompatibleStatic, isToppingCompatibleStatic } from '../../utils/compatibility';

const INGREDIENTS = {
  sizes: [
    { id: 'S', name: 'Small', label: '250 ml', price: -30 },
    { id: 'M', name: 'Standard', label: '360 ml', price: 0 },
    { id: 'L', name: 'Large', label: '450 ml', price: 40 },
  ],
  bases: [
    { id: '50-50', name: '50:50 Concentrate', price: 0, ingredientId: 1 },
    { id: '70-30', name: '70:30 Concentrate', price: 10, ingredientId: 2 },
    { id: 'arabica', name: '100% Arabica', price: 20, ingredientId: 3 },
    { id: 'sif', name: 'SIF Concentrate', price: 10, ingredientId: 4 },
    { id: 'cascara', name: 'Cascara Concentrate', price: 0, ingredientId: 46 },
  ],
  milks: [
    { id: 'dairy', name: 'Dairy Milk', price: 0, ingredientId: 8 },
    { id: 'oat', name: 'Oat Milk', price: 25, ingredientId: 9 },
    { id: 'almond', name: 'Almond Milk', price: 30, ingredientId: 10 },
    { id: 'coconut', name: 'Coconut Milk', price: 20, ingredientId: 11 },
    { id: 'none', name: 'No Milk', price: 0 },
  ],
  sweeteners: [
    { id: 'sugar', name: 'Sugar Syrup', price: 0, ingredientId: 12 },
    { id: 'jaggery', name: 'Jaggery Syrup', price: 5, ingredientId: 13 },
    { id: 'condensed', name: 'Condensed Milk', price: 15, ingredientId: 15 },
    { id: 'vanilla', name: 'Vanilla Syrup', price: 8, ingredientId: 17 },
    { id: 'honey', name: 'Honey', price: 10, ingredientId: 14 },
    { id: 'raspberry', name: 'Raspberry Syrup', price: 10, ingredientId: 24 },
    { id: 'strawberry', name: 'Strawberry Syrup', price: 10, ingredientId: 22 },
    { id: 'orange', name: 'Orange Syrup', price: 10, ingredientId: 23 },
  ],
  toppings: [
    { id: 'cinnamon', name: 'Cinnamon Powder', price: 5, ingredientId: 31 },
    { id: 'cacao', name: 'Cacao Powder', price: 5, ingredientId: 30 },
    { id: 'nutmeg', name: 'Nutmeg Powder', price: 5, ingredientId: 32 },
    { id: 'golden-cream', name: 'Golden Cream', price: 15, ingredientId: 26 },
    { id: 'whipped-cream', name: 'Whipped Cream', price: 10, ingredientId: 27 },
    { id: 'chocolate-drizzle', name: 'Chocolate Drizzle', price: 10, ingredientId: 21 },
    { id: 'hazelnut', name: 'Hazelnut Syrup', price: 10, ingredientId: 18 },
    { id: 'honey-drizzle', name: 'Honey Drizzle', price: 10, ingredientId: 14 },
    { id: 'salted-caramel', name: 'Salted Caramel', price: 8, ingredientId: 16 },
    { id: 'coconut-flakes', name: 'Coconut Flakes', price: 8, ingredientId: 36 },
    { id: 'almond-flakes', name: 'Almond Flakes', price: 10, ingredientId: 35 },
    { id: 'rainbow-sprinkles', name: 'Rainbow Sprinkles', price: 5, ingredientId: 38 },
    { id: 'brown-sugar-dust', name: 'Brown Sugar Dust', price: 3, ingredientId: 40 },
    { id: 'jaggery-powder', name: 'Jaggery Powder', price: 5, ingredientId: 13 },
    { id: 'lemon-slice', name: 'Lemon Slice', price: 5, ingredientId: 43 },
    { id: 'orange-slice', name: 'Orange Slice', price: 5, ingredientId: 44 },
  ],
};

const getById = (items, id) => items.find((item) => item.id === id);

const CustomizationModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selection, setSelection] = useState({
    size: 'M',
    base: '50-50',
    milk: 'dairy',
    sweetener: 'sugar',
    toppings: [],
  });

  const [quantity, setQuantity] = useState(1);

  const { isMilkCompatible, isSweetenerCompatible, isToppingCompatible, getCompatibleMilks } = useCompatibility(selection.base, selection);

  // Initialize selection when product changes
  React.useEffect(() => {
    if (product) {
      setSelection({
        size: 'M',
        base: '50-50',
        milk: 'dairy',
        sweetener: 'sugar',
        toppings: [],
      });
      setQuantity(1);
    }
  }, [product]);

  const total = useMemo(() => {
    if (!product) return 0;
    const basePrice = product.price || 0;
    const baseUpcharge = getById(INGREDIENTS.bases, selection.base)?.price || 0;
    const sizePrice = getById(INGREDIENTS.sizes, selection.size)?.price || 0;
    const milkPrice = getById(INGREDIENTS.milks, selection.milk)?.price || 0;
    const sweetenerPrice = getById(INGREDIENTS.sweeteners, selection.sweetener)?.price || 0;
    const toppingsPrice = selection.toppings.reduce((sum, id) => sum + (getById(INGREDIENTS.toppings, id)?.price || 0), 0);
    
    return Math.max(0, basePrice + baseUpcharge + sizePrice + milkPrice + sweetenerPrice + toppingsPrice);
  }, [selection, product]);

  const toggleListItem = (key, id) => {
    setSelection((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((itemId) => itemId !== id) : [...prev[key], id],
    }));
  };

  if (!product) return null;

  const handleAdd = () => {
    const customDrink = {
      ...product,
      isCustom: true,
      customization: {
        base: getById(INGREDIENTS.bases, selection.base)?.name,
        size: getById(INGREDIENTS.sizes, selection.size)?.name,
        milk: getById(INGREDIENTS.milks, selection.milk)?.name,
        sweetener: getById(INGREDIENTS.sweeteners, selection.sweetener)?.name,
        toppings: selection.toppings.map((id) => getById(INGREDIENTS.toppings, id)?.name),
      }
    };
    
    const variant = { id: `custom-${Date.now()}`, name: 'Custom', price: total };
    
    onAddToCart(customDrink, variant, quantity);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Customize ${product.title}`}
      size="large"
      footerActions={
        <div className="custom-modal-footer-flex">
          <div className="custom-modal-qty">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>
          <Button variant="primary" onClick={handleAdd} size="large">
            Add to Cart - {formatCurrency(total * quantity)}
          </Button>
        </div>
      }
    >
      <div className="customization-modal-body">
        {/* SIZE */}
        <div className="custom-section">
          <h4>Cup Size</h4>
          <div className="custom-options">
            {INGREDIENTS.sizes.map(s => (
              <button 
                key={s.id} 
                className={`custom-btn ${selection.size === s.id ? 'active' : ''}`}
                onClick={() => setSelection(p => ({ ...p, size: s.id }))}
              >
                {s.name} {s.price !== 0 && `(${s.price > 0 ? '+' : ''}${formatCurrency(s.price)})`}
              </button>
            ))}
          </div>
        </div>

        {/* BASE */}
        <div className="custom-section">
          <h4>Coffee Base</h4>
          <div className="custom-options">
            {INGREDIENTS.bases.map(b => (
              <button 
                key={b.id} 
                className={`custom-btn ${selection.base === b.id ? 'active' : ''}`}
                onClick={() => setSelection(p => {
                  const cm = getCompatibleMilksStatic(b.id);
                  const newMilk = cm.includes(p.milk) ? p.milk : cm[0];
                  const newSweetener = isSweetenerCompatibleStatic(b.id, p.sweetener) ? p.sweetener : 'sugar';
                  return {
                    ...p,
                    base: b.id,
                    milk: newMilk,
                    sweetener: newSweetener,
                    toppings: p.toppings.filter(t => isToppingCompatibleStatic(b.id, newMilk, newSweetener, t)),
                  };
                })}
              >
                {b.name} {b.price > 0 && `(+${formatCurrency(b.price)})`}
              </button>
            ))}
          </div>
        </div>

        {/* MILK */}
        <div className="custom-section">
          <h4>Milk Base</h4>
          <div className="custom-options">
            {INGREDIENTS.milks.map(m => {
              const disabled = !isMilkCompatible(selection.base, m.id);
              return (
              <button 
                key={m.id} 
                className={`custom-btn ${selection.milk === m.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                disabled={disabled}
                onClick={() => setSelection(p => ({ ...p, milk: m.id, toppings: p.toppings.filter(t => isToppingCompatible(p.base, m.id, p.sweetener, t)) }))}
              >
                {m.name} {m.price > 0 && `(+${formatCurrency(m.price)})`}
              </button>
            );})}
          </div>
        </div>

        {/* SWEETENER */}
        <div className="custom-section">
          <h4>Sweetener</h4>
          <div className="custom-options">
            {INGREDIENTS.sweeteners.map(s => {
              const disabled = !isSweetenerCompatible(selection.base, s.id);
              return (
              <button 
                key={s.id} 
                className={`custom-btn ${selection.sweetener === s.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                disabled={disabled}
                onClick={() => setSelection(p => ({ ...p, sweetener: s.id }))}
              >
                {s.name} {s.price > 0 && `(+${formatCurrency(s.price)})`}
              </button>
            );})}
          </div>
        </div>

        {/* TOPPINGS */}
        <div className="custom-section">
          <h4>Toppings (Optional)</h4>
          <div className="custom-options">
            {INGREDIENTS.toppings.map(t => {
              const disabled = !isToppingCompatible(selection.base, selection.milk, selection.sweetener, t.id);
              return (
              <button 
                key={t.id} 
                className={`custom-btn ${selection.toppings.includes(t.id) ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                disabled={disabled}
                onClick={() => toggleListItem('toppings', t.id)}
              >
                {t.name} {t.price > 0 && `(+${formatCurrency(t.price)})`}
              </button>
            );})}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomizationModal;
