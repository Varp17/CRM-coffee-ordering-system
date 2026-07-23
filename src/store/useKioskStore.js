import { create } from 'zustand';
import { orderService } from '../services/orders';

export const useKioskStore = create((set, get) => ({
  cart: [],
  language: 'en',
  activeCustomization: null, // item being built: { base, milk, syrup, topping, size, sweetness, ice, price }
  currentToken: null,
  estimatedWaitTime: 0,
  idleTimer: 60, // seconds
  isLoading: false,
  error: null,

  setLanguage: (lang) => set({ language: lang }),
  setKioskCart: (cart) => set({ cart: Array.isArray(cart) ? cart : [] }),

  startCustomization: (menuItem) => {
    set({
      activeCustomization: {
        menuItem,
        base: '50:50 Concentrate',
        milk: 'Dairy Milk',
        syrup: 'None',
        topping: 'None',
        size: 'Medium',
        temperature: 'Iced',
        sweetness: 'Regular',
        ice: 'Regular',
        quantity: 1,
        basePrice: menuItem.price,
        addedPrice: 0,
        totalPrice: menuItem.price,
      },
    });
  },

  updateCustomization: (fields) => {
    set((state) => {
      if (!state.activeCustomization) return {};
      const updated = { ...state.activeCustomization, ...fields };

      // Calculate new pricing
      let added = 0;

      // Custom pricing modifications:
      if (updated.size === 'Small') added += 0;
      if (updated.size === 'Medium') added += 30;
      if (updated.size === 'Large') added += 60;

      if (updated.milk && updated.milk !== 'Dairy Milk') added += 50; // Non-dairy options cost extra
      if (updated.syrup && updated.syrup !== 'None') added += 30;
      if (updated.topping && updated.topping !== 'None') added += 15;

      updated.addedPrice = added;
      updated.totalPrice = (updated.basePrice + added) * updated.quantity;

      return { activeCustomization: updated };
    });
  },

  addActiveToKioskCart: () => {
    const { activeCustomization, cart } = get();
    if (!activeCustomization) return;

    const cartId = `kiosk-${Date.now()}`;
    const newCartItem = {
      cartId,
      ...activeCustomization,
      name: activeCustomization.menuItem.name,
    };

    set({
      cart: [...cart, newCartItem],
      activeCustomization: null,
    });
  },

  removeFromKioskCart: (cartId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.cartId !== cartId),
    }));
  },

  clearKioskCart: () => {
    set({ cart: [], activeCustomization: null, currentToken: null });
  },

  getKioskSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + (item.totalPrice || item.price || 0), 0);
  },

  getKioskTax: () => {
    // 5% GST for F&B in kiosk ordering
    return Math.round(get().getKioskSubtotal() * 0.05);
  },

  getKioskTotal: () => {
    return get().getKioskSubtotal() + get().getKioskTax();
  },

  completeKioskOrder: async (storeId = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { cart } = get();
      if (cart.length === 0) {
        throw new Error('Cart is empty.');
      }

      // Map cart to backend order item schema
      const items = cart.map(item => ({
        product_id: item.id || item.uuid || item.product_id, // UUID from catalog or customized item
        quantity: item.quantity || 1,
        notes: `Size: ${item.size}, Temperature: ${item.temperature}, Sweetness: ${item.sweetness}, Milk: ${item.milk}, Syrup: ${item.syrup}, Topping: ${item.topping}`,
      }));

      const orderData = {
        store_id: storeId,
        channel: 'kiosk',
        items,
        notes: 'Store Order'
      };

      const res = await orderService.create(orderData);
      const newOrder = res.data || res;
      const tokenNum = newOrder.order_number || `T-${Math.floor(100 + Math.random() * 900)}`;
      const waitTime = 8; // SLA default

      set({
        currentToken: tokenNum,
        estimatedWaitTime: waitTime,
        cart: [],
        isLoading: false
      });

      return { tokenNum, waitTime, order: newOrder };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
