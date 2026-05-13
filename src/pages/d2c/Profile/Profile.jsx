import React from 'react';
import './Profile.css';

const Profile = () => {
  const recentOrders = [
    { id: 1, title: 'Dark Roast Concentrate', date: '2026-05-10', price: '$12.99', status: 'Delivered' },
    { id: 2, title: 'Vanilla Infused Cold Brew', date: '2026-05-05', price: '$14.99', status: 'Delivered' }
  ];

  const topOrders = [
    { id: 1, title: 'Dark Roast Concentrate', count: 5, imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' },
    { id: 2, title: 'Hazelnut Dream', count: 3, imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">Welcome Back, <span className="text-gradient">Alex</span></h1>
        <p className="profile-subtitle">Manage your orders and preferences here.</p>
      </div>

      {/* Recent Orders Section */}
      <section className="profile-section">
        <h2 className="section-title">Recent Orders</h2>
        <div className="recent-orders-list">
          {recentOrders.map(order => (
            <div key={order.id} className="order-item glass">
              <div className="order-info">
                <h3>{order.title}</h3>
                <p>Ordered on: {order.date}</p>
              </div>
              <div className="order-meta">
                <span className="order-price">{order.price}</span>
                <span className="order-status">{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Orders / Favorites Section */}
      <section className="profile-section">
        <h2 className="section-title">Your Favorites</h2>
        <p className="section-subtitle">Most ordered items.</p>
        <div className="favorites-grid">
          {topOrders.map(item => (
            <div key={item.id} className="favorite-card glass">
              <img src={item.imageUrl} alt={item.title} className="favorite-image" />
              <div className="favorite-content">
                <h3>{item.title}</h3>
                <p>Ordered {item.count} times</p>
                <button className="reorder-btn">Order Again</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Profile;
