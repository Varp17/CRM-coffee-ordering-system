import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Checkout.css';
import { formatCurrency } from '../../../utils/formatters';

const Checkout = ({ cart = [], total = 0, onBack, onComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onComplete(); // Proceeds to place the order and routes to /kiosk/token
    }, 2000);
  };

  const transitionEase = [0.16, 1, 0.3, 1];

  return (
    <div className="kiosk-checkout">
      <motion.div 
        className="checkout-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: transitionEase }}
      >
        <h2>CHECKOUT</h2>

        <div className="order-summary-section">
          <h3>ORDER ANALYSIS</h3>
          <ul className="cart-items-list">
            {cart.map((item, index) => (
              <li key={index} className="cart-item">
                <span>{item.name.toUpperCase()} {item.qty ? `×${item.qty}` : ''}</span>
                <span>{formatCurrency(item.price || 0)}</span>
              </li>
            ))}
            {cart.length === 0 && (
              <li className="cart-item" style={{justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)'}}>
                CART IS EMPTY
              </li>
            )}
          </ul>
          <div className="total-row">
            <span>SUBTOTAL:</span>
            <span className="total-price">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="payment-section">
          <h3>PAYMENT METHOD</h3>
          <div className="payment-options">
            <button 
              className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <span>CREDIT / DEBIT CARD</span>
              <span>[ TAP / INSERT ]</span>
            </button>
            <button 
              className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('upi')}
            >
              <span>UPI / SCANNABLE QR</span>
              <span>[ SMARTPHONE ]</span>
            </button>
          </div>
        </div>

        <div className="build-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button className="step-nav-btn" onClick={onBack} disabled={isProcessing}>
            RETURN
          </button>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            className="add-order-btn" 
            onClick={handlePay}
            disabled={isProcessing || cart.length === 0}
          >
            {isProcessing ? 'PROCESSING...' : `PAY ${formatCurrency(total)}`}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Checkout;
