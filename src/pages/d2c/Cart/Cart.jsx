import React, { useState } from 'react';
import './Cart.css';
import Button from '../../../components/Button/Button';

const Cart = ({ onProceedToCheckout }) => {
  const [cartItems, setCartItems] = useState([
    { 
      id: 1, 
      title: 'Dark Roast Concentrate', 
      price: 12.99, 
      quantity: 2, 
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      customizations: [
        { name: 'Extra Shot', price: 1.50 },
        { name: 'Oat Milk', price: 0.50 }
      ]
    },
    { 
      id: 2, 
      title: 'Vanilla Infused Cold Brew', 
      price: 14.99, 
      quantity: 1, 
      imageUrl: 'https://images.unsplash.com/photo-1461023235402-278239b9b242?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      customizations: []
    }
  ]);

  const updateQuantity = (id, amount) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const calculateItemTotal = (item) => {
    const customizationsTotal = item.customizations.reduce((acc, cust) => acc + cust.price, 0);
    return (item.price + customizationsTotal) * item.quantity;
  };

  const subtotal = cartItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
  const shipping = 5.00;
  const total = subtotal + shipping;

  return (
    <div className="cart-page">
      <h1 className="cart-title">Your <span className="text-gradient">Cart</span></h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Button variant="primary" onClick={() => window.location.href = '#'}>Go to Shop</Button>
        </div>
      ) : (
        <div className="cart-container">
          {/* Cart Items List */}
          <div className="cart-items-list">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item glass">
                <div className="item-image-container">
                  <img src={item.imageUrl} alt={item.title} className="item-image" />
                </div>
                <div className="item-details">
                  <h3 className="item-title">{item.title}</h3>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                  
                  {/* Customizations */}
                  {item.customizations.length > 0 && (
                    <div className="item-customizations">
                      <p className="customization-title">Customizations:</p>
                      <ul>
                        {item.customizations.map((cust, index) => (
                          <li key={index}>{cust.name} (+${cust.price.toFixed(2)})</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
                <div className="item-actions">
                  <p className="item-total">${calculateItemTotal(item).toFixed(2)}</p>
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary glass">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button variant="primary" size="large" onClick={onProceedToCheckout}>Proceed to Checkout</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
