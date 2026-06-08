/* ============================================
   MOCK DATA — Digital Coffee Platform
   Saturday Menu Edition
   ============================================ */

// ── Products ──
export const products = [
  {
    id: 'prod-001',
    title: 'Cold Brew Orange',
    description: 'Refreshing cold brew with fresh orange juice and honey. Perfect for a sunny Saturday.',
    shortDescription: 'Cold brew, OJ, and honey.',
    price: 180,
    category: 'Saturday Menu',
    tags: ['signature'],
    rating: 4.9,
    reviewCount: 15,
    imageUrl: '/images/products/cold-brew.png',
    images: ['/images/products/cold-brew.png'],
    inStock: true,
    stockQty: 50,
  },
  {
    id: 'prod-002',
    title: 'Cold Brew Tonic',
    description: 'Classic layered cold brew with premium tonic water. Crisp and clean.',
    shortDescription: 'Layered cold brew and tonic.',
    price: 160,
    category: 'Saturday Menu',
    tags: ['classic'],
    rating: 4.8,
    reviewCount: 22,
    imageUrl: '/images/products/iced-coffee.png',
    images: ['/images/products/iced-coffee.png'],
    inStock: true,
    stockQty: 60,
  },
  {
    id: 'prod-003',
    title: 'Cold Brew Mint Tonic',
    description: 'Invigorating cold brew with mint-infused tonic water. A refreshing twist.',
    shortDescription: 'Minty cold brew tonic.',
    price: 180,
    category: 'Saturday Menu',
    tags: ['refreshing'],
    rating: 4.9,
    reviewCount: 18,
    imageUrl: '/images/products/matcha-latte.png',
    images: ['/images/products/matcha-latte.png'],
    inStock: true,
    stockQty: 40,
  },
  {
    id: 'prod-004',
    title: 'Ice Latte',
    description: 'Smooth cold brew with chilled milk and jaggery syrup. Classic comfort.',
    shortDescription: 'Cold brew milk latte.',
    price: 150,
    category: 'Saturday Menu',
    tags: ['bestseller'],
    rating: 4.7,
    reviewCount: 45,
    imageUrl: '/images/products/filter-coffee.png',
    images: ['/images/products/filter-coffee.png'],
    inStock: true,
    stockQty: 80,
  },
  {
    id: 'prod-005',
    title: 'SIF on the Rocks',
    description: 'Authentic South Indian Filter coffee concentrate with condensed milk. Strong and creamy.',
    shortDescription: 'Chicory coffee on ice.',
    price: 170,
    category: 'Saturday Menu',
    tags: ['traditional'],
    rating: 4.9,
    reviewCount: 30,
    imageUrl: '/images/products/espresso.png',
    images: ['/images/products/espresso.png'],
    inStock: true,
    stockQty: 55,
  },
];

export const categories = ['All', 'Saturday Menu'];

// ── Kiosk Menu Items ──
export const kioskMenu = products.map(p => ({
  id: p.id,
  name: p.title,
  price: p.price,
  category: p.category,
  image: p.imageUrl,
  popular: p.tags.includes('bestseller') || p.tags.includes('signature')
}));

// ── Customization Options (Simplified for Saturday Menu) ──
export const customizationOptions = {
  bases: [
    { id: 'b1', name: 'Cold Brew', price: 0, icon: '🧊' },
    { id: 'b2', name: 'Chicory Concentrate', price: 0, icon: '☕' },
  ],
  milks: [
    { id: 'm1', name: 'Nandini Milk', price: 0, icon: '🥛', tag: 'Standard' },
    { id: 'm2', name: 'Condensed Milk', price: 0, icon: '🥛' },
  ],
  syrups: [
    { id: 's1', name: 'Honey', price: 0, icon: '🐝' },
    { id: 's2', name: 'Sugar / Jaggery Syrup', price: 0, icon: '🍯' },
  ],
  toppings: [
    { id: 't1', name: 'Mint Tonic Water', price: 0, icon: '🍃' },
    { id: 't2', name: 'Plain Tonic Water', price: 0, icon: '💧' },
    { id: 't3', name: 'Orange Juice', price: 0, icon: '🍊' },
    { id: 't4', name: 'Lemon Juice', price: 0, icon: '🍋' },
  ],
  cupSizes: [
    { id: 'cs1', name: 'Standard', label: 'STD', ml: '250ml', priceModifier: 0 },
  ],
  temperatures: ['Iced'],
  sweetnessLevels: ['Regular', 'Less Sweet', 'Extra Sweet'],
  iceLevels: ['Regular', 'Less Ice', 'Extra Ice'],
};

// ── Ingredient Compatibility Rules ──
export const compatibilityRules = [];

// ── Orders ──
export const orders = [];

// ── Barista Queue ──
export const baristaOrders = [];

// ── Customers ──
export const customers = [];

// ── Inventory ──
export const storeInventory = [
  { id: 'inv-001', name: 'Cold Brew Concentrate', stock: 5000, unit: 'ml', threshold: 1000, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.12 },
  { id: 'inv-002', name: 'Lemon Juice', stock: 1000, unit: 'ml', threshold: 200, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.20 },
  { id: 'inv-003', name: 'Honey', stock: 2000, unit: 'ml', threshold: 500, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.25 },
  { id: 'inv-004', name: 'Fresh Orange Juice', stock: 3000, unit: 'ml', threshold: 500, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.26 },
  { id: 'inv-005', name: 'Plain Soda Water', stock: 10000, unit: 'ml', threshold: 2000, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.02 },
  { id: 'inv-006', name: 'Tonic Water', stock: 5000, unit: 'ml', threshold: 1000, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.11 },
  { id: 'inv-007', name: 'Mint Tonic Water', stock: 5000, unit: 'ml', threshold: 1000, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.12 },
  { id: 'inv-008', name: 'Nandini Milk', stock: 10000, unit: 'ml', threshold: 2000, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.06 },
  { id: 'inv-009', name: 'Sugar / Jaggery Syrup', stock: 2000, unit: 'ml', threshold: 400, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.13 },
  { id: 'inv-010', name: 'Chicory Concentrate', stock: 5000, unit: 'ml', threshold: 1000, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.10 },
  { id: 'inv-011', name: 'Condensed Milk', stock: 3000, unit: 'ml', threshold: 500, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.23 },
  { id: 'inv-012', name: 'Ice Cubes', stock: 1000, unit: 'pcs', threshold: 200, category: 'Raw Material', lastRestocked: '2026-06-05', costPerUnit: 0.02 },
];

export const centralInventory = [];

// ── Roles ──
export const roles = [
  { id: 'role-001', name: 'Super Admin', users: 1, permissions: ['All Access'], description: 'Full system access' },
  { id: 'role-002', name: 'Barista', users: 3, permissions: ['Order Queue', 'Recipe View'], description: 'Kitchen operations only' },
];

// ── Stores ──
export const stores = [
  { id: 'store-001', name: 'Digital Coffee HSR Layout', address: '27th Main, HSR Layout, Bengaluru', status: 'Active', orders: 0, revenue: 0, rating: 4.7 },
];

// ── Analytics Data ──
export const analyticsData = {
  revenue: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, growth: 0 },
  orders: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0, pending: 0, inProgress: 0 },
  customers: { total: 0, active: 0, new: 0, retention: 0 },
  topProducts: [],
  weeklyRevenue: [],
  hourlyOrders: [],
  monthlyRevenue: [],
};

// ── Recipes (Exact SOP Steps) ──
export const recipes = [
  {
    id: 'rec-001', name: 'Cold Brew Orange', version: '1.0',
    ingredients: [
      { name: 'Cold Brew Concentrate', quantity: 100, unit: 'ml', inventoryId: 'inv-001' },
      { name: 'Fresh Orange Juice', quantity: 30, unit: 'ml', inventoryId: 'inv-004' },
      { name: 'Lemon Juice', quantity: 5, unit: 'ml', inventoryId: 'inv-002' },
      { name: 'Honey', quantity: 20, unit: 'ml', inventoryId: 'inv-003' },
      { name: 'Plain Soda Water', quantity: 95, unit: 'ml', inventoryId: 'inv-005' },
      { name: 'Ice Cubes', quantity: 5, unit: 'pcs', inventoryId: 'inv-012' },
    ],
    steps: [
      'Fill serving glass with ice',
      'Add honey and lemon juice',
      'Add fresh orange juice',
      'Pour cold brew concentrate',
      'Top with soda water',
      'Stir gently 2–3 times',
      'Serve immediately (Garnish: Orange slice/Mint leaf)'
    ],
    prepTime: 3, category: 'Saturday Menu', active: true,
    costPerCup: 28, sellingPrice: 180,
  },
  {
    id: 'rec-002', name: 'Cold Brew Tonic', version: '1.0',
    ingredients: [
      { name: 'Cold Brew', quantity: 90, unit: 'ml', inventoryId: 'inv-001' },
      { name: 'Tonic Water', quantity: 130, unit: 'ml', inventoryId: 'inv-006' },
      { name: 'Ice Cubes', quantity: 5, unit: 'pcs', inventoryId: 'inv-012' },
    ],
    steps: [
      'Fill glass with ice',
      'Pour tonic water first',
      'Slowly pour cold brew over back of spoon for layered appearance',
      'Serve without stirring (Garnish: Lemon wedge)'
    ],
    prepTime: 2, category: 'Saturday Menu', active: true,
    costPerCup: 26, sellingPrice: 160,
  },
  {
    id: 'rec-003', name: 'Cold Brew Mint Tonic', version: '1.0',
    ingredients: [
      { name: 'Cold Brew', quantity: 90, unit: 'ml', inventoryId: 'inv-001' },
      { name: 'Mint Tonic Water', quantity: 130, unit: 'ml', inventoryId: 'inv-007' },
      { name: 'Ice Cubes', quantity: 5, unit: 'pcs', inventoryId: 'inv-012' },
    ],
    steps: [
      'Fill glass with ice',
      'Pour mint tonic water',
      'Slowly layer cold brew',
      'Serve chilled (Garnish: Fresh mint sprig)'
    ],
    prepTime: 2, category: 'Saturday Menu', active: true,
    costPerCup: 27, sellingPrice: 180,
  },
  {
    id: 'rec-004', name: 'Ice Latte', version: '1.0',
    ingredients: [
      { name: 'Nandini Milk', quantity: 150, unit: 'ml', inventoryId: 'inv-008' },
      { name: 'Cold Brew Concentrate', quantity: 50, unit: 'ml', inventoryId: 'inv-001' },
      { name: 'Sugar / Jaggery Syrup', quantity: 15, unit: 'ml', inventoryId: 'inv-009' },
      { name: 'Ice Cubes', quantity: 5, unit: 'pcs', inventoryId: 'inv-012' },
    ],
    steps: [
      'Fill glass with ice',
      'Add syrup',
      'Pour milk',
      'Slowly pour cold brew concentrate',
      'Stir lightly before serving'
    ],
    prepTime: 2, category: 'Saturday Menu', active: true,
    costPerCup: 18, sellingPrice: 150,
  },
  {
    id: 'rec-005', name: 'SIF on the Rocks', version: '1.0',
    ingredients: [
      { name: 'Chicory Coffee Concentrate', quantity: 135, unit: 'ml', inventoryId: 'inv-010' },
      { name: 'Condensed Milk', quantity: 30, unit: 'ml', inventoryId: 'inv-011' },
      { name: 'Nandini Milk', quantity: 40, unit: 'ml', inventoryId: 'inv-008' },
      { name: 'Ice Cubes', quantity: 5, unit: 'pcs', inventoryId: 'inv-012' },
    ],
    steps: [
      'Fill serving glass with ice',
      'Add condensed milk',
      'Add chilled milk',
      'Pour chicory concentrate',
      'Stir well',
      'Serve immediately'
    ],
    prepTime: 2, category: 'Saturday Menu', active: true,
    costPerCup: 24, sellingPrice: 170,
  },
];

// ── Other Exports (Empty/Minimal) ──
export const banners = [];
export const testimonials = [];
export const notificationTemplates = [];
export const activityLog = [];
export const subscriptionPlans = [];
export const coupons = [];
