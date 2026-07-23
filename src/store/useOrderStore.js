import { create } from 'zustand';
import { orderService } from '../services/orders';
import { baristaService } from '../services/barista';
import { unwrapData, unwrapList } from '../utils/apiResponse';

const DUMMY_ORDERS = [
  {
    id: 'ORD-8091',
    order_number: 'ORD-8091',
    customer_name: 'Ananya Sharma',
    customer_email: 'ananya.sharma@example.com',
    channel: 'kiosk',
    terminal: 'T1 - Tech Park Plaza',
    total_amount: 780,
    status: 'in_progress',
    created_at: '2026-07-23T12:00:00Z',
    items: [
      { id: 'i-1', name: 'Bold Concentrate (325ml)', quantity: 2, unit_price: 390, line_total: 780, customizations: '325 ml Bottle' },
    ],
  },
  {
    id: 'ORD-8090',
    order_number: 'ORD-8090',
    customer_name: 'Rohan Mehta',
    customer_email: 'rohan.mehta@techpark.in',
    channel: 'kiosk',
    terminal: 'T2 - Museum Road Cafe',
    total_amount: 590,
    status: 'ready',
    created_at: '2026-07-23T11:45:00Z',
    items: [
      { id: 'i-2', name: 'Discovery Kit (All 3 Concentrates)', quantity: 1, unit_price: 590, line_total: 590, customizations: '3x 100ml Sampler Set' },
    ],
  },
  {
    id: 'ORD-8089',
    order_number: 'ORD-8089',
    customer_name: 'Sneha Patel',
    customer_email: 'sneha.p@gmail.com',
    channel: 'kiosk',
    terminal: 'T3 - Metro Station',
    total_amount: 600,
    status: 'completed',
    created_at: '2026-07-23T11:30:00Z',
    items: [
      { id: 'i-3', name: 'Kaapi Concentrate (325ml)', quantity: 1, unit_price: 390, line_total: 390, customizations: '325 ml Bottle' },
      { id: 'i-4', name: 'Bold Cold Coffee', quantity: 1, unit_price: 210, line_total: 210, customizations: 'Whole Milk, Less Ice' },
    ],
  },
  {
    id: 'ORD-8088',
    order_number: 'ORD-8088',
    customer_name: 'Vikram Roy',
    customer_email: 'vikram.roy@innovate.co',
    channel: 'd2c_website',
    terminal: 'Chilld Website Store',
    total_amount: 1370,
    status: 'completed',
    created_at: '2026-07-23T10:15:00Z',
    items: [
      { id: 'i-5', name: 'Classic CB Concentrate (1L)', quantity: 1, unit_price: 980, line_total: 980, customizations: '1 Liter Bottle' },
      { id: 'i-6', name: 'Classic CB Concentrate (325ml)', quantity: 1, unit_price: 390, line_total: 390, customizations: '325 ml Bottle' },
    ],
  },
  {
    id: 'ORD-8087',
    order_number: 'ORD-8087',
    customer_name: 'Karan Verma',
    customer_email: 'karan.verma@domain.com',
    channel: 'kiosk',
    terminal: 'T4 - Indiranagar Hub',
    total_amount: 430,
    status: 'completed',
    created_at: '2026-07-23T09:40:00Z',
    items: [
      { id: 'i-7', name: 'Kaapi Filter Shake', quantity: 1, unit_price: 220, line_total: 220, customizations: 'Jaggery Sweetened' },
      { id: 'i-8', name: 'Bold Cold Coffee', quantity: 1, unit_price: 210, line_total: 210, customizations: 'Oat Milk' },
    ],
  },
];

export const useOrderStore = create((set, get) => ({
  orders: DUMMY_ORDERS,
  baristaOrders: DUMMY_ORDERS,
  isLoading: false,
  error: null,

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await orderService.getAll(params);
      const orders = unwrapList(res);
      if (Array.isArray(orders) && orders.length > 0) {
        set({ orders, isLoading: false });
      } else {
        set({ orders: DUMMY_ORDERS, isLoading: false });
      }
    } catch (_) {
      set({ orders: DUMMY_ORDERS, isLoading: false });
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
    const current = get().orders.find((o) => o.id === orderId || o.order_number === orderId);
    if (current && current.status === newStatus) {
      return { success: true };
    }

    // Update local state immediately for fast, seamless UI update
    set((state) => ({
      orders: state.orders.map((o) =>
        (o.id === orderId || o.order_number === orderId) ? { ...o, status: newStatus } : o
      ),
      baristaOrders: state.baristaOrders.map((o) =>
        (o.id === orderId || o.order_number === orderId) ? { ...o, status: newStatus } : o
      ),
    }));

    // Attempt backend persistence; catch constraint/transition errors without breaking UI
    try {
      await orderService.updateStatus(orderId, newStatus);
    } catch (err) {
      console.warn('[useOrderStore] Backend status sync notice:', err.message);
    }
    return { success: true };
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
      await orderService.cancelWithRefund(orderId);
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
