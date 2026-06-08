import React, { useState } from 'react';
import './Layout.css';
import CMS from '../CMS/CMS'; // Import the moved CMS component
import Orders from '../Orders/Orders'; // Import the Orders component
import Inventory from '../Inventory/Inventory'; // Import the Inventory component
import Ingredients from '../Ingredients/Ingredients'; // Import the Ingredients component
import Menu from '../Menu/Menu'; // Import the Menu component
import Customers from '../Customers/Customers'; // Import the Customers component
import Dashboard from '../Dashboard/Dashboard'; // Import the Dashboard component
import Roles from '../Roles/Roles'; // Import the new Roles component

const Layout = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'orders', label: 'Orders' },
    { key: 'menu', label: 'Menu' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'ingredients', label: 'Ingredients' },
    { key: 'customers', label: 'Customers' },
    { key: 'roles', label: 'Roles' },
    { key: 'cms', label: 'Marketing' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>TOOF · Admin</h2>
        </div>
        <ul className="sidebar-nav">
          {navItems.map(item => (
            <li
              key={item.key}
              className={currentTab === item.key ? 'active' : ''}
              onClick={() => setCurrentTab(item.key)}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <p>Signed in as Admin</p>
          <button className="logout-btn">Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="content-header">
          <h1>{currentTab.replace('_', ' ')}</h1>
          <div className="user-profile">
            <span style={{ fontSize: '0.85rem', cursor: 'pointer' }}>🔔</span>
            <div className="avatar">A</div>
          </div>
        </header>

        <div className="content-area">
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'orders' && <Orders />}
          {currentTab === 'menu' && <Menu />}
          {currentTab === 'inventory' && <Inventory />}
          {currentTab === 'ingredients' && <Ingredients />}
          {currentTab === 'customers' && <Customers />}
          {currentTab === 'roles' && <Roles />}
          {currentTab === 'cms' && <CMS />}
          {currentTab === 'settings' && <div className="placeholder-view">Settings — Coming Soon</div>}
        </div>
      </div>
    </div>
  );
};

export default Layout;
