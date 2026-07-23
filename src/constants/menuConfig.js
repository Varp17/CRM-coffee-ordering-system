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
  UserPlus,
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
    permission: 'Dashboard',
  },
  {
    key: 'orders',
    label: 'Orders',
    to: '/admin/orders',
    icon: ShoppingBag,
    roles: ['*'],
    badgeKey: 'pendingOrders',
    isSingle: true,
    permission: 'Orders',
  },
  {
    key: 'products',
    label: 'Products',
    to: '/admin/products',
    icon: Package,
    roles: ['*'],
    badgeKey: 'lowStock',
    isSingle: true,
    permission: 'Inventory',
  },
  {
    key: 'recipes',
    label: 'Recipes',
    to: '/admin/recipes',
    icon: BookOpen,
    roles: ['*'],
    isSingle: true,
    permission: 'Menu',
  },
  {
    key: 'customers',
    label: 'Customers',
    to: '/admin/customers',
    icon: Users,
    roles: ['*'],
    isSingle: true,
    permission: 'Customers',
  },
  {
    key: 'support',
    label: 'Customer Support',
    to: '/admin/support',
    icon: MessageSquare,
    roles: ['*'],
    badgeKey: 'openTickets',
    isSingle: true,
    permission: 'Customers',
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
 * Filter items by role and custom permissions override
 */
export const filterByRole = (role, permissions = []) => {
  const hasAllAccess = role === 'super_admin' || permissions.includes('All Access');
  return MENU_CONFIG.map((group) => {
    if (group.isSingle) {
      const roleAllowed = group.roles.includes('*') || group.roles.includes(role);
      const permissionAllowed = !group.permission || hasAllAccess || permissions.includes(group.permission);
      return (roleAllowed || permissionAllowed) ? group : null;
    }
    const filteredItems = group.items.filter((item) => {
      const roleAllowed = item.roles.includes('*') || item.roles.includes(role);
      const permissionAllowed = !item.permission || hasAllAccess || permissions.includes(item.permission);
      return roleAllowed || permissionAllowed;
    });
    return {
      ...group,
      items: filteredItems,
    };
  }).filter((group) => group && (group.isSingle || group.items.length > 0));
};
