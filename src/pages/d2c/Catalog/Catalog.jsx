import React, { useState } from 'react';
import './Catalog.css';
import Card from '../../../components/Card/Card';

const Catalog = () => {
  const products = [
    { id: 1, title: 'Dark Roast Concentrate', description: 'Rich, bold, and smooth. Perfect for iced coffee and lattes.', price: '$12.99', category: 'Concentrates', imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
    { id: 2, title: 'Vanilla Infused Cold Brew', description: 'Smooth cold brew with a touch of natural Madagascar vanilla.', price: '$14.99', category: 'Cold Brew', imageUrl: 'https://images.unsplash.com/photo-1461023235402-278239b9b242?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
    { id: 3, title: 'Hazelnut Dream', description: 'Toasted hazelnut flavor blended with our signature roast.', price: '$13.99', category: 'Flavored', imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
    { id: 4, title: 'Caramel Macchiato Mix', description: 'Sweet caramel notes with a strong espresso base.', price: '$15.99', category: 'Concentrates', imageUrl: 'https://images.unsplash.com/photo-1572282823616-95e347895e64?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
    { id: 5, title: 'Espresso Blend', description: 'Fine ground espresso blend for a quick energy boost.', price: '$10.99', category: 'Beans', imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
    { id: 6, title: 'Mocha Magic', description: 'Chocolatey goodness mixed with premium coffee.', price: '$14.49', category: 'Flavored', imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }
  ];

  const categories = ['All', 'Concentrates', 'Cold Brew', 'Flavored', 'Beans'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1 className="catalog-title">Our <span className="text-gradient">Collection</span></h1>
        <p className="catalog-subtitle">Browse our premium coffee concentrates and blends.</p>
      </div>

      {/* Categories Filter */}
      <div className="categories-container">
        {categories.map(category => (
          <button 
            key={category}
            className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="catalog-grid">
        {filteredProducts.map(product => (
          <Card 
            key={product.id}
            title={product.title}
            description={product.description}
            price={product.price}
            imageUrl={product.imageUrl}
            onAction={() => alert(`Added ${product.title} to cart!`)}
          />
        ))}
      </div>
    </div>
  );
};

export default Catalog;
