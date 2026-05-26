import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import AdminPageErrorBoundary from '../components/AdminPageErrorBoundary/AdminPageErrorBoundary';
import './AdminLayout.css';
import { t } from '../utils/i18n';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadNotifications = useNotificationStore((state) => state.getUnreadCount());
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard Overview';
    if (path.includes('/admin/orders')) return 'Order Management';
    if (path.includes('/admin/menu')) return 'Beverage & Product Menu';
    if (path.includes('/admin/inventory')) return 'Real-Time Inventory';
    if (path.includes('/admin/ingredients')) return 'Raw Ingredients Catalog';
    if (path.includes('/admin/customers')) return 'CRM & Customer Directory';
    if (path.includes('/admin/roles')) return 'RBAC Permissions Matrix';
    if (path.includes('/admin/cms')) return 'Storefront CMS';
    if (path.includes('/admin/recipe-engine')) return 'Visual Recipe Builder';
    if (path.includes('/admin/analytics')) return 'Business Performance Analytics';
    if (path.includes('/admin/notifications')) return 'Broadcast Templates';
    if (path.includes('/admin/stores')) return 'Multi-Store Franchises';
    if (path.includes('/admin/financials')) return 'GST & Accounting Reports';
    if (path.includes('/admin/activity-log')) return 'System Security Audit Trail';
    return 'Admin command center';
  };

  return (
    <div className={`admin-layout-new ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {/* Sidebar Panel */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Link to="/admin" className="brand-logo">
            <span className="logo-icon">☕</span>
            <span className="logo-text">{t('adminLayout.logoText', 'Digital Admin')}</span>
          </Link>
          <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-menu">
          <NavLink to="/admin" end className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">📊</span>
            <span className="menu-text">{t('adminLayout.menuDashboard', 'Dashboard')}</span>
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">🛍️</span>
            <span className="menu-text">{t('adminLayout.menuOrders', 'Orders')}</span>
          </NavLink>
          <NavLink to="/admin/menu" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">☕</span>
            <span className="menu-text">{t('adminLayout.menuMenu', 'Menu')}</span>
          </NavLink>
          <NavLink to="/admin/recipe-engine" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">🧬</span>
            <span className="menu-text">{t('adminLayout.menuRecipeEngine', 'Recipe Engine')}</span>
          </NavLink>
          <NavLink to="/admin/inventory" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">📦</span>
            <span className="menu-text">{t('adminLayout.menuInventory', 'Inventory')}</span>
          </NavLink>
          <NavLink to="/admin/ingredients" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">🌿</span>
            <span className="menu-text">{t('adminLayout.menuIngredients', 'Ingredients')}</span>
          </NavLink>
          <NavLink to="/admin/customers" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">👥</span>
            <span className="menu-text">{t('adminLayout.menuCustomers', 'Customers')}</span>
          </NavLink>
          <NavLink to="/admin/roles" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">🔑</span>
            <span className="menu-text">{t('adminLayout.menuRoles', 'Roles & Access')}</span>
          </NavLink>
          <NavLink to="/admin/analytics" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">📈</span>
            <span className="menu-text">{t('adminLayout.menuAnalytics', 'Analytics')}</span>
          </NavLink>
          <NavLink to="/admin/notifications" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">🔔</span>
            <span className="menu-text">{t('adminLayout.menuNotifications', 'Notifications')}</span>
          </NavLink>
          <NavLink to="/admin/stores" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">🏢</span>
            <span className="menu-text">{t('adminLayout.menuStores', 'Store Manager')}</span>
          </NavLink>
          <NavLink to="/admin/financials" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">💸</span>
            <span className="menu-text">{t('adminLayout.menuFinancials', 'Financials')}</span>
          </NavLink>
          <NavLink to="/admin/cms" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">🖥️</span>
            <span className="menu-text">{t('adminLayout.menuCms', 'CMS Content')}</span>
          </NavLink>
          <NavLink to="/admin/activity-log" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <span className="menu-icon">📜</span>
            <span className="menu-text">{t('adminLayout.menuActivityLog', 'Audit Log')}</span>
          </NavLink>
        </nav>

        <div className="sidebar-profile">
          <div className="profile-details">
            <div className="profile-avatar">A</div>
            <div className="profile-info">
              <span className="profile-user-name">{user?.name || 'Super Admin'}</span>
              <span className="profile-user-role">{user?.role || 'Admin'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="admin-main-panel">
        <header className="admin-panel-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              ☰
            </button>
            <h1 className="header-page-title">{getPageTitle()}</h1>
          </div>

          <div className="header-right">
            <div className="store-selector">
              <span className="store-icon">📍</span>
              <select className="store-dropdown-select">
                <option>{t('adminLayout.storeAll', 'All Stores (Bengaluru)')}</option>
                <option>{t('adminLayout.storeKoramangala', 'Koramangala Store')}</option>
                <option>{t('adminLayout.storeHsr', 'HSR Layout Store')}</option>
                <option>{t('adminLayout.storeIndiranagar', 'Indiranagar Store')}</option>
              </select>
            </div>

            <div className="header-notifications">
              <Link to="/admin/notifications" className="notif-badge-trigger">
                🔔
                {unreadNotifications > 0 && <span className="notif-red-dot">{unreadNotifications}</span>}
              </Link>
            </div>

            <div className="header-profile-avatar">A</div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="admin-panel-content">
          <AdminPageErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </AdminPageErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
