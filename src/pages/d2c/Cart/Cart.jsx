import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Cart.css';
import Button from '../../../components/Button/Button';
import { useCartStore } from '../../../store/useCartStore';
import { formatCurrency } from '../../../utils/formatters';
import { coupons } from '../../../data/mockData';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscount,
    getTax,
    getTotal,
    deliveryFee
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    const result = applyCoupon(couponCode);
    if (result.success) {
      toast.success(result.message);
      setCouponCode('');
    } else {
      toast.error(result.message);
    }
  };

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax();
  const total = getTotal();

  return (
    <div className="cart-page animate-fade-in">
      <h1 className="cart-title">Cart</h1>

      {items.length === 0 ? (
        <div className="empty-cart-state">
          <span className="empty-emoji">🛒</span>
          <h2>Your cart is empty</h2>
          <p>You haven't added any delicious blends or fresh coffee concentrates yet.</p>
          <Button variant="primary" size="large" onClick={() => navigate('/store/catalog')}>
            Explore Menu Catalog 📖
          </Button>
        </div>
      ) : (
        <div className="cart-container">
          {/* Items listing */}
          <div className="cart-left-col">
            <div className="cart-items-list">
              {items.map((item) => (
                <div key={item.cartItemId} className="cart-item">
                  <div className="item-image-container">
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.title} 
                      className="item-image" 
                    />
                  </div>
                  
                  <div className="item-details">
                    <h3 className="item-title">{item.product.title}</h3>
                    <span className="item-variant-badge">{item.variant.name}</span>
                    <p className="item-unit-price">{formatCurrency(item.price)}</p>
                    
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>-</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                    </div>
                  </div>

                  <div className="item-actions">
                    <span className="item-total-price">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button 
                      className="remove-btn" 
                      onClick={() => {
                        removeItem(item.cartItemId);
                        toast.success('Item removed from cart.');
                      }}
                    >
                      Remove ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Checkout calculations summary */}
          <div className="cart-right-col">
            <div className="cart-summary">
                <h2 className="summary-title">Summary</h2>
              
              <div className="summary-calculations">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                <div className="summary-row">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Delivery Charge</span>
                  <span>{subtotal > 0 ? formatCurrency(deliveryFee) : formatCurrency(0)}</span>
                </div>

                <div className="summary-divider"></div>
                
                <div className="summary-row total-row">
                  <span>Total</span>
                  <span className="total-val">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="coupon-form">
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="coupon-input"
                />
                <Button variant="secondary" size="medium" disabled={!couponCode.trim()}>
                  Apply
                </Button>
              </form>

              {appliedCoupon && (
                <div className="active-coupon-badge">
                  <span className="badge-details">
                    🎟️ <strong>{appliedCoupon.code}</strong> Applied (-{appliedCoupon.type === 'percentage' ? `${appliedCoupon.discount}%` : formatCurrency(appliedCoupon.discount)})
                  </span>
                  <button type="button" onClick={removeCoupon} className="remove-coupon-btn">
                    Remove
                  </button>
                </div>
              )}

              {/* Available Coupons */}
              <div className="coupons-hint-box">
                <span className="hint-title">Coupon Codes:</span>
                <ul>
                  {coupons.map((c) => (
                    <li key={c.code} onClick={() => setCouponCode(c.code)}>
                      <strong>{c.code}</strong>: {c.type === 'percentage' ? `${c.discount}%` : `₹${c.discount}`} off (Min ₹{c.minOrder})
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                variant="primary" 
                size="large" 
                fullWidth={true}
                onClick={() => navigate('/store/checkout')}
              >
                  Checkout →
              </Button>
              
              <Link to="/store/catalog" className="continue-shopping-link">
                ← Back to Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
