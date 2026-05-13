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

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="sidebar glass">
        <div className="sidebar-header">
          <h2 className="text-gradient">Coffee Admin</h2>
        </div>
        <ul className="sidebar-nav">
          <li className={currentTab === 'dashboard' ? 'active' : ''} onClick={() => setCurrentTab('dashboard')}>Dashboard</li>
          <li className={currentTab === 'orders' ? 'active' : ''} onClick={() => setCurrentTab('orders')}>Orders</li>
          <li className={currentTab === 'menu' ? 'active' : ''} onClick={() => setCurrentTab('menu')}>Menu</li>
          <li className={currentTab === 'inventory' ? 'active' : ''} onClick={() => setCurrentTab('inventory')}>Inventory</li>
          <li className={currentTab === 'ingredients' ? 'active' : ''} onClick={() => setCurrentTab('ingredients')}>Ingredients</li>
          <li className={currentTab === 'customers' ? 'active' : ''} onClick={() => setCurrentTab('customers')}>Customers</li>
          <li className={currentTab === 'roles' ? 'active' : ''} onClick={() => setCurrentTab('roles')}>Roles</li>
          <li className={currentTab === 'cms' ? 'active' : ''} onClick={() => setCurrentTab('cms')}>Website CMS</li>
          <li className={currentTab === 'settings' ? 'active' : ''} onClick={() => setCurrentTab('settings')}>Settings</li>
        </ul>
        <div className="sidebar-footer">
          <p>Logged in as Admin</p>
          <button className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="content-header glass">
          <h1>{currentTab.toUpperCase()}</h1>
          <div className="user-profile">
            <span>🔔</span>
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
          {currentTab === 'settings' && <div className="placeholder-view">Settings View</div>}
        </div>
      </div>
    </div>
  );
};

export default Layout;
