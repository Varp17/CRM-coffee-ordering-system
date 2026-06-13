# ☕ Digital Coffee — Enterprise QSR Digital Ecosystem

Welcome to **Digital Coffee**, a premium, high-fidelity beverage-tech platform designed to modernize cafe operations and direct-to-consumer digital touchpoints. The platform is styled in a curated warm caramel design system with a clean, light off-white layout.

---

## 🌟 Multi-Interface Unified Ecosystem

Digital Coffee operates as a single-page application powered by **React 19**, **Vite**, and **Zustand**, driving four distinct role-based sub-systems under a unified client router:

```
                              ┌───────────────────────────┐
                              │    OPERATOR AUTH PORTAL   │
                              └─────────────┬─────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
         ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
         │   D2C STOREFRONT    │ │  ADMIN COMMAND CTR  │ │     BARISTA KDS     │
         │   `http://.../`     │ │ `http://.../admin`  │ │ `http://.../barista`│
         └──────────┬──────────┘ └─────────────────────┘ └──────────▲──────────┘
                    │                                               │
                    │           ┌─────────────────────┐             │
                    └──────────►│ SELF-ORDERING KIOSK ├─────────────┘
                                │ `http://.../kiosk`  │ [Checkout Syncs KDS]
                                └─────────────────────┘
```

### 1. 🛍️ Direct-to-Consumer (D2C) Storefront (`/`)
* **Brand Story & Landing**: Fully fluid layout with campaign hero banners, customer testimonials, and a geographical store locator.
* **Smart Catalog**: Category selectors, search debouncing, and filter widgets showcasing our cold extracts, accessories, and apparel.
* **Premium Checkout**: Live cart totals, tax splits (GST), promo coupons, multi-step checkout (UPI, Card, Wallets), and animated order confirmation tokens.
* **Weekly Subscriptions**: Flexible builders for weekly coffee plans (Basic, Premium, Custom) with pauses and delivery calendars.

### 2. 👑 Admin Command Center (`/admin`)
* **Executive KPIs**: Real-time sales dashboards tracking revenues, orders, average ticket prep times, and waste levels.
* **Recipe & Pricing Engine**: Controls for beverage formulations, compatibility checks, and region-specific pricing matrices.
* **Inventory Management**: Central warehouse log syncing with active store balances and automatic low-stock alerts.
* **RBAC Controls**: Enterprise roles manager setting permission grids (Super Admin, Manager, Chef, Barista).

### 3. ☕ Barista Kitchen Display System (KDS) (`/barista`)
* **SLA Kanban Board**: Live drag-and-drop ticket routing tracking prep columns (`Pending` $\rightarrow$ `Preparing` $\rightarrow$ `Ready` $\rightarrow$ `Completed`) with custom buzzer alerts.
* **Step-by-Step Preparations**: Focused interactive recipe sheets displaying volumetric ratios, step guidelines, and barista checkboxes.
* **Productivity Tracker**: Analytics tracking hourly output, SLA breaches, and average prep speeds.

### 4. 📱 Self-Ordering Touch Kiosk (`/kiosk`)
* **Touch-Target Catalog**: Extra-large tap elements, AI recommendations, and persistent cart sessions.
* **Interactive Customizer**: Numpads, sweetness toggles, ice adjustment dials, and milk/sweetener selectors showing real-time price updates.
* **Token Pickups**: Live preparation status monitors and large receipt displays with Estimated Wait Times.

---

## 🎨 Design System & Aesthetic Archetype

The ecosystem is built from scratch on a customized, high-contrast, warm light-themed design token system configured in `src/styles/global.css`:

| Token | CSS Variable | Color | Palette Role |
| :--- | :--- | :--- | :--- |
| **Canvas** | `--color-bg` | `#FAFAF8` | Creamy warm off-white |
| **Card Surface** | `--color-surface` | `#FFFFFF` | Premium high-contrast white |
| **Muted Surface** | `--color-surface-alt`| `#F5F3F0` | Subtle warm stone grey |
| **Primary Theme** | `--color-primary` | `#C67C4E` | Rich warm caramel |
| **Accent Tone** | `--color-accent` | `#E5A764` | Smooth golden honey |
| **Deep Text** | `--color-secondary` | `#2F2D2C` | Deep espresso dark grey |

* **Typography**: Outfit heading scales + Inter body text pre-fetched from Google Fonts.
* **Styling Principles**: Fluid size clamps, soft micro-animations (taps, hovers, list slides), and rounded Apple-like contours (`border-radius: 16px`).

---

## 📋 Client Specifications & Dynamic Customizer Rules

The application directly implements strategic guidelines provided by the client:

### A. Cup Size Standardization
Beverage sizes are standardized to exactly two cup structures to maximize efficiency:
1. **Small**: baseline cup volume (250ml) at base recipe cost (+₹0 modifier).
2. **Standard**: tall cup volume (360ml) adding +₹30 to base pricing.

### B. Customer-Guided UI Badges
Bases, milks, and sweeteners are tagged in our catalogs to direct users towards strategic choices:
* `⭐ Recommended`: Outlined caramel badge representing the developer/barista specialty pairing (e.g. *Oat Milk*, *Jaggery*).
* `❤️ Most Preferred`: Light green badge highlighting standard customer favorites (e.g. *Dairy Milk*, *Honey*, *Milk Cream*).

### C. Curated Retail Catalog
Includes our custom enterprise catalog:
* **Extract Bottles**: Strong, Balanced, and South Indian Filter concentrates (chicory 70:30) in combo packs (2, 4, 6 counts).
* **Accessories**: Stainless steel Measured Pourers and heavy Premium Shaker Glasses.
* **Apparel**: Branded organic caps and heavy oversized tee shirts.

---

## 🛠️ Stack & Developer Setup

The client codebase compiles as a pure single-page application requiring no database configuration:

### Core Dependencies
- **react-router-dom**: Drives role routing across all 4 dashboards.
- **zustand**: Handles state synchronization (Kiosk cart $\rightarrow$ KDS Kanban queue).
- **recharts**: Powers charts inside Admin Analytics.
- **react-hot-toast**: Triggers push micro-notifications.

### Commands
```bash
# Install dependencies
npm install

# Run the development environment
npm run dev

# Compile the optimized production bundle
npm run build
```

The production assets compile cleanly in under **600ms**!
