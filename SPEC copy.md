# Specification: Mobile Optimization & Dynamic Scaling

## Objective
Make all four interfaces of the Coffee Ordering System (D2C, Admin, Barista, Kiosk) fully mobile-optimized, responsive, and dynamically resizable. This includes updating components, headers, footers, page elements, and typography to scale dynamically across all device sizes (mobile, tablet, desktop).

---

## Architectural & Design Guidelines

1. **Fluid Typography**:
   - Instead of static pixel sizes, fonts will use `clamp()` or relative units (`rem`, `em`, `vw`) based on a base root font size.
   - Adjust root font size dynamically using media queries.

2. **Responsive Layouts**:
   - Replace absolute widths (e.g. static pixel widths) with fluid percentages, `max-width`, and viewport units.
   - Use CSS Flexbox and Grid with `flex-wrap` and auto-fitting templates to dynamically rearrange content without hardcoding breakpoints.

3. **Touch-Target Optimization**:
   - Interactive elements (buttons, links, form inputs) must have a minimum touch-target size of 44x44px to comply with mobile design standards.
   - Adjust paddings and margins to prevent accidental taps.

4. **Component-Specific Responsiveness**:
   - **Navigation & Headers**: Convert sidebars to collapsible drawers or slide-out overlays on mobile. Convert horizontal list navigations to wrap or use touch-scrollable lists.
   - **Tables & Data Grids**: Enable horizontal scrolling for large tables or transform table rows into card layouts on small viewports.
   - **Footers**: Stack footer links vertically on small screens and center content.

---

## Interface Requirements

### 1. Direct-to-Consumer (D2C) Interface
*   **Nav**: Responsive top nav. If screen is narrow, wrap links or make them touch-scrollable.
*   **Home Page**: Responsive hero section with dynamic typography. Flex-wrap buttons. Let `featured-section` grid columns wrap naturally.
*   **Catalog**: Grid of items using `repeat(auto-fit, minmax(280px, 1fr))` for fluid wrapping. Make filters and search elements touch-friendly.
*   **Cart / Checkout**: Order summary table/list and checkout form stack vertically on mobile.
*   **Profile**: Flex or grid layout for user info cards and past order list should wrap cleanly.

### 2. Admin Interface
*   **Layout (Sidebar & Header)**:
    - On screens `< 768px`, the sidebar should be hidden by default and toggleable via a hamburger icon in the content header, or transition to a compact top-nav/bottom-nav.
    - Sidebar footer and logout button must adapt to smaller viewports.
*   **Dashboard**: Stats cards stack nicely. The weekly revenue chart must fit within the container and scale down without overflow.
*   **Data Screens (Orders, Menu, Inventory, Ingredients, Customers, Roles, CMS)**:
    - Tables (`cms-table`, etc.) must have `overflow-x: auto` wrappers or adapt layout to card structures.
    - Forms and dialogs should use full width (`90%` of viewport) instead of absolute pixel widths.

### 3. Barista Interface
*   **Order Queue**:
    - Queue columns (New, Preparing, Ready) must stack vertically on mobile or be toggleable via tab selectors.
    - Order cards should scale dynamically, keeping buttons large and easy to tap while running around a bar.

### 4. Kiosk Interface
*   **Landing Page / Catalog / Customizer**:
    - Keep the large tap-friendly layout while resizing all elements to prevent clipping.
    - Grid of drinks and customization sliders/buttons must adjust sizes based on screen height and width.

---

---

## Client Specifications Alignment (Sizing, Guided UI & Catalog)

To align the platform with the client's commercial operations and recipe framework, the following operational constraints and UI features have been implemented:

1. **Standardized Beverage Sizing**:
   - Every customizable beverage has been restricted to exactly two cup sizes: `Small` (250ml, baseline price) and `Standard` (360ml, +₹30 price modifier).
   - This replaces the old three-size (S/M/L) framework to streamline storefront inventories and barista cup stocks.

2. **Guided Customization UI**:
   - In ingredient customization sections (Milk Bases, Sweeteners, and Toppings), key options feature clear visual guidance flags:
     - `Recommended` (e.g., Oat Milk, Jaggery) - Soft amber/caramel badges.
     - `Most Preferred` (e.g., Dairy Milk, Honey, Milk Cream) - Soft green pastel badges.
   - These indicators help guide user choice and optimize conversion rates.

3. **Expanded Retail Catalog**:
   - The D2C Storefront and Kiosk now showcase the client's expanded products:
     - **Chilled Coffee Core**: Strong, Balanced, Subtle Notes, and South Indian Filter (70:30 chicory) extract bottles.
     - **Combo Packs**: Available in 2-bottle, 4-bottle, and 6-bottle bundles at discount brackets.
     - **Coffee Accessories**: Professional Measured Pourer (for exact recipe dispensing) and Premium Shaker Glass (for aerated drinks).
     - **Merchandise**: Branded organic cotton embroidered caps and oversized heavy t-shirts.

---

## Implementation Details

We will edit the relevant CSS files:
1. `src/styles/global.css`: Add global viewport utilities, responsive base styles, and utility classes.
2. `src/App.css`: (Currently empty/small) Update if needed.
3. Specific CSS files for each page component in `src/pages/d2c`, `src/pages/admin`, `src/pages/barista`, `src/pages/kiosk`.
4. Shared component styles in `src/components/Button/Button.css` and `src/components/Card/Card.css`.

---

## Verification Plan

### Manual Verification
1. Open the application locally at `http://localhost:5173/`.
2. Inspect the UI in Chrome/Firefox Developer Tools.
3. Test using standard mobile presets:
   - iPhone SE / SE 2 (375px width)
   - iPhone 12/13/14 Pro (390px width)
   - Pixel 7 / Samsung Galaxy (412px width)
   - iPad / iPad Air (768px - 820px width)
4. Verify all flows (adding items to cart, customized kiosk builder, barista queue updates, admin CRUD tables) have no horizontal page scrolls and scale fonts/buttons cleanly.
