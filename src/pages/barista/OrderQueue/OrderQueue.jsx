import React, { useEffect, useMemo } from 'react';
import { useOrderStore } from '../../../store/useOrderStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import KdsQueue from '../../../features/kds/components/KdsQueue';
import './OrderQueue.css';

const OrderQueue = () => {
  // Activate real-time websocket connection for barista
  useWebSocket('barista');

  const { baristaOrders, fetchBaristaQueue, advanceBaristaOrder } = useOrderStore();

  useEffect(() => {
    fetchBaristaQueue();
  }, [fetchBaristaQueue]);

  // Map backend order format to the standard KdsQueue expectations
  const mappedOrders = useMemo(() => {
    return (baristaOrders || []).map((order) => ({
      ...order,
      status: (order.status || '').toLowerCase(),
      customer_name: order.customer_name || order.customer || 'Guest',
      order_number: order.order_number || order.id || '0000',
      created_at: order.created_at || order.createdAt || new Date().toISOString()
    }));
  }, [baristaOrders]);

  const pendingCount = mappedOrders.filter(o => o.status === 'pending').length;
  const preparingCount = mappedOrders.filter(o => o.status === 'in_progress').length;
  const readyCount = mappedOrders.filter(o => o.status === 'completed' || o.status === 'ready').length;

  return (
    <div className="order-queue-view animate-fade-in">
      <div className="kds-queue-header">
        <div>
          <h2>Order Queue</h2>
          <p>Live orders from all channels.</p>
        </div>
        <div className="queue-metric-summary">
          <span className="queue-tag">⏳ {pendingCount} Pending</span>
          <span className="queue-tag active">👨‍🍳 {preparingCount} Preparing</span>
          <span className="queue-tag done">✅ {readyCount} Ready</span>
        </div>
      </div>

      <KdsQueue 
        orders={mappedOrders}
        onStart={advanceBaristaOrder}
        onComplete={advanceBaristaOrder}
      />
    </div>
  );
};

export default OrderQueue;
