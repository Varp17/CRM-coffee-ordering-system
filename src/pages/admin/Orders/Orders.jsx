import React, { useState } from 'react';
import './Orders.css';

const Orders = () => {
  const [filter, setFilter] = useState('all'); // all, live, completed

  const orders = [
    { id: 'ORD001', customer: 'John Doe', items: 'Dark Roast (x2)', total: '$25.98', status: 'Live', time: '5 mins ago' },
    { id: 'ORD002', customer: 'Jane Smith', items: 'Vanilla Cold Brew', total: '$14.99', status: 'Live', time: '10 mins ago' },
    { id: 'ORD003', customer: 'Bob Johnson', items: 'Hazelnut Dream', total: '$13.99', status: 'Completed', time: '2 hours ago' },
    { id: 'ORD004', customer: 'Alice Brown', items: 'Dark Roast', total: '$12.99', status: 'Completed', time: '1 day ago' }
  ];

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === filter);

  return (
    <div className="orders-view">
      <div className="view-header">
        <h2 className="section-title">Order Management</h2>
        <div className="filter-buttons">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'live' ? 'active' : ''}`} onClick={() => setFilter('live')}>Live</button>
          <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
        </div>
      </div>

      <div className="cms-table-container glass">
        <table className="cms-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.items}</td>
                <td>{order.total}</td>
                <td>
                  <span className={`status-chip ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.time}</td>
                <td>
                  <button className="action-btn">View Details</button>
                  {order.status === 'Live' && <button className="action-btn edit">Complete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
