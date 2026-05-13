import React from 'react';
import './Card.css';
import Button from '../Button/Button';

const Card = ({ title, description, price, imageUrl, actionText = "Add to Cart", onAction }) => {
  return (
    <div className="card glass">
      <div className="card-image-container">
        <img src={imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'} alt={title} className="card-image" />
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        {description && <p className="card-description">{description}</p>}
        <div className="card-footer">
          <span className="card-price">{price}</span>
          <Button variant="primary" size="small" onClick={onAction}>{actionText}</Button>
        </div>
      </div>
    </div>
  );
};

export default Card;
