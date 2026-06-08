/**
 * MENU CONFIGURATION
 * Single source of truth for all admin navigation items.
 * roles: ['*'] means visible to all authenticated users.
 * badgeKey: matches a key from useSidebarStore.badges object.
 */
import {
  LayoutDashboard,
  ShoppingBag,
  Coffee,
  Users,
  Truck,
  Receipt,
  ClipboardList,
  Wheat,
  FlaskConical,
  Factory,
  BookOpen,
  Warehouse,
  ArrowLeftRight,
  Package,
  Trash2,
  DollarSign,
  Building2,
  FileText,
  Star,
  Tags,
  Repeat,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Wrench,
  Shield,
  UserCog,
  Clock,
  Ship,
  TrendingUp,
  BarChart3,
  Settings,
  MapPin,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export const MENU_CONFIG = [
  {
    key: 'OVERVIEW',
    label: 'Overview',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: '/admin',
        icon: LayoutDashboard,
        roles: ['*'],
        end: true,
      },
    ],
  },
  {
    key: 'OPERATIONS',
    label: 'Operations',
    icon: ShoppingBag,
    defaultOpen: true,
    items: [
      { key: 'orders', label: 'Orders', to: '/admin/orders', icon: ShoppingBag, roles: ['*'], badgeKey: 'pendingOrders' },
      { key: 'customers', label: 'Customers', to: '/admin/customers', icon: Users, roles: ['super_admin', 'admin', 'store_manager'] },
      { key: 'suppliers', label: 'Suppliers', to: '/admin/suppliers', icon: Truck, roles: ['super_admin', 'admin'] },
      { key: 'purchase-orders', label: 'Purchase Orders', to: '/admin/purchase-orders', icon: Receipt, roles: ['super_admin', 'admin', 'inventory_manager'] },
      { key: 'daily-notes', label: 'Daily Notes', to: '/admin/daily-notes', icon: ClipboardList, roles: ['*'] },
    ],
  },
  {
    key: 'PRODUCTION',
    label: 'Production',
    icon: Factory,
    defaultOpen: false,
    items: [
      { key: 'raw-materials', label: 'Raw Materials', to: '/admin/raw-materials', icon: Wheat, roles: ['super_admin', 'admin', 'production_manager', 'inventory_manager'] },
      { key: 'ingredients', label: 'Ingredients', to: '/admin/ingredients', icon: FlaskConical, roles: ['super_admin', 'admin', 'production_manager'] },
      { key: 'products', label: 'Products', to: '/admin/menu', icon: Package, roles: ['*'] },
      { key: 'production', label: 'Production', to: '/admin/production', icon: Factory, roles: ['super_admin', 'admin', 'production_manager'] },
      { key: 'brew-recipes', label: 'Brew Recipes', to: '/admin/brew-recipes', icon: Coffee, roles: ['super_admin', 'admin', 'production_manager'] },
      { key: 'recipes', label: 'Recipes', to: '/admin/recipe-engine', icon: BookOpen, roles: ['super_admin', 'admin', 'production_manager'] },
      { key: 'recipe-builder', label: 'Recipe Builder', to: '/admin/recipe-builder', icon: BookOpen, roles: ['super_admin', 'admin', 'production_manager'] },
      { key: 'compatibility-rules', label: 'Compatibility Rules', to: '/admin/compatibility-rules', icon: AlertTriangle, roles: ['super_admin', 'admin', 'production_manager'] },
    ],
  },
  {
    key: 'INVENTORY',
    label: 'Inventory',
    icon: Warehouse,
    defaultOpen: false,
    items: [
      { key: 'central-inventory', label: 'Central Inventory', to: '/admin/central-inventory', icon: Warehouse, roles: ['super_admin', 'admin', 'inventory_manager'] },
      { key: 'inventory', label: 'Store Stock', to: '/admin/inventory', icon: Warehouse, roles: ['super_admin', 'admin', 'store_manager', 'inventory_manager'], badgeKey: 'lowStock' },
      { key: 'store-transfers', label: 'Store Transfers', to: '/admin/store-transfers', icon: ArrowLeftRight, roles: ['super_admin', 'admin', 'store_manager', 'inventory_manager'] },
      { key: 'packaging', label: 'Packaging', to: '/admin/packaging', icon: Package, roles: ['super_admin', 'admin', 'inventory_manager'] },
      { key: 'waste-logs', label: 'Waste Logs', to: '/admin/waste-logs', icon: Trash2, roles: ['*'], badgeKey: 'pendingWaste' },
    ],
  },
  {
    key: 'FINANCE',
    label: 'Finance',
    icon: DollarSign,
    defaultOpen: false,
    items: [
      { key: 'cash', label: 'Cash Management', to: '/admin/cash', icon: DollarSign, roles: ['super_admin', 'admin', 'finance_manager', 'store_manager'] },
      { key: 'b2b', label: 'B2B Accounts', to: '/admin/b2b', icon: Building2, roles: ['super_admin', 'admin', 'finance_manager'] },
      { key: 'gst', label: 'GST Compliance', to: '/admin/gst', icon: FileText, roles: ['super_admin', 'admin', 'finance_manager'] },
    ],
  },
  {
    key: 'CUSTOMER',
    label: 'Customer',
    icon: Users,
    defaultOpen: false,
    items: [
      { key: 'loyalty', label: 'Loyalty', to: '/admin/loyalty', icon: Star, roles: ['super_admin', 'admin', 'store_manager'] },
      { key: 'promotions', label: 'Promotions', to: '/admin/promotions', icon: Tags, roles: ['super_admin', 'admin'] },
      { key: 'subscriptions', label: 'Subscriptions', to: '/admin/subscriptions', icon: Repeat, roles: ['super_admin', 'admin'] },
      { key: 'support', label: 'Support Tickets', to: '/admin/support', icon: MessageSquare, roles: ['*'], badgeKey: 'openTickets' },
      { key: 'customer-queries', label: 'Customer Queries', to: '/admin/customer-queries', icon: HelpCircle, roles: ['*'] },
    ],
  },
  {
    key: 'QUALITY',
    label: 'Quality',
    icon: CheckCircle2,
    defaultOpen: false,
    items: [
      { key: 'quality', label: 'Quality Control', to: '/admin/quality', icon: CheckCircle2, roles: ['super_admin', 'admin', 'production_manager'] },
      { key: 'equipment', label: 'Equipment', to: '/admin/equipment', icon: Wrench, roles: ['super_admin', 'admin', 'production_manager', 'store_manager'] },
      { key: 'food-safety', label: 'Food Safety', to: '/admin/food-safety', icon: Shield, roles: ['super_admin', 'admin', 'store_manager'] },
    ],
  },
  {
    key: 'STAFF',
    label: 'Staff',
    icon: UserCog,
    defaultOpen: false,
    items: [
      { key: 'staff', label: 'Staff', to: '/admin/staff', icon: UserCog, roles: ['super_admin', 'admin', 'store_manager'] },
      { key: 'shifts', label: 'Shifts', to: '/admin/shifts', icon: Clock, roles: ['super_admin', 'admin', 'store_manager'] },
    ],
  },
  {
    key: 'LOGISTICS',
    label: 'Logistics',
    icon: Ship,
    defaultOpen: false,
    items: [
      { key: 'shipping', label: 'D2C Shipping', to: '/admin/shipping', icon: Ship, roles: ['super_admin', 'admin', 'inventory_manager'] },
    ],
  },
  {
    key: 'INSIGHTS',
    label: 'Insights',
    icon: TrendingUp,
    defaultOpen: false,
    items: [
      { key: 'daily-ops', label: 'Daily Ops', to: '/admin/daily-ops', icon: TrendingUp, roles: ['super_admin', 'admin', 'store_manager'] },
      { key: 'reports', label: 'Reports', to: '/admin/reports', icon: BarChart3, roles: ['super_admin', 'admin', 'finance_manager'] },
      { key: 'analytics', label: 'Analytics', to: '/admin/analytics', icon: Activity, roles: ['super_admin', 'admin'] },
    ],
  },
  {
    key: 'SYSTEM',
    label: 'System',
    icon: Settings,
    defaultOpen: false,
    items: [
      { key: 'settings', label: 'Settings', to: '/admin/settings', icon: Settings, roles: ['super_admin', 'admin'] },
      { key: 'stores', label: 'Stores', to: '/admin/stores', icon: MapPin, roles: ['super_admin', 'admin'] },
      { key: 'roles', label: 'Roles', to: '/admin/roles', icon: Shield, roles: ['super_admin'] },
      { key: 'activity-log', label: 'Activity Log', to: '/admin/activity-log', icon: ClipboardList, roles: ['super_admin', 'admin'] },
    ],
  },
];

/**
 * Flat list of all menu items for search + breadcrumb generation
 */
export const ALL_MENU_ITEMS = MENU_CONFIG.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupKey: group.key, groupLabel: group.label }))
);

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
  MENU_CONFIG.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.roles.includes('*') || item.roles.includes(role)
    ),
  })).filter((group) => group.items.length > 0);
