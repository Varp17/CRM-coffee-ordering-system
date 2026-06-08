/**
 * TopHeader.jsx — Enterprise sticky top header
 * Features: Breadcrumb, store selector, notifications, theme toggle, user profile
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, ChevronDown, MapPin,
  AlertTriangle, Package, ShoppingCart, LogOut, Settings, User,
  ChevronRight,
} from 'lucide-react';
import useSidebarStore from '../../store/useSidebarStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { ALL_MENU_ITEMS, findMenuItemByPath } from '../../constants/menuConfig';
import './TopHeader.css';

// ── Breadcrumb auto-generation ───────────────────────────────
const Breadcrumb = () => {
  const location = useLocation();
  const item = findMenuItemByPath(location.pathname);

  return (
    <nav className="th-breadcrumb" aria-label="Breadcrumb">
      <Link to="/admin" className="th-bc-link">Admin</Link>
      {item && (
        <>
          <ChevronRight size={12} className="th-bc-sep" />
          {item.groupLabel && (
            <>
              <span className="th-bc-group">{item.groupLabel}</span>
              <ChevronRight size={12} className="th-bc-sep" />
            </>
          )}
          <span className="th-bc-current">{item.label}</span>
        </>
      )}
    </nav>
  );
};

// ── Notification dropdown ────────────────────────────────────
const NotificationDropdown = ({ onClose }) => {
  const orders = useOrderStore((s) => s.orders);
  const pendingOrders = (orders || []).filter((o) => o.status === 'pending').slice(0, 5);

  return (
    <div className="th-notif-dropdown" role="dialog" aria-label="Notifications">
      <div className="th-notif-header">
        <span>Notifications</span>
        <button className="th-notif-close" onClick={onClose}>Done</button>
      </div>
      {pendingOrders.length === 0 ? (
        <div className="th-notif-empty">
          <Bell size={24} opacity={0.2} />
          <p>No new notifications</p>
        </div>
      ) : (
        <div className="th-notif-list">
          {pendingOrders.map((order) => (
            <Link
              key={order.id}
              to="/admin/orders"
              className="th-notif-item"
              onClick={onClose}
            >
              <ShoppingCart size={13} className="th-notif-item-icon" />
              <div className="th-notif-item-body">
                <span className="th-notif-item-label">New order #{order.order_number || order.id}</span>
                <span className="th-notif-item-time">Pending payment</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── User profile dropdown ────────────────────────────────────
const UserDropdown = ({ user, onClose, onLogout }) => (
  <div className="th-user-dropdown" role="dialog" aria-label="User menu">
    <div className="th-user-profile-header">
      <div className="th-user-avatar-lg">
        {(user?.name || 'A').charAt(0).toUpperCase()}
      </div>
      <div className="th-user-details">
        <span className="th-user-name-lg">{user?.name || 'Admin User'}</span>
        <span className="th-user-role-lg">{user?.role?.replace('_', ' ') || 'Administrator'}</span>
        {user?.email && <span className="th-user-email">{user.email}</span>}
      </div>
    </div>
    <div className="th-user-menu-divider" />
    <Link to="/admin/settings" className="th-user-menu-item" onClick={onClose}>
      <Settings size={13} /> Settings
    </Link>
    <button className="th-user-menu-item th-user-logout" onClick={onLogout}>
      <LogOut size={13} /> Sign out
    </button>
  </div>
);

// ── Store Selector ───────────────────────────────────────────
const STORES = [
  { id: 'all', name: 'All Stores' },
  { id: '1', name: 'Bandra Kiosk' },
  { id: '2', name: 'Andheri Kiosk' },
  { id: '3', name: 'Central Kitchen' },
];

// ── Main TopHeader ───────────────────────────────────────────
const TopHeader = () => {
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [selectedStore, setSelectedStore] = useState('all');
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const toggleMobile = useSidebarStore((s) => s.toggleMobile);
  const openSearch = useSidebarStore((s) => s.openSearch);
  const theme = useSidebarStore((s) => s.theme);
  const toggleTheme = useSidebarStore((s) => s.toggleTheme);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const orders = useOrderStore((s) => s.orders);
  const unreadNotif = useNotificationStore((s) => s.getUnreadCount?.() || 0);

  const pendingCount = (orders || []).filter((o) => o.status === 'pending').length;
  const totalAlerts = pendingCount + unreadNotif;

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="th-header" role="banner">
      {/* Left: hamburger + breadcrumb */}
      <div className="th-left">
        <button
          className="th-mobile-toggle"
          onClick={toggleMobile}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>
        <Breadcrumb />
      </div>

      {/* Center: global search trigger */}
      <div className="th-center">
        <button
          className="th-search-trigger"
          onClick={openSearch}
          aria-label="Global search"
        >
          <Search size={14} className="th-search-icon" />
          <span className="th-search-placeholder">Search pages, orders, customers…</span>
          <kbd className="th-search-kbd">⌘K</kbd>
        </button>
      </div>

      {/* Right: store, alerts, theme, user */}
      <div className="th-right">
        {/* Store Selector */}
        <div className="th-store-selector">
          <MapPin size={13} className="th-store-icon" />
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="th-store-select"
            aria-label="Select store"
            id="admin-store-selector"
          >
            {STORES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Alerts chip (pending orders) */}
        {pendingCount > 0 && (
          <Link to="/admin/orders" className="th-alert-chip" aria-label={`${pendingCount} pending orders`}>
            <ShoppingCart size={12} />
            <span>{pendingCount} pending</span>
          </Link>
        )}

        {/* Notifications */}
        <div className="th-notif-wrap" ref={notifRef}>
          <button
            className="th-icon-btn"
            onClick={() => setShowNotif((v) => !v)}
            aria-label={`${totalAlerts} notifications`}
            aria-expanded={showNotif}
          >
            <Bell size={16} />
            {totalAlerts > 0 && (
              <span className="th-notif-dot">{totalAlerts > 9 ? '9+' : totalAlerts}</span>
            )}
          </button>
          {showNotif && (
            <NotificationDropdown onClose={() => setShowNotif(false)} />
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="th-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* User avatar */}
        <div className="th-user-wrap" ref={userRef}>
          <button
            className="th-user-btn"
            onClick={() => setShowUser((v) => !v)}
            aria-label="User menu"
            aria-expanded={showUser}
          >
            <div className="th-user-avatar">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
          </button>
          {showUser && (
            <UserDropdown
              user={user}
              onClose={() => setShowUser(false)}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
