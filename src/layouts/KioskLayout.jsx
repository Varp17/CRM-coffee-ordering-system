import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useKioskStore } from '../store/useKioskStore';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import './KioskLayout.css';

const KioskLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useKioskStore((state) => state.cart);
  const clearKioskCart = useKioskStore((state) => state.clearKioskCart);

  // Return to landing page if inactive for 60 seconds
  useIdleTimeout(() => {
    if (location.pathname !== '/kiosk') {
      console.log('[KIOSK TIMEOUT] Inactivity detected, resetting kiosk.');
      clearKioskCart();
      navigate('/kiosk');
    }
  }, 60000);

  const getStepProgress = () => {
    const path = location.pathname;
    if (path === '/kiosk') return 0;
    if (path === '/kiosk/catalog') return 1;
    if (path === '/kiosk/custom') return 2;
    if (path === '/kiosk/checkout') return 3;
    if (path === '/kiosk/token') return 4;
    return 0;
  };

  const currentStep = getStepProgress();
  const isHomeScreen = location.pathname === '/kiosk';
  const showNavbar = currentStep > 0 && currentStep < 4; // Hide on Home start page and Token page for focus

  return (
    <div className="kiosk-layout-container">
      {/* Immersive Floating Glass Navbar (Always visible except Token Confirmation page) */}
      {showNavbar && (
        <header className="kiosk-top-bar">
          {/* Left Slot: Logo & Terminal ID */}
          <div className="kiosk-header-left" onClick={() => navigate('/kiosk')} style={{ cursor: 'pointer' }}>
            <span className="logo-icon-kiosk">☕</span>
            <span className="terminal-id-kiosk">DC // T1-MUSEUM</span>
          </div>
          
          {/* Center Slot: Category Navigation Shortcuts */}
          <div className="kiosk-header-center">
            <button className="nav-shortcut-btn" onClick={() => navigate('/kiosk/catalog')}>DRINKS</button>
            <button className="nav-shortcut-btn" onClick={() => navigate('/kiosk/catalog')}>DESSERTS</button>
            <button className="nav-shortcut-btn" onClick={() => navigate('/kiosk/custom')}>CUSTOM LAB</button>
          </div>

          {/* Right Slot: Cart Summary & Controls */}
          <div className="kiosk-header-right">
            {!isHomeScreen && (
              <button className="kiosk-back-arrow-btn" onClick={() => navigate(-1)} style={{ marginRight: '8px' }}>
                ← BACK
              </button>
            )}
            <button className="kiosk-cart-summary-bubble" onClick={() => navigate('/kiosk/catalog')}>
              CART [{cart.length}]
            </button>
            <button className="kiosk-control-btn">[A]</button>
            <button className="kiosk-control-btn">[EN]</button>
          </div>
        </header>
      )}

      {/* Main Touch Area */}
      <main className="kiosk-view-workspace">
        <Outlet />
      </main>

      {/* Floating Kiosk Help Footer */}
      {currentStep > 0 && currentStep < 4 && (
        <footer className="kiosk-assistive-footer">
          <p>FOR SERVICE ASSISTANCE, CALL SYSTEM STAFF AT ANY TIME</p>
          <button className="kiosk-help-trigger-btn" onClick={() => alert('Assistance is on the way! A barista will help you shortly.')}>
            [?] STAFF ASSIST
          </button>
        </footer>
      )}
    </div>
  );
};

export default KioskLayout;
