import React, { useState } from 'react';
import './OrderQueue.css';
import Button from '../../../components/Button/Button';

const OrderQueue = () => {
  const [orders, setOrders] = useState([
    { 
      id: 'ORD001', 
      customer: 'John Doe', 
      items: ['Dark Roast (M)', 'Croissant'], 
      status: 'Pending', 
      time: '5m ago',
      kot: {
        steps: [
          'Grind 20g coffee beans to medium-fine.',
          'Brew with 300ml water at 94°C.',
          'Pour into medium cup and serve hot.'
        ],
        ingredients: ['20g Dark Roast Beans', '300ml Water']
      }
    },
    { 
      id: 'ORD002', 
      customer: 'Jane Smith', 
      items: ['Cold Brew (L)', 'Muffin'], 
      status: 'In Progress', 
      time: '2m ago',
      kot: {
        steps: [
          'Pour 200ml Cold Brew concentrate into large cup.',
          'Add 100ml cold water.',
          'Fill with ice and serve.'
        ],
        ingredients: ['200ml Cold Brew Concentrate', '100ml Water', 'Ice']
      }
    },
    { 
      id: 'ORD003', 
      customer: 'Bob Johnson', 
      items: ['Latte (S)'], 
      status: 'Completed', 
      time: '10m ago',
      kot: {
        steps: [
          'Pull 1 double espresso shot.',
          'Steam 150ml milk to 65°C with light foam.',
          'Pour milk over espresso creating a heart pattern.'
        ],
        ingredients: ['1 Espresso Shot', '150ml Milk']
      }
    }
  ]);

  const [selectedKOT, setSelectedKOT] = useState(null);

  const moveStatus = (id, newStatus) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  return (
    <div className="order-queue-view">
      <div className="view-header">
        <h2 className="section-title">Barista Order Queue</h2>
      </div>

      <div className="queue-columns">
        {/* Pending Column */}
        <div className="queue-column glass">
          <div className="column-header">
            <h3>Pending</h3>
            <span className="count">{orders.filter(o => o.status === 'Pending').length}</span>
          </div>
          <div className="column-content">
            {orders.filter(o => o.status === 'Pending').map(order => (
              <div key={order.id} className="order-ticket glass">
                <div className="ticket-header">
                  <span className="order-id">{order.id}</span>
                  <span className="order-time">{order.time}</span>
                </div>
                <div className="ticket-body">
                  <p className="customer-name">{order.customer}</p>
                  <ul className="item-list">
                    {order.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="ticket-footer">
                  <Button variant="secondary" size="small" onClick={() => setSelectedKOT(order)}>View KOT</Button>
                  <Button variant="primary" size="small" onClick={() => moveStatus(order.id, 'In Progress')}>Start</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="queue-column glass">
          <div className="column-header">
            <h3>In Progress</h3>
            <span className="count">{orders.filter(o => o.status === 'In Progress').length}</span>
          </div>
          <div className="column-content">
            {orders.filter(o => o.status === 'In Progress').map(order => (
              <div key={order.id} className="order-ticket glass in-progress">
                <div className="ticket-header">
                  <span className="order-id">{order.id}</span>
                  <span className="order-time">{order.time}</span>
                </div>
                <div className="ticket-body">
                  <p className="customer-name">{order.customer}</p>
                  <ul className="item-list">
                    {order.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="ticket-footer">
                  <Button variant="secondary" size="small" onClick={() => setSelectedKOT(order)}>View KOT</Button>
                  <Button variant="secondary" size="small" onClick={() => moveStatus(order.id, 'Pending')}>Revert</Button>
                  <Button variant="primary" size="small" onClick={() => moveStatus(order.id, 'Completed')}>Complete</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="queue-column glass">
          <div className="column-header">
            <h3>Completed</h3>
            <span className="count">{orders.filter(o => o.status === 'Completed').length}</span>
          </div>
          <div className="column-content">
            {orders.filter(o => o.status === 'Completed').map(order => (
              <div key={order.id} className="order-ticket glass completed">
                <div className="ticket-header">
                  <span className="order-id">{order.id}</span>
                  <span className="order-time">{order.time}</span>
                </div>
                <div className="ticket-body">
                  <p className="customer-name">{order.customer}</p>
                  <ul className="item-list">
                    {order.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="ticket-footer">
                  <Button variant="secondary" size="small" onClick={() => setSelectedKOT(order)}>View KOT</Button>
                  <span className="status-badge">Done</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KOT Modal */}
      {selectedKOT && (
        <div className="modal-backdrop" onClick={() => setSelectedKOT(null)}>
          <div className="kot-modal glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Kitchen Order Ticket (KOT)</h2>
              <button className="close-btn" onClick={() => setSelectedKOT(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="kot-info">
                <span><strong>Order ID:</strong> {selectedKOT.id}</span>
                <span><strong>Customer:</strong> {selectedKOT.customer}</span>
              </div>
              <div className="kot-section">
                <h3>Items</h3>
                <ul>
                  {selectedKOT.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="kot-section">
                <h3>Ingredients</h3>
                <ul>
                  {selectedKOT.kot.ingredients.map((ing, index) => (
                    <li key={index}>{ing}</li>
                  ))}
                </ul>
              </div>
              <div className="kot-section">
                <h3>Workflow Guidance</h3>
                <ol style={{ paddingLeft: '20px' }}>
                  {selectedKOT.kot.steps.map((step, index) => (
                    <li key={index} style={{ marginBottom: '10px', color: 'var(--color-text-muted)' }}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="primary" onClick={() => setSelectedKOT(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderQueue;
