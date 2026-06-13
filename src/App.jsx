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
import About from './pages/d2c/About/About';
import Contact from './pages/d2c/Contact/Contact';

// Existing Admin Pages
import Login from './pages/admin/Login/Login';
import Dashboard from './pages/admin/Dashboard/Dashboard';
import Orders from './pages/admin/Orders/Orders';
import Menu from './pages/admin/Menu/Menu';
import Inventory from './pages/admin/Inventory/Inventory';
import Ingredients from './pages/admin/Ingredients/Ingredients';
import CentralInventory from './pages/admin/CentralInventory/CentralInventory';
import RawMaterials from './pages/admin/RawMaterials/RawMaterials';
import Production from './pages/admin/Production/Production';
import Recipes from './pages/admin/Recipes/Recipes';
import Customers from './pages/admin/Customers/Customers';
import Roles from './pages/admin/Roles/Roles';
import CMS from './pages/admin/CMS/CMS';
import Analytics from './pages/admin/Analytics/Analytics';
import Notifications from './pages/admin/Notifications/Notifications';
import Stores from './pages/admin/Stores/Stores';
import Financials from './pages/admin/Financials/Financials';
import Settings from './pages/admin/Settings/Settings';

// New Admin Pages
import Suppliers from './pages/admin/Suppliers/Suppliers';
import PurchaseOrders from './pages/admin/PurchaseOrders/PurchaseOrders';
import WasteLogs from './pages/admin/WasteLogs/WasteLogs';
import StoreTransfers from './pages/admin/StoreTransfers/StoreTransfers';
import Packaging from './pages/admin/Packaging/Packaging';
import CashManagement from './pages/admin/CashManagement/CashManagement';
import B2B from './pages/admin/B2B/B2B';
import GST from './pages/admin/GST/GST';
import Loyalty from './pages/admin/Loyalty/Loyalty';
import Promotions from './pages/admin/Promotions/Promotions';
import Subscriptions from './pages/admin/Subscriptions/Subscriptions';
import Support from './pages/admin/Support/Support';
import Quality from './pages/admin/Quality/Quality';
import Equipment from './pages/admin/Equipment/Equipment';
import FoodSafety from './pages/admin/FoodSafety/FoodSafety';
import Staff from './pages/admin/Staff/Staff';
import Shipping from './pages/admin/Shipping/Shipping';
import DailyOps from './pages/admin/DailyOps/DailyOps';
import CustomerQueries from './pages/admin/CustomerQueries/CustomerQueries';
import CompatibilityRules from './pages/admin/CompatibilityRules/CompatibilityRules';
import Categories from './pages/admin/Categories/Categories';

// Existing Barista Pages
import OrderQueue from './pages/barista/OrderQueue/OrderQueue';

// Existing Kiosk Pages
import KioskHome from './pages/kiosk/Home/Home';
import KioskCatalog from './pages/kiosk/Catalog/Catalog';
import KioskLogin from './pages/kiosk/Login/Login';
import KioskQrOrder from './pages/kiosk/QrOrder/QrOrder';
import KioskCustomDrink from './pages/kiosk/CustomDrink/CustomDrink';
import DrinkBuilder from './features/customizer/components/DrinkBuilder';
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
     const { tokenNum, order } = await completeKioskOrder();
     navigate('/kiosk/token', { state: { order } });
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
          <Route path="shop" element={<Catalog />} />
          <Route path="shop/:id" element={<ProductDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="cart" element={<Cart onProceedToCheckout={() => {}} />} />
          <Route path="checkout" element={<Checkout onBackToCart={() => {}} />} />
          <Route path="profile" element={<Profile />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="subscriptions" element={<Subscription />} />
          <Route path="collections" element={<Collections />} />
          <Route path="success" element={<OrderSuccess />} />
          <Route path="login" element={<CustomerLogin />} />
          <Route path="custom" element={
            <DrinkBuilder
              onClose={() => navigate('/store/catalog')}
              onBack={() => navigate('/store/catalog')}
              onAddToCart={(customDrink) => {
                const cartStore = useCartStore.getState();
                cartStore.addItem(
                  {
                    id: customDrink.id,
                    name: customDrink.name,
                    image_url: customDrink.image_url,
                    description: `Customized ${customDrink.customization.base} with ${customDrink.customization.milk}`,
                    base_price: customDrink.price,
                    is_custom: true,
                    customization: customDrink.customization,
                  },
                  { id: 'custom-variant', name: 'Custom', price: customDrink.price },
                  1
                );
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
          <Route path="recipes" element={<Recipes />} />
          <Route path="compatibility-rules" element={<CompatibilityRules />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="ingredients" element={<Ingredients />} />
          <Route path="central-inventory" element={<CentralInventory />} />
          <Route path="raw-materials" element={<RawMaterials />} />
          <Route path="categories" element={<Categories />} />
          <Route path="rd" element={<Production />} />
          <Route path="production" element={<Production />} />
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="waste-logs" element={<WasteLogs />} />
          <Route path="store-transfers" element={<StoreTransfers />} />
          <Route path="packaging" element={<Packaging />} />
          <Route path="cash" element={<CashManagement />} />
          <Route path="b2b" element={<B2B />} />
          <Route path="gst" element={<GST />} />
          <Route path="loyalty" element={<Loyalty />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="support" element={<Support />} />
          <Route path="quality" element={<Quality />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="food-safety" element={<FoodSafety />} />
          <Route path="staff" element={<Staff />} />
          <Route path="shifts" element={<Staff />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="daily-ops" element={<DailyOps />} />
          <Route path="customer-queries" element={<CustomerQueries />} />
          {/* Legacy routes */}
          <Route path="settings" element={<Settings />} />
          <Route path="reports" element={<Analytics />} />
          <Route path="marketing" element={<CMS />} />
          <Route path="roles" element={<Roles />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="stores" element={<Stores />} />
          <Route path="financials" element={<Financials />} />
          <Route path="cms" element={<CMS />} />

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
            <DrinkBuilder
              onClose={() => navigate('/kiosk/catalog')}
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
