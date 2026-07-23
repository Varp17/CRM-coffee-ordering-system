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
import { storeService } from '../../services/stores';
import { unwrapList } from '../../utils/apiResponse';
import { ALL_MENU_ITEMS, findMenuItemByPath } from '../../constants/menuConfig';
import { CRM_STORES } from '../../data/crmStores';
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
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <div className="th-notif-dropdown" role="dialog" aria-label="Notifications" style={{ width: '320px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
      <div className="th-notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontWeight: '700', color: '#1f2937', fontSize: '14px' }}>Notifications</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {notifications.length > 0 && (
            <>
              <button onClick={() => markAllAsRead()} style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Mark all read</button>
              <span style={{ color: '#d1d5db', fontSize: '11px' }}>|</span>
              <button onClick={() => clearAll()} style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear all</button>
            </>
          )}
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="th-notif-empty" style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#9ca3af' }}>
          <Bell size={24} opacity={0.4} />
          <p style={{ margin: 0, fontSize: '12px' }}>No new notifications</p>
        </div>
      ) : (
        <div className="th-notif-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {notifications.map((notif) => {
            const timeStr = notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
            return (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: notif.is_read ? '#ffffff' : '#fef2f2',
                  transition: 'background-color 0.2s ease',
                }}
                onClick={() => {
                  if (!notif.is_read) {
                    markAsRead(notif.id);
                  }
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: notif.is_read ? '500' : '700', color: '#1f2937', fontSize: '12px', lineHeight: '1.4' }}>{notif.title}</div>
                  <div style={{ color: '#4b5563', fontSize: '11px', marginTop: '2px', whiteSpace: 'pre-line' }}>{notif.message}</div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>{timeStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ padding: '8px 12px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
        <button className="th-notif-close" onClick={onClose} style={{ width: '100%', padding: '6px 0', borderRadius: '6px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Close</button>
      </div>
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

// ── Main TopHeader ───────────────────────────────────────────
const TopHeader = () => {
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [selectedStore, setSelectedStore] = useState('all');
  const [stores, setStores] = useState([
    { id: 'all', name: 'All Stores' },
    ...CRM_STORES,
  ]);
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
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const unreadNotif = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    storeService.getAll({ limit: 100 }).then((res) => {
      const list = unwrapList(res, []);
      if (list.length > 0) {
        const websiteStoreNames = new Set(CRM_STORES.map((store) => store.name.toLowerCase()));
        const additionalStores = list
          .map((store) => ({
            ...store,
            name: store.name || store.store_name || '',
          }))
          .filter((store) => {
            const name = store.name.toLowerCase();
            return name && !websiteStoreNames.has(name);
          });
        setStores([
          { id: 'all', name: 'All Stores' },
          ...CRM_STORES,
          ...additionalStores,
        ]);
      }
    }).catch(() => {});
  }, [fetchNotifications, fetchUnreadCount]);

  const pendingCount = (orders || []).filter((o) => o.status === 'pending').length;
  const totalAlerts = unreadNotif;

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
        {/* Store Locator */}
        <div className="th-store-selector">
          <MapPin size={13} className="th-store-icon" />
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="th-store-select"
            aria-label="Store Locator"
            id="admin-store-selector"
          >
            {stores.map((s) => (
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
