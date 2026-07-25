import { create } from 'zustand';
import { orderService } from '../services/orders';
import { baristaService } from '../services/barista';
import { unwrapData, unwrapList } from '../utils/apiResponse';

const normalizeOrder = (order) => {
  const items = (order.items || []).map((item) => {
    const itemName = item.name || item.product?.name || item.Product?.name || item.item_name || item.title || (item.product_id ? `Product (${item.product_id})` : 'Coffee Product');
    return {
      ...item,
      name: itemName,
      unit_price: Number(item.unit_price ?? item.price ?? 0),
      line_total: Number(item.line_total ?? item.price ?? 0) * Number(item.quantity || 1),
      is_combo: !!(item.is_combo || item.isCombo || (itemName && itemName.toLowerCase().includes('combo'))),
    };
  });

  const isComboOrder = !!(
    order.is_combo ||
    order.isCombo ||
    order.shipping_address?.is_combo ||
    items.some((i) => i.is_combo || (i.name && i.name.toLowerCase().includes('combo')))
  );

  return {
    ...order,
    is_combo: isComboOrder,
    order_number: order.order_number || order.id?.slice(0, 8).toUpperCase(),
    status: (order.status || 'pending').toLowerCase(),
    customer_name: order.customer_name || order.customer?.name || order.shipping_address?.name || 'Guest',
    customer_email: order.customer_email || order.customer?.email || '',
    customer_phone: order.customer_phone || order.customer?.phone || order.shipping_address?.phone || '',
    items,
  };
};

export const useOrderStore = create((set, get) => ({
  orders: [],
  baristaOrders: [],
  isLoading: false,
  error: null,

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await orderService.getAll(params);
      const orders = unwrapList(response).map(normalizeOrder);
      set({ orders, isLoading: false });
    } catch (error) {
      set({ orders: [], error: error.message, isLoading: false });
    }
  },

  fetchBaristaQueue: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await baristaService.getQueue(params);
      const baristaOrders = unwrapList(response).map(normalizeOrder);
      set({ baristaOrders, isLoading: false });
    } catch (error) {
      set({ baristaOrders: [], error: error.message, isLoading: false });
    }
  },

  placeOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await orderService.create(orderData);
      const payload = unwrapData(response, response);
      const newOrder = normalizeOrder(payload.order || payload);
      set((state) => ({
        orders: [newOrder, ...state.orders],
        isLoading: false,
      }));
      return { success: true, order: newOrder };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    const normalizedStatus = newStatus.toLowerCase();
    const current = get().orders.find((order) => order.id === orderId || order.order_number === orderId);
    if (current?.status === normalizedStatus) return { success: true };

    const previousOrders = get().orders;
    const previousBaristaOrders = get().baristaOrders;
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId || order.order_number === orderId
          ? { ...order, status: normalizedStatus }
          : order
      ),
      baristaOrders: state.baristaOrders.map((order) =>
        order.id === orderId || order.order_number === orderId
          ? { ...order, status: normalizedStatus }
          : order
      ),
    }));

    try {
      await orderService.updateStatus(orderId, normalizedStatus.toUpperCase());
      return { success: true };
    } catch (error) {
      set({
        orders: previousOrders,
        baristaOrders: previousBaristaOrders,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  },

  advanceBaristaOrder: async (orderId) => {
    const order = get().baristaOrders.find((item) => item.id === orderId);
    if (!order) return { success: false, error: 'Order not found' };

    try {
      if (order.status === 'pending') {
        await baristaService.acceptKOT(orderId);
      } else if (order.status === 'in_progress') {
        await baristaService.completeKOT(orderId);
      } else if (order.status === 'ready') {
        await baristaService.completeOrder(orderId);
      }
      await get().fetchBaristaQueue();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  refundOrder: async (orderId) => {
    try {
      await orderService.cancelWithRefund(orderId);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, status: 'refunded' } : order
        ),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  tickTimers: () => {
    set((state) => ({
      baristaOrders: state.baristaOrders.map((order) => {
        if (!['completed', 'cancelled'].includes(order.status)) {
          const elapsed = (order.elapsedMinutes || 0) + 1;
          return { ...order, elapsedMinutes: elapsed, time: `${elapsed} mins ago` };
        }
        return order;
      }),
    }));
  },
}));
