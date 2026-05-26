import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './OrderSuccess.css';
import Button from '../../../components/Button/Button';
import Timeline from '../../../components/Timeline/Timeline';
import { formatCurrency } from '../../../utils/formatters';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract state, fallback to mock data
  const { orderId = 'ORD-3045', total = 1249, customerName = 'Valued Customer' } = location.state || {};

  const trackingTimeline = [
    { id: '1', title: 'Order Received & Confirmed 📝', description: 'Your order was successfully verified and routed to the kitchen.', status: 'completed', time: 'Just now', icon: '✅' },
    { id: '2', title: 'Kitchen Queue Assignment ☕', description: 'Assigned to HSR Layout Store barista station. Preparing brewing assembly.', status: 'current', time: 'Just now', icon: '👨‍🍳' },
    { id: '3', title: 'Beverage Brewing & Assembly ⏳', description: 'Brewing under 18-hour extraction standards, adding customized modifiers.', status: 'pending', time: '--:--', icon: '🔥' },
    { id: '4', title: 'Ready for Dispatch / Pickup 📍', description: 'Packaged securely in thermal safety boxes with KOT tags.', status: 'pending', time: '--:--', icon: '🛍️' }
  ];

  return (
    <div className="success-page animate-fade-in">
      <div className="success-card">
        {/* Animated Check */}
        <div className="success-check-wrapper">
          <div className="success-check-circle">
            <span className="success-check-icon">✓</span>
          </div>
        </div>

        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-subtitle">Thank you for your order, <strong>{customerName}</strong>. Digital Coffee baristas have received your request and started brewing.</p>

        {/* Info badges */}
        <div className="order-brief-badges">
          <div className="brief-badge">
            <span className="brief-label">Order Token</span>
            <span className="brief-val text-gradient">{orderId}</span>
          </div>
          <div className="brief-badge">
            <span className="brief-label">Paid Amount</span>
            <span className="brief-val">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* WhatsApp updates display box */}
        <div className="whatsapp-preview-box">
          <div className="wa-header">
            <span className="wa-dot online"></span>
            <strong>Digital Coffee Live Updates</strong>
          </div>
          <div className="wa-body">
            <p>💬 "Hi {customerName}! Your order <strong>{orderId}</strong> is confirmed. Track live prep status here: <span className="wa-link">dcoffee.in/t/{orderId.toLowerCase()}</span>. We'll alert you the moment it leaves the bar!"</p>
          </div>
        </div>

        {/* Timeline tracker */}
        <div className="success-timeline-section">
          <h3>Live Preparation Status</h3>
          <Timeline items={trackingTimeline} />
        </div>

        {/* CTAs */}
        <div className="success-actions">
          <Button variant="primary" size="large" onClick={() => navigate('/store')}>
            Return to Homepage 🏠
          </Button>
          <Button variant="outline" size="large" onClick={() => navigate('/store/profile')}>
            View Order History 👤
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
