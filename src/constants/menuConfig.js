import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Receipt,
  Warehouse,
  Wheat,
  Package,
  ArrowLeftRight,
  Trash2,
  Users,
  Star,
  Tags,
  Repeat,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Coffee,
  AlertTriangle,
  UserCog,
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
  Settings,
  MapPin,
  Shield,
  Factory,
} from 'lucide-react';

export const MENU_CONFIG = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/admin',
    icon: LayoutDashboard,
    roles: ['*'],
    end: true,
    isSingle: true,
  },
  {
    key: 'orders',
    label: 'Orders',
    to: '/admin/orders',
    icon: ShoppingBag,
    roles: ['*'],
    badgeKey: 'pendingOrders',
    isSingle: true,
  },
  {
    key: 'RECIPES',
    label: 'Recipes',
    icon: BookOpen,
    defaultOpen: false,
    items: [
      { key: 'recipes', label: 'Recipes', to: '/admin/recipes', icon: BookOpen, roles: ['super_admin', 'store_admin', 'manager'] },
      { key: 'compatibility-rules', label: 'Compatibility Rules', to: '/admin/compatibility-rules', icon: AlertTriangle, roles: ['super_admin', 'store_admin', 'manager'] },
      { key: 'rd', label: 'R&D', to: '/admin/production', icon: Factory, roles: ['super_admin', 'store_admin', 'manager'] },
    ],
  },
  {
    key: 'STOCK_MANAGEMENT',
    label: 'Stock Management',
    icon: Warehouse,
    defaultOpen: false,
    items: [
      { key: 'raw-materials', label: 'Raw Materials', to: '/admin/raw-materials', icon: Wheat, roles: ['super_admin', 'store_admin', 'manager'] },
      { key: 'products', label: 'Menu & Stock', to: '/admin/menu', icon: Package, roles: ['*'], badgeKey: 'lowStock' },
      { key: 'categories', label: 'Categories', to: '/admin/categories', icon: Tags, roles: ['super_admin', 'store_admin'] },
      { key: 'central-inventory', label: 'Central Inventory', to: '/admin/central-inventory', icon: Warehouse, roles: ['super_admin', 'store_admin'] },
      { key: 'store-transfers', label: 'Store Transfers', to: '/admin/store-transfers', icon: ArrowLeftRight, roles: ['super_admin', 'store_admin', 'manager'] },
      { key: 'waste-logs', label: 'Waste Logs', to: '/admin/waste-logs', icon: Trash2, roles: ['*'], badgeKey: 'pendingWaste' },
    ],
  },
  {
    key: 'CUSTOMER',
    label: 'Customer',
    icon: Users,
    defaultOpen: false,
    items: [
      { key: 'customers', label: 'Customers', to: '/admin/customers', icon: Users, roles: ['super_admin', 'store_admin', 'manager'] },
      // { key: 'loyalty', label: 'Loyalty', to: '/admin/loyalty', icon: Star, roles: ['super_admin', 'store_admin', 'manager'] },
      // { key: 'promotions', label: 'Promotions', to: '/admin/promotions', icon: Tags, roles: ['super_admin', 'store_admin'] },
      // { key: 'subscriptions', label: 'Subscriptions', to: '/admin/subscriptions', icon: Repeat, roles: ['super_admin', 'store_admin'] },
      { key: 'support', label: 'Support Tickets', to: '/admin/support', icon: MessageSquare, roles: ['*'], badgeKey: 'openTickets' },
      { key: 'customer-queries', label: 'Customer Queries', to: '/admin/customer-queries', icon: HelpCircle, roles: ['*'] },
    ],
  },
  {
    key: 'SUPPLIERS',
    label: 'Suppliers',
    icon: Truck,
    defaultOpen: false,
    items: [
      { key: 'suppliers', label: 'Suppliers', to: '/admin/suppliers', icon: Truck, roles: ['super_admin', 'store_admin'] },
      { key: 'purchase-orders', label: 'Purchase Orders', to: '/admin/purchase-orders', icon: Receipt, roles: ['super_admin', 'store_admin', 'manager'] },
    ],
  },
  {
    key: 'STAFF',
    label: 'Staff',
    icon: UserCog,
    defaultOpen: false,
    items: [
      { key: 'staff', label: 'Staff', to: '/admin/staff', icon: UserCog, roles: ['super_admin', 'store_admin', 'manager'] },
      { key: 'shifts', label: 'Shifts', to: '/admin/shifts', icon: Clock, roles: ['super_admin', 'store_admin', 'manager'] },
    ],
  },
  {
    key: 'REPORTS',
    label: 'Reports',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { key: 'daily-ops', label: 'Daily Ops', to: '/admin/daily-ops', icon: TrendingUp, roles: ['super_admin', 'store_admin', 'manager'] },
      { key: 'reports', label: 'Reports', to: '/admin/reports', icon: BarChart3, roles: ['super_admin', 'store_admin'] },
      { key: 'analytics', label: 'Analytics', to: '/admin/analytics', icon: Activity, roles: ['super_admin', 'store_admin'] },
    ],
  },
  {
    key: 'SETTINGS',
    label: 'Settings',
    icon: Settings,
    defaultOpen: false,
    items: [
      { key: 'settings', label: 'Settings', to: '/admin/settings', icon: Settings, roles: ['super_admin', 'store_admin'] },
      { key: 'stores', label: 'Stores', to: '/admin/stores', icon: MapPin, roles: ['super_admin', 'store_admin'] },
      { key: 'roles', label: 'Roles', to: '/admin/roles', icon: Shield, roles: ['super_admin'] },
    ],
  },
];

/**
 * Flat list of all menu items for search + breadcrumb generation
 */
export const ALL_MENU_ITEMS = MENU_CONFIG.flatMap((group) => {
  if (group.isSingle) {
    return [{ ...group, groupKey: group.key, groupLabel: '' }];
  }
  return group.items.map((item) => ({ ...item, groupKey: group.key, groupLabel: group.label }));
});

/**
 * Find a menu item by route path
 */
export const findMenuItemByPath = (path) =>
  ALL_MENU_ITEMS.find((item) =>
    item.end ? path === item.to : path.startsWith(item.to)
  );

/**
 * Find the group that owns a given path
 */
export const findGroupByPath = (path) => {
  const item = findMenuItemByPath(path);
  if (!item) return null;
  return MENU_CONFIG.find((g) => g.key === item.groupKey);
};

/**
 * Filter items by role
 */
export const filterByRole = (role) =>
  MENU_CONFIG.map((group) => {
    if (group.isSingle) {
      return (group.roles.includes('*') || group.roles.includes(role)) ? group : null;
    }
    return {
      ...group,
      items: group.items.filter(
        (item) => item.roles.includes('*') || item.roles.includes(role)
      ),
    };
  }).filter((group) => group && (group.isSingle || group.items.length > 0));
