import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ConfirmationProvider } from './providers/ConfirmationProvider';

// Layouts
import D2CLayout from './layouts/D2CLayout';
import AdminLayout from './layouts/AdminLayout';
import BaristaLayout from './layouts/BaristaLayout';
import KioskLayout from './layouts/KioskLayout';

// Existing D2C Pages
import Home from './pages/d2c/Home/Home';
import Catalog from './pages/d2c/Catalog/Catalog';
import Cart from './pages/d2c/Cart/Cart';
import Profile from './pages/d2c/Profile/Profile';
import Checkout from './pages/d2c/Cart/Checkout';
import ProductDetail from './pages/d2c/ProductDetail/ProductDetail';
import OrderSuccess from './pages/d2c/OrderSuccess/OrderSuccess';
import Subscription from './pages/d2c/Subscription/Subscription';
import Collections from './pages/d2c/Collections/Collections';
import CustomerLogin from './pages/d2c/Auth/Login';

// Existing Admin Pages
import Login from './pages/admin/Login/Login';
import Dashboard from './pages/admin/Dashboard/Dashboard';
import Orders from './pages/admin/Orders/Orders';
import Menu from './pages/admin/Menu/Menu';
import Inventory from './pages/admin/Inventory/Inventory';
import Ingredients from './pages/admin/Ingredients/Ingredients';
import Customers from './pages/admin/Customers/Customers';
import Roles from './pages/admin/Roles/Roles';
import CMS from './pages/admin/CMS/CMS';
import RecipeEngine from './pages/admin/RecipeEngine/RecipeEngine';
import Analytics from './pages/admin/Analytics/Analytics';
import Notifications from './pages/admin/Notifications/Notifications';
import Stores from './pages/admin/Stores/Stores';
import Financials from './pages/admin/Financials/Financials';
import ActivityLog from './pages/admin/ActivityLog/ActivityLog';

// Existing Barista Pages
import OrderQueue from './pages/barista/OrderQueue/OrderQueue';

// Existing Kiosk Pages
import KioskHome from './pages/kiosk/Home/Home';
import KioskCatalog from './pages/kiosk/Catalog/Catalog';
import KioskLogin from './pages/kiosk/Login/Login';
import KioskQrOrder from './pages/kiosk/QrOrder/QrOrder';
import KioskCustomDrink from './pages/kiosk/CustomDrink/CustomDrink';
import KioskCheckout from './pages/kiosk/Checkout/Checkout';

// Simulated Real-Time WebSocket Hook
import { useWebSocket } from './hooks/useWebSocket';

// Real Barista & Kiosk Components
import ActivePrep from './pages/barista/ActivePrep/ActivePrep';
import CompletedOrders from './pages/barista/CompletedOrders/CompletedOrders';
import DelayedOrders from './pages/barista/DelayedOrders/DelayedOrders';
import Performance from './pages/barista/Performance/Performance';
import TokenConfirmation from './pages/kiosk/TokenConfirmation/TokenConfirmation';

// Portal (unified login hub)
import Portal from './pages/Portal/Portal';

// Stores & State
import { useNavigate } from 'react-router-dom';
import { useKioskStore } from './store/useKioskStore';
import { useOrderStore } from './store/useOrderStore';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';

function App() {
  const navigate = useNavigate();

  // Handle auto-logout and redirect when session expires (401 Unauthorized)
  useEffect(() => {
    const handleUnauthorized = () => {
      useAuthStore.setState({ user: null, role: null, isAuthenticated: false });
      navigate('/');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);
  // Activate simulated real-time WebSocket updates
  useWebSocket();

  const placeOrder = useOrderStore((state) => state.placeOrder);

  // Kiosk cart has one source of truth so the header, catalog and checkout stay in sync.
  const kioskCart = useKioskStore((state) => state.cart);
  const setKioskCart = useKioskStore((state) => state.setKioskCart);
  const completeKioskOrder = useKioskStore((state) => state.completeKioskOrder);
  const clearKioskCart = useKioskStore((state) => state.clearKioskCart);

  const kioskSubtotal = kioskCart.reduce((sum, item) => sum + (item.price || item.totalPrice || 0), 0);

  const handleKioskComplete = async () => {
    // Generate pickup token and estimates via kiosk store
    const { tokenNum } = await completeKioskOrder();

    // Route order live to KDS (Barista display queue)
    const newOrder = {
      id: tokenNum,
      customer: 'Kiosk Guest',
      items: kioskCart.map((item) => ({
        name: item.name,
        price: item.price || item.totalPrice || 0,
        qty: item.qty || item.quantity || 1
      })),
      source: 'Kiosk',
      status: 'Pending',
      notes: 'Self-Service Kiosk Order'
    };

    placeOrder(newOrder);
    navigate('/kiosk/token');
  };

  return (
    <ConfirmationProvider>
      <Routes>
        {/* ── 0. Portal — Default Landing / Login Hub ── */}
        <Route path="/" element={<Portal />} />

        {/* ── 1. D2C storefront (Customer Facing) ── */}
        <Route path="/store" element={<D2CLayout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart onProceedToCheckout={() => {}} />} />
          <Route path="checkout" element={<Checkout onBackToCart={() => {}} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="collections" element={<Collections />} />
          <Route path="success" element={<OrderSuccess />} />
          <Route path="login" element={<CustomerLogin />} />
          <Route path="custom" element={
            <KioskCustomDrink
              onBack={() => navigate('/store/catalog')}
              onAddToCart={(customDrink) => {
                const cartStore = useCartStore.getState();
                const customProduct = {
                  id: customDrink.id,
                  name: customDrink.name,
                  image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&auto=format&fit=crop&q=88',
                  description: `Customized base: ${customDrink.customization.base}, milk: ${customDrink.customization.milk}`,
                  base_price: customDrink.price,
                  is_custom: true,
                  customization: customDrink.customization
                };
                const customVariant = {
                  id: 'custom-variant',
                  name: customDrink.customization.size,
                  price: customDrink.price
                };
                cartStore.addItem(customProduct, customVariant, 1);
                navigate('/store/cart');
              }}
            />
          } />
        </Route>

        {/* ── 2. Admin Command Center ── */}
        <Route path="/admin/login" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="menu" element={<Menu />} />
          <Route path="recipe-engine" element={<RecipeEngine />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="ingredients" element={<Ingredients />} />
          <Route path="customers" element={<Customers />} />
          <Route path="roles" element={<Roles />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="stores" element={<Stores />} />
          <Route path="financials" element={<Financials />} />
          <Route path="cms" element={<CMS />} />
          <Route path="activity-log" element={<ActivityLog />} />
        </Route>

        {/* ── 3. Barista Kitchen Display System (KDS) ── */}
        <Route path="/barista" element={<BaristaLayout />}>
          <Route index element={<OrderQueue />} />
          <Route path="active" element={<ActivePrep />} />
          <Route path="completed" element={<CompletedOrders />} />
          <Route path="delayed" element={<DelayedOrders />} />
          <Route path="performance" element={<Performance />} />
        </Route>

        {/* ── 4. Self-Ordering Kiosk Terminal ── */}
        <Route path="/kiosk" element={<KioskLayout />}>
          <Route index element={
            <KioskHome
              onStart={() => {
                setKioskCart([]);
                clearKioskCart();
                navigate('/kiosk/catalog');
              }}
              onQrScan={() => navigate('/kiosk/qr')}
            />
          } />
          <Route path="catalog" element={
            <KioskCatalog
              cart={kioskCart}
              setCart={setKioskCart}
              onBack={() => navigate('/kiosk')}
              onLogin={() => navigate('/kiosk/login')}
              onCreateCustom={() => navigate('/kiosk/custom')}
              onCheckout={() => navigate('/kiosk/checkout')}
            />
          } />
          <Route path="custom" element={
            <KioskCustomDrink
              onBack={() => navigate('/kiosk/catalog')}
              onAddToCart={(customDrink) => {
                setKioskCart([...kioskCart, customDrink]);
                navigate('/kiosk/catalog');
              }}
            />
          } />
          <Route path="checkout" element={
            <KioskCheckout
              cart={kioskCart}
              total={kioskSubtotal}
              onBack={() => navigate('/kiosk/catalog')}
              onComplete={handleKioskComplete}
            />
          } />
          <Route path="login" element={
            <KioskLogin
              onLogin={() => navigate('/kiosk/catalog')}
              onBack={() => navigate('/kiosk/catalog')}
            />
          } />
          <Route path="qr" element={<KioskQrOrder onBack={() => navigate('/kiosk')} />} />
          <Route path="token" element={<TokenConfirmation />} />
        </Route>

        {/* ── Catch-all / Redirect to Portal ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfirmationProvider>
  );
}

export default App;
