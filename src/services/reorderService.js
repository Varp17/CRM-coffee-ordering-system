import { api } from './api';

export const reorderService = {
  reorderFromPastOrder: async (orderId, storeId, channel) => {
    return api.post(`/me/orders/${orderId}/reorder`, {
      store_id: storeId,
      channel: channel || 'qr_mobile'
    });
  },

  reorderFromDrink: async (drinkId, storeId, channel) => {
    return api.post(`/me/drinks/${drinkId}/reorder`, {
      store_id: storeId,
      channel: channel || 'qr_mobile'
    });
  }
};
