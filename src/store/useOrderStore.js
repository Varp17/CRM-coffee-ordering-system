import { create } from 'zustand';
import { orderService } from '../services/orders';
import { baristaService } from '../services/barista';
import { unwrapData, unwrapList } from '../utils/apiResponse';

export const useOrderStore = create((set, get) => ({
  orders: [],
  baristaOrders: [],
  isLoading: false,
  error: null,

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.getAll(params);
      const orders = unwrapList(res);
      set({ orders, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchBaristaQueue: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await baristaService.getQueue(params);
      const baristaOrders = unwrapList(res);
      set({ baristaOrders, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Add a new order (D2C or Kiosk)
  placeOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.create(orderData);
      const newOrder = unwrapData(res, res);
      set((state) => ({
        orders: [newOrder, ...state.orders],
        isLoading: false
      }));
      return { success: true, order: newOrder };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  // Update order status in KDS / Main list
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ),
        baristaOrders: state.baristaOrders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Advance barista order step in KDS
  advanceBaristaOrder: async (orderId) => {
    const { baristaOrders } = get();
    const order = baristaOrders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const status = (order.status || '').toLowerCase();
      if (status === 'pending') {
        await baristaService.acceptKOT(orderId);
      } else if (status === 'in_progress' || status === 'in progress') {
        await baristaService.completeKOT(orderId);
      } else if (status === 'ready') {
        await baristaService.completeOrder(orderId);
      }
      // Re-fetch queue to get latest state from DB
      await get().fetchBaristaQueue();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Admin/Refund Order
  refundOrder: async (orderId) => {
    try {
      await orderService.refund(orderId);
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, status: 'Refunded' } : o
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  tickTimers: () => {
    set((state) => ({
      baristaOrders: state.baristaOrders.map((o) => {
        if (o.status !== 'Completed' && o.status !== 'Cancelled') {
          const elapsed = (o.elapsedMinutes || 0) + 1;
          return {
            ...o,
            elapsedMinutes: elapsed,
            time: `${elapsed} mins ago`
          };
        }
        return o;
      })
    }));
  },
}));
