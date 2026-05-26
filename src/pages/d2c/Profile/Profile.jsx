import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import Avatar from '../../../components/Avatar/Avatar';
import Tabs from '../../../components/Tabs/Tabs';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import { useAuthStore } from '../../../store/useAuthStore';
import { useCartStore } from '../../../store/useCartStore';
import { d2cService } from '../../../services/d2cService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const addItemToCart = useCartStore((state) => state.addItem);

  const [customerOrders, setCustomerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadCustomerOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const res = await d2cService.getOrders();
      const list = res.orders || res.data?.orders || res.data || res || [];
      setCustomerOrders(list);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCustomerOrders();
    }
  }, [user]);

  // If not logged in, display login prompt
  if (!user) {
    return (
      <div className="profile-page anonymous-profile animate-fade-in">
        <div className="login-prompt-card">
          <span className="prompt-emoji">👤</span>
          <h2>Access Your Digital Coffee Profile</h2>
          <p>Login to track active kitchen orders, manage recurring weekly subscriptions, save custom beverage modifications, and earn loyalty points.</p>
          <Button variant="primary" size="large" onClick={() => navigate('/store/login')}>
            Log In / Sign Up 🔑
          </Button>
        </div>
      </div>
    );
  }

  const handleReorder = async (order) => {
    try {
      // Get full details of order to retrieve product IDs/slugs
      const details = await d2cService.getOrderDetail(order.id);
      const items = details.items || details.data?.items || [];
      
      // Add each item back to cart
      items.forEach((item) => {
        const baseProduct = {
          id: item.product_id || item.product_uuid,
          name: item.item_name || 'Coffee Bottle',
          price: item.unit_price,
          image_url: item.image_url
        };
        const variant = { id: 'default', name: 'Standard', price: item.unit_price };
        addItemToCart(baseProduct, variant, item.quantity || 1);
      });
      toast.success('All items added back to your cart! 🛒');
      navigate('/store/cart');
    } catch (err) {
      toast.error('Reorder failed: ' + err.message);
    }
  };

  const tabsList = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'history', label: 'Order History', icon: '📜', count: customerOrders.length },
    { id: 'favorites', label: 'Saved Drinks', icon: '⭐' },
    { id: 'addresses', label: 'Addresses', icon: '📍' }
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const activeOrder = customerOrders.find(o => o.status !== 'completed' && o.status !== 'cancelled');

  return (
    <div className="profile-page animate-fade-in">
      {/* Header with user card */}
      <div className="profile-hero-panel">
        <div className="user-hero-info">
          <Avatar name={user.name} size="large" status="online" color="primary" />
          <div className="user-text-details">
            <h1 className="profile-title">Welcome back, {user.name.split(' ')[0]} 👋</h1>
            <p className="profile-subtitle">Loyalty Level: <strong>Gold Bean Member</strong> | 🏆 450 pts</p>
          </div>
        </div>
        <button className="profile-logout-btn" onClick={handleLogout}>
          🚪 Log Out
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="profile-nav-tabs">
        <Tabs
          tabs={tabsList}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="segmented"
          fullWidth={true}
        />
      </div>

      {/* Dynamic contents based on tab selection */}
      <div className="profile-tab-content">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="overview-tab-grid animate-fade-in">
            {/* Quick stats */}
            <div className="overview-card-metric">
              <span className="metric-icon">🛍️</span>
              <div className="metric-text">
                <h3>{customerOrders.length}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            
            <div className="overview-card-metric">
              <span className="metric-icon">💖</span>
              <div className="metric-text">
                <h3>{customerOrders.length > 0 ? (customerOrders[0].items_summary?.split(',')[0] || 'Coffee Core') : 'Coffee Core'}</h3>
                <p>Most Ordered Blend</p>
              </div>
            </div>

            {/* Quick active order display */}
            <div className="overview-section-panel form-full-row">
              <h3>Active Order Tracking</h3>
              {activeOrder ? (
                <div className="active-order-tracking-box">
                  <div className="tracking-top">
                    <div>
                      <strong>Order #{activeOrder.order_number || activeOrder.id}</strong>
                      <p>Current Status: {activeOrder.status}</p>
                    </div>
                    <Badge variant={activeOrder.status === 'ready' ? 'success' : 'warning'}>
                      {activeOrder.status}
                    </Badge>
                  </div>
                  
                  <div className="tracking-progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: activeOrder.status === 'pending' ? '25%' :
                               activeOrder.status === 'in_progress' ? '60%' :
                               activeOrder.status === 'ready' ? '90%' : '100%' 
                      }}
                    ></div>
                  </div>
                  
                  <Button variant="outline" size="small" onClick={() => navigate('/store/success', { state: { orderId: activeOrder.id, total: activeOrder.total_amount, customerName: user.name } })}>
                    Open Prep Timeline →
                  </Button>
                </div>
              ) : (
                <p className="no-orders-prompt">No active kitchen orders. Craft something fresh from the catalog!</p>
              )}
            </div>
          </div>
        )}

        {/* 2. ORDER HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="history-tab-list animate-fade-in">
            {isLoadingOrders ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading history...</p>
            ) : customerOrders.length > 0 ? (
              customerOrders.map((order) => (
                <div key={order.id} className="history-order-card">
                  <div className="order-history-header">
                    <div>
                      <strong>Order #{order.order_number || order.id}</strong>
                      <span className="order-history-date">{formatDate(order.created_at || new Date().toISOString())}</span>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'success' :
                        order.status === 'cancelled' ? 'danger' :
                        order.status === 'refunded' ? 'info' : 'warning'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="order-history-items" style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>
                    <span>{order.items_summary || 'Custom Blend'}</span>
                  </div>

                  <div className="order-history-footer">
                    <span className="history-total">Total: <strong>{formatCurrency(order.total_amount)}</strong></span>
                    <div className="history-ctas">
                      <Button variant="outline" size="small" onClick={() => handleReorder(order)}>
                        Reorder 🔄
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-history-box">
                <span>📜</span>
                <p>No past order logs found in database matching {user.email}.</p>
                <Button variant="primary" size="medium" onClick={() => navigate('/store/catalog')}>
                  Order Your First Bottle
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 3. FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <div className="favorites-tab-grid animate-fade-in">
            <div className="favorite-drink-card">
              <span className="fav-star">⭐</span>
              <h3>Vikram's Monday Fuel</h3>
              <p>Vanilla Cold Brew with Oat Milk, regular sugar, extra ice.</p>
              <Button variant="primary" size="small" onClick={() => {
                toast.success('Favorite Fuel added to cart!');
              }}>
                Add to Cart
              </Button>
            </div>
            
            <div className="favorite-drink-card">
              <span className="fav-star">⭐</span>
              <h3>Afternoon Espresso Rush</h3>
              <p>Double Shot Hot Cappuccino with Coconut Milk, light chocolate dust.</p>
              <Button variant="primary" size="small" onClick={() => {
                toast.success('Espresso Rush added to cart!');
              }}>
                Add to Cart
              </Button>
            </div>
          </div>
        )}

        {/* 4. ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <div className="addresses-tab-grid animate-fade-in">
            <div className="address-item-card">
              <span className="address-badge-tag">HOME</span>
              <p>Flat 402, Oakwood Residency, 27th Main HSR Layout, Bengaluru, 560102</p>
              <span className="address-actions-lbl">Default Address</span>
            </div>
            
            <div className="address-item-card">
              <span className="address-badge-tag office">OFFICE</span>
              <p>Digital Tech Park, Block B 3rd Floor, Indiranagar, Bengaluru, 560038</p>
              <span className="address-actions-lbl edit">Edit Address</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
