import React from 'react';
import './KdsQueue.css';

const STATUS_COLUMNS = [
  { key: 'pending',     label: 'Pending',    className: 'kds-col-pending' },
  { key: 'in_progress', label: 'In Progress', className: 'kds-col-active' },
  { key: 'completed',   label: 'Ready',       className: 'kds-col-done' },
  { key: 'ready',       label: 'Ready',       className: 'kds-col-done' },
];

const KdsQueue = ({ orders = [], onStart, onComplete }) => {
  const grouped = {};
  STATUS_COLUMNS.forEach((col) => {
    const matched = orders.filter((o) => o.status === col.key);
    if (matched.length) grouped[col.key] = matched;
  });

  const columns = STATUS_COLUMNS.filter((col) => grouped[col.key]?.length > 0);
  if (!columns.length) {
    return (
      <div className="kds-empty">
        <p>No orders at this time.</p>
      </div>
    );
  }

  return (
    <div className="kds-queue">
      {columns.map((col) => (
        <div key={col.key} className={`kds-column ${col.className}`}>
          <div className="kds-col-header">
            <span>{col.label}</span>
            <span className="kds-count">{grouped[col.key].length}</span>
          </div>
          <div className="kds-col-body">
            {grouped[col.key].map((order) => (
              <div key={order.id || order.uuid} className="kds-card">
                <div className="kds-card-top">
                  <strong className="kds-order-num">#{order.order_number}</strong>
                  <span className="kds-customer">{order.customer_name || 'Guest'}</span>
                </div>
                <div className="kds-card-items">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <span key={i} className="kds-item">{item.name || item.item_name}</span>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="kds-item-more">+{order.items.length - 3} more</span>
                  )}
                </div>
                <div className="kds-card-actions">
                  {order.status === 'pending' && onStart && (
                    <button className="kds-btn kds-btn-start" onClick={() => onStart(order.uuid || order.id, 'in_progress')}>
                      Start
                    </button>
                  )}
                  {(order.status === 'in_progress') && onComplete && (
                    <button className="kds-btn kds-btn-done" onClick={() => onComplete(order.uuid || order.id, 'completed')}>
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KdsQueue;
