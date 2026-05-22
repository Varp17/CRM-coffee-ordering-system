import React, { useState, useEffect } from 'react'
import Home from './pages/d2c/Home/Home'
import Catalog from './pages/d2c/Catalog/Catalog'
import Cart from './pages/d2c/Cart/Cart'
import Profile from './pages/d2c/Profile/Profile'
import Checkout from './pages/d2c/Cart/Checkout'
import Login from './pages/admin/Login/Login'
import Layout from './pages/admin/Layout/Layout'
import OrderQueue from './pages/barista/OrderQueue/OrderQueue'
import KioskHome from './pages/kiosk/Home/Home'
import KioskCatalog from './pages/kiosk/Catalog/Catalog'
import KioskLogin from './pages/kiosk/Login/Login'
import KioskQrOrder from './pages/kiosk/QrOrder/QrOrder'
import KioskCustomDrink from './pages/kiosk/CustomDrink/CustomDrink'
import KioskCheckout from './pages/kiosk/Checkout/Checkout'
import Portal from './pages/Portal/Portal' // Import Portal

function App() {
  // We'll store app mode in state so it can be changed via the Portal
  const [appMode, setAppMode] = useState('');
  
  // Set document title based on mode
  useEffect(() => {
    if (appMode === 'admin') document.title = 'Admin Dashboard';
    else if (appMode === 'barista') document.title = 'Barista Interface';
    else if (appMode === 'kiosk') document.title = 'Kiosk Interface';
    else if (appMode === 'd2c') document.title = 'Vasify Coffee - D2C';
    else document.title = 'Vasify Portal';
  }, [appMode]);

  const [currentPage, setCurrentPage] = useState('portal');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Kiosk Cart State
  const [kioskCart, setKioskCart] = useState([]);
  const [kioskTotal, setKioskTotal] = useState(0);

  // Determine if we should show the main nav (only for D2C mode)
  const shouldShowNav = appMode === 'd2c';
  
  // Hide nav for specific pages
  const hideNavPages = ['admin-dashboard', 'kiosk', 'kiosk-catalog', 'kiosk-login', 'kiosk-qr', 'kiosk-custom', 'kiosk-checkout', 'portal'];
  const isNavHidden = hideNavPages.includes(currentPage);

  const handlePortalLogin = (role) => {
    setAppMode(role);
    if (role === 'admin') {
      setIsAdminLoggedIn(true);
      setCurrentPage('admin-dashboard');
    }
    else if (role === 'barista') setCurrentPage('barista');
    else if (role === 'kiosk') setCurrentPage('kiosk');
    else if (role === 'd2c') setCurrentPage('home');
  };

  return (
    <>
      {/* Navigation Bar */}
      {shouldShowNav && !isNavHidden && (
        <nav className="d2c-nav">
          <button 
            onClick={() => setCurrentPage('home')} 
            className={`d2c-nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('catalog')} 
            className={`d2c-nav-btn ${currentPage === 'catalog' ? 'active' : ''}`}
          >
            Catalog
          </button>
          <button 
            onClick={() => setCurrentPage('cart')} 
            className={`d2c-nav-btn ${currentPage === 'cart' || currentPage === 'checkout' ? 'active' : ''}`}
          >
            Cart
          </button>
          <button 
            onClick={() => setCurrentPage('profile')} 
            className={`d2c-nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
          >
            Profile
          </button>
        </nav>
      )}

      {currentPage === 'portal' && <Portal onLogin={handlePortalLogin} />}

      {currentPage === 'home' && <Home />}
      {currentPage === 'catalog' && <Catalog />}
      {currentPage === 'cart' && <Cart onProceedToCheckout={() => setCurrentPage('checkout')} />}
      {currentPage === 'profile' && <Profile />}
      {currentPage === 'checkout' && <Checkout onBackToCart={() => setCurrentPage('cart')} />}
      {currentPage === 'barista' && <OrderQueue />}
      
      {/* Kiosk Flow */}
      {currentPage === 'kiosk' && (
        <KioskHome 
          onStart={() => setCurrentPage('kiosk-catalog')} 
          onQrScan={() => setCurrentPage('kiosk-qr')}
        />
      )}
      {currentPage === 'kiosk-catalog' && (
        <KioskCatalog 
          onBack={() => setCurrentPage('kiosk')} 
          onLogin={() => setCurrentPage('kiosk-login')}
          onCreateCustom={() => setCurrentPage('kiosk-custom')}
          onCheckout={(cart, total) => {
            setKioskCart(cart);
            setKioskTotal(total);
            setCurrentPage('kiosk-checkout');
          }}
        />
      )}
      {currentPage === 'kiosk-login' && (
        <KioskLogin 
          onLogin={(mobile) => {
            alert(`Logged in with ${mobile}`);
            setCurrentPage('kiosk-catalog');
          }} 
          onBack={() => setCurrentPage('kiosk-catalog')}
        />
      )}
      {currentPage === 'kiosk-qr' && (
        <KioskQrOrder onBack={() => setCurrentPage('kiosk')} />
      )}
      {currentPage === 'kiosk-custom' && (
        <KioskCustomDrink 
          onBack={() => setCurrentPage('kiosk-catalog')} 
          onAddToCart={(drink) => {
            setKioskCart([...kioskCart, drink]);
            setKioskTotal(kioskTotal + drink.price);
            setCurrentPage('kiosk-catalog');
          }}
        />
      )}
      {currentPage === 'kiosk-checkout' && (
        <KioskCheckout 
          cart={kioskCart}
          total={kioskTotal}
          onBack={() => setCurrentPage('kiosk-catalog')} 
          onComplete={() => {
            setKioskCart([]);
            setKioskTotal(0);
            setCurrentPage('kiosk');
          }}
        />
      )}

      {/* Admin Flow */}
      {currentPage === 'admin-login' && (
        <Login onLogin={() => {
          setIsAdminLoggedIn(true);
          setCurrentPage('admin-dashboard');
        }} />
      )}
      {currentPage === 'admin-dashboard' && isAdminLoggedIn && <Layout />}
    </>
  )
}

export default App
