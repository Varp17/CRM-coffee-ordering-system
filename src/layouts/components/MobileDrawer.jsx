/**
 * MobileDrawer.jsx — Slide-in drawer for mobile/tablet navigation
 */
import React, { useEffect } from 'react';
import useSidebarStore from '../../store/useSidebarStore';
import Sidebar from './Sidebar';
import './MobileDrawer.css';

const MobileDrawer = () => {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  // Lock body scroll when open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeMobile(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeMobile]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-drawer-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <Sidebar onNavigate={closeMobile} />
      </div>
    </>
  );
};

export default MobileDrawer;
