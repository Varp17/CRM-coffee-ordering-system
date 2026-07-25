# CHILLD CRM — Project Information

**Project:** `coffee-ordering-system`  
**Last verified:** July 24, 2026  
**Local URL:** `http://localhost:5173`

## 1. Purpose and Scope

This React application contains:

- the unified staff portal
- the CHILLD admin/CRM command center
- the barista kitchen display system (KDS)
- a redirect to the active public ordering website
- a separate legacy D2C storefront under `/store/*`

The admin CRM’s linked operational pages read the same backend used by `coffee-ordering-kiosk`. The customer website creates customers, orders, recipes, and contact messages; the CRM displays and manages those backend records.

The public customer ordering application is `coffee-ordering-kiosk`. The CRM’s `/store/*` tree is not its replacement.

## 2. Technology

| Area | Current implementation |
|---|---|
| UI | React 19.2.6 |
| Build | Vite 8.0.12 |
| Routing | React Router 7.15 |
| State | Zustand 5 |
| Server state | TanStack React Query 5 |
| Charts | Recharts 3 |
| Motion/3D | Framer Motion, Three.js, React Three Fiber, Drei, Rapier |
| Icons/toasts | Lucide React, React Hot Toast |
| Deployment option | Cloudflare Vite plugin and Wrangler |

Vite runs on port 5173. It proxies `/api/v1` to the local backend and `/ws` to the backend WebSocket service.

## 3. Data Policy

The active CRM admin pages must use backend data or a clear empty/error state.

- Embedded CRM dummy orders were removed.
- Embedded dashboard live-order and metric constants were removed.
- CRM Customers, Recipes, Orders, Dashboard, Products, and Support now reconcile with backend responses.
- A backend record may still be test data if somebody created it in the backend; the CRM does not delete or disguise database records.
- API failures must not restore old dummy records.
- Removing CRM dummy data does not authorize deletion of backend, website, or recipe data.

Important scope exception:

`src/data/mockData.js` still supports parts of the **legacy `/store/*` D2C storefront**, including collections/catalog-style content and coupons. That isolated legacy data is not used as the primary admin Orders/Dashboard/Customers/Recipes source.

The API client also contains compatibility handling for old `mock-*` login tokens. It returns empty collections—not fabricated business records—when such a token cannot access the backend. This compatibility path and demo authentication should be removed or environment-gated before production.

## 4. Root Routing

### Portal

| Route | Purpose |
|---|---|
| `/` | Unified role/login portal |

`/admin/login` redirects to the portal.

### Admin

All routes below are under `/admin`.

| Area | Routes |
|---|---|
| Dashboard | `/admin` |
| Orders | `/admin/orders` |
| Products | `/admin/products`, `/admin/menu` |
| Recipes | `/admin/recipes` |
| Product rules | `/admin/compatibility-rules`, `/admin/categories` |
| Stock/production | `/admin/inventory`, `/admin/ingredients`, `/admin/central-inventory`, `/admin/raw-materials`, `/admin/rd`, `/admin/production` |
| Customers | `/admin/customers` |
| Supply chain | `/admin/suppliers`, `/admin/purchase-orders`, `/admin/store-transfers`, `/admin/shipping` |
| Operations | `/admin/waste-logs`, `/admin/packaging`, `/admin/daily-ops` |
| Finance/commercial | `/admin/cash`, `/admin/b2b`, `/admin/gst`, `/admin/financials` |
| Retention | `/admin/loyalty`, `/admin/promotions`, `/admin/subscriptions` |
| Service/compliance | `/admin/support`, `/admin/customer-queries`, `/admin/quality`, `/admin/equipment`, `/admin/food-safety` |
| Workforce | `/admin/staff`, `/admin/shifts`, `/admin/roles` |
| Legacy/admin utilities | `/admin/settings`, `/admin/reports`, `/admin/marketing`, `/admin/analytics`, `/admin/notifications`, `/admin/stores`, `/admin/cms` |

Some extended admin modules have frontend and service code but do not have a matching route in the current shared backend. See “Backend Coverage.”

### Barista KDS

| Route | Purpose |
|---|---|
| `/barista` | Order queue |
| `/barista/active` | Active preparation |
| `/barista/completed` | Completed orders |
| `/barista/delayed` | Delayed orders |
| `/barista/performance` | Performance view |

### Customer Website Redirect

`/kiosk` currently redirects to the hardcoded GitLab Pages customer URL. The previous internal kiosk route tree is commented out in `src/App.jsx`.

There is a deployment-link inconsistency: the Portal and recipe media default to `https://coffee-ordering-kiosk.vercel.app`, while `KioskRedirect` points to `https://coffee-ordering-kiosk-248e1f.gitlab.io/`. These should be unified before production.

### Legacy D2C Storefront

`/store/*` includes home, catalog, product detail, cart, checkout, profile, subscription, collections, custom drink, success, login, about, and contact routes.

This route family has a dedicated `/store/cart`, but that does **not** mean the active public website has a `/cart` page. The active `coffee-ordering-kiosk` project uses a cart drawer and `/checkout`.

## 5. Linked CRM Surfaces

### Dashboard

Dashboard data is derived from backend orders. It calculates:

- total revenue
- total order count
- pending-payment count
- paid-order count
- distinct ordering customers
- weekly sales trend
- product mix/share
- recent orders
- activity by configured store/location

There are no embedded fallback order arrays or static headline metric constants in the current dashboard.

### Orders

Orders reads `GET /orders` and starts empty until the request resolves.

Supported behavior includes:

- search/filtering
- order detail
- payment and order state display
- operational status updates through `PATCH /orders/:id/status`
- real-time reconciliation from order events

If the request fails, the page exposes the failure/empty condition. It does not load removed dummy orders.

### Products/Menu

The primary CRM Products page reads the backend but presents the approved website catalog by stable product ID:

- `coffee-50-50-concentrate`
- `classic-cb-concentrate`
- `sif-concentrate`
- `sampler-concentrate`

Matching backend metadata is reconciled into these records. Unrelated backend products are not automatically admitted to the website-approved product display.

### Customers

Customers reads backend customer records and related notes. Website OTP registration and verified orders are therefore visible without a separate CRM import.

### Recipes

The Recipes page reads `GET /recipes/admin/all` and displays the website’s imported recipe catalog in two moderation groups.

Verified baseline:

- 21 total website recipes
- 14 approved
- 7 pending

Actions:

- Approve persists with `PATCH /recipes/admin/:id/status`.
- Reject/Delete calls `DELETE /recipes/admin/:id`, which soft-deactivates the backend recipe.
- Website images/video are displayed using `VITE_ORDERING_WEBSITE_URL` or the configured default website origin.

The records originate in `coffee-ordering-kiosk/src/data/recipes.js` and are imported by the backend command `npm run import:website-recipes`. They are website content, not CRM dummy records.

### Support

Website `POST /contact` submissions become backend support tickets. The CRM can:

- list tickets and aggregates
- open ticket detail
- change status
- change priority
- assign an agent
- read replies
- add a reply

### Inventory and Ingredients

Inventory-related pages use their service modules and empty/error states. However, current shared-backend route coverage is narrower than the total CRM navigation. A page existing in the router does not guarantee that its corresponding server endpoint is mounted.

## 6. Static Configuration That Is Not Dummy Business Data

The global store selector uses `src/data/crmStores.js`:

| ID | Store/location |
|---|---|
| `loc001` | Indiranagar |
| `loc002` | Koramangala |
| `loc003` | HSR Layout |
| `loc004` | Whitefield |
| `loc005` | MG Road |

This is currently configuration/presentation data. There is no mounted backend stores endpoint populating the selector.

Dashboard maps order locations against its configured terminal/store list to calculate activity. That does not create orders or revenue.

## 7. API Client

`src/services/api.js` selects the API base as follows:

- `VITE_API_URL` when provided
- Vercel host: `https://coffee-website-backend.onrender.com/api/v1`
- localhost: `http://localhost:3000/api/v1`
- other hosts: relative `/api/v1`

The client:

- sends JSON
- attaches `dc_token`
- sends stored session/store headers
- attempts one refresh-token retry after a 401
- clears invalid auth and dispatches `auth:unauthorized`
- falls back from an unreachable local backend to the production backend
- normalizes HTTP/network failures as `ApiError`

For an old `mock-*` token, a 401/network failure currently returns an empty response shape to preserve portal compatibility. It must not be described as real authenticated production behavior.

## 8. Backend Coverage

The current shared backend mounts:

- auth
- customers and customer notes
- products
- categories
- orders and payment verification
- recipes and moderation
- contact messages
- support ticket workflow
- health

These power the primary linked customer-to-CRM flow.

Several CRM service modules and screens exist for a broader ERP roadmap, including advanced inventory, procurement, transfers, stores, finance, subscriptions, loyalty, compliance, staff, shipping, and CMS functions. Some of those expect endpoints not mounted by the current backend. They must be verified individually before being called production-integrated.

## 9. State Management

Major Zustand areas include:

- authentication/role/session
- backend order list and status changes
- legacy D2C cart
- old internal kiosk state
- UI/sidebar/theme behavior
- notifications

The active admin order store is backend-driven and initializes with no orders.

Notification state is currently client-side and WebSocket-oriented. It does not use a persistent notification API. Mark/read/clear operations are local presentation behavior.

## 10. Real-Time Behavior

`useWebSocket` is initialized at the application root. Order creation and status events can update CRM/KDS views without waiting for a manual reload.

Local Vite proxy:

- `/ws` → `ws://localhost:3000`

Real-time events improve freshness, but REST responses and backend database state remain authoritative.

## 11. Authentication Status

The portal supports development/demo role access and stores local compatibility tokens. The backend `/auth/login-email` flow is not yet a production-grade staff authentication system and does not currently enforce a complete password-validation model.

Before production:

- remove or environment-gate demo identities
- remove mock-token compatibility
- implement verified staff credentials and role authorization
- review route-level admin/KDS protection
- rotate any development credentials

Credentials are intentionally not copied into this document.

## 12. Relationship to Website Orders and Payments

The CRM does not capture customer card or UPI information.

The customer website opens Razorpay, while the backend:

- validates catalog items
- computes authoritative subtotal, GST, and takeaway packaging
- creates the Razorpay order
- verifies the Razorpay signature
- persists payment/order state
- decrements stock after verification
- broadcasts order events

CRM Orders and Dashboard then read that server result. A browser-side payment callback alone is never sufficient to show an order as paid.

The Razorpay integration path has been code-verified in test mode. Live capture, webhook, settlement, and account dashboard configuration still require account-level verification.

## 13. Repository Structure

```text
src/
├── App.jsx                    Root routing and app-level WebSocket hook
├── components/               Shared CRM/store UI
├── data/
│   ├── crmStores.js          Static selector configuration
│   └── mockData.js           Legacy /store support only
├── features/                 Customizer and domain features
├── hooks/                    WebSocket and shared hooks
├── layouts/
│   ├── AdminLayout.jsx
│   ├── BaristaLayout.jsx
│   └── D2CLayout.jsx
├── pages/
│   ├── admin/
│   ├── barista/
│   ├── d2c/
│   └── Portal/
├── services/                 REST service modules
├── store/                    Zustand stores
├── styles/                   Global tokens/styles
└── utils/                    Formatting and shared helpers
```

## 14. Environment and Deployment

Frontend variables:

- `VITE_API_URL`
- `VITE_ORDERING_WEBSITE_URL`

Never expose backend database, JWT, mail/OTP, or Razorpay secret values through `VITE_*`.

`wrangler.jsonc` configures a Cloudflare static SPA deployment with:

- single-page application fallback
- `nodejs_compat`
- observability

The project also has a Vercel-compatible production API selection. The exact CRM production URL is not recorded as a source-of-truth value here.

## 15. Development

```powershell
npm install
npm run dev
npm run build
npm run preview
npm run deploy
npm run lint
```

To run the full workspace from `F:\Projects\CHILLD-Coffee`:

```powershell
npm run dev
```

The shared backend must be available locally on port 3000 for fully local API and WebSocket testing.

## 16. Verification Baseline

Verified on July 24, 2026:

- CRM production build passes.
- Dashboard, Orders, Products, Customers, Recipes, and Support use shared-backend data paths.
- CRM dummy orders and dashboard metric/live-order arrays are absent.
- Website recipe import produces 21 CRM records with 14 approved and 7 pending.
- Recipe approval/rejection is persisted through the backend.
- Linked CRM pages do not repopulate removed dummy business records on API failure.
- Website/backend/CRM product and order identifiers are compatible.
- Linked browser checks completed without API or console errors.

## 17. Known Limits

- Production build reports a chunk larger than 500 kB.
- Repository-wide lint contains legacy debt.
- Legacy `/store/*` still uses isolated mock catalog/coupon/profile content.
- Static CRM store configuration is not a backend stores service.
- Notifications are not persisted by a backend notification API.
- Some extended admin pages do not yet have matching shared-backend endpoints.
- Demo portal access and email login are not production-grade staff authentication.
- `/kiosk` is an external redirect; old internal kiosk components remain commented.
- The `/kiosk` GitLab redirect does not match the Vercel URL used by the Portal and recipe media.
- A live Razorpay account-level audit is still required before production launch.
