import { useEffect, useRef } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

export const useWebSocket = (roleParam) => {
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchBaristaQueue = useOrderStore((state) => state.fetchBaristaQueue);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const tickTimers = useOrderStore((state) => state.tickTimers);
  const storeRole = useAuthStore((state) => state.role);
  const wsRef = useRef(null);

  const role = roleParam || storeRole;

  useEffect(() => {
    // 1. KDS SLA Timers Tick (every 30 seconds, simulate 1 minute elapsed)
    const timerInterval = setInterval(() => {
      tickTimers();
    }, 30000);

    // 2. Real WebSocket connection for staff roles
    let isMounted = true;
    const ALLOWED_ROLES = ['barista', 'store_manager', 'manager', 'store_admin', 'admin', 'super_admin', 'staff', 'kiosk'];
    const token = localStorage.getItem('dc_token');

    const isMockToken = token && (token.startsWith('mock-') || token.includes('mock'));
    if (isMockToken) {
      console.log('[WS] Mock session token detected. Skipping real WebSocket connection.');
    }

    if (token && !isMockToken && ALLOWED_ROLES.includes(role)) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const storeId = localStorage.getItem('dc_store_id') || '1';
      const wsHost = window.location.hostname.includes('vercel.app')
        ? 'coffee-ordering-system-backend.onrender.com'
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'localhost:3000'
          : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${token}&storeId=${storeId}`;

      const connect = () => {
        if (!isMounted) return;
        console.log('[WS] Connecting to:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('[WS] Connected successfully');
          // Explicitly subscribe to store-specific events
          ws.send(JSON.stringify({
            type: 'subscribe',
            store_id: storeId,
            role: role
          }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            // Support both { type, payload } and { event, data } formats
            const type = data.type || data.event;
            const payload = data.payload || data.data;
            console.log('[WS] Event received:', type, payload);

            switch (type) {
              case 'NEW_NOTIFICATION':
                useNotificationStore.getState().addNotificationToState(payload);
                break;

              case 'NEW_ORDER':
              case 'order.created':
              case 'order.confirmed':
                useNotificationStore.getState().addNotificationToState({
                  id: `order-create-${Date.now()}`,
                  type: 'new_order',
                  title: 'New Order Received',
                  message: `Order #${payload.order_number || payload.id} placed.`,
                  created_at: new Date().toISOString()
                });
                fetchOrders();
                if (role === 'barista') {
                  fetchBaristaQueue();
                }
                break;

              case 'KOT_UPDATE':
              case 'ORDER_STATUS':
              case 'order.status_changed':
                useNotificationStore.getState().addNotificationToState({
                  id: `order-status-${Date.now()}`,
                  type: 'order_updated',
                  title: 'Order Status Changed',
                  message: `Order #${payload.order_number || payload.id || 'N/A'} is now ${payload.status || payload.toStatus || 'updated'}.`,
                  created_at: new Date().toISOString()
                });
                fetchOrders();
                if (role === 'barista') {
                  fetchBaristaQueue();
                }
                break;

              case 'STOCK_ALERT':
              case 'inventory.low_stock':
              case 'inventory.out_of_stock':
                useNotificationStore.getState().addNotificationToState({
                  id: `stock-${Date.now()}`,
                  type: 'low_stock',
                  title: 'Low Stock Alert',
                  message: payload.message || `${payload.ingredient_name || 'Ingredient'} is running low.`,
                  created_at: new Date().toISOString()
                });
                break;

              case 'ERROR':
                console.error('[WS] Server error message:', payload?.message);
                break;

              default:
                break;
            }
          } catch (err) {
            console.error('[WS] Parse message error:', err);
          }
        };

        ws.onclose = (e) => {
          if (!isMounted) return;
          console.warn('[WS] Closed:', e.reason);
          // Auto-reconnect with backoff
          setTimeout(() => {
            if (isMounted && localStorage.getItem('dc_token')) {
              connect();
            }
          }, 5000);
        };

        ws.onerror = (err) => {
          if (!isMounted) return;
          console.error('[WS] Error:', err);
          ws.close();
        };
      };

      connect();
    }

    return () => {
      isMounted = false;
      clearInterval(timerInterval);
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onclose = null;
        ws.onerror = null;
        if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    };
  }, [role, fetchOrders, fetchBaristaQueue, addNotification, tickTimers]);
};
