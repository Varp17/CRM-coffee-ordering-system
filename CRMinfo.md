# CRM Info — Digital Coffee Ordering System

> **Note:** This document describes the structure and functionality of the codebase.
> All confidential values (API keys, tokens, passwords, internal URLs, service account
> credentials, etc.) have been redacted.

---

## 1. Project Overview

**Name:** Digital Coffee / CHILLD Coffee Ordering System  
**Type:** Full-stack QSR (Quick Service Restaurant) ordering ecosystem  
**Surfaces:** Customer Ordering Website, Admin Command Center (CRM), and Barista KDS
**Purpose:** Unified platform for customer ordering, kitchen operations, inventory management,
supply chain, analytics, and enterprise admin workflows.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19, React DOM 19 |
| Build Tool | Vite 8 |
| Routing | React Router DOM v7 |
| State Management | Zustand v5 (6 stores) |
| Server State | TanStack Query v5 |
| UI/Icons | Lucide React |
| Charts | Recharts |
| Animations | Framer Motion |
| 3D / Physics | Three.js, @react-three/fiber, @react-three/drei, @react-three/rapier |
| Notifications | react-hot-toast |
| Deployment | Cloudflare Workers + Wrangler |
| Linting | ESLint + React Hooks + React Refresh |

---

## 3. Repository Structure

```
F:\Projects\coffee-ordering-system\
├── .dockerignore
├── .env
├── .gitignore
├── .kilo/                          # Kilo configuration
├── .wrangler/                      # Cloudflare Workers state
├── API_SPECIFICATION.md
├── Dockerfile
├── README.md
├── SPEC.md
├── index.html
├── nginx.conf
├── package.json
├── package-lock.json
├── public/                          # Static assets (fonts, images, chime.mp3)
│   └── fonts/
│       └── Author_Complete/         # Author variable font family (woff2/woff/ttf/otf)
├── src/
│   ├── App.jsx                      # Root routing & layout shells
│   ├── App.css
│   ├── main.jsx                     # Provider stack entry point
│   ├── index.css
│   ├── assets/                      # Image/video assets
│   ├── components/
│   │   ├── ui/                      # Generic reusable UI primitives
│   │   │   ├── DataTable.jsx / DataTable.css
│   │   │   ├── SlideOver.jsx / SlideOver.css
│   │   │   └── Skeleton.jsx / Skeleton.css
│   │   ├── Button/                  # Button component
│   │   ├── Card/                    # Card component
│   │   ├── Modal/                   # Modal/dialog component
│   │   ├── Tabs/                    # Tabs component
│   │   ├── Badge/                   # Badge component
│   │   ├── Input/                   # Input component
│   │   ├── Dropdown/                # Dropdown component
│   │   ├── SearchBar/               # Search component
│   │   ├── EmptyState/              # Empty state component
│   │   ├── ErrorState/              # Error state component
│   │   ├── KPICard/                 # KPI stat card
│   │   ├── SectionHeader/           # Section header
│   │   ├── Avatar/                  # Avatar component
│   │   ├── StarRating/              # Star rating
│   │   ├── Timeline/                # Timeline component
│   │   ├── Table/                   # Table wrapper
│   │   ├── ScrollVideoFrame/        # Scroll-driven video frame
│   │   ├── ProductMedia/            # Media for product cards
│   │   ├── SensoryProfiler/         # Sensory/flavor profiler
│   │   ├── CupAnimation/            # Cup animation
│   │   ├── Visualizer/              # Liquid visualizer
│   │   ├── system/                  # Brew-related system components
│   │   ├── Motion/                  # Animated wrappers
│   │   ├── CustomizationModal/      # Drink customization modal
│   │   ├── InlineDrinkBuilder/      # Inline drink builder
│   │   ├── RecipeDiscoverer/        # Recipe discovery UI
│   │   ├── LoyaltyClub/             # Loyalty club UI
│   │   ├── Logo/                    # Logo component (text + badge)
│   │   └── skeletons/               # Skeleton loaders
│   ├── constants/
│   │   └── menuConfig.js            # Admin sidebar navigation config
│   ├── data/
│   │   ├── mockData.js              # Legacy mock data
│   │   ├── kioskProducts.js         # Ordering-site concentrate catalog mirror
│   │   ├── kioskRecipes.js          # Ordering-site recipe definitions
│   │   └── crmStores.js             # Ordering-site locations used by the CRM store selector
│   ├── design-system/
│   │   └── tokens/
│   │       ├── colors.js            # Brand color tokens (unused in active code)
│   │       └── spacing.js           # Spacing/radius/shadow tokens (unused)
│   ├── features/
│   │   ├── kds/                     # KDS-specific feature components
│   │   │   └── components/
│   │   │       └── KdsQueue.jsx
│   │   └── customizer/              # Drink customization feature
│   │       └── components/
│   │           └── DrinkBuilder.jsx
│   ├── hooks/
│   │   ├── useWebSocket.js          # WebSocket connection + real-time handlers
│   │   ├── useIdleTimeout.js        # Idle session timeout
│   │   ├── useDebounce.js           # Debounce hook
│   │   └── useMediaQuery.js         # Responsive media query hook
│   ├── layouts/
│   │   ├── AdminLayout.jsx / .css   # Admin shell (sidebar + header + content)
│   │   ├── BaristaLayout.jsx / .css # Barista KDS shell
│   │   ├── D2CLayout.jsx / .css     # Customer storefront shell
│   │   ├── KioskLayout.jsx / .css   # Kiosk shell
│   │   └── components/
│   │       ├── Sidebar.jsx / .css   # Admin sidebar navigation
│   │       ├── TopHeader.jsx / .css # Admin top header
│   │       └── MobileDrawer.jsx / .css
│   ├── lib/
│   │   └── queryClient.js           # TanStack Query client config
│   ├── pages/
│   │   ├── Portal/                  # Unified login hub (root route /)
│   │   │   ├── Portal.jsx / .css
│   │   ├── admin/                   # Admin command center (~35 modules)
│   │   │   ├── Dashboard/
│   │   │   ├── Orders/
│   │   │   ├── Menu/
│   │   │   ├── Inventory/
│   │   │   ├── Ingredients/
│   │   │   ├── CentralInventory/
│   │   │   ├── RawMaterials/
│   │   │   ├── Production/
│   │   │   ├── Recipes/
│   │   │   ├── RecipeBuilder/
│   │   │   ├── BrewRecipes/
│   │   │   ├── Customers/
│   │   │   ├── Suppliers/
│   │   │   ├── PurchaseOrders/
│   │   │   ├── WasteLogs/
│   │   │   ├── StoreTransfers/
│   │   │   ├── Packaging/
│   │   │   ├── CashManagement/
│   │   │   ├── B2B/
│   │   │   ├── GST/
│   │   │   ├── Loyalty/
│   │   │   ├── Promotions/
│   │   │   ├── Subscriptions/
│   │   │   ├── Support/
│   │   │   ├── Quality/
│   │   │   ├── Equipment/
│   │   │   ├── FoodSafety/
│   │   │   ├── Staff/
│   │   │   ├── Shipping/
│   │   │   ├── DailyOps/
│   │   │   ├── CustomerQueries/
│   │   │   ├── CompatibilityRules/
│   │   │   ├── Categories/
│   │   │   ├── Analytics/
│   │   │   ├── Notifications/
│   │   │   ├── Stores/
│   │   │   ├── Financials/
│   │   │   ├── Settings/
│   │   │   ├── CMS/
│   │   │   ├── Roles/
│   │   │   └── Login/
│   │   ├── barista/                 # Kitchen Display System (KDS)
│   │   │   ├── OrderQueue/
│   │   │   ├── ActivePrep/
│   │   │   ├── CompletedOrders/
│   │   │   ├── DelayedOrders/
│   │   │   └── Performance/
│   │   ├── d2c/                     # Direct-to-consumer storefront
│   │   │   ├── Home/
│   │   │   ├── Catalog/
│   │   │   ├── Cart/
│   │   │   ├── Checkout/
│   │   │   ├── Profile/
│   │   │   ├── Subscription/
│   │   │   ├── Collections/
│   │   │   ├── Auth/ (Login)
│   │   │   ├── About/
│   │   │   ├── Contact/
│   │   │   └── ProductDetail/
│   │   ├── kiosk/                   # Self-ordering kiosk (currently external)
│   │   │   ├── Home/
│   │   │   ├── Catalog/
│   │   │   ├── Checkout/
│   │   │   ├── Login/
│   │   │   ├── CustomDrink/
│   │   │   ├── QrOrder/
│   │   │   └── TokenConfirmation/
│   │   └── Portal/                  # Unified login hub
│   ├── providers/
│   │   └── ConfirmationProvider.jsx # Global confirmation dialog provider
│   ├── services/                    # 40+ API service modules
│   │   ├── api.js                   # Base HTTP client (JWT, refresh, 401 handling)
│   │   ├── auth.js                  # Authentication endpoints
│   │   ├── orders.js                # Order management
│   │   ├── customers.js             # Customer management
│   │   ├── inventory.js             # Inventory management
│   │   ├── ingredients.js           # Ingredient management
│   │   ├── rawMaterials.js          # Raw materials
│   │   ├── recipes.js               # Recipes
│   │   ├── menuRecipes.js           # Menu recipes
│   │   ├── brewRecipes.js           # Brew recipes
│   │   ├── products.js              # Products
│   │   ├── suppliers.js             # Suppliers
│   │   ├── purchaseOrders.js        # Purchase orders
│   │   ├── waste.js / wasteLogs.js  # Waste tracking
│   │   ├── stores.js                # Store management
│   │   ├── notifications.js         # Notifications
│   │   ├── barista.js               # Barista/KDS endpoints
│   │   ├── dashboard.js             # Dashboard analytics
│   │   ├── analytics.js             # Analytics
│   │   ├── b2b.js                   # B2B wholesale
│   │   ├── cashManagement.js        # Cash management
│   │   ├── gst.js                   # GST/tax
│   │   ├── loyalty.js               # Loyalty program
│   │   ├── promotions.js            # Promotions
│   │   ├── subscriptions.js         # Subscriptions
│   │   ├── shipping.js              # Shipping
│   │   ├── cms.js                   # CMS/content
│   │   ├── roles.js                 # Roles & permissions
│   │   ├── staff.js                 # Staff management
│   │   ├── equipment.js             # Equipment
│   │   ├── foodSafety.js            # Food safety
│   │   ├── quality.js               # Quality control
│   │   ├── customDrinks.js          # Custom drinks
│   │   ├── d2cService.js            # D2C-specific endpoints
│   │   ├── support.js               # Support tickets
│   │   ├── customerQueries.js       # Customer queries
│   │   ├── activityLog.js           # Activity logging
│   │   ├── executiveNotes.js        # Executive notes
│   │   ├── reorderService.js        # Reorder rules
│   │   ├── inventoryOps.js          # Inventory operations
│   │   └── ...                      # Additional service modules
│   ├── store/                       # Zustand global state (6 stores)
│   │   ├── useAuthStore.js          # Auth state, login, OTP, profile
│   │   ├── useOrderStore.js         # Orders + barista queue state
│   │   ├── useCartStore.js          # D2C shopping cart state
│   │   ├── useKioskStore.js         # Kiosk cart + customization state
│   │   ├── useNotificationStore.js  # Notifications + toast integration
│   │   └── useSidebarStore.js       # Admin sidebar state + theme
│   ├── styles/
│   │   └── global.css               # Design tokens, typography, motion, admin overrides, KDS rules
│   ├── utils/
│   │   ├── apiResponse.js           # Response unwrap helpers (handles multiple API shapes)
│   │   ├── formatters.js            # Currency/date/number formatters
│   │   ├── validators.js            # Form validation helpers
│   │   ├── permissions.js           # Permission/policy checks
│   │   ├── i18n.js                  # Internationalization (t() helper)
│   │   ├── constants.js             # Shared constants
│   │   └── compatibility.js         # Compatibility checks
│   └── providers/
│       └── ConfirmationProvider.jsx
├── vercel.json
├── vite.config.js
├── vite_error.txt
├── vite_output.txt
├── wrangler.jsonc                   # Cloudflare Workers config
└── dist/                            # Build output
```

---

## 4. Routing & Layouts

### 4.1 Root Router (`src/App.jsx`)

| Route | Layout | Purpose |
|---|---|---|
| `/` | Portal | Unified login hub / default landing |
| `/store/*` | D2CLayout | Customer-facing storefront |
| `/admin/*` | AdminLayout | Enterprise admin command center |
| `/barista/*` | BaristaLayout | Kitchen Display System (KDS) |
| `/kiosk/*` | Redirects to the external Vercel ordering website | Legacy internal route retained for compatibility |
| `*` | Redirect to `/` | Catch-all |

### 4.2 Layouts

| Layout | Path | Description |
|---|---|---|
| **AdminLayout** | `src/layouts/AdminLayout.jsx` | Sidebar + sticky top header + scrollable content area. Responsive: expanded (>=1200px), collapsed (>=900px), mobile drawer (<900px). Contains AdminPageErrorBoundary for route-level error handling. |
| **BaristaLayout** | `src/layouts/BaristaLayout.jsx` | KDS-optimized layout with large touch targets and fluid typography. |
| **D2CLayout** | `src/layouts/D2CLayout.jsx` | Customer storefront layout with navigation, cart summary, and footer. |
| **KioskLayout** | `src/layouts/KioskLayout.jsx` | Legacy internal ordering layout (currently unused; the customer ordering website is external). |

---

## 5. State Management (Zustand)

| Store | File | Responsibilities |
|---|---|---|
| **useAuthStore** | `src/store/useAuthStore.js` | User session, role, token, login/logout/OTP/loadUser/profile updates. Supports mock demo credentials with localStorage fallbacks. |
| **useOrderStore** | `src/store/useOrderStore.js` | Order list, barista queue, fetch/create/updateStatus/refund/advanceBaristaOrder, SLA timers. Includes hardcoded DUMMY_ORDERS fallback when API returns empty. |
| **useCartStore** | `src/store/useCartStore.js` | D2C cart with localStorage persistence, coupon validation, tax/delivery fee calculations. |
| **useKioskStore** | `src/store/useKioskStore.js` | Kiosk cart, drink customization builder (size/milk/syrup/topping upsell pricing), completeKioskOrder flow with token generation. |
| **useNotificationStore** | `src/store/useNotificationStore.js` | Notification list, unread count, toast integration, audio chime playback (`/assets/chime.mp3`). |
| **useSidebarStore** | `src/store/useSidebarStore.js` | Admin sidebar mode (expanded/collapsed/mobile), accordion groups, pinned items, search, badge counts, theme toggle. Persists theme/group state to localStorage. |

---

## 6. Services / API Layer

Base client: `src/services/api.js`
- `ApiClient` class with `get`, `post`, `put`, `patch`, `delete` wrappers.
- Automatic JWT injection from localStorage (`dc_token`).
- Refresh-token retry logic on 401.
- Auto-logout on 401 via `CustomEvent('auth:unauthorized')`.
- Session/Store ID headers from localStorage.
- Response normalization via `src/utils/apiResponse.js` (`unwrapData`, `unwrapList`, `unwrapObject`, `unwrapMeta`) because API response shapes vary across endpoints.

### Service Modules

| Module | Path | Key Endpoints |
|---|---|---|
| **api** | `src/services/api.js` | Base HTTP client |
| **auth** | `src/services/auth.js` | loginEmail, sendOtp, verifyOtp, getMe, logout, updateProfile |
| **orders** | `src/services/orders.js` | getAll, getById, getMyOrders, create, updateStatus, cancel, cancelWithRefund, initiatePayment |
| **customers** | `src/services/customers.js` | Customer CRUD |
| **inventory** | `src/services/inventory.js` | Inventory stock levels |
| **ingredients** | `src/services/ingredients.js` | Ingredient master data |
| **rawMaterials** | `src/services/rawMaterials.js` | Raw material management |
| **recipes** | `src/services/recipes.js` | Recipe master data |
| **menuRecipes** | `src/services/menuRecipes.js` | Menu recipe mapping |
| **brewRecipes** | `src/services/brewRecipes.js` | Brew recipe mapping |
| **products** | `src/services/products.js` | Product catalog |
| **suppliers** | `src/services/suppliers.js` | Supplier management |
| **purchaseOrders** | `src/services/purchaseOrders.js` | Purchase order lifecycle |
| **waste / wasteLogs** | `src/services/waste.js`, `wasteLogs.js` | Waste tracking |
| **stores** | `src/services/stores.js` | Store management |
| **notifications** | `src/services/notifications.js` | Notifications CRUD + mark as read |
| **barista** | `src/services/barista.js` | Barista queue, acceptKOT, completeKOT, completeOrder |
| **dashboard** | `src/services/dashboard.js` | Dashboard KPIs |
| **analytics** | `src/services/analytics.js` | Analytics data |
| **b2b** | `src/services/b2b.js` | B2B wholesale orders |
| **cashManagement** | `src/services/cashManagement.js` | Cash management |
| **gst** | `src/services/gst.js` | GST/tax management |
| **loyalty** | `src/services/loyalty.js` | Loyalty program |
| **promotions** | `src/services/promotions.js` | Promotions engine |
| **subscriptions** | `src/services/subscriptions.js` | Subscription plans |
| **shipping** | `src/services/shipping.js` | Shipping/logistics |
| **cms** | `src/services/cms.js` | CMS content |
| **roles** | `src/services/roles.js` | Roles & permissions |
| **staff** | `src/services/staff.js` | Staff management |
| **equipment** | `src/services/equipment.js` | Equipment management |
| **foodSafety** | `src/services/foodSafety.js` | Food safety records |
| **quality** | `src/services/quality.js` | Quality control |
| **customDrinks** | `src/services/customDrinks.js` | Custom drink definitions |
| **d2cService** | `src/services/d2cService.js` | D2C-specific API |
| **support** | `src/services/support.js` | Support tickets |
| **customerQueries** | `src/services/customerQueries.js` | Customer queries |
| **activityLog** | `src/services/activityLog.js` | Activity logging |
| **executiveNotes** | `src/services/executiveNotes.js` | Executive notes |
| **reorderService** | `src/services/reorderService.js` | Reorder rules |
| **inventoryOps** | `src/services/inventoryOps.js` | Inventory operations (transfers, adjustments) |

---

## 7. Pages & Modules

### 7.1 Portal (Unified Login Hub)
**Path:** `src/pages/Portal/Portal.jsx`  
**Route:** `/`  
**Functionality:**
- Email/password login form with role-based redirect after auth.
- Collapsible credential drawer with demo accounts (Admin, Barista, Store Display) for quick access.
- Auto-fill on credential row click.
- Shortcut to the external coffee ordering website.
- Visible CRM copy uses “Store” or “Ordering Website”; legacy `kiosk` role/route/storage identifiers remain internal for compatibility.
- Error handling with toast notifications.

### 7.2 Admin Command Center (~35 modules)

| Module | Path | Functionality |
|---|---|---|
| **Dashboard** | `src/pages/admin/Dashboard/Dashboard.jsx` | Responsive KPI cards, weekly revenue area chart, four-product sales-mix donut, recent orders table, and store-terminal status for the five ordering-site locations. |
| **Orders** | `src/pages/admin/Orders/Orders.jsx` | Order management table with pagination, CSV export, Ready-aware status filtering, compact inline status menu, and a centered View modal with order timeline/items/invoice actions. Refund UI has been removed. |
| **Menu / Products** | `src/pages/admin/Menu/Menu.jsx` | Displays only the four approved ordering-site concentrate products. Production API rows are reconciled against the approved catalog so unrelated backend products cannot replace the local list. Matching records retain backend ID, stock, and active/draft state. |
| **Recipes** | `src/pages/admin/Recipes/Recipes.jsx` | Recipe management with tabs (Menu, Engine, Customer, Brew), compatibility rules, ingredient mapping. |
| **Inventory** | `src/pages/admin/Inventory/Inventory.jsx` | Inventory tracking with timeline, cards, stock levels, search/filter. |
| **Ingredients** | `src/pages/admin/Ingredients/Ingredients.jsx` | Ingredient master data management. |
| **CentralInventory** | `src/pages/admin/CentralInventory/CentralInventory.jsx` | Central warehouse inventory with movement modals and timeline. |
| **RawMaterials** | `src/pages/admin/RawMaterials/RawMaterials.jsx` | Raw material procurement and stock. |
| **Production** | `src/pages/admin/Production/Production.jsx` | Production batch wizard, KPI cards, batch detail drawer, active batches. |
| **RecipeBuilder** | `src/pages/admin/RecipeBuilder/*.jsx` | Beverage formulator, recipe detail, costing summary. |
| **BrewRecipes** | `src/pages/admin/BrewRecipes/**/*.jsx` | Brew recipe cards, builder, detail drawer, live cost card, material rows. |
| **Customers** | `src/pages/admin/Customers/Customers.jsx` | Customer list, profiles, search, add/edit. |
| **Suppliers** | `src/pages/admin/Suppliers/Suppliers.jsx` | Supplier master data. |
| **PurchaseOrders** | `src/pages/admin/PurchaseOrders/PurchaseOrders.jsx` | Purchase order lifecycle (create, approve, track). |
| **WasteLogs** | `src/pages/admin/WasteLogs/WasteLogs.jsx` | Waste tracking and logging. |
| **StoreTransfers** | `src/pages/admin/StoreTransfers/StoreTransfers.jsx` | Inter-store transfer requests and tracking. |
| **Packaging** | `src/pages/admin/Packaging/Packaging.jsx` | Packaging types and inventory. |
| **CashManagement** | `src/pages/admin/CashManagement/CashManagement.jsx` | Cash drawer, denominations, reconciliation. |
| **B2B** | `src/pages/admin/B2B/B2B.jsx` | B2B wholesale orders and clients. |
| **GST** | `src/pages/admin/GST/GST.jsx` | GST returns, filing, reconciliation. |
| **Loyalty** | `src/pages/admin/Loyalty/Loyalty.jsx` | Loyalty program configuration and member management. |
| **Promotions** | `src/pages/admin/Promotions/Promotions.jsx` | Promotions, discounts, coupons. |
| **Subscriptions** | `src/pages/admin/Subscriptions/Subscriptions.jsx` | Subscription plans and subscriber management. |
| **Support** | `src/pages/admin/Support/Support.jsx` | Customer support tickets, status updates, assignment. |
| **Quality** | `src/pages/admin/Quality/Quality.jsx` | Quality checks and reports. |
| **Equipment** | `src/pages/admin/Equipment/Equipment.jsx` | Equipment maintenance and tracking. |
| **FoodSafety** | `src/pages/admin/FoodSafety/FoodSafety.jsx` | Food safety compliance and audits. |
| **Staff** | `src/pages/admin/Staff/Staff.jsx` | Staff roster, shifts, attendance. |
| **Shipping** | `src/pages/admin/Shipping/Shipping.jsx` | Shipping partners, tracking, rates. |
| **DailyOps** | `src/pages/admin/DailyOps/DailyOps.jsx` | Daily operations checklist and logs. |
| **CustomerQueries** | `src/pages/admin/CustomerQueries/CustomerQueries.jsx` | Customer query management. |
| **CompatibilityRules** | `src/pages/admin/CompatibilityRules/CompatibilityRules.jsx` | Drink customization compatibility rules (milk, syrups, toppings). |
| **Categories** | `src/pages/admin/Categories/Categories.jsx` | Product category management. |
| **Analytics** | `src/pages/admin/Analytics/Analytics.jsx` | Advanced analytics and reporting. |
| **Notifications** | `src/pages/admin/Notifications/Notifications.jsx` | Notification center, mark as read, clear all. |
| **Stores** | `src/pages/admin/Stores/Stores.jsx` | Multi-store management. |
| **Financials** | `src/pages/admin/Financials/Financials.jsx` | Financial reports and summaries. |
| **Settings** | `src/pages/admin/Settings/Settings.jsx` | App settings and configuration. |
| **CMS** | `src/pages/admin/CMS/CMS.jsx` | Content management for storefront. |
| **Roles** | `src/pages/admin/Roles/Roles.jsx` | Role-based access control. |
| **Login** | `src/pages/admin/Login/Login.jsx` | Admin login page (now routes to Portal via redirect). |

### 7.3 Barista KDS

| Module | Path | Functionality |
|---|---|---|
| **OrderQueue** | `src/pages/barista/OrderQueue/OrderQueue.jsx` | Live order queue with KOT generation, status progression, timer SLA. |
| **ActivePrep** | `src/pages/barista/ActivePrep/ActivePrep.jsx` | Currently active preparation orders. |
| **CompletedOrders** | `src/pages/barista/CompletedOrders/CompletedOrders.jsx` | Recently completed orders. |
| **DelayedOrders** | `src/pages/barista/DelayedOrders/DelayedOrders.jsx` | Delayed/SLA-breached orders. |
| **Performance** | `src/pages/barista/Performance/Performance.jsx` | Barista performance metrics and stats. |

### 7.4 D2C Storefront

| Module | Path | Functionality |
|---|---|---|
| **Home** | `src/pages/d2c/Home/Home.jsx` | Landing page, featured products, promos. |
| **Catalog** | `src/pages/d2c/Catalog/Catalog.jsx` | Product catalog with category filtering, search, sorting, add-to-cart. |
| **ProductDetail** | `src/pages/d2c/ProductDetail/ProductDetail.jsx` | Product detail page with variants, customization, add to cart. |
| **Cart** | `src/pages/d2c/Cart/Cart.jsx` | Shopping cart with quantity controls, coupon code, summary. |
| **Checkout** | `src/pages/d2c/Cart/Checkout.jsx` | Checkout form, address, payment, order summary. |
| **OrderSuccess** | `src/pages/d2c/OrderSuccess/OrderSuccess.jsx` | Order confirmation page. |
| **Profile** | `src/pages/d2c/Profile/Profile.jsx` | Customer profile, order history, favorites, addresses. |
| **Subscription** | `src/pages/d2c/Subscription/Subscription.jsx` | Subscription plans and management. |
| **Collections** | `src/pages/d2c/Collections/Collections.jsx` | Curated product collections. |
| **Auth/Login** | `src/pages/d2c/Auth/Login.jsx` | Customer login/registration. |
| **About** | `src/pages/d2c/About/About.jsx` | About page. |
| **Contact** | `src/pages/d2c/Contact/Contact.jsx` | Contact page. |

### 7.5 Customer Ordering Website (External)

The customer ordering website is maintained in `F:\Projects\coffee-ordering-kiosk` and is live on Vercel. The legacy `src/pages/kiosk/` implementation and `/kiosk` identifiers remain in this repository for compatibility, but the CRM UI does not expose “Kiosk” terminology.

| Module | Path | Functionality |
|---|---|---|
| **Home** | `src/pages/kiosk/Home/Home.jsx` | Kiosk home/start screen. |
| **Catalog** | `src/pages/kiosk/Catalog/Catalog.jsx` | Kiosk product browsing with category sidebar and cart summary. |
| **CustomDrink** | `src/pages/kiosk/CustomDrink/CustomDrink.jsx` | Drink customizer with size/milk/syrup/topping compatibility rules. |
| **Checkout** | `src/pages/kiosk/Checkout/Checkout.jsx` | Kiosk checkout and payment. |
| **Login** | `src/pages/kiosk/Login/Login.jsx` | Kiosk user login. |
| **QrOrder** | `src/pages/kiosk/QrOrder/QrOrder.jsx` | QR code scanning for pre-built orders. |
| **TokenConfirmation** | `src/pages/kiosk/TokenConfirmation/TokenConfirmation.jsx` | Pickup token display. |

---

## 8. Shared Components

| Component | Path | Purpose |
|---|---|---|
| **DataTable** | `src/components/ui/DataTable.jsx` | Reusable table with search, multi-column sort, pagination, CSV export, sticky right column, row view/delete actions. |
| **SlideOver** | `src/components/ui/SlideOver.jsx` | Slide-over panel component. |
| **Skeleton** | `src/components/ui/Skeleton.jsx` | Loading skeleton placeholders. |
| **Button** | `src/components/Button/` | Button variants (primary, outline, danger, ghost). |
| **Card** | `src/components/Card/` | Card container. |
| **Modal** | `src/components/Modal/` | Modal dialog. |
| **Tabs** | `src/components/Tabs/` | Tabbed navigation. |
| **Dropdown** | `src/components/Dropdown/` | Dropdown menu. |
| **SearchBar** | `src/components/SearchBar/` | Search input. |
| **EmptyState** | `src/components/EmptyState/` | Empty state illustration. |
| **ErrorState** | `src/components/ErrorState/` | Error state display. |
| **KPICard** | `src/components/KPICard/` | Key performance indicator card. |
| **Avatar** | `src/components/Avatar/` | User avatar with color hashing. |
| **Badge** | `src/components/Badge/` | Status badge. |
| **Input** | `src/components/Input/` | Form input. |
| **Timeline** | `src/components/Timeline/` | Timeline component. |
| **Table** | `src/components/Table/` | Table wrapper. |
| **Logo** | `src/components/Logo/Logo.jsx` | Text-based logo with badge. |
| **CustomizationModal** | `src/components/CustomizationModal/` | Drink customization modal. |
| **InlineDrinkBuilder** | `src/components/InlineDrinkBuilder/` | Inline drink builder. |
| **CupAnimation** | `src/components/CupAnimation/` | 3D cup animation. |
| **Visualizer** | `src/components/Visualizer/` | Liquid visualizer. |
| **ProductMedia** | `src/components/ProductMedia/` | Product image/video handling. |
| **SensoryProfiler** | `src/components/SensoryProfiler/` | Flavor profile selector. |
| **System Components** | `src/components/system/` | Brew system-related components. |
| **Motion Components** | `src/components/Motion/` | Framer Motion wrappers. |
| **ScrollVideoFrame** | `src/components/ScrollVideoFrame/` | Scroll-driven video frame. |
| **RecipeDiscoverer** | `src/components/RecipeDiscoverer/` | Recipe discovery UI. |
| **LoyaltyClub** | `src/components/LoyaltyClub/` | Loyalty club UI. |

---

## 9. Hooks & Utilities

### Hooks (`src/hooks/`)
- **useWebSocket.js** — WebSocket lifecycle, auto-reconnect with 5s backoff, event normalization for NEW_ORDER, ORDER_STATUS, STOCK_ALERT, NEW_NOTIFICATION. Triggers store refreshes.
- **useIdleTimeout.js** — Idle session management (useful for kiosk).
- **useDebounce.js** — Debounce utility for search inputs.
- **useMediaQuery.js** — Responsive breakpoint hook.

### Utils (`src/utils/`)
- **apiResponse.js** — `unwrapData`, `unwrapList` (handles ~25 domain-specific array keys), `unwrapMeta`, `unwrapObject`.
- **formatters.js** — Currency, date, time, number formatting.
- **validators.js** — Email, phone, required field validation.
- **permissions.js** — Role/permission policy checks.
- **i18n.js** — `t()` translation helper with fallback to English.
- **constants.js** — Shared constants (status labels, etc.).
- **compatibility.js** — Drink customization compatibility checks.

---

## 10. Design System & Styling

### Global Design Tokens (`src/styles/global.css`)
- **Font:** Author (variable, 200-800 weight), Outfit, Inter, Playfair Display via Google Fonts.
- **Color System:** Espresso (`#1F2A44`) / Cream (`#F5F9FC`) / Caramel/Gold (`#007AFF`) for D2C; White-canvas SaaS minimal for Admin (`.admin-layout-new` overrides).
- **Spacing:** CSS custom properties from `--space-2` to `--space-128`.
- **Typography:** Fluid scale with `clamp()` for responsive sizing.
- **Motion:** Keyframes (fadeIn, slideInRight, scaleIn, shimmer, pulse, spin) + transition tokens.
- **Elevation:** `--elevation-0` through `--elevation-float`.
- **Z-Index Scale:** Base to max (`--z-modal`, `--z-drawer`, `--z-overlay`, etc.).
- **Admin Shell:** `.al-root`, `.al-main-panel`, and `.al-content` scope the current sidebar/header/content layout. Legacy `.admin-layout-new` overrides still exist in `global.css` but are not the active root class.
- **KDS Rules:** Fluid type and large touch targets for barista displays.
- **Responsive Breakpoints:** 768px (mobile), 1024px (tablet), 1920px+ (large screens).

### Component-level CSS
Each page/component has a co-located `.css` file (e.g., `Orders.css`, `Dashboard.css`, `Inventory.css`).

---

## 11. Infrastructure & Deployment

### Cloudflare Workers
Config file: `wrangler.jsonc`
- Serves the Vite-built SPA as static assets.
- SPA fallback routing enabled (`not_found_handling: "single-page-application"`).
- `nodejs_compat` compatibility flag enabled.
- Observability enabled.

### Production URLs
- **CRM frontend:** Live on Vercel (production URL not recorded in this document).
- **Backend API:** Separate REST + WebSocket service deployed on a third-party host (URL redacted).
- **Customer ordering website:** Live on Vercel at `https://coffee-ordering-kiosk.vercel.app`.

The repository still includes Cloudflare Workers configuration (`wrangler.jsonc`) as an alternative deployment target.

### Environment Variables
- `VITE_API_URL` — API base URL override. If unset, auto-detects based on hostname (localhost → local dev; Vercel/Render domain → production API).

---

## 12. Mock Data & Demo Credentials

### Demo Accounts (for development/demo)
| Role | Email | Password |
|---|---|---|
| Super Admin | `[REDACTED]` | `[REDACTED]` |
| Barista | `[REDACTED]` | `[REDACTED]` |
| Store Display (internal role: `kiosk`) | `[REDACTED]` | `[REDACTED]` |

**Note:** These are hardcoded in `src/store/useAuthStore.js` with localStorage token fallbacks.
Remove or gate behind environment flags before production.

### Dummy Data Fallbacks
- `useOrderStore.js` — 5 hardcoded DUMMY_ORDERS used when API returns empty.
- `Dashboard.jsx` — Separate `DUMMY_LIVE_ORDERS` and `DASHBOARD_METRICS` constants.
- `Menu.jsx` — Starts from the four-product approved ordering-site catalog and reconciles matching production API metadata without admitting unrelated products.
- Purpose: Graceful degradation for demos when backend is unavailable.

---

## 13. Real-Time & Notifications

- **WebSocket:** `src/hooks/useWebSocket.js` connects for staff roles (`barista`, `store_manager`, `admin`, `super_admin`).
- **Events:** NEW_ORDER, ORDER_STATUS, STOCK_ALERT, NEW_NOTIFICATION.
- **Auto-reconnect:** 5-second backoff.
- **Toast + Audio:** `useNotificationStore.js` triggers `react-hot-toast` and plays `/assets/chime.mp3` on new notifications.
- **Polling:** Admin sidebar badges (pending orders, low stock, open tickets) update via `useEffect` watching store data.

---

## 14. Key Functional Flows

### Order Lifecycle
1. Customer places an order through the customer ordering website → `POST /orders`.
2. Order appears in Admin Orders + Barista KDS via WebSocket `NEW_ORDER`.
3. Barista advances status: pending → in_progress → ready → completed via KDS actions.
4. Admin can also update status inline from Orders table (badge picker).
5. Completed orders can be printed/invoiced.

Refund services remain in the API/store layer for compatibility, but the CRM Orders interface no longer exposes a Refund button or refund modal.

### Inventory Flow
- Central inventory → store transfers → store-level inventory.
- Raw materials → production batches → finished goods.
- Low stock alerts via WebSocket → notification + toast.

### Subscription Flow
- Plan selection → recurring billing → subscriber management.
- Integrated with D2C checkout and customer profile.

---

## 15. Notable Patterns & Decisions

- **No TypeScript:** Entire codebase is JavaScript with `@types/react` only in devDependencies.
- **Inline Styles:** Heavy use of inline `style={{}}` objects despite a robust CSS custom property system.
- **Multiple Token Systems:** CSS variables in `global.css`, unused JS tokens in `design-system/tokens/`, and hardcoded hex values in components.
- **API Response Unwrap:** `apiResponse.js` normalizes inconsistent backend response shapes.
- **Error Boundaries:** `AdminPageErrorBoundary` wraps admin route outlets.
- **Orders View Modal:** Orders open in a centered, screen-level modal with backdrop and Escape/close handling rather than the former right-side slide-over.
- **Approved Product Catalog:** The Products page treats the external ordering-site concentrate catalog as the display allowlist. A successful production API response can enrich matching products but cannot inject unrelated rows.
- **Commented-Out Code:** Kiosk routes in `App.jsx` and legacy sidebar code in `Sidebar.jsx` remain but are inactive.

---

## 16. Dependencies Summary

| Dependency | Purpose |
|---|---|
| `@tanstack/react-query` | Server state caching (installed but largely supplemented by Zustand + services) |
| `framer-motion` | Page transitions and micro-interactions |
| `recharts` | Dashboard charts |
| `@react-three/fiber/drei/rapier` + `three` | 3D cup/liquid visualizers with physics |
| `zustand` | Global client state (6 stores) |
| `lucide-react` | Icon system |
| `react-hot-toast` | Toast notifications |
| `@cloudflare/vite-plugin` + `wrangler` | Cloudflare Workers build/deploy |
| `react-router-dom` | Nested route layout shells |

---

## 17. Current CRM Alignment (July 24, 2026)

This section records the completed CRM alignment work that supersedes older UI screenshots or descriptions.

### 17.1 Visible Terminology

- The CRM no longer displays the word “Kiosk” in user-facing admin/portal copy.
- Visible replacements use **Store**, **Store Display**, **Store Network**, or **Coffee Ordering Website**, depending on context.
- Updated surfaces include Portal/Login, Dashboard, Products, Recipes, Recipe Builder, Financials, Support, and recipe approval/menu copy.
- Internal identifiers such as `/kiosk`, `useKioskStore`, `is_available_kiosk`, `chilld_kiosk_*`, CSS class names, and source filenames are intentionally retained to avoid breaking routing, persisted data, API contracts, or ordering-site synchronization.

### 17.2 Dashboard

- Header: **Chilld Coffee Operations**.
- KPI cards:
  - Total Revenue
  - Total Orders
  - Pipeline Volume
  - Active Web Sessions
  - Satisfaction
- The chart section contains:
  - **Weekly Sales & Revenue Trend**
  - **Product Mix** donut chart
- Product Mix covers the complete approved catalog:

| Product | Sales Share |
|---|---:|
| Bold Concentrate | 32% |
| Classic CB Concentrate | 29% |
| Kaapi Concentrate | 24% |
| Discovery Kit | 15% |

- The Product Mix panel uses a responsive two-column donut/legend layout and stacks internally when its container is narrow, preventing cropping when the sidebar is expanded.
- Lower panels are **Recent Orders** and **Store Terminals**.
- Dashboard panel typography was enlarged without heavy bold styling:

| Element | Size | Weight |
|---|---:|---:|
| Section headings | 21px | 500 |
| Section subtitles | 15px | 400 |
| Product Mix labels | 14.5px | 400 |
| Product Mix percentages | 14.5px | 500 |
| Recent Orders headers | 14px | 500 |
| Recent Orders cells | 15px | 400 |
| Store terminal names | 15px | 500 |
| Store terminal locations | 13.5px | 400 |

### 17.3 Store Selector and Store-Terminal Data

`src/data/crmStores.js` mirrors the public locations from `F:\Projects\coffee-ordering-kiosk\src\data\locations.js`.

The **All Stores** selector always contains:

1. Indiranagar
2. Koramangala
3. HSR Layout
4. Whitefield
5. MG Road

`TopHeader.jsx` preloads these locations and then de-duplicates any additional API stores by normalized store name. Dashboard terminal names and addresses use the same five locations.

### 17.4 Orders

- Summary cards use the shared dashboard metric-card visual language.
- Metric-card typography uses larger regular-weight text:
  - Label: 14px / 400
  - Value: 30px / 400
  - Description: 15px / 400
- Search/filter controls include **All Orders**, **Completed**, **In Progress**, **Pending**, **Ready**, and **Cancelled**.
- Clicking **View** opens a centered modal over a backdrop. It supports the close button, backdrop dismissal, and Escape.
- The modal shows customer information, order details, progress timeline, ordered items, totals, status actions, and invoice access.
- The Refund button and refund confirmation UI were removed.
- The inline status changer follows the compact reference design:
  - 136×36px colored trigger pill
  - Two colored dots and a chevron
  - White 150px floating menu with 7px radius and soft shadow
  - 32px menu rows
  - Colored status dots
  - Neutral highlighted active row with a right-aligned checkmark
- Status options remain domain-specific: Pending, In Progress, Ready, Completed, and Cancelled.
- Selecting a status updates local state immediately and then attempts backend synchronization.

### 17.5 Approved Products and Production Reconciliation

The CRM catalog source `src/data/kioskProducts.js` is byte-for-byte identical to the ordering website source `F:\Projects\coffee-ordering-kiosk\src\data\products.js` as of July 24, 2026.

Only these products may appear in the CRM Products table:

1. Bold Concentrate
2. Classic CB Concentrate
3. Kaapi Concentrate
4. Discovery Kit

Production behavior:

- `Menu.jsx` always begins with the four approved catalog products.
- A successful `/products` response is reconciled by normalized product ID, slug, SKU, or name.
- Matching API products may contribute backend ID, category ID, recipe/concentrate links, stock quantity, created date, and active/draft state.
- The ordering-site name, description, price, image, and concentrate category remain the displayed catalog values.
- Unrelated backend products are discarded instead of replacing the approved list.
- Product category filters are derived only from the four displayed products, preventing unrelated API categories from appearing in the filter.

Optimized ordering-site thumbnails included in the CRM:

- `public/images/products/BoldConcentrate325.png`
- `public/images/products/ClassicCBConc325.png`
- `public/images/products/KappiConcentrate325.png`
- `public/3inone.jpeg`

These files total roughly 395 KB and replace the need to copy approximately 16 MB of full-resolution product assets.

### 17.6 Verification and Deployment Notes

Completed verification:

- `npm run build` passes with Vite 8.
- Browser QA confirmed the Dashboard, Orders status interaction, centered order modal, store selector, larger typography, and approved Products table.
- A production-like test injected a successful API response containing Cappuccino, Cafe Latte, and Chocolate Shake. The CRM still displayed exactly the four approved products and no unrelated rows.
- Product category filtering was exercised (Bold → one result → All → four results).
- No React page errors or framework error overlays were observed.

Known environment notes:

- Local API/WebSocket connection warnings are expected when the backend at `localhost:3000` is offline; the CRM uses local fallback data in that condition.
- A transient Recharts container-size warning may appear during route/viewport transitions without causing a visible layout failure.
- The Codex in-app browser helper is currently blocked by the user-level `C:\Users\HP\package.json` setting `"type": "module"`; standalone Playwright was used for rendered verification.
- Neither repository contains `.vercel/project.json`, and the currently connected Vercel account does not expose the CRM or ordering-site projects. Source changes must be committed/pushed or deployed from the Vercel account/project that owns the live sites.

---

## 18. Confidential Information (Redacted)

The following categories of data have been omitted from this document for security:
- API keys, service account keys, and signing secrets
- JWT secrets, refresh tokens, and session keys
- Database connection strings and credentials
- Internal hostnames / private IP addresses for backend services
- Production API base URLs and internal service endpoints
- Third-party webhook secrets and callback URLs
- Any passwords or credentials beyond the demo accounts listed above

If you need the exact values for any of these, consult your secrets manager, `.env` files,
or deployment platform directly — do not hardcode them into documentation.
