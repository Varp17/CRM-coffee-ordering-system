import React, { useState, useMemo } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import './CustomizationModal.css';
import { formatCurrency } from '../../utils/formatters';

const INGREDIENTS = {
  sizes: [
    { id: 'S', name: 'Small', label: '250 ml', price: -30 },
    { id: 'M', name: 'Standard', label: '360 ml', price: 0 },
    { id: 'L', name: 'Large', label: '450 ml', price: 40 },
  ],
  milks: [
    { id: 'whole', name: 'Whole Milk', price: 0 },
    { id: 'oat', name: 'Oat Milk', price: 60 },
    { id: 'almond', name: 'Almond Milk', price: 50 },
    { id: 'none', name: 'No Milk', price: 0 },
  ],
  syrups: [
    { id: 'vanilla', name: 'Vanilla Syrup', price: 30 },
    { id: 'caramel', name: 'Caramel Syrup', price: 30 },
    { id: 'hazelnut', name: 'Hazelnut Syrup', price: 40 },
  ],
  toppings: [
    { id: 'whipped-cream', name: 'Whipped Cream', price: 25 },
    { id: 'cold-foam', name: 'Cold Foam', price: 35 },
    { id: 'ice', name: 'Extra Ice', price: 0 },
  ],
};

const getById = (items, id) => items.find((item) => item.id === id);

const CustomizationModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selection, setSelection] = useState({
    size: 'M',
    milk: 'none', // Default depends on product, but standard is none if black
    syrups: [],
    toppings: [],
  });

  const [quantity, setQuantity] = useState(1);

  // Initialize selection when product changes
  React.useEffect(() => {
    if (product) {
      setSelection({
        size: 'M',
        milk: product.category?.toLowerCase().includes('milk') ? 'whole' : 'none',
        syrups: [],
        toppings: [],
      });
      setQuantity(1);
    }
  }, [product]);

  const total = useMemo(() => {
    if (!product) return 0;
    const basePrice = product.price || 0;
    const sizePrice = getById(INGREDIENTS.sizes, selection.size)?.price || 0;
    const milkPrice = getById(INGREDIENTS.milks, selection.milk)?.price || 0;
    const syrupsPrice = selection.syrups.reduce((sum, id) => sum + (getById(INGREDIENTS.syrups, id)?.price || 0), 0);
    const toppingsPrice = selection.toppings.reduce((sum, id) => sum + (getById(INGREDIENTS.toppings, id)?.price || 0), 0);
    
    return Math.max(0, basePrice + sizePrice + milkPrice + syrupsPrice + toppingsPrice);
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
        size: getById(INGREDIENTS.sizes, selection.size)?.name,
        milk: getById(INGREDIENTS.milks, selection.milk)?.name,
        syrups: selection.syrups.map((id) => getById(INGREDIENTS.syrups, id)?.name),
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

        {/* MILK */}
        <div className="custom-section">
          <h4>Milk Base</h4>
          <div className="custom-options">
            {INGREDIENTS.milks.map(m => (
              <button 
                key={m.id} 
                className={`custom-btn ${selection.milk === m.id ? 'active' : ''}`}
                onClick={() => setSelection(p => ({ ...p, milk: m.id }))}
              >
                {m.name} {m.price > 0 && `(+${formatCurrency(m.price)})`}
              </button>
            ))}
          </div>
        </div>

        {/* SYRUPS */}
        <div className="custom-section">
          <h4>Syrups (Optional)</h4>
          <div className="custom-options">
            {INGREDIENTS.syrups.map(s => (
              <button 
                key={s.id} 
                className={`custom-btn ${selection.syrups.includes(s.id) ? 'active' : ''}`}
                onClick={() => toggleListItem('syrups', s.id)}
              >
                {s.name} (+{formatCurrency(s.price)})
              </button>
            ))}
          </div>
        </div>

        {/* TOPPINGS */}
        <div className="custom-section">
          <h4>Toppings (Optional)</h4>
          <div className="custom-options">
            {INGREDIENTS.toppings.map(t => (
              <button 
                key={t.id} 
                className={`custom-btn ${selection.toppings.includes(t.id) ? 'active' : ''}`}
                onClick={() => toggleListItem('toppings', t.id)}
              >
                {t.name} {t.price > 0 && `(+${formatCurrency(t.price)})`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomizationModal;
