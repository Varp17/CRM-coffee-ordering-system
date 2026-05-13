import React from 'react';
import './Home.css';
import Button from '../../../components/Button/Button';
import Card from '../../../components/Card/Card';

const Home = () => {
  const featuredProducts = [
    {
      id: 1,
      title: 'Dark Roast Concentrate',
      description: 'Rich, bold, and smooth. Perfect for iced coffee and lattes.',
      price: '$12.99',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 2,
      title: 'Vanilla Infused Cold Brew',
      description: 'Smooth cold brew with a touch of natural Madagascar vanilla.',
      price: '$14.99',
      imageUrl: 'https://images.unsplash.com/photo-1461023235402-278239b9b242?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    },
    {
      id: 3,
      title: 'Hazelnut Dream',
      description: 'Toasted hazelnut flavor blended with our signature roast.',
      price: '$13.99',
      imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero glow-effect">
        <div className="hero-content">
          <h1 className="hero-title">Experience Coffee <span className="text-gradient">Redefined</span></h1>
          <p className="hero-subtitle">Premium concentrates and custom drinks delivered to your door. Craft your perfect cup at home.</p>
          <div className="hero-buttons">
            <Button variant="primary" size="large">Shop Now</Button>
            <Button variant="secondary" size="large">Customize Drink</Button>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Featured Concentrates</h2>
          <p className="section-subtitle">Our most popular blends, crafted for perfection.</p>
        </div>
        <div className="products-grid">
          {featuredProducts.map(product => (
            <Card 
              key={product.id}
              title={product.title}
              description={product.description}
              price={product.price}
              imageUrl={product.imageUrl}
              onAddToCart={() => alert(`Added ${product.title} to cart!`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
