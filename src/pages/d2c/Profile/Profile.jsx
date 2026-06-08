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
import { customDrinkService } from '../../../services/customDrinks';
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
  const [favorites, setFavorites] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

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

  const loadFavorites = async () => {
    setIsLoadingFavorites(true);
    try {
      const res = await customDrinkService.list();
      const list = res.data || res || [];
      setFavorites(list);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const handleAddCustomToCart = (drink) => {
    try {
      const recipe = typeof drink.ingredients === 'string' ? JSON.parse(drink.ingredients) : drink.ingredients;
      
      const baseName = recipe.some(i => i.ingredient_id === 1) ? '50:50 Concentrate' :
                       recipe.some(i => i.ingredient_id === 3) ? '70:30 Concentrate' :
                       recipe.some(i => i.ingredient_id === 4) ? 'SIF Concentrate' :
                       recipe.some(i => i.ingredient_id === 46) ? 'Cascara Concentrate' :
                       recipe.some(i => i.ingredient_id === 2) ? '100% Arabica' : '50:50 Concentrate';
      const milkName = recipe.some(i => i.ingredient_id === 8) ? 'Dairy Milk' :
                       recipe.some(i => i.ingredient_id === 15) ? 'Condensed Milk' : 'No Milk';
      
      const customProduct = {
        id: drink.uuid,
        name: drink.name,
        image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&auto=format&fit=crop&q=88',
        description: `Customized base: ${baseName}, milk: ${milkName}`,
        base_price: parseFloat(drink.total_price),
        is_custom: true,
        customization: {
          base: baseName,
          milk: milkName,
          syrups: [],
          toppings: []
        }
      };
      
      const customVariant = {
        id: 'custom-variant',
        name: 'Regular',
        price: parseFloat(drink.total_price)
      };
      
      addItemToCart(customProduct, customVariant, 1);
      toast.success(`"${drink.name}" added to your cart! 🛒`);
    } catch (err) {
      toast.error('Failed to add custom drink to cart.');
    }
  };

  const handleShareCustomDrink = (drink) => {
    const shareUrl = `${window.location.origin}/store/custom?import=${drink.uuid}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard! Share it via WhatsApp or QR code! 🔗');
  };

  const handleDeleteCustomDrink = async (uuid) => {
    try {
      await customDrinkService.delete(uuid);
      toast.success('Custom drink removed from favorites.');
      loadFavorites();
    } catch (err) {
      toast.error('Failed to delete custom drink.');
    }
  };

  const getIngredientsText = (ingredients) => {
    try {
      const list = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
      if (!Array.isArray(list)) return 'Custom Blend';
      
      const mapping = {
        1: '50:50 Concentrate',
        2: '100% Arabica',
        3: '70:30 Concentrate',
        4: 'SIF Concentrate',
        8: 'Dairy Milk',
        11: 'Honey',
        12: 'Sugar Syrup',
        13: 'Jaggery Syrup',
        15: 'Condensed Milk',
        28: 'Whipped Cream',
        29: 'Chocolate Drizzle',
        45: 'Ice Cubes',
        46: 'Cascara Concentrate',
        47: 'Mint Tonic Water'
      };

      return list.map(i => mapping[i.ingredient_id] || `Ingredient #${i.ingredient_id}`).join(', ');
    } catch (e) {
      return 'Custom Blend';
    }
  };

  useEffect(() => {
    if (user) {
      loadCustomerOrders();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'favorites') {
      loadFavorites();
    }
  }, [user, activeTab]);

  // If not logged in, display login prompt
  if (!user) {
    return (
      <div className="profile-page anonymous-profile animate-fade-in">
        <div className="login-prompt-card">
          <span className="prompt-emoji">👤</span>
          <h2>Your Profile</h2>
          <p>Log in to view orders, saved drinks, and subscriptions.</p>
          <Button variant="primary" size="large" onClick={() => navigate('/store/login')}>
            Log In / Sign Up
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
    { id: 'history', label: 'Orders', icon: '📜', count: customerOrders.length },
    { id: 'favorites', label: 'Saved', icon: '⭐' },
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
            <h1 className="profile-title">Welcome, {user.name.split(' ')[0]}</h1>
            <p className="profile-subtitle">Gold Member · 450 pts</p>
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
            {isLoadingFavorites ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                Loading custom creations...
              </p>
            ) : favorites.length > 0 ? (
              favorites.map((drink) => (
                <div key={drink.uuid} className="favorite-drink-card">
                  <span className="fav-star">⭐</span>
                  <h3>{drink.name}</h3>
                  <p>{getIngredientsText(drink.ingredients)}</p>
                  <span className="favorite-drink-price">Total: {formatCurrency(drink.total_price)}</span>
                  <div className="favorite-ctas" style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button variant="primary" size="small" onClick={() => handleAddCustomToCart(drink)}>
                      Add to Cart 🛒
                    </Button>
                    <Button variant="outline" size="small" onClick={() => handleShareCustomDrink(drink)}>
                      Share Link 🔗
                    </Button>
                    <Button variant="danger" size="small" onClick={() => handleDeleteCustomDrink(drink.uuid)}>
                      Delete 🗑️
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-history-box" style={{ gridColumn: '1/-1' }}>
                <span>🧪</span>
                <p>No customized coffee creations found in your profile favorites yet.</p>
                <Button variant="primary" size="medium" onClick={() => navigate('/store/custom')}>
                  Build Your Custom Coffee ☕
                </Button>
              </div>
            )}
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
