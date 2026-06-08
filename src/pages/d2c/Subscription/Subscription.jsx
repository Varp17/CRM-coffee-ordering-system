import React, { useState, useEffect } from 'react';
import './Subscription.css';
import Button from '../../../components/Button/Button';
import Card from '../../../components/Card/Card';
import { d2cService } from '../../../services/d2cService';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { t } from '../../../utils/i18n';

const Subscription = () => {
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customPlan, setCustomPlan] = useState({
    frequency: 'Weekly',
    itemsCount: 4,
    itemType: 'Concentrates',
    deliveryDay: 'Monday',
  });

  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'builder'
  const [successPlan, setSuccessPlan] = useState(null);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res = await d2cService.getSubscriptions();
      const list = res.data || res || [];
      const mapped = list.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features) : []),
        popular: p.is_popular === 1 || p.is_popular === true || p.popular
      }));
      setSubscriptionPlans(mapped);
    } catch (err) {
      toast.error('Failed to load subscription plans: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const calculateCustomPrice = () => {
    let basePricePerBottle = 350;
    if (customPlan.itemType === 'Cold Brew') basePricePerBottle = 399;
    if (customPlan.itemType === 'Beans') basePricePerBottle = 450;

    let subtotal = basePricePerBottle * customPlan.itemsCount;
    // Apply discount based on frequency
    if (customPlan.frequency === 'Weekly') subtotal *= 0.85; // 15% off
    if (customPlan.frequency === 'Bi-weekly') subtotal *= 0.90; // 10% off

    return Math.round(subtotal);
  };

  const handleSubscribe = (planName, price) => {
    setSuccessPlan({
      name: planName,
      price: price,
      frequency: planName === 'Custom Plan' ? customPlan.frequency : 'Weekly',
      nextDelivery: `Next ${planName === 'Custom Plan' ? customPlan.deliveryDay : 'Monday'}`,
    });
    toast.success(`Subscribed to ${planName} successfully!`);
  };

  if (isLoading && subscriptionPlans.length === 0) {
    return (
      <div className="subscription-page flex-center animate-pulse" style={{ height: '70vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('subscription.loading', 'Loading subscription plans...')}</p>
      </div>
    );
  }

  return (
    <div className="subscription-page animate-fade-in container">
      {/* Hero Header */}
      <header className="subscription-hero">
        <span className="badge-promo text-gradient">{t('subscription.heroBadge', 'Subscribe & Save')}</span>
        <h1 className="hero-title">{t('subscription.heroTitle', 'Coffee, Delivered Weekly')}</h1>
        <p className="hero-desc">
          {t('subscription.heroDesc', 'Choose a plan or build your own. Pause anytime. Up to 15% off.')}
        </p>

        {/* Tab Toggle */}
        <div className="subscription-tabs">
          <button
            className={`sub-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => { setActiveTab('plans'); setSuccessPlan(null); }}
          >
            {t('subscription.tabCurated', 'Plans')}
          </button>
          <button
            className={`sub-tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => { setActiveTab('builder'); setSuccessPlan(null); }}
          >
            {t('subscription.tabBuilder', 'Custom Plan')}
          </button>
        </div>
      </header>

      {successPlan ? (
        <div className="success-sub-card  animate-scale-in">
          <div className="success-icon-circle">✓</div>
          <h2>{t('subscription.successTitle', 'Subscription Activated! 🎉')}</h2>
          <p>{t('subscription.successDesc', 'Your specialty coffee journey with Digital Coffee has officially begun.')}</p>
          <div className="sub-summary-grid">
            <div className="summary-row">
              <span>{t('subscription.summaryPlan', 'Plan Selected:')}</span>
              <strong>{successPlan.name}</strong>
            </div>
            <div className="summary-row">
              <span>{t('subscription.summaryPrice', 'Price:')}</span>
              <strong>{formatCurrency(successPlan.price)} / {successPlan.frequency.toLowerCase()}</strong>
            </div>
            <div className="summary-row">
              <span>{t('subscription.summaryDelivery', 'First Delivery:')}</span>
              <strong>{successPlan.nextDelivery}</strong>
            </div>
            <div className="summary-row">
              <span>{t('subscription.summaryAddress', 'Delivery Address:')}</span>
              <span>{t('subscription.savedAddress', 'Saved Profile Address')}</span>
            </div>
          </div>
          <p className="sub-helper-text">{t('subscription.successHelper', 'You can pause, skip, or cancel this plan at any time from your Profile dashboard with zero penalty.')}</p>
          <Button variant="primary" size="large" onClick={() => setSuccessPlan(null)}>
            {t('subscription.backToSubs', 'Back to Subscriptions')}
          </Button>
        </div>
      ) : activeTab === 'plans' ? (
        /* Curated plans grid */
        <div className="plans-grid">
          {subscriptionPlans.map((plan) => (
            <Card
              key={plan.id || plan.uuid}
              className={`plan-card ${plan.popular ? 'plan-popular' : ''}`}
              elevation={plan.popular ? 'high' : 'low'}
            >
              {plan.popular && <span className="popular-ribbon">{t('subscription.popularLabel', 'Bestseller 🔥')}</span>}
              <div className="plan-header">
                <h3>{plan.name} {t('subscription.planLabel', 'Plan')}</h3>
                <div className="plan-price-row">
                  <span className="price-num">{formatCurrency(plan.price)}</span>
                  <span className="price-unit">/{plan.frequency.toLowerCase()}</span>
                </div>
                <p className="plan-items">{plan.items}</p>
              </div>

              <hr className="divider" />

              <ul className="plan-features">
                {plan.features.map((feat, idx) => (
                  <li key={idx}>✅ {feat}</li>
                ))}
              </ul>

              <div className="plan-footer">
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  fullWidth={true}
                  onClick={() => handleSubscribe(`${plan.name} Plan`, plan.price)}
                >
                  {t('subscription.subscribeCta', 'Subscribe Now 🚀')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Custom Plan Builder Workspace */
        <div className="custom-builder-workspace  animate-slide-up">
          <div className="builder-controls">
            <h3>{t('subscription.configTitle', 'Configure Your Delivery')}</h3>
            
            {/* Frequency options */}
            <div className="builder-group">
              <label>{t('subscription.deliveryFreq', 'Delivery Frequency')}</label>
              <div className="options-row">
                {['Weekly', 'Bi-weekly', 'Monthly'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    className={`builder-option ${customPlan.frequency === freq ? 'active' : ''}`}
                    onClick={() => setCustomPlan({ ...customPlan, frequency: freq })}
                  >
                    {freq}
                    {freq === 'Weekly' && <span className="discount-tag">{t('subscription.save15', 'Save 15%')}</span>}
                    {freq === 'Bi-weekly' && <span className="discount-tag">{t('subscription.save10', 'Save 10%')}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Coffee Type */}
            <div className="builder-group">
              <label>{t('subscription.selectCategory', 'Select Beverage Category')}</label>
              <div className="options-row">
                {['Concentrates', 'Cold Brew', 'Beans'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`builder-option ${customPlan.itemType === type ? 'active' : ''}`}
                    onClick={() => setCustomPlan({ ...customPlan, itemType: type })}
                  >
                    {type === 'Concentrates' && '☕ Concentrates'}
                    {type === 'Cold Brew' && '🧊 Ready Cold Brew'}
                    {type === 'Beans' && '🫘 Whole Beans'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Slider */}
            <div className="builder-group">
              <div className="label-row">
                <label>{t('subscription.itemsPerShipment', 'Items per Shipment')}</label>
                <span className="builder-qty-label">{customPlan.itemsCount} Items</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="2"
                value={customPlan.itemsCount}
                onChange={(e) => setCustomPlan({ ...customPlan, itemsCount: parseInt(e.target.value) })}
                className="builder-slider"
              />
              <div className="slider-labels">
                <span>{t('subscription.qtyMinLabel', '2 bottles')}</span>
                <span>{t('subscription.qtyMidLabel', '6 bottles')}</span>
                <span>{t('subscription.qtyMaxLabel', '12 bottles')}</span>
              </div>
            </div>

            {/* Preferred Delivery Day */}
            <div className="builder-group">
              <label>{t('subscription.deliveryDay', 'Preferred Delivery Day')}</label>
              <div className="options-row">
                {['Monday', 'Wednesday', 'Saturday'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`builder-option ${customPlan.deliveryDay === day ? 'active' : ''}`}
                    onClick={() => setCustomPlan({ ...customPlan, deliveryDay: day })}
                  >
                    📅 {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing panel side */}
          <div className="builder-preview-panel">
            <h3 className="preview-title">{t('subscription.summaryTitle', 'Plan Summary')}</h3>
            <div className="preview-card">
              <div className="preview-item">
                <span>{t('subscription.summaryShipment', 'Shipment:')}</span>
                <strong>{customPlan.itemsCount}x {customPlan.itemType}</strong>
              </div>
              <div className="preview-item">
                <span>{t('subscription.summaryFrequency', 'Frequency:')}</span>
                <strong>{t('subscription.everyPrefix', 'Every ')}{customPlan.frequency === 'Weekly' ? 'Week' : customPlan.frequency === 'Bi-weekly' ? '2 Weeks' : 'Month'}</strong>
              </div>
              <div className="preview-item">
                <span>{t('subscription.summaryDispatch', 'Dispatched on:')}</span>
                <strong>{t('subscription.everyPrefix', 'Every ')}{customPlan.deliveryDay}</strong>
              </div>
              <div className="preview-item">
                <span>{t('subscription.summaryShipping', 'Shipping:')}</span>
                <strong className="text-free">{t('subscription.freeShipping', 'FREE 🚚')}</strong>
              </div>
              <hr />
              <div className="preview-total-row">
                <span>{t('subscription.pricePerDelivery', 'Price per delivery:')}</span>
                <span className="total-val">{formatCurrency(calculateCustomPrice())}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="large"
              fullWidth={true}
              onClick={() => handleSubscribe('Custom Plan', calculateCustomPrice())}
            >
              {t('subscription.activateCustom', 'Activate Custom Plan 🚀')}
            </Button>
            <p className="preview-footer-note">{t('subscription.footerNote', '🔒 No long contracts. Modify ingredients or cancel instantly from the dashboard.')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
