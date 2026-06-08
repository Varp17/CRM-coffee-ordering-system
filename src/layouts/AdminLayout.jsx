/**
 * AdminLayout.jsx — Enterprise Admin Shell
 * Grid: [sidebar | main panel]
 * Main panel: [sticky top header | scrollable content]
 * Features: Responsive collapse, mobile drawer, independent scrolling,
 *           dark mode, theme init, badge polling, keyboard nav
 */
import React, { useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import useSidebarStore from '../store/useSidebarStore';
import AdminPageErrorBoundary from '../components/AdminPageErrorBoundary/AdminPageErrorBoundary';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import MobileDrawer from './components/MobileDrawer';
import './AdminLayout.css';

// ── Responsive hook: update sidebar mode on viewport resize ──
const useResponsiveSidebar = () => {
  const setMode = useSidebarStore((s) => s.setMode);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1200) {
        // Desktop: expanded (user can still manually collapse)
        // Don't force-expand if user collapsed it
      } else if (w >= 900) {
        setMode('collapsed');
        closeMobile();
      } else {
        // Mobile/tablet: hide sidebar, use drawer
        closeMobile();
      }
    };

    update(); // Run on mount
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [setMode, closeMobile]);
};

const AdminLayout = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useSidebarStore((s) => s.mode);
  const initTheme = useSidebarStore((s) => s.initTheme);
  const setBadges = useSidebarStore((s) => s.setBadges);
  const orders = useOrderStore((s) => s.orders);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  useResponsiveSidebar();

  // ── Auth guard ──
  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // ── Apply stored theme on mount ──
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // ── Close mobile drawer on route change ──
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  // ── Update sidebar badges from live store data ──
  useEffect(() => {
    const pendingOrders = (orders || []).filter((o) => o.status === 'pending').length;
    setBadges({ pendingOrders });
  }, [orders, setBadges]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

  return (
    <div
      className={`al-root al-mode-${mode}`}
      data-sidebar={mode}
    >
      {/* ── Sidebar (hidden on mobile, use drawer instead) ── */}
      <div className="al-sidebar-slot">
        <Sidebar />
      </div>

      {/* ── Main Panel ── */}
      <div className="al-main-panel">
        {/* Sticky Header */}
        <TopHeader />

        {/* Page Content */}
        <main className="al-content" id="admin-main-content" role="main">
          <AdminPageErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </AdminPageErrorBoundary>
        </main>
      </div>

      {/* ── Mobile Drawer (portal-style overlay on mobile) ── */}
      <MobileDrawer />
    </div>
  );
};

export default AdminLayout;
