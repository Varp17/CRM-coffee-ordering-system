import React from 'react';
import './Cart.css'; // Sharing styles for simplicity
import Button from '../../../components/Button/Button';

const Checkout = ({ onBackToCart }) => {
  const subtotal = 42.97; // Mock data
  const shipping = 5.00;
  const total = subtotal + shipping;

  return (
    <div className="cart-page checkout-page">
      <h1 className="cart-title">Secure <span className="text-gradient">Checkout</span></h1>

      <div className="cart-container">
        {/* Checkout Form */}
        <div className="checkout-form glass" style={{ padding: '30px', flex: '2' }}>
          <h2 className="section-title" style={{ marginBottom: '20px' }}>Shipping & Payment</h2>
          <form className="form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Full Name</label>
              <input type="text" placeholder="John Doe" style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--glass-border)', 
                padding: '12px', 
                borderRadius: '8px',
                color: 'var(--color-text)'
              }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Address</label>
              <input type="text" placeholder="123 Coffee Lane" style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--glass-border)', 
                padding: '12px', 
                borderRadius: '8px',
                color: 'var(--color-text)'
              }} />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Card Details</label>
              <input type="text" placeholder="xxxx-xxxx-xxxx-xxxx" style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--glass-border)', 
                padding: '12px', 
                borderRadius: '8px',
                color: 'var(--color-text)'
              }} />
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="cart-summary glass" style={{ flex: '1' }}>
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
          <Button variant="primary" size="large" onClick={() => alert('Order Placed Successfully!')}>Pay Now</Button>
          <button className="back-btn" onClick={onBackToCart} style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--color-text-muted)', 
            marginTop: '15px', 
            cursor: 'pointer',
            textDecoration: 'underline'
          }}>
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
