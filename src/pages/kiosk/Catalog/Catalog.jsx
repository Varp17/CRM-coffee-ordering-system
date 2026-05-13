import React, { useState } from 'react';
import './Catalog.css';
import Button from '../../../components/Button/Button';
import Card from '../../../components/Card/Card';

const Catalog = ({ onBack, onLogin, onCreateCustom, onCheckout }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);

  const categories = ['All', 'Hot Coffee', 'Cold Coffee', 'Bakery', 'Merch'];

  const products = [
    { id: 1, name: 'Espresso', category: 'Hot Coffee', price: 150, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 2, name: 'Cappuccino', category: 'Hot Coffee', price: 200, image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 3, name: 'Iced Latte', category: 'Cold Coffee', price: 220, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba195c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 4, name: 'Cold Brew', category: 'Cold Coffee', price: 180, image: 'https://images.unsplash.com/photo-1461023235402-278239b9b249?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 5, name: 'Butter Croissant', category: 'Bakery', price: 120, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
    { id: 6, name: 'Chocolate Muffin', category: 'Bakery', price: 100, image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' },
  ];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="kiosk-catalog">
      <div className="catalog-sidebar">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="categories-list">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-main">
        <div className="catalog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Select Your Items</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" size="small" onClick={onCreateCustom}>Custom Drink</Button>
            <Button variant="secondary" size="small" onClick={onLogin}>Login</Button>
          </div>
        </div>
        <div className="products-grid">
          {filteredProducts.map(product => (
            <Card 
              key={product.id}
              title={product.name}
              price={`₹${product.price}`}
              imageUrl={product.image}
              actionText="Add"
              onAction={() => addToCart(product)}
            />
          ))}
        </div>
      </div>

      <div className="catalog-cart-summary glass">
        <h3>Your Order</h3>
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-msg">No items added yet</p>
          ) : (
            <ul>
              {cart.map((item, index) => (
                <li key={index}>
                  <span>{item.name}</span>
                  <span>₹{item.price}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="cart-total">
          <span>Total:</span>
          <span>₹{total}</span>
        </div>
        <Button variant="primary" size="large" disabled={cart.length === 0} onClick={() => onCheckout(cart, total)}>Checkout</Button>
      </div>
    </div>
  );
};

export default Catalog;
