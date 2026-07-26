import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import Dropdown from '../../../components/Dropdown/Dropdown';
import { useCartStore } from '../../../store/useCartStore';
import { useOrderStore } from '../../../store/useOrderStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, getDiscount, getTax, getTotal, clearCart, deliveryFee } = useCartStore();
  const placeOrder = useOrderStore((state) => state.placeOrder);
  const user = useAuthStore((state) => state.user);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, cod
  const [upiMethod, setUpiMethod] = useState('qr'); // qr, vpa
  const [vpaAddress, setVpaAddress] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
  const [placingOrder, setPlacingOrder] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const tax = getTax();
  const total = getTotal();

  // If cart is empty, redirect back
  React.useEffect(() => {
    if (items.length === 0 && !placingOrder) {
      navigate('/cart');
    }
  }, [items, navigate, placingOrder]);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCardChange = (field, val) => {
    setCardData((prev) => ({ ...prev, [field]: val }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toast.error('Please fill in all required fields (Name, Phone, Address).');
      return;
    }

    if (paymentMethod === 'upi' && upiMethod === 'vpa' && !vpaAddress.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g. name@okhdfc).');
      return;
    }

    if (paymentMethod === 'card' && (cardData.number.length < 12 || !cardData.expiry || cardData.cvv.length < 3)) {
      toast.error('Please enter valid Credit/Debit card details.');
      return;
    }

    setPlacingOrder(true);
    toast.loading('Processing secure payment...');

    // Simulate payment transaction
    setTimeout(() => {
      toast.dismiss();
      
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = {
        id: orderId,
        customer: formData.name,
        email: formData.email || 'guest@digitalcoffee.com',
        items: items.map((i) => ({
          name: `${i.product.title} (${i.variant.name})`,
          qty: i.quantity,
          price: i.price
        })),
        total: total,
        status: 'Pending',
        source: 'D2C',
        time: 'Just now',
        createdAt: new Date().toISOString(),
        paymentMethod: paymentMethod.toUpperCase(),
        address: formData.address,
        notes: formData.notes
      };

      // Place order in KDS & admin logs
      placeOrder(newOrder);
      
      toast.success('Payment verified! Order placed successfully. ☕');
      
      // Clear cart
      clearCart();
      
      // Redirect to success page
      navigate('/success', { state: { orderId, total, customerName: formData.name } });
    }, 1500);
  };

  return (
    <div className="checkout-page animate-fade-in">
      <div className="checkout-back-header">
        <button className="back-btn" onClick={() => navigate('/cart')}>
          ← Back to Cart
        </button>
        <h1 className="checkout-title">Secure <span className="text-gradient">Checkout</span></h1>
      </div>

      <div className="checkout-grid">
        {/* Left billing & payment column */}
        <form onSubmit={handlePlaceOrder} className="checkout-left-col">
          
          {/* Shipping Form */}
          <div className="checkout-section-panel">
            <h2>📍 Delivery & Contact Details</h2>
            <div className="shipping-form-grid">
              <Input
                label="Full Name *"
                placeholder="Vikram Dev"
                value={formData.name}
                onChange={(val) => handleInputChange('name', val)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="vikram@gmail.com"
                value={formData.email}
                onChange={(val) => handleInputChange('email', val)}
              />
              <Input
                label="Phone Number *"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(val) => handleInputChange('phone', val)}
                required
              />
              <Input
                label="Delivery Address *"
                placeholder="Flat No, Wing, Society, Area, Bengaluru"
                value={formData.address}
                onChange={(val) => handleInputChange('address', val)}
                required
              />
              <div className="form-full-row">
                <Input
                  label="Special Preparation / Delivery Notes"
                  placeholder="E.g., Please knock door, ring bell, leave at gate, or extra hot."
                  value={formData.notes}
                  onChange={(val) => handleInputChange('notes', val)}
                />
              </div>
            </div>
          </div>



          <Button
            variant="primary"
            size="large"
            fullWidth={true}
            type="submit"
            disabled={placingOrder}
          >
            {placingOrder ? 'Processing Payment...' : `Pay & Place Order (${formatCurrency(total)}) ✨`}
          </Button>

        </form>

        {/* Right order summaries list */}
        <div className="checkout-right-col">
          <div className="checkout-summary-panel">
            <h3>Cart Summary</h3>
            <div className="checkout-summary-items">
              {items.map((item) => (
                <div key={item.cartItemId} className="summary-item-row">
                  <div className="summary-item-left">
                    <span className="qty-tag">{item.quantity}x</span>
                    <span className="item-name">{item.product.title} ({item.variant.name})</span>
                  </div>
                  <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="summary-calculations">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              
              {discount > 0 && (
                <div className="summary-row discount-row">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              
              <div className="summary-row">
                <span>GST (18%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              
              <div className="summary-row">
                <span>Delivery Charge</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>

              <div className="summary-divider"></div>
              
              <div className="summary-row total-row">
                <span>Grand Total</span>
                <span className="total-val">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="trust-indicator-box">
              🔒 256-Bit SSL Encrypted secure server transactions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
