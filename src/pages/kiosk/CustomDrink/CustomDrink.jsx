import React, { useState, useEffect } from 'react';
import './CustomDrink.css';
import Button from '../../../components/Button/Button';

const CustomDrink = ({ onBack, onAddToCart }) => {
  const [drinkName, setDrinkName] = useState('My Custom Brew');
  const [selectedIngredients, setSelectedIngredients] = useState({
    base: 'Espresso',
    milk: 'Whole Milk',
    syrups: [],
    toppings: []
  });
  
  const [freeDiscardAvailable, setFreeDiscardAvailable] = useState(true);

  const ingredients = {
    bases: [
      { id: 1, name: 'Espresso', price: 100 },
      { id: 2, name: 'Cold Brew', price: 120 },
      { id: 3, name: 'Matcha', price: 150 }
    ],
    milks: [
      { id: 1, name: 'Whole Milk', price: 0 },
      { id: 2, name: 'Oat Milk', price: 50 },
      { id: 3, name: 'Almond Milk', price: 50 }
    ],
    syrups: [
      { id: 1, name: 'Vanilla', price: 30 },
      { id: 2, name: 'Caramel', price: 30 },
      { id: 3, name: 'Hazelnut', price: 30 }
    ],
    toppings: [
      { id: 1, name: 'Whipped Cream', price: 20 },
      { id: 2, name: 'Chocolate Drizzle', price: 15 },
      { id: 3, name: 'Cinnamon Dust', price: 10 }
    ]
  };

  // Conditional Mapping Simulation
  useEffect(() => {
    if (selectedIngredients.base === 'Matcha' && selectedIngredients.milk !== 'Oat Milk') {
      setSelectedIngredients({
        ...selectedIngredients,
        milk: 'Oat Milk'
      });
      alert('Matcha is best paired with Oat Milk. We have selected it for you!');
    }
  }, [selectedIngredients.base]);

  const calculateTotal = () => {
    let total = 0;
    const base = ingredients.bases.find(b => b.name === selectedIngredients.base);
    const milk = ingredients.milks.find(m => m.name === selectedIngredients.milk);
    
    if (base) total += base.price;
    if (milk) total += milk.price;
    
    selectedIngredients.syrups.forEach(s => {
      const syrup = ingredients.syrups.find(item => item.name === s);
      if (syrup) total += syrup.price;
    });
    
    selectedIngredients.toppings.forEach(t => {
      const topping = ingredients.toppings.find(item => item.name === t);
      if (topping) total += topping.price;
    });
    
    return total;
  };

  const toggleSyrup = (name) => {
    if (selectedIngredients.syrups.includes(name)) {
      setSelectedIngredients({
        ...selectedIngredients,
        syrups: selectedIngredients.syrups.filter(s => s !== name)
      });
    } else {
      setSelectedIngredients({
        ...selectedIngredients,
        syrups: [...selectedIngredients.syrups, name]
      });
    }
  };

  const toggleTopping = (name) => {
    if (selectedIngredients.toppings.includes(name)) {
      setSelectedIngredients({
        ...selectedIngredients,
        toppings: selectedIngredients.toppings.filter(t => t !== name)
      });
    } else {
      setSelectedIngredients({
        ...selectedIngredients,
        toppings: [...selectedIngredients.toppings, name]
      });
    }
  };

  const handleDiscard = () => {
    if (freeDiscardAvailable) {
      setFreeDiscardAvailable(false);
      setSelectedIngredients({
        base: 'Espresso',
        milk: 'Whole Milk',
        syrups: [],
        toppings: []
      });
      setDrinkName('My Custom Brew');
      alert('Your 1 free discard has been used. Starting over!');
    } else {
      alert('You have already used your free discard for this session.');
    }
  };

  const handleShare = () => {
    alert(`Sharing "${drinkName}" via WhatsApp! Includes recipe and location.`);
  };

  return (
    <div className="kiosk-custom-drink">
      <div className="custom-main">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Create Your Custom Drink</h2>
        
        {/* Naming Section */}
        <div className="naming-section glass">
          <label>Name Your Creation:</label>
          <input 
            type="text" 
            value={drinkName} 
            onChange={(e) => setDrinkName(e.target.value)}
            className="drink-name-input"
          />
        </div>

        {/* Ingredients Selection */}
        <div className="ingredients-grid">
          {/* Base */}
          <div className="ingredient-category glass">
            <h3>Choose Base</h3>
            <div className="options-list">
              {ingredients.bases.map(b => (
                <button 
                  key={b.id} 
                  className={`option-btn ${selectedIngredients.base === b.name ? 'active' : ''}`}
                  onClick={() => setSelectedIngredients({...selectedIngredients, base: b.name})}
                >
                  <span>{b.name}</span>
                  <span>+₹{b.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Milk */}
          <div className="ingredient-category glass">
            <h3>Choose Milk</h3>
            <div className="options-list">
              {ingredients.milks.map(m => (
                <button 
                  key={m.id} 
                  className={`option-btn ${selectedIngredients.milk === m.name ? 'active' : ''}`}
                  onClick={() => setSelectedIngredients({...selectedIngredients, milk: m.name})}
                  disabled={selectedIngredients.base === 'Matcha' && m.name !== 'Oat Milk'}
                  style={{ opacity: selectedIngredients.base === 'Matcha' && m.name !== 'Oat Milk' ? 0.5 : 1 }}
                >
                  <span>{m.name}</span>
                  <span>+₹{m.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Syrups */}
          <div className="ingredient-category glass">
            <h3>Add Syrups</h3>
            <div className="options-list">
              {ingredients.syrups.map(s => (
                <button 
                  key={s.id} 
                  className={`option-btn ${selectedIngredients.syrups.includes(s.name) ? 'active' : ''}`}
                  onClick={() => toggleSyrup(s.name)}
                >
                  <span>{s.name}</span>
                  <span>+₹{s.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div className="ingredient-category glass">
            <h3>Add Toppings</h3>
            <div className="options-list">
              {ingredients.toppings.map(t => (
                <button 
                  key={t.id} 
                  className={`option-btn ${selectedIngredients.toppings.includes(t.name) ? 'active' : ''}`}
                  onClick={() => toggleTopping(t.name)}
                >
                  <span>{t.name}</span>
                  <span>+₹{t.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="custom-summary glass">
        <h3>Summary</h3>
        <div className="summary-details">
          <div className="summary-item">
            <span className="label">Name:</span>
            <span className="value">{drinkName}</span>
          </div>
          <div className="summary-item">
            <span className="label">Base:</span>
            <span className="value">{selectedIngredients.base}</span>
          </div>
          <div className="summary-item">
            <span className="label">Milk:</span>
            <span className="value">{selectedIngredients.milk}</span>
          </div>
          {selectedIngredients.syrups.length > 0 && (
            <div className="summary-item">
              <span className="label">Syrups:</span>
              <span className="value">{selectedIngredients.syrups.join(', ')}</span>
            </div>
          )}
          {selectedIngredients.toppings.length > 0 && (
            <div className="summary-item">
              <span className="label">Toppings:</span>
              <span className="value">{selectedIngredients.toppings.join(', ')}</span>
            </div>
          )}
        </div>
        
        <div className="total-section">
          <span>Total Price:</span>
          <span className="total-price">₹{calculateTotal()}</span>
        </div>

        <div className="discard-section" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {freeDiscardAvailable ? (
            <p>🎁 1 Free Discard Available</p>
          ) : (
            <p style={{ color: 'var(--color-primary)' }}>Free discard used</p>
          )}
          <Button variant="secondary" size="small" onClick={handleDiscard} style={{ marginTop: '5px' }}>Discard & Reset</Button>
        </div>

        <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button variant="primary" size="large" onClick={() => onAddToCart({ name: drinkName, price: calculateTotal(), ingredients: selectedIngredients })}>Add to Cart</Button>
          <Button variant="secondary" size="large" onClick={handleShare}>📲 Share via WhatsApp</Button>
        </div>
      </div>
    </div>
  );
};

export default CustomDrink;
